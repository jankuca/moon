var assert = require('assert');
var KVN = require('../src/key-value-notation');
var MockDocumentNode = require('./fixtures/mock-dom').MockDocumentNode;
var ScriptAttributeWidget = require('../src/script-attribute-widget');


describe('ScriptAttributeWidget', function () {

  it('should not modify attribute values before an update is requested', function () {
    var scope = { 'abc': 123 };
    var document = new MockDocumentNode();

    var attrs = { 'data-test': '{abc}' };
    var element = document.createElement('div', attrs);
    var kvn = KVN.stringify(attrs);

    var widget = new ScriptAttributeWidget(kvn, scope, element);
    assert.equal(element.getAttribute('data-test'), '{abc}');
  });


  it('should correctly set attribute values on update', function () {
    var scope = {
      'abc': 123,
      'def': { 'e': 456 }
    };
    var document = new MockDocumentNode();

    var attrs = {
      'data-test': '{abc}',
      'data-test2': 'Hey, the number is {def.e}.'
    };
    var element = document.createElement('div', attrs);
    var kvn = KVN.stringify(attrs);

    var widget = new ScriptAttributeWidget(kvn, scope, element);

    widget.update();
    assert.equal(element.getAttribute('data-test'), '123');
    assert.equal(element.getAttribute('data-test2'), 'Hey, the number is 456.');

    scope['abc'] = 'Badass.';
    widget.update();
    assert.equal(element.getAttribute('data-test'), 'Badass.');
  });

});
