import { warn, assert, deprecate, warn as debugWarn, assert as debugAssert, deprecate as debugDeprecate } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

if (DEBUG) {
  doStuff();
}

warn('This is a warning');

assert('Hahahaha', foo);
assert('without predicate');

deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
});

// renamed imports
debugWarn('This is a warning');

debugAssert('Hahahaha', foo);
debugAssert('without predicate');

debugDeprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
});


