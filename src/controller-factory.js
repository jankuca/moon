var fs = require('fs');
var path = require('path');


var ControllerFactory = function (controller_dir) {
  this.controller_dir = controller_dir;

  this.ioc = null;
};


ControllerFactory.prototype.create = function (name, parent_scope, root) {
  var Controller = this.controllers_[name];
  if (!Controller) {
    throw new Error('Unknown controller ' + name);
  }

  var scope = Object.create(parent_scope);

  var PreparedController = function () {};
  PreparedController.prototype = Controller.prototype;

  var controller = this.ioc.create(PreparedController);
  controller.$scope = scope;
  controller.$root = root;
  this.ioc.inject(Controller, controller);
  return controller;
};


ControllerFactory.prototype.run = function () {
  var controllers = {};
  var rx = /^@?[a-z][a-z0-9]*-controller\.[a-z0-9]+$/;

  try {
    var controller_dir = this.controller_dir;
    var dir = fs.readdirSync(controller_dir);
  } catch (err) {
    dir = [];
  }

  dir.forEach(function (filename) {
    if (rx.test(filename)) {
      var name = path.basename(filename, path.extname(filename));
      name = name.replace(/(^@?|-)[a-z]/g, function (c) {
        return c.replace(/^-/, '').toUpperCase();
      });
      controllers[name] = require(path.join(controller_dir, filename));
    }
  });

  this.controllers_ = controllers;
};


module.exports = ControllerFactory;
