var jsdom = require('jsdom');
var HTMLParser = require('htmlparser');
var XPathResult = jsdom.dom.level3.core.XPathResult;


var DOMFactory = function () {
  this.jsdom_options_ = {
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false,
      MutationEvents: false,
      QuerySelector: true
    },
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
    view: function (builder) { return builder(); }
  };

  this.compileTextNodes_(document);
  this.compileWidgets_(document, sandbox_scope);

  callback();
};


DOMFactory.prototype.compileTextNodes_ = function (node) {
  var document = node.parentWindow.document;
  // Find all text nodes in the given DOM tree using XPath.
  var texts = document.evaluate('//text()', document, null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  for (var i = 0, ii = texts.snapshotLength; i < ii; ++i) {
    var text = texts.snapshotItem(i);
    var parent = text.parentNode;
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
        parent.setAttribute('moon:script', value);
        text.nodeValue = value.replace(/\{.+?\}/g, '');
        break;
      }

      // Leave the original node contents before the script.
      text.nodeValue = value.substr(0, value.length - match[0].length);
      // `querySelector` in jsdom does not return the element for `[moon\\:script]`
      // if the attribute value is empty.
      parent.setAttribute('moon:script', '!');

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
  }
};


DOMFactory.prototype.compileWidgets_ = function (node, scope) {
  //var document = node.parentWindow.document;
  var self = this;
  var widgets = this.widgets;
  var matchesSelector = node.parentWindow.document.matchesSelector;

  var compileLevel = function (parent, scope) {
    parent.childNodes.some(function (child) {
      if (child.nodeType === child.ELEMENT_NODE) {
        compileElement(child, scope);
      }
    });
  };

  var compileElement = function (element, scope) {
    widgets.some(function (widget) {
      var selector = widget.selector;
      if (matchesSelector.call(element, selector)) {
        var exp;
        var captures = self.getSelectorCaptures_(selector);
        if (captures.length === 1) {
          exp = element.getAttribute(captures[0]);
        } else {
          exp = captures.map(function (capture) {
            return element.getAttribute(capture);
          });
        }

        var factory = widget.factory;
        var instance = factory(scope, element, exp);
        scope.$addWidget(instance);

        var child_scope = instance.scope || scope;
        compileLevel(element, child_scope);

        return true;

      } else {
        compileLevel(element, scope);
      }
    });
  };

  compileLevel(node, scope);
};


DOMFactory.prototype.getSelectorCaptures_ = function (selector) {
  var captures = [];
  var rx = /\[([^=]+).*?\]/g;
  var match;
  while (match = rx.exec(selector)) {
    captures.push(match[1].replace(/\\/g, ''));
  }

  return captures;
};


module.exports = DOMFactory;
