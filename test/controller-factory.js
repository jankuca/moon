var assert = require('assert');
var path = require('path');
var ControllerFactory = include('controller-factory');


describe('ControllerFactory', function () {

  var dirname = path.resolve(__dirname, './fixtures/controller-factory/controllers');


  var MockIoCContainer = function () {};
  MockIoCContainer.prototype.create = function (Constructor) {
    var Prepared = function () {};
    Prepared.prototype = Constructor.prototype;
    var instance = new Prepared();
    this.inject(Constructor, instance);
    return instance;
  };
  MockIoCContainer.prototype.inject = function (Constructor, instance) {
    Constructor.call(instance);
  };


  it('should not throw on a missing controller dir', function () {
    var dirname = path.resolve(__dirname, './fixtures/controller-factory/missing');

    var factory = new ControllerFactory(dirname);
    factory.ioc = new MockIoCContainer();
    factory.run();
  });


  it('should instantiate a controller', function () {
    var factory = new ControllerFactory(dirname);
    factory.ioc = new MockIoCContainer();
    factory.run();

    var scope = {};
    var controller = factory.create('TestController', scope, null);
  });


  it('should throw on a missing controller', function () {
    var factory = new ControllerFactory(dirname);
    factory.ioc = new MockIoCContainer();
    factory.run();

    assert.throws(function () {
      var controller = factory.create('UnknownController', null, null);
    });
  });


  it('should pre-populate controllers with $scope and $root member properties', function () {
    var factory = new ControllerFactory(dirname);
    factory.ioc = new MockIoCContainer();
    factory.run();

    var scope = {};
    var root = {};
    var controller = factory.create('TestController', scope, root);

    assert.equal(Object.getPrototypeOf(controller.$scope), scope,
      'Child scope does not inherit from the parent scope.');
    assert.equal(controller.$root, root, '$root is not correctly set');
  });

});
