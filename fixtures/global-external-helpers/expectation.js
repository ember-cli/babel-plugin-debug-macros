const _DEBUG = 1;
(_DEBUG && __debugHelpers__.warn('This is a warning'));
(_DEBUG && __debugHelpers__.assert(false, 'Hahahaha'));
(_DEBUG && true && __debugHelpers__.deprecate('This thing is donzo', {
  id: 'donzo',
  until: '4.0.0',
  url: 'http://example.com'
}));