var assert = require('assert');
var IoCContainer = require('../src/ioc-container.js');


describe('IoCContainer', function () {

  it('should accept new factories', function () {
    var ioc = new IoCContainer();
    ioc.addService('a', function () {
      return {};
    });
  });


  it('should accept new prepared instances', function () {
    var ioc = new IoCContainer();
    ioc.addService('a', {});
  });


  it('should return prepared instances', function () {
    var ioc = new IoCContainer();

    var a = {};
    ioc.addService('a', a);

    assert.equal(ioc.getService('a'), a);
  });


  it('should return factory-created instances', function () {
    var ioc = new IoCContainer();

    var a = {};
    ioc.addService('a', function () {
      return a;
    });

    assert.equal(ioc.getService('a'), a);
  });


  it('should not create multiple instances of one service', function () {
    var ioc = new IoCContainer();

    var a = {};
    var count = 0;
    ioc.addService('a', function () {
      assert.equal(++count, 1, 'Factory called more than once.');
      return a;
    });

    ioc.getService('a');
  });


  it('should instantiate a constructor providing it with correct dependencies', function () {
    var ioc = new IoCContainer();
    var expected_a = {};
    var expected_b = {};

    ioc.addService('a', expected_a);
    ioc.addService('b', expected_b);

    var Constructor = function (a, b) {
      assert.equal(a, expected_a, 'Incorrect a');
      assert.equal(b, expected_b, 'Incorrect b');
    };
    Constructor.prototype.$deps = [ 'a', 'b' ];

    ioc.create(Constructor);
  });


  it('should inject dependencies to a constructor with a prepared instance', function () {
    var ioc = new IoCContainer();
    var expected_a = {};
    var expected_b = {};
    var ctx = {};

    ioc.addService('a', expected_a);
    ioc.addService('b', expected_b);

    var Constructor = function (a, b) {
      assert.equal(a, expected_a, 'Incorrect a');
      assert.equal(b, expected_b, 'Incorrect b');
      assert.equal(this, ctx, 'Incorrect execution context in the constructor');
    };
    Constructor.prototype.$deps = [ 'a', 'b' ];

    ioc.inject(Constructor, ctx);
  });


  it('should pass provided custom arguments after dependencies', function () {
    var ioc = new IoCContainer();
    var expected_a = {};
    var expected_arg1 = 1;
    var expected_arg2 = 2;

    ioc.addService('a', expected_a);

    var Constructor = function (a, arg1, arg2) {
      assert.equal(arg1, expected_arg1);
      assert.equal(arg2, expected_arg2);
    };
    Constructor.prototype.$deps = [ 'a' ];

    ioc.create(Constructor, expected_arg1, expected_arg2);
  });

});
