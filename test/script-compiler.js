var assert = require('assert');
var ScriptCompiler = include('script-compiler');


describe('ScriptCompiler', function () {

  var equal = function (fn, expected_js) {
    var js = fn.toString();
    js = js.substring(31, js.length - 4);

    assert.equal(js, expected_js);
  };

  it('should compile a string', function () {
    var fn = ScriptCompiler.compile('"abc"');
    equal(fn, '"abc"');

    var fn = ScriptCompiler.compile('"a b c č"');
    equal(fn, '"a b c č"');
  });

  it('should compile a variable', function () {
    var fn = ScriptCompiler.compile('abc');
    equal(fn, '(this.abc||"")');
  });

  it('should compile a nested variable', function () {
    var fn = ScriptCompiler.compile('abc.def');
    equal(fn, '((this.abc||"").def||"")');
  });

  it('should compile a function call', function () {
    var fn = ScriptCompiler.compile('@abc');
    equal(fn, 'this.$$fn.abc()');
  });

  it('should compile a function call with an argument', function () {
    var fn = ScriptCompiler.compile('@abc def');
    equal(fn, 'this.$$fn.abc((this.def||""))');
  });

  it('should compile a function call with an alternative', function () {
    var fn = ScriptCompiler.compile('@abc || x');
    equal(fn, 'this.$$fn.abc()||(this.x||"")');
  });

  it('should compile a function call with an argument and an alternative', function () {
    var fn = ScriptCompiler.compile('@abc def || x');
    equal(fn, 'this.$$fn.abc((this.def||""))||(this.x||"")');
  });

  it('should compile a function call with an argument with an alternative', function () {
    var fn = ScriptCompiler.compile('@abc (def || x)');
    equal(fn, 'this.$$fn.abc(((this.def||"")||(this.x||"")))');
  });

});
