import { deprecate } from '@ember/debug';

deprecate('This is deprecated', false, {
  until: '3.0.0',
  id: 'a-thing',
  url: 'http://example.com'
})