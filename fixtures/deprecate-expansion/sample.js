import { DEBUG } from '@ember/env-flags';
import { deprecate } from '@ember/debug-tools';

deprecate('This is deprecated', true, {
  until: '3.0.0',
  id: 'a-thing',
  url: 'http://example.com'
});