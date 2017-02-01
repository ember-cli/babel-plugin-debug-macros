import { warn, assert, deprecate } from '@ember/debug-tools';

warn('This is a warning');

assert(false, 'Hahahaha');

deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
});