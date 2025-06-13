import Builder from './builder';
import type * as Babel from '@babel/core';
import type { types as t } from '@babel/core';

import type { NormalizedOptions } from './normalize-options';
import type { NodePath } from '@babel/core';
import { isCallStatementPath, name } from './babel-type-helpers';
import type { ImportUtil } from 'babel-import-util';


const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];
type SupportedMacro = 'assert' | 'deprecate' | 'warn' | 'log';

export default class Macros {
  private debugHelpers: NormalizedOptions['externalizeHelpers'];
  private localDebugBindings: NodePath<t.Identifier>[] = [];
  private builder: Builder;

  constructor(babel: typeof Babel, options: NormalizedOptions, util: ImportUtil) {
    this.debugHelpers = options.externalizeHelpers;
    this.builder = new Builder(babel.types, util, {
      module: this.debugHelpers?.module,
      global: this.debugHelpers?.global,
      assertPredicateIndex: options.debugTools && options.debugTools.assertPredicateIndex,
      isDebug: options.debugTools.isDebug,
    });
  }

  /**
   * Collects the import bindings for the debug tools.
   */
  collectDebugToolsSpecifiers(
    specifiers: NodePath<
      t.ImportSpecifier | t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier
    >[]
  ) {
    specifiers.forEach((specifier) => {
      if (
        specifier.node.type === 'ImportSpecifier' &&
        SUPPORTED_MACROS.indexOf(name(specifier.node.imported)) > -1
      ) {
        this.localDebugBindings.push(specifier.get('local'));
      }
    });
  }

  /**
   * Expands the given expression, if it is simple CallExpression statement for the debug tools.
   */
  build(path: NodePath<t.ExpressionStatement>) {
    if (!isCallStatementPath(path)) {
      return;
    }
    if (this.localDebugBindings.some((b) => b.node.name === path.node.expression.callee.name)) {
      let imported = name(
        (path.scope.getBinding(path.node.expression.callee.name)!.path.node as t.ImportSpecifier)
          .imported
      ) as SupportedMacro;
      this.builder[`${imported}`](path);
    }
  }

  /**
   * Removes obsolete import bindings for the debug tools.
   */
  cleanImports() {
    if (!this.debugHelpers?.module) {
      if (this.localDebugBindings.length > 0) {
        let importPath = this.localDebugBindings[0].findParent((p) =>
          p.isImportDeclaration()
        ) as NodePath<t.ImportDeclaration> | null;
        if (importPath === null) {
          // import declaration in question seems to have already been removed
          return;
        }
        let specifiers = importPath.get('specifiers');

        if (specifiers.length === this.localDebugBindings.length) {
          this.localDebugBindings[0].parentPath.parentPath!.remove();
        } else {
          this.localDebugBindings.forEach((binding) => binding.parentPath.remove());
        }
      }
    }
  }
}
