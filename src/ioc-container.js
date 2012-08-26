
function IoCContainer() {
  this.factories_ = {};
  this.instances_ = {};
};


IoCContainer.prototype.getService = function (key) {
  var instance = this.instances_[key];
  if (!instance) {
    instance = this.factories_[key]();
    this.instances_[key] = instance;
  }
  return instance;
};

IoCContainer.prototype.addService = function (key, factory_or_instance) {
  if (typeof factory_or_instance === 'function') {
    this.factories_[key] = factory_or_instance;
  } else {
    this.instances_[key] = factory_or_instance;
  }
};

IoCContainer.prototype.create = function (Class /*, ...args */) {
  var args = Array.prototype.slice.call(arguments, 1);

  var Dependant = function () {};
  Dependant.prototype = Class.prototype;

  var instance = new Dependant();
  this.inject.apply(this, [ Class, instance ].concat(args));

  return instance;
};


IoCContainer.prototype.inject = function (Class, instance /*, ...args */) {
  var args = Array.prototype.slice.call(arguments, 2);

  var deps = Class.prototype.$deps || [];
  deps = deps.map(function (key) {
    return this.getService(key);
  }, this);

  args = deps.concat(args);
  Class.apply(instance, args);
};


module.exports = IoCContainer;
