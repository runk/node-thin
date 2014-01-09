node-thin
=========

is a HTTP/HTTPS debugging proxy which allows to use collection of middlewares/interceptors in order to trace/pre-process/post-process requests and resposes. The proxy in HTTPS mode actually allows simulate the *man-in-the-middle* (mitm) attack or traffic hijacking. Concept of middlewares is similar to connect (expressjs) frameworks.


### Installation

```
npm i thin
```


### Usage

```javascript
var Thin = require('thin');

var proxy = new Thin;

// `req` and `res` params are `http.ClientRequest` and `http.ServerResponse` accordingly
// be sure to check http://nodejs.org/api/http.html for more details
proxy.use(function(req, res, next) {
  console.log('Proxying:', req.url);
  next();
});

proxy.use(function(req, res, next) {
  if (req.url === '/foobar')
    return res.end('hello world');
  next();
});

proxy.listen(8081, 'localhost', function(err) {
  // .. error handling code ..
});

```



### Limitations

POST and PUT methods aren't working yet.
