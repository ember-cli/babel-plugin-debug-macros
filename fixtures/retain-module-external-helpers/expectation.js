import { warn, assert, deprecate } from '@ember/debug-tools';

(1 && warn('This is a warning'));
(1 && assert(false, 'Hahahaha'));
(1 && !true && deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));