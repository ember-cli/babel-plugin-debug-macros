export default class Builder {
  constructor(t, module, global) {
    this.t = t;
    this.module = module;
    this.global = global;
    this.expressions = [];
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
  assert(path) {
    this._createMacroExpression(path);
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
  warn(path) {
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
  log(path) {
    this._createMacroExpression(path);
  }

  _createMacroExpression(path) {
    let { t, module, global } = this;
    let expression = path.node.expression;
    let { callee, arguments: args } = expression;
    let callExpression;

    if (module || global) {
      if (global) {
        callExpression = this._createGlobalExternalHelper(callee, args, global);
      } else {
        callExpression = expression;
      }
    } else {
      callExpression = this._createConsoleAPI(callee, args);
    }

    let identifiers = this._getIdentifiers(args);
    this.expressions.push([path, this._buildLogicalExpressions(identifiers, callExpression)]);
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
  deprecate(path) {
    let { t, module, global } = this;
    let expression = path.node.expression;
    let callee = expression.callee;
    let args = expression.arguments;
    let [ message, predicate, meta ] = args;

    if (meta && meta.properties && !meta.properties.some( prop =>  prop.key.name === 'id')) {
      throw new ReferenceError(`deprecate's meta information requires an "id" field.`);
    }

    if (meta && meta.properties && !meta.properties.some(prop =>  prop.key.name === 'until')) {
      throw new ReferenceError(`deprecate's meta information requires an "until" field.`);
    }

    let deprecate;
    if (module || global) {
      if (global) {
        deprecate = this._createGlobalExternalHelper(callee, args, global);
      } else {
        deprecate = expression;
      }
    } else {
      deprecate = this._createConsoleAPI(t.identifier('warn'), [message]);
    }

    this.expressions.push([path, this._buildLogicalExpressions([
      t.unaryExpression('!', t.parenthesizedExpression(predicate))
    ], deprecate)]);
  }

  /**
   * Performs the actually expansion of macros
   */
  expandMacros(debugFlag) {
    let { t } = this;
    let flag = t.booleanLiteral(debugFlag);
    for (let i = 0; i < this.expressions.length; i++) {
      let [exp, logicalExp] = this.expressions[i];
      exp.replaceWith(t.parenthesizedExpression(logicalExp(flag)));
    }
  }

  _getIdentifiers(args) {
    return args.filter((arg) => this.t.isIdentifier(arg));
  }

  _createGlobalExternalHelper(identifier, args, ns) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier(ns), identifier), args);
  }

  _createConsoleAPI(identifier, args) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier('console'), identifier), args);
  }

  _buildLogicalExpressions(identifiers, callExpression) {
    let { t } = this;

    return (debugIdentifier) => {
      identifiers.unshift(debugIdentifier);
      identifiers.push(callExpression);
      let logicalExpressions;

        for (let i = 0; i < identifiers.length; i++) {
          let left = identifiers[i];
          let right = identifiers[i + 1];
          if (!logicalExpressions) {
            logicalExpressions = t.logicalExpression('&&', left, right);
          } else if (right) {
            logicalExpressions = t.logicalExpression('&&', logicalExpressions, right)
          }
        }

      return logicalExpressions;
    }
  }
}