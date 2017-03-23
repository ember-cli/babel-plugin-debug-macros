(true && __debugHelpers__.warn('This is a warning'));
(true && __debugHelpers__.assert(false, 'Hahahaha'));
(true && !(true) && __debugHelpers__.deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));