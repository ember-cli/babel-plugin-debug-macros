

(function () {
  return (true && !('assert') && console.assert('assert'));
})();
const assert1 = function () {
  return (true && !('assert') && console.assert('assert'));
};
function assert2() {
  return (true && !('assert') && console.assert('assert'));
}

(function () {
  return (true && console.warn('warn'));
})();
const warn1 = function () {
  return (true && console.warn('warn'));
};
function warn2() {
  return (true && console.warn('warn'));
}

(function () {
  return (true && console.log('log'));
})();
const log1 = function () {
  return (true && console.log('log'));
};
function log2() {
  return (true && console.log('log'));
}

(function () {
  return (true && !(false) && console.warn('deprecate'));
})();
const deprecate1 = function () {
  return (true && !(false) && console.warn('deprecate'));
};
function deprecate2() {
  return (true && !(false) && console.warn('deprecate'));
}