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
    this.debugSource = options.debugTools.debugToolsImport;
    this.importedDebugTools = false;
    this.envFlags = options.envFlags.flags;
    this.featureFlags = options.features;
    this.debugHelpers = options.externalizeHelpers.debug;
    this.isGlobals = true;

    this.builder = new Builder(t, options.externalizeHelpers);
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  expand(path) {
    let debugBinding = path.scope.getBinding(DEBUG);
    let { builder } = this;

    if (this._hasDebugModule(debugBinding)) {
      this.builder.expandMacros(debugBinding.path.node.local);
    } else {
      let debugIdentifier = path.scope.generateUidIdentifier(DEBUG);

      if (builder.expressions.length > 0) {
        this._injectDebug(path, debugIdentifier);
      }

      this.builder.expandMacros(debugIdentifier);
    }

    this._cleanImports(path);
  }

  inlineEnvFlags(path) {
    let flags = [];
    let declaration;
    Object.keys(this.envFlags).forEach(flag =>  {
      let binding = path.scope.getBinding(flag);
      let source = binding.path.parentPath.node.source.value;
      if (binding.path.isImportSpecifier() && source === this.envFlagsSource) {
        declaration = binding.path.parentPath;
        flags = flags.concat(this.builder.flagConstants([binding.path.node], this.envFlags, this.envFlagsSource));
      }
    });

    declaration.replaceWithMultiple(flags);
  }

  inlineFeatureFlags(path) {
    for (let i = 0; i < this.featureFlags.length; i++) {
      let features = this.featureFlags[i];
      if (features.featuresImport === path.node.source.value) {
        let flagDeclarations = this.builder.flagConstants(path.node.specifiers, features.flags, path.node.source.value);
        path.replaceWithMultiple(flagDeclarations);
        break;
      }
    }
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
      if (SUPPORTED_MACROS.includes(specifier.node.imported.name)) {
        buffer.push(specifier.get('local'));
      }
    });
  }

  _injectDebug(path, name) {
    path.node.body.unshift(this.builder.debugFlag(name, this.envFlags.DEBUG));
  }

  _inlineEnvFlags(path) {
    let flagDeclarations = this.builder.flagConstants(path.node.specifiers, this.envFlags, path.node.source.value);
    path.replaceWithMultiple(flagDeclarations);
  }

  _hasDebugModule(debugBinding) {
    let fromModule = debugBinding && debugBinding.kind === 'module';
    let moduleName = fromModule && debugBinding.path.parent.source.value;
    return moduleName === this.envFlagsSource;
  }

  _cleanImports(path) {
    let { debugHelpers } = this;

    if (debugHelpers) {
      this.isGlobals = !!debugHelpers.global;
    }

    if (this.localDebugBindings.length > 0 && this.isGlobals) {
      if (this.isImportRemovable) {
        this.localDebugBindings[0].parentPath.parentPath.remove();
      } else {
        this.localDebugBindings.forEach((binding) => binding.parentPath.remove());
      }
    }
  }
}
