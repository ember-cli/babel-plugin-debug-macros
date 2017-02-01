import DebugToolsPlugin from '../index';
import { transform } from 'babel-core';
import { expect } from 'chai';
import { file } from 'chai-files';
import { lstatSync } from 'fs';

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
        [DebugToolsPlugin, {
          envFlags: {
            importSpecifier: '@ember/env-flags',
            flags: {
              DEBUG: 1
            }
          },
          debugTools: {
            importSpecifier: '@ember/debug-tools'
          },
          features: {
            importSpecifier: '@ember/features',
            flags: {
              FEATURE_A: 0,
              FEATURE_B: 1
            }
          }
        }]
      ],
    },
    fixtures: [
      'inline-feature-flags',
      'missing-feature-flag'
    ],
    errors: [
      'Imported FEATURE_C from @ember/features which is not a supported flag.'
    ]
  },

  'Debug Macros': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          debugTools: {
            importSpecifier: '@ember/debug-tools'
          },
          envFlags: {
            importSpecifier: '@ember/env-flags',
            flags: {
              DEBUG: 1
            }
          }
        }]
      ]
    },
    fixtures: [
      'warn-expansion',
      'assert-expansion',
      'deprecate-expansion',
      'deprecate-missing-id',
      'hygenic-debug-injection'
    ],
    errors: [
      `deprecate's meta information requires an "id" field.`,
      `deprecate's meta information requires an "until" field.`
    ]
  },

  'Deprecation stripping': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          debugTools: {
            importSpecifier: '@ember/debug-tools'
          },
          envFlags: {
            importSpecifier: '@ember/env-flags',
            flags: {
              DEBUG: 1
            }
          },
          packageVersion: '3.0.0'
        }]
      ]
    },

    fixtures: ['deprecate-is-stripped-when-expired']
  }
}

function compile(source, transformOptions) {
  return transform(source, transformOptions).code;
}

Object.keys(cases).forEach(caseName => {
  describe(caseName, () => {
    let ep = 0;

    cases[caseName].fixtures.forEach(assertionName => {
      it(assertionName, () => {
        let sample = file(`./fixtures/${assertionName}/sample.js`).content;
        let options = cases[caseName].transformOptions;
        let expectationPath = `./fixtures/${assertionName}/expectation.js`;
        let expectationExists = true;

        try {
          lstatSync(expectationPath);
        } catch (e) {
          expectationExists = false
        }

        if (expectationExists) {
          let expectation = file(`./fixtures/${assertionName}/expectation.js`).content;
          expect(compile(sample, options)).to.equal(expectation);
        } else {
          let fn = () => compile(sample, options);
          expect(fn).to.throw(new RegExp(cases[caseName].errors[ep++]));
        }
      });
    });
  });
});
