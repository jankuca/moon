var assert = require('assert');
var MockDocumentNode = require('./fixtures/mock-dom').MockDocumentNode;
var ScriptWidget = include('script-widget');


describe('ScriptAttributeWidget', function () {

  it('should not modify the DOM before an update is requested', function () {
    var scope = { 'number': 123 };
    var pattern = 'The number is {number}.';

    var document = new MockDocumentNode();
    var element = document.createElement('div', { 'm:script': pattern });
    element.appendChild(document.createTextNode(pattern));
    element.innerHTML = pattern;

    var widget = new ScriptWidget(element.getAttribute('m:script'), scope, element);

    assert.equal(element.childNodes[0].nodeValue, pattern);
  });


  it('should correctly set simple element contents on update', function () {
    var scope = { 'number': 123, 'text': 'Abc def.' };
    var pattern = 'The number is {number}. The text is {text}.';

    var document = new MockDocumentNode();
    var element = document.createElement('div', { 'm:script': pattern });
    element.appendChild(document.createTextNode(pattern));
    element.innerHTML = pattern;

    var widget = new ScriptWidget(element.getAttribute('m:script'), scope, element);

    widget.update();
    assert.equal(element.innerHTML, 'The number is 123. The text is Abc def..');

    scope['number'] = 234;
    delete scope['text'];
    widget.update();
    assert.equal(element.innerHTML, 'The number is 234. The text is .');
  });


  it('should correctly set mixed element contents on update', function () {
    var scope = { 'number': 123, 'text': 'Abc def.' };

    var document = new MockDocumentNode();
    var element = document.createElement('div', { 'm:script': '!' });
    element.appendChild(document.createTextNode('Prefix content'));
    element.appendChild(document.createComment('{number}'));
    element.appendChild(document.createComment('/'));
    element.appendChild(document.createTextNode('Middle content'));
    element.appendChild(document.createComment('{text}'));
    element.appendChild(document.createComment('/'));
    element.appendChild(document.createTextNode('Postfix content'));

    var widget = new ScriptWidget(element.getAttribute('m:script'), scope, element);

    widget.update();
    assert.equal(element.childNodes[0].nodeValue, 'Prefix content');
    assert.equal(element.childNodes[1].nodeValue, '{number}');
    assert.equal(element.childNodes[2].nodeType, 3, 'First placeholder not filled');
    assert.equal(element.childNodes[2].nodeValue, '123');
    assert.equal(element.childNodes[3].nodeValue, '/');
    assert.equal(element.childNodes[4].nodeValue, 'Middle content');
    assert.equal(element.childNodes[5].nodeValue, '{text}');
    assert.equal(element.childNodes[6].nodeType, 3, 'Second placeholder not filled');
    assert.equal(element.childNodes[6].nodeValue, 'Abc def.');
    assert.equal(element.childNodes[7].nodeValue, '/');
    assert.equal(element.childNodes[8].nodeValue, 'Postfix content');

    scope['number'] = 234;
    delete scope['text'];
    widget.update();
    assert.equal(element.childNodes[2].nodeValue, '234');
    assert.equal(element.childNodes[5].nodeType, 8);
    assert.equal(element.childNodes[6].nodeType, 8);
  });

});
