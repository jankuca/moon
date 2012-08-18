
var Server = function () {
  this.port = 80;
  this.router = null;
};


Server.prototype.run = function () {
  var self = this;

  var domain = require('domain');
  var http = require('http');
  var http_server = http.createServer();

  http_server.on('request', function (req, res) {
    var d = domain.create();

    d.on('error', function (err) {
      var stack = err.stack || err.message || err.toString();
      stack = stack.replace(/^(.+?:)/, '\033[0;31m$1\033[0m');
      stack = stack.replace(/(\n\s+at\s)(\S+)/g, '$1\033[0;32m$2\033[0m');
      stack = stack.replace(/:(\d+):/g, ':\033[4;36m$1\033[0m:');
      console.error(stack);

      res.writeHead(500, {
        'content-type': 'text/plain; charset=UTF-8'
      });
      res.write('500 Server Error\n\n' + err.stack, 'utf8');
      res.end();
    });

    d.run(function () {
      self.router.handle(req, res);
    });
  });

  var port = this.port;
  http_server.listen(port, function () {
    console.log('The HTTP server is running on port %d.', port);
  });
};


module.exports = Server;
