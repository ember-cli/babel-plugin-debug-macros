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
  'Feature Flags': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: false
            }
          },
          debugTools: {
            source: '@ember/debug-tools'
          },
          features: [{
            name: "ember-source",
            source: '@ember/features',
            flags: {
              FEATURE_A: false,
              FEATURE_B: true
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

  'Debug Macros': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          debugTools: {
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
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
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
            }
          }
        }]
      ]
    },

    fixtures: ['global-external-helpers']
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
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
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
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
            }
          },

          svelte: {
            'ember-source': '2.15.0'
          },

          features: [{
            name: 'my-app',
            source: 'my-app/features',
            flags: {
              FEATURE_A: false,
              FEATURE_B: true
            }
          },
          // Note this going to have to be concated in by each lib
          {
            name: 'ember-source',
            source: '@ember/features',
            flags: {
              DEPRECATED_PARTIALS: '2.14.0',
              DEPRECATED_CONTROLLERS: '2.16.0'
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
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: false
            }
          },

          svelte: {
            'ember-source': '2.15.0'
          },

          features: [{
            name: 'my-app',
            source: 'my-app/features',
            flags: {
              FEATURE_A: false,
              FEATURE_B: true
            }
          },
          // Note this going to have to be concated in by each lib
          {
            name: 'ember-source',
            source: '@ember/features',
            flags: {
              DEPRECATED_PARTIALS: '2.14.0',
              DEPRECATED_CONTROLLERS: '2.16.0'
            }
          }]
        }]
      ]
    },

    fixtures: ['production-svelte-builds']
  },

  'Inline Env Flags': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true,
              TESTING: false
            }
          },
          debugTools: {
            source: '@ember/debug-tools'
          },
          features: []
        }]
      ]
    },
    fixtures: [
      'inject-env-flags'
    ]
  },

  'Retains non-macro types': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          debugTools: {
            source: '@ember/debug-tools'
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
            }
          }
        }]
      ]
    },
    fixtures: [
      'retains-import-for-non-macro-types'
    ]
  },

  'Runtime Feature Flags': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: false
            }
          },
          debugTools: {
            source: '@ember/debug-tools'
          },
          features: {
            name: 'ember-source',
            source: '@ember/features',
            flags: {
              FEATURE_A: true,
              FEATURE_B: null
            }
          }
        }]
      ]
    },
    fixtures: [
      'runtime-feature-flags'
    ]
  },
}

function compile(source, transformOptions) {
  return transform(source, transformOptions);
}

Object.keys(cases).forEach(caseName => {
  describe(caseName, () => {
    let ep = 0;

    cases[caseName].fixtures.forEach(assertionName => {
      if (cases[caseName].only) {
        it.only(assertionName, () => {
          test(caseName, cases, assertionName, ep);
        });
      } else {
        it(assertionName, () => {
          test(caseName, cases, assertionName, ep);
        });
      }
    });
  });
});


function test(caseName, cases, assertionName, ep) {
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
}