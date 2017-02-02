const DEBUG = 'DEBUG';

import Builder from './builder';

export default class Macros {
  constructor(t, options) {
    this.localBindings = [];
    this.importedBindings = [];
    this.importedDebugTools = false;
    this.envFlags = options.envFlags.flags;
    this.featureFlags = options.features;
    this.externalizeHelpers = !!options.externalizeHelpers;
    this.helpers = options.externalizeHelpers;
    this.builder = new Builder(t, options.externalizeHelpers);
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  expand(path) {
    let debugBinding = path.scope.getBinding(DEBUG);
    let { builder } = this;
    let name;

    let importsToClean;

    if (!this._hasDebugModule(debugBinding)) {
      name = path.scope.generateUidIdentifier(DEBUG);

      if (builder.expressions.length > 0) {
        this._injectDebug(path, name);
      }

      this.builder.expandMacros(name.name);
    } else {
      name = DEBUG;
      this.builder.expandMacros(DEBUG);
      this._inlineEnvFlags(debugBinding.path.parentPath);
    }

    this._cleanImports(path);
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
    specifiers.forEach((specifier) => {
      this.importedBindings.push(specifier.imported.name);
      this.localBindings.push(specifier.local.name);
    });
  }

  /**
   * Builds the expressions that the CallExpression will expand into.
   */
  build(path) {
    let expression = path.node.expression;
    let { builder, localBindings, importedBindings } = this;
    if (builder.t.isCallExpression(expression) && localBindings.indexOf(expression.callee.name) > -1) {
      let imported = importedBindings[localBindings.indexOf(expression.callee.name)];
      this.builder[`${imported}`](path);
    }
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
    return moduleName === '@ember/env-flags';
  }

  _cleanImports(path) {
    let { externalizeHelpers, helpers } = this;

    if (this.localBindings.length > 0) {
      let importDeclaration = path.scope.getBinding(this.localBindings[0]).path.parentPath;

      if (externalizeHelpers && helpers.module) {
        if (typeof helpers.module === 'string') {
          importDeclaration.node.source.value = helpers.module;
        }
      } else {
        // Note this nukes the entire ImportDeclaration so we simply can
        // just grab one of the bindings to remove.
        importDeclaration.remove();
      }
    }
  }
}
