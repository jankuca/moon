var assert = require('assert');
var Scope = include('scope');


describe('Scope', function () {

  it('should initially be empty (have no enumerable keys)', function () {
    var scope = new Scope();
    assert.deepEqual(Object.keys(scope), []);
  });


  it('should notify all associated widgets about updates', function () {
    var MockWidget = function () {
      this.updated = false;
    };
    MockWidget.prototype.update = function () {
      this.updated = true;
    };

    var widget_a = new MockWidget();
    var widget_b = new MockWidget();

    var scope = new Scope();
    scope.$addWidget(widget_a);
    scope.$addWidget(widget_b);
    scope.a = 123;
    scope.$update();

    assert(widget_a.updated);
    assert(widget_b.updated);
  });

})
