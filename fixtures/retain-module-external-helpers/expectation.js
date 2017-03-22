const _DEBUG = 1;
import { warn, assert, deprecate } from '@ember/debug-tools';

(_DEBUG && warn('This is a warning'));
(_DEBUG && assert(false, 'Hahahaha'));
(_DEBUG && !true && deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));