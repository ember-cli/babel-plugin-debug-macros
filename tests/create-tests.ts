import DebugToolsPlugin from '../src/index.js';
import fs from 'fs';
import 'code-equality-assertions/jest';
import { type TransformOptions, transform } from '@babel/core';
import * as Babel from '@babel/core';
import { types as t } from '@babel/core';
import { UserOptions } from '../src/utils/normalize-options.js';

const CONSOLE = Object.assign({}, console);

export interface Options {
  presets: TransformOptions['presets'];
  babelVersion: 7;
  transform: typeof transform;
}

export default function createTests(options: Options) {
  const babelVersion = options.babelVersion;
  const presets = options.presets;
  const transform = options.transform;

  afterEach(function () {
    Object.assign(console, CONSOLE);
  });

  describe('Feature Flags', function () {
    const h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            flags: [
              {
                source: '@ember/env-flags',
                flags: {
                  DEBUG: false,
                },
              },
              {
                source: '@ember/features',
                flags: {
                  FEATURE_A: false,
                  FEATURE_B: true,
                },
              },
            ],
            debugTools: {
              isDebug: false,
              source: '@ember/debug-tools',
            },
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

  describe('Debug Macros', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
              assertPredicateIndex: 0,
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true } }],
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

  describe('Debug macros idempotnency', function () {
    let h = transformTestHelper({
      presets,
      plugins: [[DebugToolsPlugin]],
    });

    h.generateTest('missing-debug-tools-options');
  });

  describe('foreign debug imports', function () {
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
              isDebug: true,
              source: '@ember/debug-tools',
              assertPredicateIndex: 0,
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true } }],
          },
        ],

        [
          function (babel: typeof Babel): Babel.PluginObj {
            let t = babel.types;

            return {
              name: 'import-remover',
              visitor: {
                ImportSpecifier(path) {
                  let importedName = babel.types.isIdentifier(path.node.imported)
                    ? path.node.imported.name
                    : path.node.imported.value;
                  if (importedName === 'inspect') {
                    let importDeclarationPath = path.findParent((p) => p.isImportDeclaration());
                    let binding = path.scope.getBinding(importedName)!;
                    let references = binding.referencePaths;

                    let replacements: t.VariableDeclaration[] = [];
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
                    importDeclarationPath!.insertAfter(replacements);
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

  describe('Global External Test Helpers', function () {
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
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true } }],
          },
        ],
      ],
    });

    h.generateTest('global-external-helpers');
  });

  describe('ember-cli-babel configuration', function () {
    describe('default configuration', function () {
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
                isDebug: true,
                source: '@ember/debug',
                assertPredicateIndex: 1,
              },
              flags: [{ source: '@glimmer/env', flags: { DEBUG: true } }],
            },
          ],
        ],
      });

      h.generateTest('ember-cli-babel-config-pre-3-27');
    });

    describe('Ember >= 3.27', function () {
      describe('default configuration', function () {
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
                  isDebug: true,
                  source: '@ember/debug',
                  assertPredicateIndex: 1,
                },
                flags: [{ source: '@glimmer/env', flags: { DEBUG: true } }],
              },
            ],
          ],
        });

        h.generateTest('ember-cli-babel-config');
      });
    });
  });

  describe('Retain Module External Test Helpers', function () {
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
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true } }],
          },
        ],
      ],
    });

    h.generateTest('retain-module-external-helpers');
  });

  describe('Svelte Builds', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [
              { source: '@ember/env-flags', flags: { DEBUG: true } },
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

            svelte: {
              'ember-source': '2.15.0',
            },
          },
        ],
      ],
    });

    h.generateTest('development-svelte-builds');
  });

  describe('Inline Env Flags', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true, TESTING: false } }],
          },
        ],
      ],
    });

    h.generateTest('inject-env-flags');
    h.generateTest('debug-flag');
  });

  describe('Retains non-macro types', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [{ source: '@ember/env-flags', flags: { DEBUG: true } }],
          },
        ],
      ],
    });

    h.generateTest('retains-import-for-non-macro-types');
    h.generateTest('does-not-modify-non-imported-flags');
  });

  describe('Removes Imports Without Specifiers', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
            flags: [{ source: '@glimmer/env', flags: { DEBUG: true } }],
          },
        ],
      ],
    });

    h.generateTest('removes-imports-without-specifiers');
  });

  describe('Runtime Feature Flags', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: false,
              source: '@ember/debug-tools',
            },
            flags: [
              { source: '@ember/env-flags', flags: { DEBUG: false } },
              {
                source: '@ember/features',
                flags: {
                  FEATURE_A: true,
                  FEATURE_B: null,
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('runtime-feature-flags');
  });

  describe('Runtime default export features', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              isDebug: false,
              source: '@ember/debug-tools',
            },
            flags: [
              { source: '@ember/env-flags', flags: { DEBUG: false } },
              {
                source: '@ember/features',
                flags: {
                  FEATURE_A: true,
                  FEATURE_B: null,
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('default-export-features');
  });

  describe('Retains runtime feature flag definitions', function () {
    let h = transformTestHelper({
      presets,
      plugins: [
        [
          DebugToolsPlugin,
          {
            flags: [
              { source: '@ember/env-flags', flags: { DEBUG: true } },
              {
                name: 'ember-source',
                source: '@ember/features',
                flags: {
                  FOO_BAR: false,
                  WIDGET_WOO: false,
                },
              },
            ],
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
          },
        ],
      ],
    });

    h.generateTest('retains-runtime-definitions');
  });

  describe('@embroider/macros target', function () {
    let h = transformTestHelper({
      plugins: [
        [
          DebugToolsPlugin,
          {
            debugTools: {
              source: '@ember/debug',
              assertPredicateIndex: 1,
              isDebug: '@embroider/macros',
            },
            externalizeHelpers: {
              module: true,
            },
            flags: [
              {
                source: '@glimmer/env',
                flags: {
                  DEBUG: '@embroider/macros',
                },
              },
            ],
          },
        ],
      ],
    });

    h.generateTest('embroider-macros/assert');
    h.generateTest('embroider-macros/deprecate');
    h.generateTest('embroider-macros/glimmer-env');
  });

  // This says: the first plugin must be our own plugin. It allows us to
  // typecheck the options.
  type OurTransformOptions = Omit<TransformOptions, 'plugins'> & {
    plugins: [[unknown, UserOptions?], ...NonNullable<TransformOptions['plugins']>];
  };

  function transformTestHelper(options: OurTransformOptions) {
    return {
      generateTest(fixtureName: string) {
        it(fixtureName, function () {
          let sample = fs.readFileSync(`./fixtures/${fixtureName}/sample.js`, 'utf-8');
          let expectation = fs.readFileSync(
            `./fixtures/${fixtureName}/expectation${babelVersion}.js`,
            'utf-8'
          );
          expect(transform(sample, options)!.code).toEqualCode(expectation);
        });
      },

      generateErrorTest(fixtureName: string, error: string) {
        it(fixtureName, function () {
          let sample = fs.readFileSync(`./fixtures/${fixtureName}/sample.js`, 'utf-8');
          expect(() => transform(sample, options)).toThrow(error);
        });
      },
    };
  }
}
