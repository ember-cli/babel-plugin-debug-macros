import { isDevelopingApp } from '@embroider/macros';

if (isDevelopingApp()) {
  console.log('stuff');
}