

(() => (true && !('assert') && console.assert('assert')))();
const assert1 = () => (true && !('assert') && console.assert('assert'));
const assert2 = () => {
  return (true && !('assert') && console.assert('assert'));
};

(() => (true && console.warn('warn')))();
const warn1 = () => (true && console.warn('warn'));
const warn2 = () => {
  return (true && console.warn('warn'));
};

(() => (true && console.log('log')))();
const log1 = () => (true && console.log('log'));
const log2 = () => {
  return (true && console.log('log'));
};

(() => (true && !(false) && console.warn('deprecate')))();
const deprecate1 = () => (true && !(false) && console.warn('deprecate'));
const deprecate2 = () => {
  return (true && !(false) && console.warn('deprecate'));
};