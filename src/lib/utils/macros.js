const DEBUG = 'DEBUG';

import Builder from './builder';

const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];

export default class Macros {
  constructor(t, options) {
    this.localDebugBindings = [];
    this.isImportRemovable = false;
    this.envFlagBindings = [];
    this.hasEnvFlags = false;
    this.envFlagsSource = options.envFlags.envFlagsImport;
    this.importedDebugTools = false;
    this.envFlags = options.envFlags.flags;
    this.featureSources = options.featureSources;
    this.featuresMap = options.featuresMap;
    this.featureFlags = options.features || [];
    this.debugHelpers = options.externalizeHelpers || {};
    let { module, global } = this.debugHelpers;
    this.builder = new Builder(t, module, global);
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  expand(path) {
    let debugBinding = path.scope.getBinding(DEBUG);
    let { builder, envFlags } = this;


    if (this._hasDebugModule(debugBinding)) {
      debugBinding.path.parentPath.remove();
    }

    this._inlineFeatureFlags(path);
    this._inlineEnvFlags(path)
    this.builder.expandMacros(envFlags.DEBUG);
    this._cleanImports(path);
  }

  _inlineFeatureFlags(path) {
    let { envFlags, builder, featureFlags } = this;
    if (!envFlags.DEBUG) {
      featureFlags.forEach((features) => {
        Object.keys(features.flags).forEach((feature) => {

          let binding = path.scope.getBinding(feature);

          if (binding && features.flags[feature] !== null) {
            binding.referencePaths.forEach(p => p.replaceWith(builder.t.booleanLiteral(features.flags[feature])));
            binding.path.remove();
          }
        });
      });
    }
  }

  _inlineEnvFlags(path) {
    let { envFlags, builder } = this;
    Object.keys(envFlags).forEach(flag => {
       let binding = path.scope.getBinding(flag);
       if (binding) {
         binding.referencePaths.forEach(p => p.replaceWith(builder.t.booleanLiteral(envFlags[flag])));
       }
    });
  }

  /**
   * Collects the import bindings for the debug tools.
   */
  collectDebugToolsSpecifiers(specifiers) {
    this.importedDebugTools = true;
    this._collectImportBindings(specifiers, this.localDebugBindings);
    if (specifiers.length === this.localDebugBindings.length) {
      this.isImportRemovable = true;
    }
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
    let { builder, localDebugBindings } = this;
    if (builder.t.isCallExpression(expression) && localDebugBindings.some((b) => b.node.name === expression.callee.name)) {
      let imported = path.scope.getBinding(expression.callee.name).path.node.imported.name;
      this.builder[`${imported}`](path);
    }
  }

  _collectImportBindings(specifiers, buffer) {
    specifiers.forEach((specifier) => {
      if (specifier.node.imported && SUPPORTED_MACROS.includes(specifier.node.imported.name)) {
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
    let { featuresMap } = this;
    specifiers.forEach((specifier) => {
      if (featuresMap[source][specifier.imported.name] !== null) {
        throw new Error(`Imported ${specifier.imported.name} from ${source} which is not a supported flag.`);
      }
    });
  }

  _cleanImports(path) {
    let {
      debugHelpers,
      builder,
      featureFlags,
      featureSources
    } = this;

    let body = path.get('body');

    if (!this.envFlags.DEBUG) {
      for (let i = 0; i < body.length; i++) {
        let decl = body[i];

        if (builder.t.isImportDeclaration(decl)) {
          let source = decl.node.source.value;
          if (featureSources.includes(source)) {
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

    if (!debugHelpers.module) {
      if (this.localDebugBindings.length > 0) {
        if (this.isImportRemovable) {
          this.localDebugBindings[0].parentPath.parentPath.remove();
        } else {
          this.localDebugBindings.forEach((binding) => binding.parentPath.remove());
        }
      }
    }
  }
}
