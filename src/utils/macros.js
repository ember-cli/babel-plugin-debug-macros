'use strict';

const Builder = require('./builder');

const DEBUG = 'DEBUG';
const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];

module.exports = class Macros {
  constructor(t, options) {
    this.localDebugBindings = [];
    this.envFlagBindings = [];
    this.hasEnvFlags = false;
    this.envFlagsSource = options.envFlags.envFlagsImport;
    this.importedDebugTools = false;
    this.envFlags = options.envFlags.flags;
    this.featureSources = options.featureSources;
    this.featuresMap = options.featuresMap;
    this.svelteMap = options.svelteMap;
    this.svelteVersions = options.svelte;
    this.featureFlags = options.features || [];
    this.debugHelpers = options.externalizeHelpers || {};
    this.builder = new Builder(t, {
      module: this.debugHelpers.module,
      global: this.debugHelpers.global,
      assertPredicateIndex: options.debugTools.assertPredicateIndex,
    });
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  expand(path) {
    let debugBinding = path.scope.getBinding(DEBUG);

    this._inlineFeatureFlags(path);
    this._inlineSvelteFlags(path);
    this._inlineEnvFlags(path);
    this.builder.expandMacros(this.envFlags.DEBUG);

    if (this._hasDebugModule(debugBinding)) {
      debugBinding.path.parentPath.remove();
    }

    this._cleanImports(path);
  }

  _inlineFeatureFlags(path) {
    let featuresMap = this.featuresMap;

    if (this.envFlags.DEBUG) {
      return;
    }
    Object.keys(featuresMap).forEach(source => {
      Object.keys(featuresMap[source]).forEach(flag => {
        let flagValue = featuresMap[source][flag];
        let binding = path.scope.getBinding(flag);

        if (binding && flagValue !== null) {
          binding.referencePaths.forEach(referencePath => {
            referencePath.replaceWith(this.builder.t.booleanLiteral(flagValue));
          });

          if (binding.path.parentPath.isImportDeclaration()) {
            binding.path.remove();
          }
        }
      });
    });
  }

  _inlineEnvFlags(path) {
    let envFlags = this.envFlags;

    Object.keys(envFlags).forEach(flag => {
      let binding = path.scope.getBinding(flag);
      if (
        binding &&
        binding.path.isImportSpecifier() &&
        binding.path.parent.source.value === this.envFlagsSource
      ) {
        binding.referencePaths.forEach(p =>
          p.replaceWith(this.builder.t.booleanLiteral(envFlags[flag]))
        );
      }
    });
  }

  _inlineSvelteFlags(path) {
    let svelteMap = this.svelteMap;
    let envFlags = this.envFlags;
    let builder = this.builder;

    let sources = Object.keys(svelteMap);
    sources.forEach(source => {
      Object.keys(svelteMap[source]).forEach(flag => {
        let binding = path.scope.getBinding(flag);
        if (binding !== undefined) {
          binding.referencePaths.forEach(p => {
            let t = builder.t;
            // in debug builds add an error after a conditional (to ensure if the
            // specific branch is taken, an error is thrown)
            if (envFlags.DEBUG && svelteMap[source][flag] === false) {
              if (p.parentPath.isIfStatement()) {
                let consequent = p.parentPath.get('consequent');
                consequent.unshiftContainer(
                  'body',
                  t.throwStatement(
                    t.newExpression(t.identifier('Error'), [
                      t.stringLiteral(
                        `You indicated you don't have any deprecations, however you are relying on ${flag}.`
                      ),
                    ])
                  )
                );
              }
            } else if (envFlags.DEBUG === false) {
              p.replaceWith(t.booleanLiteral(svelteMap[source][flag]));
            }
          });

          if (!envFlags.DEBUG && binding) {
            binding.path.remove();
          }
        }
      });
    });
  }

  /**
   * Collects the import bindings for the debug tools.
   */
  collectDebugToolsSpecifiers(specifiers) {
    this.importedDebugTools = true;
    this._collectImportBindings(specifiers, this.localDebugBindings);
  }

  collectEnvFlagSpecifiers(specifiers) {
    this.hasEnvFlags = true;
    this._collectImportBindings(specifiers, this.envFlagBindings);
  }

  /**
   * Builds the expressions that the CallExpression will expand into.
   */
  build(path) {
    let expression = path.node.expression;

    if (
      this.builder.t.isCallExpression(expression) &&
      this.localDebugBindings.some(b => b.node.name === expression.callee.name)
    ) {
      let imported = path.scope.getBinding(expression.callee.name).path.node.imported.name;
      this.builder[`${imported}`](path);
    }
  }

  _collectImportBindings(specifiers, buffer) {
    specifiers.forEach(specifier => {
      if (specifier.node.imported && SUPPORTED_MACROS.indexOf(specifier.node.imported.name) > -1) {
        buffer.push(specifier.get('local'));
      }
    });
  }

  _hasDebugModule(debugBinding) {
    let fromModule = debugBinding && debugBinding.kind === 'module';
    let moduleName = fromModule && debugBinding.path.parent.source.value;
    return moduleName === this.envFlagsSource;
  }

  _detectForeignFeatureFlag(specifiers, source) {
    specifiers.forEach(specifier => {
      if (specifier.imported && this.featuresMap[source][specifier.imported.name] !== null) {
        throw new Error(
          `Imported ${specifier.imported.name} from ${source} which is not a supported flag.`
        );
      }
    });
  }

  _cleanImports(path) {
    let body = path.get('body');

    if (!this.envFlags.DEBUG) {
      for (let i = 0; i < body.length; i++) {
        let decl = body[i];

        if (this.builder.t.isImportDeclaration(decl)) {
          let source = decl.node.source.value;
          if (this.featureSources.indexOf(source) > -1) {
            if (decl.node.specifiers.length > 0) {
              this._detectForeignFeatureFlag(decl.node.specifiers, source);
            } else {
              decl.remove();
              break;
            }
          }
        }
      }
    }

    if (!this.debugHelpers.module) {
      if (this.localDebugBindings.length > 0) {
        this.localDebugBindings[0].parentPath.parentPath;
        let importPath = this.localDebugBindings[0].findParent(p => p.isImportDeclaration());
        let specifiers = importPath.get('specifiers');

        if (specifiers.length === this.localDebugBindings.length) {
          this.localDebugBindings[0].parentPath.parentPath.remove();
        } else {
          this.localDebugBindings.forEach(binding => binding.parentPath.remove());
        }
      }
    }
  }
};
