var assert = require('assert');
var DOMFactory = require('../src/dom-factory.js');


describe('DOMFactory', function () {

  it('should create a DOM tree from HTML', function () {
    var factory = new DOMFactory();

    var html = '<body><a href="#">Link</a>';
    var dom = factory.create(function () { return html; });

    assert(dom.document);
  });


  it('should compile a standalone script', function (done) {
    var factory = new DOMFactory();

    var html = '<html><body>Abc{abc}def';
    var dom = factory.create(function () { return html; });

    factory.compile(dom, null, function () {
      var body = dom.document.firstChild.firstChild;
      var attr_names = Array.prototype.map.call(body.attributes, function (attr) {
        return attr.name;
      });
      assert.notEqual(attr_names.indexOf('m:script'), -1);
      assert.equal(body.getAttribute('m:script'), 'Abc{abc}def');
      done();
    });
  });


  it('should compile a script with siblings', function (done) {
    var factory = new DOMFactory();

    var html = '<html><body>Abc{abc}def<div></div>';
    var dom = factory.create(function () { return html; });

    factory.compile(dom, null, function () {
      var body = dom.document.firstChild.firstChild;
      var attr_names = Array.prototype.map.call(body.attributes, function (attr) {
        return attr.name;
      });
      assert.notEqual(attr_names.indexOf('m:script'), -1);
      assert.equal(body.getAttribute('m:script'), '!');
      assert.equal(body.childNodes[0].nodeType, body.TEXT_NODE);
      assert.equal(body.childNodes[0].nodeValue, 'Abc');
      assert.equal(body.childNodes[1].nodeType, body.COMMENT_NODE);
      assert.equal(body.childNodes[1].nodeValue, '{abc}');
      assert.equal(body.childNodes[2].nodeType, body.COMMENT_NODE);
      assert.equal(body.childNodes[2].nodeValue, '/');
      assert.equal(body.childNodes[3].nodeType, body.TEXT_NODE);
      assert.equal(body.childNodes[3].nodeValue, 'def');
      done();
    });
  });


  it('should compile widgets', function (done) {
    var factory = new DOMFactory();

    var html = '<html><body>{abc}';
    var dom = factory.create(function () { return html; });

    var w = {};
    var scope = {
      $addWidget: function (widget) {
        assert.equal(widget, w, 'Widget instances don\'t match.');
      }
    }

    factory.widgets.push({
      selector: '[m\\:script]',
      factory: function (element, scope, script) {
        assert.equal(element.tagName, 'BODY');
        assert.equal(script, '{abc}');
        assert(scope);
        return w;
      }
    });

    factory.compile(dom, scope, done);
  });

});
