const FEATURE_A = 0;
const FEATURE_B = 1;


let a;
if (FEATURE_A) {
  a = () => console.log('hello');
} else if (FEATURE_B) {
  a = () => console.log('bye');
}