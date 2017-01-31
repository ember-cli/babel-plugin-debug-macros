// import { readFileSync } from 'fs';
// import MacroBuilder from './utils/macro-builder';

// /**
// Takes a deprecation CallExpression and strips the deprecation under the
// following conditions:

// 1) The "until" field in the meta is expired.
// 2) We are in production mode

// The expansion is as follows given the "until" is valid:

// ```javascript
// import { deprecate } from 'debug-tools';

// deprecate('This feature is no longer supported', false, {
//   id: 'some-deprecated-thing',
//   until: '3.0.0'
// });
// ```

// Would expand into:

// ```javascript
// const DEBUG = 0;

// (DEBUG && false && console.warn(`some-deprecated-thing (Until 3.0.0): This feature is no longer supported.`));
// ```

// If the deprecation "until" is expired then the output would be a complete removal
// of the CallExpression and warning in console asking for the removal from the code
// base.
// */

// export default function (babel) {
//   const { types: t } = babel;

//   let builder;
//   return {
//     name: 'babel-deprecation-macros',
//     visitor: {
//       Progam: {

//         enter() {
//           builder = new MacroBuilder(t);
//         },

//         exit() {

//         }
//       },

//       ImportDeclaration(path) {
//         let importPath = path.node.source.value;

//         if (importPath === '') {}

//       }
//     }
//   }
// };
