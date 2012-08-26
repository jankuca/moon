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


var createLogger = function (target) {
  return function () {
    var err = new Error();
    var origin = err.stack.split("\n")[2];
    if (/mocha/.test(origin)) {
      target.apply(global.console, arguments);
    }
  };
};

global.console.log = createLogger(global.console.log);
global.console.info = createLogger(global.console.info);
global.console.warn = createLogger(global.console.warn);
global.console.error = createLogger(global.console.error);
global.console.trace = createLogger(global.console.trace);
