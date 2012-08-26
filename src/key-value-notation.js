var Tokenizer = require('tokenizer');


var stringify = function (input) {
  switch (typeof input) {
  case 'string':
    return "'" + input.replace(/'/g, "\\'") + "'";
  case 'number':
    return String(input);
  case 'boolean':
    return (input ? 'true' : 'false');
  case 'undefined':
    return 'null';
  case 'object':
    if (input === null) {
      return 'null';
    }

    var result = '[';
    result += Object.keys(input).map(function (key) {
      return stringify(key) + ':' + stringify(input[key]);
    }).join(', ');
    result += ']';
    return result;
  }
};


var parse = function (input) {
  var tokenizer = new Tokenizer();
  tokenizer.addRule(/^'([^']|\\')+':$/, 'key');
  tokenizer.addRule(/^'([^']|\\')*'$/, 'string');
  tokenizer.addRule(/^\s+$/, 'whitespace');
  tokenizer.addRule(/^(\d*\.)?\d+$/, 'number');
  tokenizer.addRule(/^(true|false)$/, 'boolean');
  tokenizer.addRule(/^null$/, 'null');
  tokenizer.addRule(/^(\[|,|\])$/, 'symbol');
  tokenizer.addRule(/^;$/, 'terminator');

  tokenizer.addRule(/^'([^']|\\')*$/, 'maybe-string');
  tokenizer.addRule(/^\d*\.$/, 'maybe-number');
  tokenizer.addRule(/^(t(r(ue?)?)?|f(a(l(se?)?)?)?)$/, 'maybe-boolean');
  tokenizer.addRule(/^n(u(ll?)?)?$/, 'maybe-null');


  var result = [];
  var key = 0;
  var cursors = [ result ]

  tokenizer.on('token', function (token, type) {
    var cursor = cursors[cursors.length - 1];

    switch (type) {
    case 'symbol':
      switch (token) {
      case '[':
        var obj = {};
        cursor[key] = obj;
        cursors.push(obj);
        break;
      case ']':
        cursors.pop();
        break;
      }
      break;

    case 'key':
      key = token.substr(1).replace(/'\s*:$/, '');
      break;

    case 'string':
      cursor[key] = token.substr(1, token.length - 2);
      break;
    case 'number':
      cursor[key] = Number(token);
      break;
    case 'boolean':
      cursor[key] = (token === 'true');
      break;
    case 'null':
      cursor[key] = null;
      break;
    }
  });

  tokenizer.write(input + ';');

  return result[0];
};


var KeyValueNotation = {};
KeyValueNotation.stringify = stringify;
KeyValueNotation.parse = parse;


module.exports = KeyValueNotation;
