'use strict';

const DebugToolsPlugin = require('..');
const fs = require('fs');

function createTests(options) {
  const babelVersion = options.babelVersion;
  const presets = options.presets;
  const transform = options.transform;

  describe('Feature Flags', function() {
    const h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: false,
              },
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            features: [
              {
                name: 'ember-source',
                source: '@ember/features',
                flags: {
                  FEATURE_A: false,
                  FEATURE_B: true,
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('inline-feature-flags');
    h.generateErrorTest(
      'missing-feature-flag',
      'Imported FEATURE_C from @ember/features which is not a supported flag.'
    );
  });

  describe('Debug Macros', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              source: '@ember/debug-tools',
              assertPredicateIndex: 0,
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('warn-expansion');
    h.generateTest('assert-expansion');
    h.generateTest('deprecate-expansion');
    h.generateErrorTest(
      'deprecate-missing-id',
      `deprecate's meta information requires an "id" field.`
    );
    h.generateTest('hygenic-debug-injection');
    h.generateTest('log-expansion');
  });

  describe('foreign debug imports', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            externalizeHelpers: {
              global: 'Ember',
            },
            debugTools: {
              source: '@ember/debug-tools',
              assertPredicateIndex: 0,
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],

        [
          function(babel) {
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
                    references.forEach(() => {
                      replacements.push(
                        t.variableDeclaration('var', [
                          t.variableDeclarator(
                            t.identifier(path.node.local.name),
                            t.memberExpression(t.identifier('Ember'), t.identifier(importedName))
                          ),
                        ])
                      );
                    });

                    path.remove();
                    importDeclarationPath.insertAfter(replacements);
                  }
                },
              },
            };
          },
        ],
      ],
    });

    h.generateTest('shared-debug-module');
  });

  describe('Global External Test Helpers', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            externalizeHelpers: {
              global: '__debugHelpers__',
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('global-external-helpers');
  });

  describe('ember-cli-babel default configuration', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            externalizeHelpers: {
              global: 'Ember',
            },
            debugTools: {
              source: '@ember/debug',
              assertPredicateIndex: 1,
            },
            envFlags: {
              source: '@glimmer/env',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('ember-cli-babel-config');
  });

  describe('Retain Module External Test Helpers', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            externalizeHelpers: {
              module: true,
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('retain-module-external-helpers');
  });

  describe('Development Svelte Builds', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              source: '@ember/debug-tools',
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },

            svelte: {
              'ember-source': '2.15.0',
            },

            features: [
              {
                name: 'my-app',
                source: 'my-app/features',
                flags: {
                  FEATURE_A: false,
                  FEATURE_B: true,
                },
              },
              // Note this going to have to be concated in by each lib
              {
                name: 'ember-source',
                source: '@ember/features',
                flags: {
                  DEPRECATED_PARTIALS: '2.14.0',
                  DEPRECATED_CONTROLLERS: '2.16.0',
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('development-svelte-builds');
  });

  describe('Production Svelte Builds', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              source: '@ember/debug-tools',
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: false,
              },
            },

            svelte: {
              'ember-source': '2.15.0',
            },

            features: [
              {
                name: 'my-app',
                source: 'my-app/features',
                flags: {
                  FEATURE_A: false,
                  FEATURE_B: true,
                },
              },
              // Note this going to have to be concated in by each lib
              {
                name: 'ember-source',
                source: '@ember/features',
                flags: {
                  DEPRECATED_PARTIALS: '2.14.0',
                  DEPRECATED_CONTROLLERS: '2.16.0',
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('production-svelte-builds');
  });

  describe('Inline Env Flags', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
                TESTING: false,
              },
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            features: [],
          },
        ],
      ],
    });

    h.generateTest('inject-env-flags');
    h.generateTest('debug-flag');
  });

  describe('Retains non-macro types', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              source: '@ember/debug-tools',
            },
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('retains-import-for-non-macro-types');
    h.generateTest('does-not-modify-non-imported-flags');
  });

  describe('Runtime Feature Flags', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: false,
              },
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            features: {
              name: 'ember-source',
              source: '@ember/features',
              flags: {
                FEATURE_A: true,
                FEATURE_B: null,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('runtime-feature-flags');
  });

  describe('Runtime default export features', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: false,
              },
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            features: {
              name: 'ember-source',
              source: '@ember/features',
              flags: {
                FEATURE_A: true,
                FEATURE_B: null,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('default-export-features');
  });

  describe('Retains runtime feature flag definitions', function() {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            envFlags: {
              source: '@ember/env-flags',
              flags: {
                DEBUG: true,
              },
            },
            debugTools: {
              source: '@ember/debug-tools',
            },
            features: {
              name: 'ember-source',
              source: '@ember/features',
              flags: {
                FOO_BAR: false,
                WIDGET_WOO: false,
              },
            },
          },
        ],
      ],
    });

    h.generateTest('retains-runtime-definitions');
  });

  function transformTestHelper(options) {
    return {
      generateTest(fixtureName) {
        it(fixtureName, function() {
          let sample = fs.readFileSync(`./fixtures/${fixtureName}/sample.js`, 'utf-8');
          let expectation = fs.readFileSync(
            `./fixtures/${fixtureName}/expectation${babelVersion}.js`,
            'utf-8'
          );
          expect(transform(sample, options).code).toEqual(expectation);
        });
      },

      generateErrorTest(fixtureName, error) {
        it(fixtureName, function() {
          let sample = fs.readFileSync(`./fixtures/${fixtureName}/sample.js`, 'utf-8');
          expect(() => transform(sample, options)).toThrow(error);
        });
      },
    };
  }
}

module.exports = createTests;
