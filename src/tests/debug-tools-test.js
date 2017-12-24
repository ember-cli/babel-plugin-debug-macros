'use strict';

const DebugToolsPlugin = require('../index');
const transform = require('babel-core').transform;
const expect = require('chai').expect;
const file = require('chai-files').file;
const lstatSync = require('fs').lstatSync;

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
            source: '@ember/debug-tools',
            assertPredicateIndex: 0
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

  'foreign debug imports': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          externalizeHelpers: {
            global: 'Ember'
          },
          debugTools: {
            source: '@ember/debug-tools',
            assertPredicateIndex: 0
          },
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
            }
          }
        }],

        [function(babel) {
          let t = babel.types;

          return {
            name: 'import-remover',
            visitor: {
              ImportSpecifier(path) {
                let importedName = path.node.imported.name;
                if (importedName === 'inspect') {
                  let importDeclarationPath = path.findParent(p => p.isImportDeclaration());
                  let binding = path.scope.getBinding(importedName);
                  let references = binding.referencePaths;

                  let replacements = [];
                  for (let reference of references) {
                    replacements.push(t.variableDeclaration('var', [
                      t.variableDeclarator(
                        t.identifier(path.node.local.name),
                        t.memberExpression(t.identifier('Ember'), t.identifier(importedName))
                      ),
                    ]));
                  }

                  path.remove();
                  importDeclarationPath.insertAfter(replacements);
                }
              }
            }
          }
        }]
      ]
    },
    fixtures: [
      'shared-debug-module',
    ],
    errors: [ ]
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

  'ember-cli-babel default configuration': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          externalizeHelpers: {
            global: 'Ember'
          },
          debugTools: {
            source: '@ember/debug',
            assertPredicateIndex: 1
          },
          envFlags: {
            source: '@glimmer/env',
            flags: {
              DEBUG: true
            }
          }
        }]
      ]
    },

    fixtures: ['ember-cli-babel-config']
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
      'inject-env-flags',
      'debug-flag'
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
      'retains-import-for-non-macro-types',
      'does-not-modify-non-imported-flags'
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

  'Runtime default export features': {
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
      'default-export-features'
    ]
  },

  'Retains runtime feature flag definitions': {
    transformOptions: {
      presets,
      plugins: [
        [DebugToolsPlugin, {
          envFlags: {
            source: '@ember/env-flags',
            flags: {
              DEBUG: true
            }
          },
          debugTools: {
            source: '@ember/debug-tools'
          },
          features: {
            name: 'ember-source',
            source: '@ember/features',
            flags: {
              FOO_BAR: false,
              WIDGET_WOO: false
            }
          }
        }]
      ]
    },
    fixtures: [
      'retains-runtime-definitions'
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
      } else if (cases[caseName].skip) {
        it.skip(assertionName, () => {});
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
