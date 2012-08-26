var assert = require('assert');
var http = require('http');
var Router = require('../src/router');


describe('Router', function () {

  var MockDOMFactory = function (expected_view) {
    this._expected_view_ = expected_view;
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
    assert.equal(this._body_, this._expected_body_);
    this.ended = true;
  };


  it('should route to views', function () {
    var a = function () { return 'A'; };
    var bc = function () { return 'B/C'; };

    var router = new Router();
    router.routes = {
      '/a': a,
      '/b/c': bc
    };

    var req1 = new http.IncomingMessage();
    var res1 = new MockResponse(200, a());
    req1.method = 'GET';
    req1.url = '/a';
    router.dom_factory = new MockDOMFactory(a);
    router.handle(req1, res1);

    var req2 = new http.IncomingMessage();
    var res2 = new MockResponse(200, a());
    req2.method = 'GET';
    req2.url = '/a?b=c';
    router.dom_factory = new MockDOMFactory(a);
    router.handle(req2, res2);

    var req3 = new http.IncomingMessage();
    var res3 = new MockResponse(200, bc());
    req3.method = 'GET';
    req3.url = '/b/c';
    router.dom_factory = new MockDOMFactory(bc);
    router.handle(req3, res3);


    assert(res1.got_head);
    assert(res1.ended);
    assert(res2.got_head);
    assert(res2.ended);
    assert(res3.got_head);
    assert(res3.ended);
  });

});
