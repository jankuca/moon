
var Server = function (http_server) {
  this.port = 80;
  this.router = null;

  this.http_server = http_server;
};


Server.prototype.run = function () {
  var self = this;

  var domain = require('domain');

  this.http_server.on('request', function (req, res) {
    var d = domain.create();

    d.on('error', function (err) {
      var stack = err.stack || err.message || err.toString();
      stack = stack.replace(/^(.+?:)/, '\033[0;31m$1\033[0m');
      stack = stack.replace(/\(.+?\)/g, function (match) {
        var app_specific = (match.indexOf('/node_modules/') === -1 && match !== '(native)');
        var color = app_specific ? '\033[0m' : '\033[0;37m';
        return color + match.replace(/:(\d+):/, ':\033[4;36m$1' + color + ':') + '\033[0m';
      });
      stack = stack.replace(/(\n\s+at\s)([^\(]+)(\s+)/g, '$1\033[0;32m$2\033[0m$3');
      stack = stack.replace(/(\n\s+at\s[^m]+m)([^\(]+)/g, function (match, prefix, call) {
        return prefix + call.replace(/(^|\W)([A-Z][\w]*)/g, '$1\033[4m$2\033[0;32m');
      });
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
  this.http_server.listen(port, function () {
    console.log('The HTTP server is running on port %d.', port);
  });
};


module.exports = Server;
