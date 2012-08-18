var path = require('path');


var Application = function (dir) {
  this.dir = dir;

  this.router = null;
  this.server = null;

  this.widgets = [];
};


Application.prototype.run = function () {
  if (this.controller_factory) {
    this.controller_factory.controller_dir = path.join(this.dir, 'controllers');
    this.controller_factory.ioc = this.ioc;
    this.controller_factory.run();
  }

  if (this.dom_factory) {
    this.dom_factory.widgets = this.widgets;
    this.router.dom_factory = this.dom_factory;
  }

  if (this.server) {
    this.server.router = this.router;
    this.server.run();
  }
};


module.exports = Application;
