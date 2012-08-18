
var Scope = function () {
  Object.defineProperties(this, {
    widgets_: {
      value: [],
      enumerable: false,
      configurable: true
    }
  });
};


Scope.prototype.$addWidget = function (widget) {
  this.widgets_.push(widget);
};


Scope.prototype.$update = function () {
  this.widgets_.forEach(function (widget) {
    if (typeof widget.update === 'function') {
      widget.update();
    }
  });
};


module.exports = Scope;
