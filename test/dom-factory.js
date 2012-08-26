var assert = require('assert');
var DOMFactory = include('dom-factory');
var KVM = include('key-value-notation');


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


  it('should compile scripts in attributes', function (done) {
    var factory = new DOMFactory();

    var html = '<html><body data-test="{abc}" data-test2="Abc {abc} def."></body>';
    var dom = factory.create(function () { return html; });

    factory.compile(dom, null, function () {
      var body = dom.document.firstChild.firstChild;

      var attr_names = Array.prototype.map.call(body.attributes, function (attr) {
        return attr.name;
      });
      assert.equal(attr_names.indexOf('m:script'), -1);
      assert.notEqual(attr_names.indexOf('m:attrs'), -1);

      var attrs = KVM.parse(body.getAttribute('m:attrs'));
      assert.equal(attrs['data-test'], '{abc}');
      assert.equal(attrs['data-test2'], 'Abc {abc} def.');

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
    };

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


  it('should compile widgets with selectors of multiple attributes', function (done) {
    var factory = new DOMFactory();

    var html = '<html><body data-a="A" data-b="B"></body>';
    var dom = factory.create(function () { return html; });

    var scope = {
      $addWidget: function (widget) {
      }
    };

    factory.widgets.push({
      selector: '[data-a][data-b]',
      factory: function (element, scope, values) {
        assert.deepEqual(values, [ 'A', 'B' ]);
        return {};
      }
    });

    factory.compile(dom, scope, done);
  });

});
