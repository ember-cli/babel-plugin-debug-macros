const _DEBUG = 1;

import bar from 'something';

if (bar()) {
  const DEBUG = 'hahah';
  (_DEBUG && true && console.warn('This is deprecated'));
}