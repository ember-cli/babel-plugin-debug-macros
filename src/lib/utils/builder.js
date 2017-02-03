export default class Builder {
  constructor(t, externalizeHelpers) {
    this.t = t;
    this.hasHelpers = !!externalizeHelpers;
    this.helpers = externalizeHelpers;
    this.expressions = [];
  }

  /**
   * Expands:
   *
   * assert($PREDICATE, $MESSAGE)
   *
   * into
   *
   * (DEBUG && console.assert($PREDICATE, $MESSAGE));
   *
   * or
   *
   * (DEBUG && assert($PREDICATE, $MESSAGE));
   *
   * or
   *
   * (DEBUG && $GLOBAL_NS.assert($PREDICATE, $MESSAGE));
   */
  assert(path) {
    let { t, hasHelpers, helpers } = this;
    let expression = path.node.expression;
    let { callee, arguments: args } = expression;
    let assert;

    if (hasHelpers) {
      let ns = helpers.global;
      if (ns) {
        assert = this._createGlobalExternalHelper(callee, args, ns);
      } else {
        assert = path.node.expression;
      }
    } else {
      assert = this._createConsoleAPI(callee, args);
    }

    let identifiers = this._getIdentifiers(args);
    this.expressions.push([path, this._buildLogicalExpressions(identifiers, assert)]);
  }

  /**
   * Expands:
   *
   * warn($MESSAGE)
   *
   * into
   *
   * (DEBUG && console.warn($MESSAGE));
   *
   * or
   *
   * (DEBUG && warn($MESSAGE));
   *
   * or
   *
   * (DEBUG && $GLOBAL_NS.warn($MESSAGE));
   */
  warn(path) {
    let { t, hasHelpers, helpers } = this;
    let expression = path.node.expression;
    let { callee, arguments: args } = expression;

    let warn;
    if (hasHelpers) {
      let ns = helpers.global;
      if (ns) {
        warn = this._createGlobalExternalHelper(callee, args, ns);
      } else {
        warn = expression
      }
    } else {
      warn = this._createConsoleAPI(callee, args);
    }

    let identifiers = this._getIdentifiers(args);
    this.expressions.push([path, this._buildLogicalExpressions([], warn)]);
  }

  /**
   * Expands:
   *
   * deprecate($MESSAGE, $PREDICATE, {
   *  $ID,
   *  $URL,
   *  $UNIL
   * });
   *
   * into
   *
   * (DEBUG && $PREDICATE && console.warn('DEPRECATED [$ID]: $MESSAGE. Will be removed in $UNIL. See $URL for more information.'));
   *
   * or
   *
   * (DEBUG && $PREDICATE && deprecate('DEPRECATED [$ID]: $MESSAGE. Will be removed in $UNIL. See $URL for more information.'));
   *
   * or
   *
   * (DEBUG && $PREDICATE && $GLOBAL_NS.deprecate('DEPRECATED [$ID]: $MESSAGE. Will be removed in $UNIL. See $URL for more information.'));
   */
  deprecate(path) {
    let { t, hasHelpers, helpers } = this;
    let expression = path.node.expression;
    let { callee, arguments: args } = expression;
    let [ message, predicate, metaExpression ] = args;

    let meta = {
      url: null,
      id: null,
      until: null
    };

    metaExpression.properties.forEach((prop) => {
      let { key, value } = prop;
      meta[key.name] = value.value;
    });

    if (!meta.id) {
      throw new ReferenceError(`deprecate's meta information requires an "id" field.`);
    }

    if (!meta.until) {
      throw new ReferenceError(`deprecate's meta information requires an "until" field.`);
    }

    let deprecationMessage = this._generateDeprecationMessage(message, meta);

    let deprecate;
    if (hasHelpers) {
      let ns = helpers.global;
      if (ns) {
        deprecate = this._createGlobalExternalHelper(callee, [deprecationMessage], ns);
      } else {
        deprecate = path.node.expression;
        deprecate.arguments = [deprecationMessage];
      }
    } else {
      deprecate = this._createConsoleAPI(t.identifier('warn'), [deprecationMessage]);
    }

    this.expressions.push([path, this._buildLogicalExpressions([predicate], deprecate)]);
  }

  /**
   * Produces
   *
   * const $NAME = $DEBUG;
   */
  debugFlag(name, debug) {
    let { t } = this;
    return this._createConstant(name, t.numericLiteral(debug));
  }

  /**
   * Produces an array on "const" VariableDeclarations based on
   * flags.
   */
  flagConstants(specifiers, flagTable, source) {
    let { t } = this;
    return specifiers.map((specifier) => {
      let flag = flagTable[specifier.imported.name];
      if (flag !== undefined) {
        return this._createConstant(t.identifier(specifier.imported.name), t.numericLiteral(flag));
      }

      throw new Error(`Imported ${specifier.imported.name} from ${source} which is not a supported flag.`);
    });
  }

  /**
   * Performs the actually expansion of macros
   */
  expandMacros(debugIdentifier) {
    for (let i = 0; i < this.expressions.length; i++) {
      let [exp, logicalExp] = this.expressions[i];
      exp.replaceWith(this.t.parenthesizedExpression(logicalExp(debugIdentifier)));
    }
  }

  _createConstant(left, right) {
    let { t } = this;
    return t.variableDeclaration('const', [t.variableDeclarator(left, right)])
  }

  _getIdentifiers(args) {
    return args.filter((arg) => this.t.isIdentifier(arg));
  }

  _createGlobalExternalHelper(identifier, args, ns) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier(ns), identifier), args);
  }

  _createExternalHelper(identifier, args) {
    let { t } = this;
    return t.callExpression(t.identifier(type), args);
  }

  _createConsoleAPI(identifier, args) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier('console'), identifier), args);
  }

  _generateDeprecationMessage(message, meta) {
    return this.t.stringLiteral(`DEPRECATED [${meta.id}]: ${message.value}. Will be removed in ${meta.until}.${meta.url ? ` See ${meta.url} for more information.` : ''}`);
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