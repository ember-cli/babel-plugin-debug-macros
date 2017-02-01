const _DEBUG = 1;
(_DEBUG && __debugHelpers__.warn('This is a warning'));
(_DEBUG && __debugHelpers__.assert(false, 'Hahahaha'));
(_DEBUG && true && __debugHelpers__.deprecate('DEPRECATED [donzo]: This thing is donzo. Will be removed in 4.0.0. See http://example.com for more information.'));