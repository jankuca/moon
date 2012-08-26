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

global.console.log = function () {};
global.console.info = function () {};
global.console.warn = function () {};
global.console.error = function () {};
global.console.trace = function () {};
