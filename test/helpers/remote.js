var fs = require('fs');
var https = require('https');
var express = require('express');


function Remote() {

  this.app = express();
  this.app.use(express.urlencoded());

  this.app.all('/test', function(req, res) {
    res.json({
      protocol: req.protocol,
      method:   req.method,
      query:    req.query,
      body:     req.body,
      headers:  req.headers
    });
  });
}

Remote.prototype.listen = function(httpPort, httpsPort, cb) {
  // https.createServer({
  //   key: fs.readFileSync('./cert/dummy.key'),
  //   cert: fs.readFileSync('./cert/dummy.crt')
  // }, this.app).listen(httpsPort);

  this.app.listen(httpPort, cb);
};


module.exports = Remote;

/*

curl -d "foo=baz" -k -x https://localhost:8081 https://localhost:3001/test?fo=bar
curl -d "foo=baz" -k https://localhost:3001/test?fo=bar

*/
