import createTests from './create-tests.js';
import { transformSync as transform } from '@babel/core';

const presets = [
  [
    '@babel/preset-env',
    {
      targets: {
        browsers: ['> 5%'],
      },
      modules: false,
    },
  ],
];

createTests({
  presets: presets,
  babelVersion: 7,
  transform: transform,
});
