import { warn, assert, deprecate } from '@ember/debug-tools';

(true && warn('This is a warning'));
(true && assert(false, 'Hahahaha'));
(true && !(true) && deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));