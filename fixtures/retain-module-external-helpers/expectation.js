const _DEBUG = 1;
import { warn, assert, deprecate } from '@ember/debug-tools';

(_DEBUG && warn('This is a warning'));
(_DEBUG && assert(false, 'Hahahaha'));
(_DEBUG && true && deprecate('DEPRECATED [donzo]: This thing is donzo. Will be removed in 4.0.0. See http://example.com for more information.'));