import { assert } from '@ember/debug';

assert('This is an assertion', (() => true )());
assert('This is an assertion 2', false);