var assert = require('assert');
var KVN = include('key-value-notation');


describe('KeyValueNotation', function () {

  it('should parse primitives', function () {
    assert.strictEqual(KVN.parse("123"), 123);
    assert.strictEqual(KVN.parse("123.456"), 123.456);
    assert.strictEqual(KVN.parse("'abc'"), 'abc');
    assert.strictEqual(KVN.parse("'abc def.'"), 'abc def.');
    assert.strictEqual(KVN.parse("'abc\ndef.'"), 'abc\ndef.');
    assert.strictEqual(KVN.parse("true"), true);
    assert.strictEqual(KVN.parse("false"), false);
    assert.strictEqual(KVN.parse("null"), null);
  });


  it('should not parse illegals', function () {
    assert.throws(function () { KVN.parse("abc"); });
    assert.throws(function () { KVN.parse("TRUE"); });
    assert.throws(function () { KVN.parse("NULL"); });
    assert.throws(function () { KVN.parse("[abc:'x']"); });
  });


  it('should stringify primitives', function () {
    assert.strictEqual(KVN.stringify(123), "123");
    assert.strictEqual(KVN.stringify('abc'), "'abc'");
    assert.strictEqual(KVN.stringify('abc def.'), "'abc def.'");
    assert.strictEqual(KVN.stringify('abc\ndef.'), "'abc\ndef.'");
    assert.strictEqual(KVN.stringify(true), "true");
    assert.strictEqual(KVN.stringify(false), "false");
    assert.strictEqual(KVN.stringify(null), "null");
  });


  it('should parse maps', function () {
    assert.deepEqual(KVN.parse("[]"), {});
    assert.deepEqual(KVN.parse("['a':123]"), { 'a': 123 });
    assert.deepEqual(KVN.parse("['a':123, 'b': 234]"), { 'a': 123, 'b': 234 });
  });


  it('should stringify maps', function () {
    assert.deepEqual(KVN.stringify({}), "[]");
    assert.deepEqual(KVN.stringify({ 'a': 123 }), "['a':123]");
    assert.deepEqual(KVN.stringify({ 'a': 123, 'b': 234 }), "['a':123, 'b':234]");
  });


  it('should stringify arrays as maps', function () {
    assert.deepEqual(KVN.stringify([]), "[]");
    assert.deepEqual(KVN.stringify([ 'a' ]), "['0':'a']");
    assert.deepEqual(KVN.stringify([ 'a', 123 ]), "['0':'a', '1':123]");
  });

});
