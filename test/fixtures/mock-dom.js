var assert = require('assert');
var htmlparser = require('htmlparser');
var util = require('util');


var MockNode = function () {
  this.nodeType = 0;
  this.previousSibling = null;
  this.nextSibling = null;
  this.ownerDocument = null;

  var parentNode = null;
  Object.defineProperty(this, 'parentNode', {
    get: function () { return parentNode; },
    set: function (value) {
      if (parentNode) {
        parentNode.removeChild(this);
      }
      parentNode = value;
    }
  });
};

MockNode.prototype.ELEMENT_NODE = 1;
MockNode.prototype.TEXT_NODE = 3;
MockNode.prototype.COMMENT_NODE = 8;
MockNode.prototype.DOCUMENT_NODE = 9;
MockNode.prototype.DOCUMENT_FRAGMENT_NODE = 11;


var MockTextNode = function (value) {
  MockNode.call(this);
  this.nodeType = this.TEXT_NODE;
  this.nodeValue = value;
};
util.inherits(MockTextNode, MockNode);


var MockCommentNode = function (value) {
  MockNode.call(this);
  this.nodeType = this.COMMENT_NODE;
  this.nodeValue = value;
};
util.inherits(MockCommentNode, MockNode);


var MockElementNode = function (tag_name, attrs) {
  MockNode.call(this);
  this.nodeType = this.ELEMENT_NODE;
  this.tagName = tag_name;
  this.childNodes = [];

  Object.defineProperty(this, 'firstChild', {
    get: function () { return this.childNodes[0] || null; },
    set: function () { throw new Error('firstChild is read-only'); }
  });
  Object.defineProperty(this, 'lastChild', {
    get: function () { return this.childNodes[this.childNodes.length - 1] || null; },
    set: function () { throw new Error('lastChild is read-only'); }
  });

  var innerHTML = '';
  Object.defineProperty(this, 'innerHTML', {
    get: function () { return innerHTML; },
    set: function (html) {
      var onError = function (err) { throw err; };
      var handler = new htmlparser.DefaultHandler(onError, {});
      var parser = new htmlparser.Parser(handler, {});
      try {
        parser.parseComplete(html);
      } catch (err) {
        assert(!err);
      }

      var document = this.ownerDocument;

      var processLevel = function (level, parent) {
        level.forEach(function (item) {
          switch (item.type) {
          case 'tag':
            var element = document.createElement(item.name, item.attribs);
            parent.appendChild(element);

            if (item.children) {
              processLevel(item.children, element);
            }
            break;
          case 'text':
            parent.appendChild(document.createTextNode(item.data));
            break;
          case 'comment':
            parent.appendChild(document.createComment(item.data));
            break;
          }
        });
      };

      this.childNodes = [];
      processLevel(handler.dom, this);

      innerHTML = html;
    }
  });

  this._attrs_ = attrs || {};
  this._updateAttributes_();
};
util.inherits(MockElementNode, MockNode);

MockElementNode.prototype.getAttribute = function (name) {
  return this._attrs_[name] || '';
};
MockElementNode.prototype.setAttribute = function (name, value) {
  this._attrs_[name] = String(value);
};
MockElementNode.prototype._updateAttributes_ = function () {
  this.attributes = Object.keys(this._attrs_).map(function (name) {
    return { name: name };
  });
};
MockElementNode.prototype.appendChild = function (node) {
  if (node.nodeType === 11) { // DOCUMENT_FRAGMENT_NODE
    node.childNodes.forEach(function (node) {
      this.appendChild(node);
    }, this);
  } else {
    var prev = this.childNodes[this.childNodes.length - 1] || null;
    this.childNodes.push(node);
    node.parentNode = this;
    node.previousSibling = prev;
    node.nextSibling = null;
    if (prev) {
      prev.nextSibling = node;
    }
  }
};
MockElementNode.prototype.insertBefore = function (node, ref) {
  var index = this.childNodes.indexOf(ref);
  assert(index !== -1);

  if (node.nodeType === 11) { // DOCUMENT_FRAGMENT_NODE
    node.childNodes.forEach(function (node) {
      this.insertBefore(node, ref);
    }, this);
  } else {
    var prev = this.childNodes[index - 1] || null;
    this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    node.previousSibling = prev;
    node.nextSibling = ref;
    if (prev) {
      prev.nextSibling = node;
    }
  }
};
MockElementNode.prototype.removeChild = function (node) {
  var index = this.childNodes.indexOf(node);
  assert(index !== -1);

  var prev = this.childNodes[index - 1] || null;
  var next = this.childNodes[index + 1] || null;

  this.childNodes.splice(index, 1);
  if (prev) {
    prev.nextSibling = next;
  }
  if (next) {
    next.prevSibling = prev;
  }
};


var MockDocumentFragmentNode = function () {
  MockElementNode.call(this, '#documentfragment');
  this.nodeType = this.DOCUMENT_FRAGMENT_NODE;
};
util.inherits(MockDocumentFragmentNode, MockElementNode);


var MockDocumentNode = function () {
  MockElementNode.call(this, '#document');
  this.nodeType = this.DOCUMENT_NODE;
};
util.inherits(MockDocumentNode, MockElementNode);

MockDocumentNode.prototype.createElement = function (tag_name, attrs) {
  var node = new MockElementNode(tag_name, attrs);
  node.ownerDocument = this;
  return node;
};
MockDocumentNode.prototype.createTextNode = function (value) {
  var node = new MockTextNode(value);
  node.ownerDocument = this;
  return node;
};
MockDocumentNode.prototype.createComment = function (value) {
  var node = new MockCommentNode(value);
  node.ownerDocument = this;
  return node;
};
MockDocumentNode.prototype.createDocumentFragment = function (value) {
  var node = new MockDocumentFragmentNode(value);
  node.ownerDocument = this;
  return node;
};


exports.MockNode = MockNode;
exports.MockElementNode = MockElementNode;
exports.MockTextNode = MockTextNode;
exports.MockCommentNode = MockCommentNode;
exports.MockDocumentFragmentNode = MockDocumentFragmentNode;
exports.MockDocumentNode = MockDocumentNode;
