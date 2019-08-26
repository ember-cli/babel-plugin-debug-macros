(true && !(true) && console.warn('This is deprecated'));
(true && !(false) && console.warn('Message without predicate'));
(true && !(true) && console.warn('This is deprecated with options'));

function wrappedDeprecate() {
  (true && !(true) && console.warn('This is also deprecated'));
}