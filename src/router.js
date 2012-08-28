var Scope = require('./scope');


var Router = function () {
  this.routes = {};

  this.dom_factory = null;
};


Router.prototype.handle = function (req, res) {
  var self = this;
  var path = req.url;
  var pathname = path.split('?')[0];

  console.log('%s %s', req.method, path);

  var matchesPrefix = function (pathname, prefix) {
    var rx = new RegExp('^' + prefix);
    return rx.test(pathname);
  };
  var matches = function (pathname, prefix) {
    var rx = new RegExp('^' + prefix + '$');
    return rx.test(pathname);
  };

  var walkRouteLevel = function (routes, prefix, layout) {
    prefix = prefix || '';
    layout = routes.$layout || layout;

    for (var pattern in routes) {
      var target = routes[pattern];

      pattern = prefix + pattern;

      switch (typeof target) {
      case 'function': // view
        if (target !== layout && matches(pathname, pattern)) {
          self.routeToView_(req, res, target, layout);
          return true;
        }
        break;
      case 'object': // multi-level route
        if (matchesPrefix(pathname, pattern)) {
          return walkRouteLevel(target, pattern, layout);
        }
        break;
      }
    }
    return false;
  };

  var found = walkRouteLevel(this.routes);
  if (!found) {
    res.writeHead(404, {
      'content-type': 'text/plain; charset=UTF-8'
    });
    res.write('404 Not Found\n', 'utf8');
    res.end();
    return;
  }
};


Router.prototype.routeToView_ = function (req, res, view, layout) {
  var scope = new Scope();
  scope.$app = {};
  scope.$view = layout ? view : null;

  this.returnView_(req, res, layout || view, scope);
};

Router.prototype.returnView_ = function (req, res, view, scope) {
  var dom = this.dom_factory.create(view);
  this.dom_factory.compile(dom, scope, function () {
    var html = dom.document.doctype + dom.document.innerHTML;

    res.writeHead(200, {
      'content-type': 'text/html; charset=UTF-8'
    });
    res.write(html, 'utf8');
    res.end();
  });
};


module.exports = Router;
