import { warn, assert, deprecate } from '@ember/debug';

if (true
/* DEBUG */
) {
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