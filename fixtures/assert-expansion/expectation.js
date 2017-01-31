const DEBUG = 1;
(DEBUG && console.assert((() => true)(), 'This is an assertion'));
(DEBUG && console.assert(false, 'This is an assertion 2'));