(true && !((() => true)()) && console.assert((() => true)(), 'This is an assertion'));
(true && !(false) && console.assert(false, 'This is an assertion 2'));
(true && !(false) && console.assert(false, 'renamed assertion'));
