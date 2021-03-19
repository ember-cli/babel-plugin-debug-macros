import { warn, assert, deprecate } from '@ember/debug';


if (true /* DEBUG */) {
  doStuff();
}

(true && warn('This is a warning'));
(true && !(foo) && assert('Hahahaha', foo));
(true && !(false) && assert('without predicate'));
(true && !(true) && deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));

// renamed imports

(true && Ember.warn('This is a warning'));
(true && !(foo) && Ember.assert('Hahahaha', foo));
(true && !(false) && Ember.assert('without predicate'));
(true && !(true) && Ember.deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));
