var path = require('path');

var HTML_COVERAGE_REPORTING = (process.argv.indexOf('html-cov') !== -1);
var JSON_COVERAGE_REPORTING = (process.argv.indexOf('json-cov') !== -1);
var COVERAGE_REPORTING = HTML_COVERAGE_REPORTING || JSON_COVERAGE_REPORTING;

global.include = function (file_path) {
  if (COVERAGE_REPORTING) {
    file_path = path.join('../../src-cov', file_path);
  } else {
    file_path = path.join('../../src', file_path);
  }
  return require(file_path);
};


var console_log = console.log;
var console_error = console.error;
var log = [];

var createLogger = function (target, highlight) {
  return function () {
    var err = new Error();
    var origin = err.stack.split("\n")[2];
    if (/mocha/.test(origin)) {
      target.apply(global.console, arguments);

    } else {
      var args = [].slice.call(arguments);
      if (args[1]) {
        args[1] = (highlight ? '\033[0m' : '\033[0;37m') + args[1];
      }

      log.push([ target ].concat(args));
    }
  };
};

global.console.log = createLogger(global.console.log);
global.console.info = createLogger(global.console.info);
global.console.warn = createLogger(global.console.warn, true);
global.console.error = createLogger(global.console.error, true);
global.console.trace = createLogger(global.console.trace, true);

process.on('exit', function () {
  if (log.length > 0) {
    console_log('');
    log.forEach(function (args) {
      args[0].apply(global.console, args.slice(1));
    });
    console_log('\033[0m');
  }
});
