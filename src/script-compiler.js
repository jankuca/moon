var vm = require('vm');
var Tokenizer = require('tokenizer');


var ScriptCompiler = {};


ScriptCompiler.compile = function (source) {
  var tokenizer = ScriptCompiler.createTokenizer_();

  var root_level = [];
  var cursors = [];
  cursors.push({ list: root_level, index: 0, space: Infinity });

  var handleSymbol = function (symbol, cursor) {
    if (cursor.space !== Infinity) {
      cursor = cursors.pop();
    }

    switch (symbol) {
    case '&&':
      var prev = cursor.list[cursor.index - 1];
      var level = [
        '(', prev, '?', prev, '+', null, ':"")'
      ];
      cursor.list[cursor.index - 1] = level;
      cursors.push(cursor);
      cursors.push({ list: level, index: 5, space: 1 });
      break;

    case '.':
      var prev = cursor.list[cursor.index - 1];
      var level = [
        '(', prev, '.', null, '||"")'
      ];
      cursor.list[cursor.index - 1] = level;
      cursors.push(cursor);
      cursors.push({ list: level, index: 3, space: 1, key: true });
      break;

    case '@':
      var args = [];
      var level = [
        'this.$$fn.', null, '(', args, ')'
      ];
      cursor.list[cursor.index++] = level;
      cursors.push(cursor);
      cursors.push({ list: args, index: 0, space: 1 });
      cursors.push({ list: level, index: 1, space: 1, key: true });
      break;

    case '(':
      var level = [];
      cursor.list[cursor.index++] = [ '(', level , ')' ];
      if (--cursor.space) {
        cursors.push(cursor);
      }
      cursors.push({ list: level, index: 0, space: Infinity });
      break;

    case ')':
      break;

    default:
      cursor.list[cursor.index++] = symbol;
      cursors.push(cursor);
    }
  };

  tokenizer.on('token', function (token, type) {
    var cursor = cursors.pop();
    switch (type) {
    case 'string':
      cursor.list[cursor.index++] = token.replace(/\n/g, '\\n');
      if (--cursor.space) {
        cursors.push(cursor);
      }
      break;

    case 'number':
      cursor.list[cursor.index++] = token;
      if (--cursor.space) {
        cursors.push(cursor);
      }
      break;

    case 'identifier':
      cursor.list[cursor.index++] = cursor.key ? token : [
        '(this.', token, '||"")'
      ];
      if (--cursor.space) {
        cursors.push(cursor);
      }
      break;

    case 'symbol':
      handleSymbol(token, cursor);
      break;

    default:
      cursors.push(cursor);
    }
  });
  // There is a strange bug in the tokenizer that causes it
  // not to return the last token.
  tokenizer.write(source + ';');

  var fn = ScriptCompiler.buildScript_(root_level);
  return fn;
};


ScriptCompiler.createTokenizer_ = function () {
  var tokenizer = new Tokenizer();
  tokenizer.addRule(/^"([^"]|\\")*"$/, 'string');
  tokenizer.addRule(/^'([^']|\\')*'$/, 'string');
  tokenizer.addRule(/^(@|\.|&&|\|\||\+|\(|\))$/, 'symbol');
  tokenizer.addRule(/^([a-z_$]\w*)$/i, 'identifier');
  tokenizer.addRule(/^(\d+(?:\.\d+))$/, 'number');
  tokenizer.addRule(/^(\s)$/, 'whitespace');
  tokenizer.addRule(/^;$/, 'terminator');

  // The tokenizer needs to match any part of a token against
  // at least one of the `RegExp`s to not throw a `SyntaxError`.
  tokenizer.addRule(/^"([^"]|\\")*$/, 'maybe-string');
  tokenizer.addRule(/^'([^']|\\')*$/, 'maybe-string');
  tokenizer.addRule(/^(&|\|)$/, 'maybe-symbol');

  return tokenizer;
};


ScriptCompiler.buildScript_ = function (tree) {
  var js = '';
  var processLevel = function (level) {
    level.forEach(function (token) {
      if (Array.isArray(token)) {
        processLevel(token)
      } else {
        js += token;
      }
    });
  };
  processLevel(tree);

  return new Function('return (' + js + ');');
};


module.exports = ScriptCompiler;
