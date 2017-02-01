const _DEBUG = 1;

import bar from 'something';

if (bar()) {
  const DEBUG = 'hahah';
  (_DEBUG && true && console.warn('DEPRECATED [a-thing]: This is deprecated. Will be removed in 3.0.0. See http://example.com for more information.'));
}