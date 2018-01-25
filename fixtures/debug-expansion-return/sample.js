import { DEBUG } from '@ember/env-flags';
import { assert, warn, log, deprecate } from '@ember/debug-tools';

(function() {
  return assert('assert');
})();
const assert1 = function() {
  return assert('assert');
};
function assert2() {
  return assert('assert');
}

(function(){
  return warn('warn');
})();
const warn1 = function() {
  return warn('warn');
};
function warn2() {
  return warn('warn');
}

(function(){
  return log('log');
})();
const log1 = function() {
  return log('log');
};
function log2() {
  return log('log');
}

(function(){
  return deprecate('deprecate');
})();
const deprecate1 = function() {
  return deprecate('deprecate');
};
function deprecate2() {
  return deprecate('deprecate');
}
