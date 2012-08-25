var KeyValueNotation = require('./key-value-notation');
var ScriptCompiler = require('./script-compiler');


var ScriptAttributeWidget = function (kvn, scope, element) {
  this.element_ = element;
  this.patterns_ = KeyValueNotation.parse(kvn);
  this.scope_ = scope;

  this.scripts_ = null;
};


ScriptAttributeWidget.prototype.update = function () {
  // We are caching the scripts for performance.
  if (!this.scripts_) {
    this.createScripts_();
  }

  var element = this.element_;
  var scope = this.scope_;
  var scripts = this.scripts_;

  Object.keys(scripts).forEach(function (name) {
    var value = scripts[name].call(scope);
    element.setAttribute(name, value);
  });
};


ScriptAttributeWidget.prototype.createScripts_ = function () {
  var patterns = this.patterns_;
  var scripts = {};

  Object.keys(patterns).forEach(function (name) {
    var source = patterns[name].replace(/\{((?:[^}]|\\\})*)\}/g, '" + ($1) + "');
    source = '"' + source + '"';
    source = source.replace(/(^\s*""\s+\+\s*|\s*\+\s+""\s*$)/g, '');

    scripts[name] = ScriptCompiler.compile(source);
  });

  this.scripts_ = scripts;
};


module.exports = ScriptAttributeWidget;
