var assert = require('assert');
var http = require('http');
var Router = include('router');


describe('Router', function () {

  var MockDOMFactory = function (expected_view) {
    this._expected_view_ = expected_view;
    this.root_scope = null;
  };
  MockDOMFactory.prototype.create = function (view) {
    assert.equal(view, this._expected_view_);
    this._rendering_ = view();

    return {
      document: {
        doctype: '',
        innerHTML: this._rendering_
      }
    }
  };
  MockDOMFactory.prototype.compile = function (dom, scope, callback) {
    this.root_scope = scope;
    callback(this._rendering_);
  };


  var MockResponse = function (expected_status, expected_body) {
    this._expected_status_ = expected_status;
    this._expected_body_ = expected_body;

    this._body_ = '';
    this.got_head = false;
    this.ended = false;
  };
  MockResponse.prototype.writeHead = function (status, headers) {
    this.got_head = true;
    assert.equal(status, this._expected_status_);
  };
  MockResponse.prototype.write = function (data, encoding) {
    this._body_ += data.toString('utf8');
  };
  MockResponse.prototype.end = function () {
    if (this._expected_body_ !== null) {
      assert.equal(this._body_, this._expected_body_);
    }
    this.ended = true;
  };


  var mockRequest = function (router, method, url, status, view) {
    var req = new http.IncomingMessage();
    var res = new MockResponse(status, view ? view() : null);
    req.method = method;
    req.url = url;
    router.dom_factory = new MockDOMFactory(view || null);
    router.handle(req, res);

    assert(res.got_head);
    assert(res.ended);
  };


  it('should route to views', function () {
    var a = function () { return 'A'; };
    var bc = function () { return 'B/C'; };

    var router = new Router();
    router.routes = {
      '/a': a,
      '/b/c': bc
    };

    mockRequest(router, 'GET', '/a', 200, a);
    mockRequest(router, 'GET', '/a?b=c', 200, a);
    mockRequest(router, 'GET', '/b/c', 200, bc);
  });

  it('should route to layout if set with $view in scope', function () {
    var layout = function () { return 'layout'; };
    var a = function () { return 'A'; };

    var router = new Router();
    router.routes = {
      $layout: layout,
      '/a': a
    };

    mockRequest(router, 'GET', '/a', 200, layout);

    assert.equal(router.dom_factory.root_scope.$view, a);
  });


  it('should route to views using structured routes', function () {
    var x = function () { return 'X'; };
    var a = function () { return 'A'; };
    var bc = function () { return 'B/C'; };

    var router = new Router();
    router.routes = {
      '/': {
        '/x': x
      },
      '/a': {
        '/': a,
        '/a': a,
        '/b/c': bc
      }
    };

    mockRequest(router, 'GET', '/x', 200, x);
    mockRequest(router, 'GET', '/a/a', 200, a);
    mockRequest(router, 'GET', '/a/a?b=c', 200, a);
    mockRequest(router, 'GET', '/a/b/c', 200, bc);
    mockRequest(router, 'GET', '/a', 404);
    mockRequest(router, 'GET', '/b/c', 404);
  });

});
