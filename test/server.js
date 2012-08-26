var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Server = include('server');


describe('Server', function () {

  it('should make the native HTTP server start listening on the correct port', function () {
    var expected_port = 1234;
    var called = false;

    var http_server = new EventEmitter();
    http_server.listen = function (port, callback) {
      called = true;
      assert.equal(port, expected_port);
    };

    var server = new Server(http_server);
    server.port = expected_port;
    server.router = {};

    server.run();
    assert(called);
  });


  it('should pass request/response pairs to the router', function () {
    var http_server = new EventEmitter();
    http_server.listen = function () {};

    var expected_req = {};
    var expected_res = {};

    var server = new Server(http_server);
    server.router = {
      handle: function (req, res) {
        assert.equal(req, expected_req);
        assert.equal(res, expected_res);
      }
    };

    server.run();
    http_server.emit('request', expected_req, expected_res);
  });

});
