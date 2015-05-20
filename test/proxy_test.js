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

  after(proxy.close.bind(proxy));
  after(remote.close.bind(remote));

  it('should work for HTTP GET methods', function(done) {
    request({
      proxy: 'http://localhost:30002',
      url: 'http://localhost:30000/test?foo=bar'
    }, function(err, res) {
      if (err) return done(err);
      assert.deepEqual(res, {
        protocol: 'http',
        method: 'GET',
        query: {foo: 'bar'},
        body: {},
        headers: {
          'host': 'localhost:30000',
          'accept': 'application/json',
          'connection': 'keep-alive'
        }
      });
      done()
    });
  });

  it('should work for HTTP POST methods', function(done) {
    request({
      method: 'POST',
      form: {hello: 'world'},
      proxy: 'http://localhost:30002',
      url: 'http://localhost:30000/test?foo=bar'
    }, function(err, res) {
      if (err) return done(err);
      assert.deepEqual(res, {
        protocol: 'http',
        method: 'POST',
        query: {foo: 'bar'},
        body: {hello: 'world'},
        headers: {
          'host': 'localhost:30000',
          'content-type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
          'content-length': '11',
          'connection': 'keep-alive'
        }
      });
      done()
    });
  });

  it('should work for HTTPS GET methods', function(done) {
    request({
      proxy: 'http://localhost:30002',
      url: 'https://localhost:30001/test?foo=bar'
    }, function(err, res) {
      if (err) return done(err);
      assert.deepEqual(res, {
        protocol: 'https',
        method: 'GET',
        query: {foo: 'bar'},
        body: {},
        headers: {
          'host': 'localhost:30001',
          'accept': 'application/json',
          'connection': 'keep-alive'
        }
      });
      done()
    });
  });

  it('should work for HTTPS POST methods', function(done) {
    request({
      method: 'POST',
      form: {hello: 'world'},
      proxy: 'http://localhost:30002',
      url: 'https://localhost:30001/test?foo=bar'
    }, function(err, res) {
      if (err) return done(err);
      assert.deepEqual(res, {
        protocol: 'https',
        method: 'POST',
        query: {foo: 'bar'},
        body: {hello: 'world'},
        headers: {
          'host': 'localhost:30001',
          'content-type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
          'content-length': '11',
          'connection': 'keep-alive'
        }
      });
      done()
    });
  });

  it('should work for correctly for 404 responses', function(done) {
    request({
      method: 'GET',
      form: {hello: 'world'},
      proxy: 'http://localhost:30002',
      url: 'https://localhost:30001/not-found'
    }, function(err, body, response) {
      if (err) return done(err);
      assert.deepEqual(body, {status: 404});
      assert.equal(response.statusCode, 404);
      done()
    });
  });

  it('should not follow HTTP redirects', function(done) {
    request({
      method: 'GET',
      proxy: 'http://localhost:30002',
      url: 'http://localhost:30000/redirect',
      followRedirect: false
    }, function(err, body, response) {
      if (err) return done(err);
      assert.equal(response.statusCode, 302);
      done()
    });
  });

});
