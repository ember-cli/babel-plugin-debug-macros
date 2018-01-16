import { DEBUG } from '@ember/env-flags';
import { assert, warn, log, deprecate } from '@ember/debug-tools';

(() => assert('assert'))();
const assert1 = () => assert('assert');
const assert2 = () => {
  return assert('assert');
};

(() => warn('warn'))();
const warn1 = () => warn('warn');
const warn2 = () => {
  return warn('warn');
};

(() => log('log'))();
const log1 = () => log('log');
const log2 = () => {
  return log('log');
};

(() => deprecate('deprecate'))();
const deprecate1 = () => deprecate('deprecate');
const deprecate2 = () => {
  return deprecate('deprecate');
};
