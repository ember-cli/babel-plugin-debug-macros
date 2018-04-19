

let a;
if (false) {
  a = () => console.log('hello');
} else if (true) {
  a = () => console.log('bye');
}

if (!false) {
  console.log('stuff');
}

a = false ? 'hello' : 'bye';

if (false && window.foo && window.bar) {
  console.log('wheeee');
}