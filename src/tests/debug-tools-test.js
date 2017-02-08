import DebugToolsPlugin from '../index';
import { transform } from 'babel-core';
import { expect } from 'chai';
import { file } from 'chai-files';
import { lstatSync, writeFileSync } from 'fs';

const presets = [["latest", {
  "es2015": false,
  "es2016": false,
  "es2017": false
}]];

let cases = {
  'Production Feature Flags': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          envFlags: {
            importSpecifier: '@ember/env-flags',
            flags: {
              DEBUG: 0
            }
          },
          debugTools: {
            importSpecifier: '@ember/debug-tools'
          },
          features: [{
            name: "ember-source",
            importSpecifier: '@ember/features',
            flags: {
              FEATURE_A: 0,
              FEATURE_B: 1
            }
          }]
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

  'Development Feature Flags': {
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
          features: [{
            name: 'ember-source',
            importSpecifier: '@ember/features',
            flags: {
              FEATURE_A: 0,
              FEATURE_B: 1
            }
          }]
        }]
      ]
    },
    fixtures: [
      'development-feature-flags'
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
      'hygenic-debug-injection',
      'log-expansion'
    ],
    errors: [
      `deprecate's meta information requires an "id" field.`,
      `deprecate's meta information requires an "until" field.`
    ]
  },

  'Global External Test Helpers': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          externalizeHelpers: {
            global: '__debugHelpers__'
          },
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

    fixtures: ['global-external-helpers']
  },

  'Module External Test Helpers': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          externalizeHelpers: {
            module: '@ember/metal'
          },
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

    fixtures: ['module-external-helpers']
  },

  'Retain Module External Test Helpers': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          externalizeHelpers: {
            module: true
          },
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

    fixtures: ['retain-module-external-helpers']
  },

  'Development Svelte Builds': {
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

          svelte: {
            'ember-source': '2.15.0'
          },

          features: [{
            name: 'my-app',
            importSpecifier: 'my-app/features',
            flags: {
              FEATURE_A: 0,
              FEATURE_B: 1
            }
          },
          // Note this going to have to be concated in by each lib
          {
            name: 'ember-source',
            importSpecifier: '@ember/features',
            flags: {
              DEPRECATED_PARTIALS: '2.14.0',
              DEPRECATED_CONTROLERS: '2.16.0'
            }
          }]
        }]
      ]
    },

    fixtures: ['development-svelte-builds']
  },

  'Production Svelte Builds': {
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
              DEBUG: 0
            }
          },

          svelte: {
            'ember-source': '2.15.0'
          },

          features: [{
            name: 'my-app',
            importSpecifier: 'my-app/features',
            flags: {
              FEATURE_A: 0,
              FEATURE_B: 1
            }
          },
          // Note this going to have to be concated in by each lib
          {
            name: 'ember-source',
            importSpecifier: '@ember/features',
            flags: {
              DEPRECATED_PARTIALS: '2.14.0',
              DEPRECATED_CONTROLLERS: '2.16.0'
            }
          }]
        }]
      ]
    },

    fixtures: ['production-svelte-builds']
  }
}

function compile(source, transformOptions) {
  return transform(source, transformOptions);
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
          let compiled = compile(sample, options);
          expect(compiled.code).to.equal(expectation);

        } else {
          let fn = () => compile(sample, options);
          expect(fn).to.throw(new RegExp(cases[caseName].errors[ep++]));
        }
      });
    });
  });
});
