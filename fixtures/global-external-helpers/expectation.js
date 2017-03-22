(1 && __debugHelpers__.warn('This is a warning'));
(1 && __debugHelpers__.assert(false, 'Hahahaha'));
(1 && !true && __debugHelpers__.deprecate('This thing is donzo', true, {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));