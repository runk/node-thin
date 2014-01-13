var assert = require('assert');

var Thin = require('../lib/thin'),
  Remote = require('./helpers/remote'),
  request = require('./helpers/request');

describe('proxy', function() {

  var remote = new Remote;
  var proxy = new Thin;

  before(function(done) {
    remote.listen(30000, 30001, function(err) {
      if (err) return done(err);
      proxy.listen(30002, 'localhost', done);
    });
  });

  it('should work for GET methods', function(done) {
    request({
      proxy: 'http://localhost:30002',
      url: 'http://localhost:30000/test?foo=bar'
    }, function(err, res) {
      assert.equal(err, null);
      assert.deepEqual(res, {
        protocol: 'http',
        method: 'GET',
        query: {foo: 'bar'},
        body: {},
        headers: {
          host: 'localhost:30000',
          accept: 'application/json',
          connection: 'keep-alive'
        }
      });
      done()
    });
  });

  it('should work for POST methods', function(done) {
    request({
      method: 'POST',
      form: {hello: 'world'},
      proxy: 'http://localhost:30002',
      url: 'http://localhost:30000/test?foo=bar'
    }, function(err, res) {
      assert.equal(err, null);
      assert.deepEqual(res, {
        protocol: 'http',
        method: 'POST',
        query: {foo: 'bar'},
        body: {hello: 'world'},
        headers: {
          host: 'localhost:30000',
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          accept: 'application/json',
          'content-length': '11',
          connection: 'keep-alive'
        }
      });
      done()
    });
  });

});
