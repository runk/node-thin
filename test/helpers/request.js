var request = require('request');

module.exports = function(opts, cb) {
  opts.json = true;
  request(opts, function(err, res, body) {
    cb(err, body);
  });
};
