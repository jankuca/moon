var jsdom = require('jsdom');
var HTMLParser = require('htmlparser');
var KeyValueNotation = require('./key-value-notation');
var XPathResult = jsdom.dom.level3.core.XPathResult;


var DOMFactory = function () {
  this.jsdom_options_ = {
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false,
      MutationEvents: false,
      QuerySelector: true
    },
    optionalClosing: true,
    parser: HTMLParser
  };

  this.widgets = [];
};


DOMFactory.prototype.create = function (view) {
  var source = view();
  var document = jsdom.jsdom(source, null, this.jsdom_options_);
  var dom = document.createWindow();
  return dom;
};


DOMFactory.prototype.compile = function (dom, scope, callback) {
  var document = dom.document;

  var sandbox_scope = Object.create(scope);
  sandbox_scope.$$fn = {
    view: function (builder) {
      return builder();
    }
  };

  this.compileElement_(document);
  this.compileWidgets_(document, sandbox_scope);

  callback();
};


DOMFactory.prototype.compileElement_ = function (node) {
  var self = this;

  var compileNode = function (node) {
    switch (node.nodeType) {
    case node.ELEMENT_NODE:
      self.compileAttributes_(node);
      compileLevel(node);
      break;
    case node.TEXT_NODE:
      self.compileTextNode_(node);
      break;
    }
  };
  var compileLevel = function (parent) {
    parent.childNodes.forEach(compileNode);
  };

  compileLevel(node);
};


DOMFactory.prototype.compileAttributes_ = function (element) {
  var rx = /\{(.+?)\}([\s\S]*)/g;
  var sources = {};

  var attrs = element.attributes;
  for (var i = 0, ii = attrs.length; i < ii; ++i) {
    var name = attrs[i].name;
    if (name !== 'm:script' && name !== 'm:attrs') {
      var value = element.getAttribute(name);

      if (value.match(rx)) {
        sources[name] = value;
        //var source = '"' + value.replace(rx, '" + ($1) + "') + '"';
        //source = source.replace(/(^\s*""\s+\+\s*|\s*\+\s+""\s*$)/g, '');
        //sources[name] = source;
      }
    }
  }

  if (Object.keys(sources).length > 0) {
    var result = KeyValueNotation.stringify(sources);
    element.setAttribute('m:attrs', result);
  }
};


DOMFactory.prototype.compileTextNode_ = function (text) {
  var parent = text.parentNode;
  var document = parent.ownerDocument;
  // Determine whether there are element siblings of the text node.
  var plain_parent = parent.childNodes.every(function (node) {
    return (node.nodeType !== node.ELEMENT_NODE);
  });

  var value = text.nodeValue;
  var match;
  while (match = value.match(/\{(.+?)\}([\s\S]*)/)) {
    // If there is no element sibling to the text node, store its contents
    // in the `moon:script` attribute of the parent element instead of
    // creating a placeholder comment pair.
    if (plain_parent) {
      parent.setAttribute('m:script', value);
      text.nodeValue = value.replace(/\{.+?\}/g, '');
      break;
    }

    // Leave the original node contents before the script.
    text.nodeValue = value.substr(0, value.length - match[0].length);
    // `querySelector` in jsdom does not return the element for `[moon\\:script]`
    // if the attribute value is empty.
    parent.setAttribute('m:script', '!');

    var frag = document.createDocumentFragment();
    // Create a placeholder comment pair such as
    // `<!--{script}--><!--/-->`.
    var script = match[1];
    var start_comment = document.createComment('{' + script + '}');
    var end_comment = document.createComment('/');
    frag.appendChild(start_comment);
    frag.appendChild(end_comment);

    // If there is more content after the script, create a new text node
    // with this content.
    var remainder = match[2];
    var remainder_text = document.createTextNode(remainder);
    if (remainder) {
      frag.appendChild(remainder_text);
    }

    // Insert the comment pair and the remainder after the original text node.
    parent.insertBefore(frag, text.nextSibling);

    // The next loop will be run against the content after the script.
    text = remainder_text;
    value = remainder;
  }
};


DOMFactory.prototype.compileWidgets_ = function (node, scope) {
  var self = this;
  var widgets = this.widgets;

  var compileLevel = function (parent, scope) {
    parent.childNodes.forEach(function (child) {
      if (child.nodeType === child.ELEMENT_NODE) {
        compileElement(child, scope);
      }
    });
  };

  var compileElement = function (element, scope) {
    var child_scope = scope;

    var matched = false;
    widgets.forEach(function (widget) {
      var selector = widget.selector;
      if (element.matchesSelector(selector)) {
        var exp;
        var captures = self.getSelectorCaptures_(selector);
        if (captures.length === 1) {
          exp = element.getAttribute(captures[0]);
        } else {
          exp = captures.map(function (capture) {
            return element.getAttribute(capture);
          });
        }

        // Create a widget.
        var factory = widget.factory;
        var instance = factory(element, scope, exp);
        // Attach the widget object to the scope to have it receive
        // future updates.
        scope.$addWidget(instance);

        // Compile template scripts in the widget element.
        self.compileElement_(element);

        // Widget can create their own sub-scopes.
        child_scope = instance.$scope || child_scope;
        // Continue the tree compilation in the correct scope.
        compileLevel(element, child_scope);

        matched = true;
      }
    });

    // If the element is not a widget root element,
    // continue the tree compilation in the same scope.
    if (!matched) {
      compileLevel(element, scope);
    }
  };

  compileLevel(node, scope);
};


DOMFactory.prototype.getSelectorCaptures_ = function (selector) {
  var captures = [];
  var rx = /\[([^=\]]+)[^\]]*?\]/g;
  var match;
  while (match = rx.exec(selector)) {
    captures.push(match[1].replace(/\\/g, ''));
  }

  return captures;
};


module.exports = DOMFactory;
