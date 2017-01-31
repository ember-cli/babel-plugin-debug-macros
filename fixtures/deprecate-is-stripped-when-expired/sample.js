import { deprecate } from 'debug-tools';

const WOOF = 'WOOF';

deprecate('This is deprecated', true, {
  until: '3.0.0',
  id: 'a-thing',
  url: 'http://example.com'
});