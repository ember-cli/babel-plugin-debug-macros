import { deprecate } from '@ember/debug';
import { isDevelopingApp } from '@embroider/macros';

isDevelopingApp() &&
  !false &&
  deprecate('This is deprecated', false, {
    until: '3.0.0',
    id: 'a-thing',
    url: 'http://example.com',
  });
