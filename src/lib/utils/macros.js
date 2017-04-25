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
    this.svelteMap = options.svelteMap;
    this.svelteVersions = options.svelte;
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
    this._inlineSvelteFlags(path);
    this._inlineEnvFlags(path)
    this.builder.expandMacros(envFlags.DEBUG);
    this._cleanImports(path);
  }

  _inlineFeatureFlags(path) {
    let { envFlags, builder, featureFlags, featuresMap } = this;

    if (this.envFlags.DEBUG) { return; }
    Object.keys(featuresMap).forEach((source) => {
      Object.keys(featuresMap[source]).forEach((flag) => {
        let binding = path.scope.getBinding(flag);
        if (binding && featuresMap[source][flag] !== null) {
          binding.referencePaths.forEach(p => {
            if (p.parentPath.isIfStatement() ||
              (p.parentPath.isLogicalExpression() &&
               p.parentPath.parentPath &&
               p.parentPath.parentPath.isIfStatement())) {
              p.replaceWith(builder.t.booleanLiteral(featuresMap[source][flag]))
            }
          });

          if (binding.path.parentPath.isImportDeclaration()) {
            binding.path.remove();
          }
        }
      });
    });
  }

  _inlineEnvFlags(path) {
    let { envFlags, builder } = this;
    Object.keys(envFlags).forEach(flag => {
       let binding = path.scope.getBinding(flag);
       if (binding &&
          binding.path.isImportSpecifier() &&
          binding.path.parent.source.value === this.envFlagsSource) {

         binding.referencePaths.forEach(p => p.replaceWith(builder.t.booleanLiteral(envFlags[flag])));
       }
    });
  }

  _inlineSvelteFlags(path) {
    let { svelteMap, envFlags, builder } = this;
    let sources = Object.keys(svelteMap);
    sources.forEach((source) => {
      Object.keys(svelteMap[source]).forEach((flag) => {
        let binding = path.scope.getBinding(flag);
        if (binding !== undefined) {
          binding.referencePaths.forEach((p) => {
            if (envFlags.DEBUG) {
              if (svelteMap[source][flag] === false) {
                let { t } = builder;
                if (!p.parentPath.isIfStatement()) { return; }
                let consequent = p.parentPath.get('consequent');
                consequent.unshiftContainer('body', builder.t.throwStatement(
                  t.newExpression(t.identifier('Error'), [t.stringLiteral(`You indicated you don't have any deprecations, however you are relying on ${flag}.`)])
                ));
              }
            } else {
              if (p.parentPath.isIfStatement()) {
                p.replaceWith(builder.t.booleanLiteral(svelteMap[source][flag]));
              }
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
    let { featuresMap } = this;
    specifiers.forEach((specifier) => {
      if (specifier.imported && featuresMap[source][specifier.imported.name] !== null) {
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
          if (featureSources.indexOf(source) > -1) {
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
