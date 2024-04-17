import { assert } from '@ember/debug';
import { isDevelopingApp } from '@embroider/macros';

isDevelopingApp() && !(() => true )() && assert('This is an assertion', (() => true )());
isDevelopingApp() && !false && assert('This is an assertion 2', false);