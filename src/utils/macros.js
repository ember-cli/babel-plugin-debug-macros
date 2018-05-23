'use strict';

const Builder = require('./builder');

const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];

module.exports = class Macros {
  constructor(babel, options) {
    this.babel = babel;
    this.localDebugBindings = [];
    this.flagBindings = [];
    this.flags = options.flags;

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
    this._inlineFlags(path);
    //this.builder.expandMacros(this.envFlags.DEBUG);
    this._cleanImports(path);
  }

  _inlineFlags(path) {
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

    for (let source in this.flags) {
      let flagsForSource = this.flags[source];

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
    }
  }

  /**
   * Collects the import bindings for the debug tools.
   */
  collectDebugToolsSpecifiers(specifiers) {
    this._collectImportBindings(specifiers, this.localDebugBindings);
  }

  collectFlagSpecifiers(specifiers) {
    this._collectImportBindings(specifiers, this.flagBindings);
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

  _detectForeignFeatureFlag(specifiers, source) {
    specifiers.forEach(specifier => {
      if (!specifier.imported) {
        return;
      }

      let isKnownFeature = specifier.imported.name in this.flags[source];

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
        if (this.flags[source]) {
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
