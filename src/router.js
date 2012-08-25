var Scope = require('./scope');


var Router = function () {
  this.routes = {};

  this.dom_factory = null;
};


Router.prototype.handle = function (req, res) {
  var path = req.url;
  var pathname = path.split('?')[0];

  console.log('%s %s', req.method, path);

  var routes = this.routes;
  var found = Object.keys(routes).some(function (pattern) {
    if (pattern === pathname) {
      var dom = routes[pattern];
      var layout_dom = routes.$layout;
      if (layout_dom) {
        var root_scope = new Scope();
        root_scope.$app = {};
        root_scope.$view = dom;

        this.returnDOM_(req, res, layout_dom, root_scope);
      } else {
        this.returnDOM_(req, res, dom);
      }
      return true;
    }
  }, this);

  if (!found) {
    res.writeHead(404, {
      'content-type': 'text/plain; charset=UTF-8'
    });
    res.write('404 Not Found\n', 'utf8');
    res.end();
    return;
  }
};


Router.prototype.returnDOM_ = function (req, res, dom, scope) {
  scope = scope || {};

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
