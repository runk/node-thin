var request = require('request');

module.exports = function(opts, cb) {
  opts.json = true;
  opts.strictSSL = false;
  request(opts, function(err, res, body) {
    cb(err, body, res);
  });
};
