import type * as Babel from '@babel/core';
import type { NodePath, types as t } from '@babel/core';
import { CallIdentifierExpression, CallStatementPath } from './babel-type-helpers';
import { ImportUtil } from 'babel-import-util';

export interface Options {
  module: boolean | undefined;
  global: string | undefined;
  assertPredicateIndex: number | undefined;
  isDebug: boolean | "@embroider/macros";
}

interface MacroExpressionOpts {
  validate?: (expression: CallIdentifierExpression, args: t.CallExpression['arguments']) => void;
  buildConsoleAPI?: (
    expression: CallIdentifierExpression,
    args: t.CallExpression['arguments']
  ) => t.CallExpression;
  consoleAPI?: t.Identifier;
  predicate?: (
    expression: CallIdentifierExpression,
    args: t.CallExpression['arguments']
  ) => t.CallExpression['arguments'][number] | undefined;
}

export default class Builder {
  private module: boolean | undefined;
  private global: string | undefined;
  private assertPredicateIndex: number | undefined;
  private isDebug: boolean | '@embroider/macros';
  private util: ImportUtil;

  constructor(
    readonly t: typeof Babel.types,
    util: ImportUtil,
    options: Options
  ) {
    this.module = options.module;
    this.global = options.global;
    this.assertPredicateIndex = options.assertPredicateIndex;
    this.isDebug = options.isDebug;
    this.util = util;
  }

  /**
   * Expands:
   *
   * assert($PREDICATE, $MESSAGE)
   *
   * into
   *
   * ($DEBUG && console.assert($PREDICATE, $MESSAGE));
   *
   * or
   *
   * ($DEBUG && assert($PREDICATE, $MESSAGE));
   *
   * or
   *
   * ($DEBUG && $GLOBAL_NS.assert($PREDICATE, $MESSAGE));
   */
  assert(path: CallStatementPath) {
    let predicate: MacroExpressionOpts['predicate'];
    const index = this.assertPredicateIndex;
    if (index !== undefined) {
      predicate = (expression, args) => {
        return args[index];
      };
    }

    this._createMacroExpression(path, {
      predicate,
    });
  }

  /**
   * Expands:
   *
   * warn($MESSAGE)
   *
   * into
   *
   * ($DEBUG && console.warn($MESSAGE));
   *
   * or
   *
   * ($DEBUG && warn($MESSAGE));
   *
   * or
   *
   * ($DEBUG && $GLOBAL_NS.warn($MESSAGE));
   */
  warn(path: CallStatementPath) {
    this._createMacroExpression(path);
  }

  /**
   * Expands:
   *
   * log($MESSAGE)
   *
   * into
   *
   * ($DEBUG && console.log($MESSAGE));
   *
   * or
   *
   * ($DEBUG && log($MESSAGE));
   *
   * or
   *
   * ($DEBUG && $GLOBAL_NS.log($MESSAGE));
   */
  log(path: CallStatementPath) {
    this._createMacroExpression(path);
  }

  _createMacroExpression(path: CallStatementPath, options: MacroExpressionOpts = {}) {
    let t = this.t;
    let expression = path.node.expression;
    let callee = expression.callee;
    let args = expression.arguments;

    if (options.validate) {
      options.validate(expression, args);
    }

    let callExpression;
    if (this.module) {
      callExpression = expression;
    } else if (this.global) {
      callExpression = this._createGlobalExternalHelper(callee, args, this.global);
    } else if (options.buildConsoleAPI) {
      callExpression = options.buildConsoleAPI(expression, args);
    } else {
      callExpression = this._createConsoleAPI(options.consoleAPI || callee, args);
    }

    let prefixedIdentifiers: t.Expression[] = [];

    if (options.predicate) {
      let predicate = options.predicate(expression, args) || t.identifier('false');
      if (!this.t.isExpression(predicate)) {
        throw new Error(`bug: this doesn't support ${predicate.type}`);
      }
      let negatedPredicate = t.unaryExpression('!', t.parenthesizedExpression(predicate));
      prefixedIdentifiers.push(negatedPredicate);
    }

    // Expand the macro!
    let replacementPath = this._buildLogicalExpressions(prefixedIdentifiers, callExpression, this._debugExpression(path));
    path.replaceWith(replacementPath);
    path.scope.crawl();
  }

  /**
   * Expands:
   *
   * deprecate($MESSAGE, $PREDICATE)
   *
   * or
   *
   * deprecate($MESSAGE, $PREDICATE, {
   *  $ID,
   *  $URL,
   *  $UNIL
   * });
   *
   * into
   *
   * ($DEBUG && $PREDICATE && console.warn($MESSAGE));
   *
   * or
   *
   * ($DEBUG && $PREDICATE && deprecate($MESSAGE, $PREDICATE, { $ID, $URL, $UNTIL }));
   *
   * or
   *
   * ($DEBUG && $PREDICATE && $GLOBAL_NS.deprecate($MESSAGE, $PREDICATE, { $ID, $URL, $UNTIL }));
   */
  deprecate(path: CallStatementPath) {
    this._createMacroExpression(path, {
      predicate: (expression, args) => args[1],

      buildConsoleAPI: (expression, args) => {
        let message = args[0];

        return this._createConsoleAPI(this.t.identifier('warn'), [message]);
      },

      validate: (expression, args) => {
        let meta = args[2];

        if (
          meta &&
          this.t.isObjectExpression(meta) &&
          meta.properties &&
          !meta.properties.some(
            (prop) =>
              this.t.isObjectProperty(prop) &&
              ((this.t.isIdentifier(prop.key) && prop.key.name === 'id') ||
                (this.t.isStringLiteral(prop.key) && prop.key.value === 'id'))
          )
        ) {
          throw new ReferenceError(`deprecate's meta information requires an "id" field.`);
        }
      },
    });
  }

  _debugExpression(target: NodePath) {
    if (typeof this.isDebug === 'boolean') {
      return this.t.booleanLiteral(this.isDebug);
    } else {
      return this.t.callExpression(
        this.util.import(target, '@embroider/macros', 'isDevelopingApp'),
        []
      );
    }
  }

  _createGlobalExternalHelper(
    identifier: t.Identifier,
    args: t.CallExpression['arguments'],
    ns: string
  ) {
    let t = this.t;
    return t.callExpression(t.memberExpression(t.identifier(ns), identifier), args);
  }

  _createConsoleAPI(identifier: t.Identifier, args: t.CallExpression['arguments']) {
    let t = this.t;
    return t.callExpression(t.memberExpression(t.identifier('console'), identifier), args);
  }

  _buildLogicalExpressions(
    identifiers: t.Expression[],
    callExpression: t.Expression,
    debugIdentifier: t.Expression
  ): t.Expression {
    let t = this.t;

    identifiers.unshift(debugIdentifier);
    identifiers.push(callExpression);
    let logicalExpressions;

    for (let i = 0; i < identifiers.length; i++) {
      let left = identifiers[i];
      let right = identifiers[i + 1];
      if (!logicalExpressions) {
        logicalExpressions = t.logicalExpression('&&', left, right);
      } else if (right) {
        logicalExpressions = t.logicalExpression('&&', logicalExpressions, right);
      }
    }

    return t.parenthesizedExpression(logicalExpressions!);
  }
}
