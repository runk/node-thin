var http = require('http'),
  net = require('net'),
  https = require('https'),
  fs = require('fs'),
  os = require('os'),
  request = require('request'),
  url = require('url');

var Logger = require('./logger');


function Mitm(opts) {
  this.opts = opts || {};

  // socket path for system mitm https server
  this.socket = os.tmpdir() + '/node-thin.' + process.pid + '.sock';
  this.interceptors = [];

  this.log = new Logger(false);
}


Mitm.prototype.listen = function(port, host, cb) {
  var self = this;

  // make sure there's no previously created socket
  if (fs.existsSync(this.socket))
    fs.unlinkSync(this.socket);

  var options = {
    key: fs.readFileSync(__dirname + '/../cert/dummy.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/../cert/dummy.crt', 'utf8')
  };
  // fake https server, MITM if you want
  https.createServer(options, this._handler.bind(this)).listen(this.socket);

  // start HTTP server with custom request handler callback function
  var server = http.createServer(this._handler.bind(this)).listen(port, host, function(err) {
    if (err)
      self.log.error('Cannot start proxy', err);
    // else
    //   this.log.info('Listening on %s:%s [%d]', this.opts.host, this.opts.port, process.pid);
    cb(err);
  });

  // add handler for HTTPS (which issues a CONNECT to the proxy)
  server.addListener('connect', this._httpsHandler.bind(this));
};


Mitm.prototype._handler = function(req, res) {

  var interceptors = this.interceptors.concat([this.direct.bind(this)]);
  var layer = 0;

  (function runner() {
    var interceptor = interceptors[layer++];
    interceptor(req, res, function(err) {
      if (err) return res.end('Proxy error: ' + err.toString());
      runner();
    });
  })();
};


Mitm.prototype._httpsHandler = function(request, socketRequest, bodyhead) {
  var self = this;
  var log = this.log,
    url = request['url'],
    httpVersion = request['httpVersion'];

  log.info('  = will connect to socket "%s"', this.socket);

  // set up TCP connection
  var proxySocket = new net.Socket();
  proxySocket.connect(this.socket, function() {
    log.info('< connected to socket "%s"', self.socket);
    log.info('> writing head of length %d', bodyhead.length);

    proxySocket.write(bodyhead);

    // tell the caller the connection was successfully established
    socketRequest.write('HTTP/' + httpVersion + ' 200 Connection established\r\n\r\n');
  });

  proxySocket.on('data', function(chunk) {
    log.info('< data length = %d', chunk.length);
    socketRequest.write(chunk);
  });

  proxySocket.on('end', function() {
    log.info('< end');
    socketRequest.end();
  });

  socketRequest.on('data', function(chunk) {
    log.info('> data length = %d', chunk.length);
    proxySocket.write(chunk);
  });

  socketRequest.on('end', function() {
    log.info('> end');
    proxySocket.end();
  });

  proxySocket.on('error', function(err) {
    socketRequest.write('HTTP/' + httpVersion + ' 500 Connection error\r\n\r\n');
    log.error('< ERR: %s', err);
    socketRequest.end();
  });

  socketRequest.on('error', function(err) {
    log.error('> ERR: %s', err);
    proxySocket.end();
  });
};


Mitm.prototype.use = function(fn) {
  this.interceptors.push(fn);
};


Mitm.prototype.direct = function(req, res) {
  var log = this.log,
    path = url.parse(req.url).path,
    schema = Boolean(req.client.pair) ? 'https' : 'http',
    dest = schema + '://' + req.headers['host'] + path;

  var params = {
    url: dest,
    strictSSL: false,
    method: req.method,
    proxy: this.opts.proxy,
    headers: {}
  };

  // Set original headers except proxy system's headers
  var exclude = ['proxy-connection'];
  for (var hname in req.headers)
    if (!~exclude.indexOf(hname))
      params.headers[hname] = req.headers[hname];

  var buffer = '';
  req.on('data', function(chunk) {
    buffer += chunk;
  });

  req.on('end', function() {
    params.body = buffer;
    // console.log(params)
    // console.log('requesting..', params)
    var r = request(params, function(err, response) {
      // don't save responses with codes other than 200
      if (err || response.statusCode !== 200) {
        // console.log it?
      }
    });

    r.pipe(res);
  });

};

module.exports = Mitm;
