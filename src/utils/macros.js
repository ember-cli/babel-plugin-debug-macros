'use strict';

const Builder = require('./builder');

const DEBUG = 'DEBUG';
const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];

module.exports = class Macros {
  constructor(babel, options) {
    this.babel = babel;
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
    this.builder = new Builder(babel.types, {
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
    let t = this.babel.types;

    function buildIdentifier(value, name) {
      let replacement = t.booleanLiteral(value);

      // when we only support babel@7 we should change this
      // to `path.addComment` or `t.addComment`
      let comment = {
        type: 'CommentBlock',
        value: ` ${name} `,
        leading: false,
        trailing: true,
      };
      replacement.trailingComments = [comment];

      return replacement;
    }

    let sources = Object.keys(svelteMap);
    sources.forEach(source => {
      let flagsForSource = svelteMap[source];

      for (let flag in flagsForSource) {
        let flagValue = flagsForSource[flag];

        let binding = path.scope.getBinding(flag);
        if (binding !== undefined) {
          binding.referencePaths.forEach(p => {
            let replacement = buildIdentifier(flagValue, flag);

            p.replaceWith(replacement);
          });

          binding.path.remove();
        }
      }
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
      if (!specifier.imported) {
        return;
      }

      let isKnownFeature = specifier.imported.name in this.featuresMap[source];

      if (!isKnownFeature) {
        throw new Error(
          `Imported ${specifier.imported.name} from ${source} which is not a supported flag.`
        );
      }
    });
  }

  _cleanImports(path) {
    let body = path.get('body');

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
