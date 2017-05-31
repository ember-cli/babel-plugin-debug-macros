

if (true) {
  doStuff();
}

(true && Ember.warn('This is a warning'));
(true && !(foo) && Ember.assert('Hahahaha', false));
(true && !(false) && Ember.assert('without predicate', false));
(true && !(true) && Ember.deprecate('This thing is donzo', false, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));