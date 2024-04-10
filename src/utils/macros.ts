'use strict';

import type * as Babel from '@babel/core';
import type { NodePath, types as t } from '@babel/core';
import Builder from './builder';
import { NormalizedOptions } from './normalize-options';

const SUPPORTED_MACROS = ['assert', 'deprecate', 'warn', 'log'];
type Macro = 'assert' | 'deprecate' | 'warn' | 'log';

export default class Macros {
  private builder: Builder;
  private localDebugBindings: Map<string, Macro> = new Map();
  private module = false;

  constructor(babel: typeof Babel, options: NormalizedOptions) {
    let global: string | undefined;
    if (options.externalizeHelpers) {
      if ('module' in options.externalizeHelpers) {
        this.module = Boolean(options.externalizeHelpers.module);
      }
      if ('global' in options.externalizeHelpers) {
        global = options.externalizeHelpers.global;
      }
    }

    this.builder = new Builder(babel.types, {
      module: this.module,
      global,
      assertPredicateIndex: options.debugTools && options.debugTools.assertPredicateIndex,
      isDebug: options.debugTools.isDebug,
    });
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  expand(path: NodePath<t.Program>) {
    this.builder.expandMacros();

    this._cleanImports(path);
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
        specifier.isImportSpecifier() &&
        SUPPORTED_MACROS.indexOf(name(specifier.node.imported)) > -1
      ) {
        this.localDebugBindings.set(
          specifier.get('local').node.name,
          name(specifier.node.imported) as Macro
        );
      }
    });
  }

  /**
   * Builds the expressions that the CallExpression will expand into.
   */
  build(path: NodePath<t.ExpressionStatement>) {
    const expression = path.node.expression;
    if (!this.builder.t.isCallExpression(expression)) {
      return;
    }
    const callee = expression.callee;
    if (!this.builder.t.isIdentifier(callee)) {
      return;
    }

    let imported = this.localDebugBindings.get(callee.name);

    if (imported != null) {
      this.builder[`${imported}`](path);
    }
  }

  _cleanImports(path: NodePath<t.Program>) {
    if (this.module) {
      return;
    }
    for (let item of path.get('body')) {
      if (item.isImportDeclaration()) {
        
      }
    }
    let importPath = this.localDebugBindings[0].findParent((p) => p.isImportDeclaration());
    if (importPath === null) {
      // import declaration in question seems to have already been removed
      return;
    }
    let specifiers = importPath.get('specifiers');
    if (specifiers.length === this.localDebugBindings.length) {
      this.localDebugBindings[0].parentPath.parentPath.remove();
    } else {
      this.localDebugBindings.forEach((binding) => binding.parentPath.remove());
    }
  }
}

function name(value: t.Identifier | t.StringLiteral): string {
  if (value.type === 'Identifier') {
    return value.name;
  } else {
    return value.value;
  }
}
