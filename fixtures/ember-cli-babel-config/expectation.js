

if (true) {
  doStuff();
}

(true && Ember.warn('This is a warning'));
(true && !(foo) && Ember.assert('Hahahaha', foo));
(true && !(true) && Ember.deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));