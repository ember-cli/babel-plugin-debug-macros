'use strict';

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _babelCore = require('babel-core');

var _chai = require('chai');

var _chaiFiles = require('chai-files');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const presets = [["latest", {
  "es2015": false,
  "es2016": false,
  "es2017": false
}]];

let cases = {
  'Feature Flags': {
    transformOptions: {
      presets,
      plugins: [[_index2.default, { features: { FEATURE_A: 0, FEATURE_B: 1 } }]]
    },
    fixtures: ['inline-feature-flags']
  }
};

function compile(source, transformOptions) {
  return (0, _babelCore.transform)(source, transformOptions).code;
}

Object.keys(cases).forEach(caseName => {
  describe(caseName, () => {
    cases[caseName].fixtures.forEach(assertionName => {
      it(assertionName, () => {
        let sample = (0, _chaiFiles.file)(`./fixtures/${assertionName}/sample.js`).content;
        let options = cases[caseName].transformOptions;
        let expectation = (0, _chaiFiles.file)(`./fixtures/${assertionName}/expectation.js`).content;
        (0, _chai.expect)(compile(sample, options)).to.equal(expectation);
      });
    });
  });
});