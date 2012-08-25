
var clientside = (typeof process === 'undefined');


var moon = {};

moon.Application = require('./application');
moon.Controller = require('./controller');
moon.ControllerFactory = require('./controller-factory');
moon.DOMFactory = require('./dom-factory');
moon.IoCContainer = require('./ioc-container');
moon.Router = require('./router');
moon.Scope = require('./scope');
moon.ScriptWidget = require('./script-widget');
moon.ScriptAttributeWidget = require('./script-attribute-widget');
moon.Server = require('./server');

moon.inherits = require('util').inherits;
moon.base = function (Class, instance /*, ...args */) {
  var args = Array.prototype.slice.call(arguments, 2);
  var ioc = instance.$$ioc;
  if (ioc) {
    ioc.inject.apply(ioc, [ Class, instance ].concat(args));
  } else {
    Class.apply(instance, args);
  }
};

moon.env = clientside ? {} : process.env;


moon.create = function (app_dir) {
  var app = new moon.Application(app_dir);
  app.controller_factory = new moon.ControllerFactory();
  app.ioc = new moon.IoCContainer();
  app.router = new moon.Router();

  if (!clientside) {
    app.dom_factory = new moon.DOMFactory();
    app.server = new moon.Server();
  }

  app.widgets.push({
    selector: '[m\\:control]',
    factory: function (root, scope, script) {
      var factory = app.controller_factory;
      var controller = factory.create(script, scope, root);
      return controller;
    }
  });

  app.widgets.push({
    selector: '[m\\:attrs]',
    factory: function (element, scope, kvn) {
      var widget = new moon.ScriptAttributeWidget(kvn, scope, element);
      widget.update();
      return widget;
    }
  });

  app.widgets.push({
    selector: '[m\\:script]',
    factory: function (parent, scope, script) {
      var widget = new moon.ScriptWidget(script, scope, parent);
      widget.update();
      return widget;
    }
  });

  return app;
};



if (!clientside) {
  require.extensions['.view'] = function (module, filename) {
    var fs = require('fs');
    if (!fs.existsSync(filename)) {
      throw new Error(filename + ' not found');
    }

    var contents = fs.readFileSync(filename, 'utf8');
    module.exports = function () {
      return contents;
    };
  };
}


module.exports = moon;
