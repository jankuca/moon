var vm = require('vm');
var ScriptCompiler = require('./script-compiler');


var ScriptWidget = function (pattern, scope, parent) {
  this.pattern_ = pattern;
  this.scope_ = scope;
  this.parent_ = parent;

  this.scripts_ = null;
};


ScriptWidget.prototype.update = function () {
  // We are caching the scripts for performance.
  if (!this.scripts_) {
    this.createScripts_();
  }

  var document = this.parent_.ownerDocument;
  var scope = this.scope_;

  this.scripts_.forEach(function (item) {
    var html = item.script.call(scope);

    // If the script handles a whole element, replace all of its contents.
    // Otherwise just the nodes inside the comment node pair.
    if (item.container) {
      item.container.innerHTML = html;
    } else {
      // Create a DOM tree by setting contents of a detached DIV element.
      var div = document.createElement('div');
      div.innerHTML = html;

      // Create a `DocumentFragment` with the DIV's contents.
      var frag = document.createDocumentFragment();
      div.childNodes.forEach(function (node) {
        frag.appendChild(node);
      });

      var opening = item.opening;
      var node;
      while (node = opening.nextSibling) {
        if (node === item.closing) {
          opening.parentNode.insertBefore(frag, item.closing);
          return;
        }
        node.parentNode.removeChild(node);
      }
      throw new Error('Missing a closing comment node for {' + item.source + '}');
    }
  });
};


ScriptWidget.prototype.createScripts_ = function () {
  var sources = [];
  var element = this.pattern_;

  // If the widget element contains element nodes, scripts are represented
  // by placeholder comment pairs such as `<!--{script}--><!--/-->`.
  if (this.pattern_ === '!') {
    var comments = this.parent_.childNodes.filter(function (node) {
      return (node.nodeType === node.COMMENT_NODE);
    });

    for (var i = 0, ii = comments.length; i < ii; ++i) {
      var comment = comments[i];
      var value = comment.nodeValue;

      // On an opening comment node, create a new pair with the closing
      // comment node not set.
      if (value[0] === '{' && value[value.length - 1] === '}') {
        var source = value.substr(1, value.length - 2);
        sources.push({
          source: source,
          script: ScriptCompiler.compile(source),
          opening: comment,
          closing: null
        });
      }

      // On a closing comment node, complete the first comment pair with
      // its closing tag not set.
      if (value === '/') {
        for (var o = sources.length - 1; o >= 0; --o) {
          if (sources[o].closing === null) {
            sources[o].closing = comment;
            break;
          }
          if (o === 0) {
            throw new Error('Missing an opening script comment node.');
          }
        }
      }
    }
  } else {
    // Convert the pattern to a single script.
    // Example: `The name is {name}.` to `"The name is " + (name) + "."`
    // TODO: Escape double quotes in the strings.
    var source = this.pattern_.replace(/\{((?:[^}]|\\\})*)\}/g, '" + ($1) + "');
    source = '"' + source + '"';
    sources.push({
      source: source,
      script: ScriptCompiler.compile(source),
      container: this.parent_
    });
  }

  this.scripts_ = sources;
};


module.exports = ScriptWidget;
