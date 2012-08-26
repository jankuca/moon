
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

/*
IoCContainer.prototype.setServiceInstance = function (key, instance) {
  this.instances_[key] = instance;
};

IoCContainer.prototype.setServices = function (declaration) {
  var self = this;
  var factories = this.factories_;

  var repositories = declaration['@repositories']
  if (repositories) {
    this.setRepositoryServices(repositories);
    delete declaration['@repositories'];
  }

  Object.keys(declaration).forEach(function (key) {
    factories[key] = function () {
      options = declaration[key];
      Class = options['class'];

      service = self.create(Class, options);
      return service;
    };
  });
};

IoCContainer.prototype.setRepositoryServices = function (declaration) {
  var self = this;

  Object.keys(repositories).forEach(function (key) {
    factories[key] = function () {
      var options = declaration[key];
      var Class = options['class'] || EntityRepository;

      var repository = this.create(Class, options);
      repository.Entity = options['entity'] || Entity;
      repository.ensureIndexes(options['indexes'] || []);
      return repository;
    };
  });
};
*/

IoCContainer.prototype.create = function (Class /*, ...args */) {
  var args = Array.prototype.slice.call(arguments, 1);

  var Dependant = function () {};
  Dependant.prototype = Class.prototype;

  var instance = new Dependant();
  instance.$$ioc = this;
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
