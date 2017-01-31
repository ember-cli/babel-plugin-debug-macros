import DebugToolsPlugin from '../index';
import { transform } from 'babel-core';
import { expect } from 'chai';
import { file } from 'chai-files';

const presets = [["latest", {
  "es2015": false,
  "es2016": false,
  "es2017": false
}]];

let cases = {
  'Feature Flags': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, { features: { FEATURE_A: 0, FEATURE_B: 1 } }]
      ],
    },
    fixtures: [
      'inline-feature-flags'
    ]
  }
}

function compile(source, transformOptions) {
  return transform(source, transformOptions).code;
}

Object.keys(cases).forEach(caseName => {
  describe(caseName, () => {
    cases[caseName].fixtures.forEach(assertionName => {
      it(assertionName, () => {
        let sample = file(`./fixtures/${assertionName}/sample.js`).content;
        let options = cases[caseName].transformOptions;
        let expectation = file(`./fixtures/${assertionName}/expectation.js`).content;
        expect(compile(sample, options)).to.equal(expectation);
      });
    });
  });
});
