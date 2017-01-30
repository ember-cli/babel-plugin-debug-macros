export default class MacroBuilder {
  constructor(t) {
    this.t = t;
    this.expressions = [];
  }

  expand(binding) {
    for (let i = 0; i < this.expressions.length; i++) {
      let [exp, logicalExp] = this.expressions[i];
      exp.replaceWith(this.t.parenthesizedExpression(logicalExp(binding)));
    }
  }

  warn(expression) {
    let { t } = this;
    let args = expression.node.expression.arguments;
    let consoleWarn = this._createConsoleAPI('warn', args);
    let identifiers = this._getIdentifiers(args);
    this.expressions.push([expression, this._buildLogicalExpressions([], consoleWarn)]);
  }

  assert(expression) {
    let { t } = this;
    let args = expression.node.expression.arguments;
    let consoleAssert = this._createConsoleAPI('assert', args);
	let identifiers = this._getIdentifiers(args);
    this.expressions.push([expression, this._buildLogicalExpressions(identifiers, consoleAssert)]);
  }

  _getIdentifiers(args) {
    return args.filter((arg) => this.t.isIdentifier(arg));
  }

  _createConsoleAPI(type, args) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier('console'), t.identifier(type)), args);
  }

  _buildLogicalExpressions(identifiers, callExpression) {
    let { t } = this;

    return (binding) => {
      identifiers.unshift(t.identifier(binding));
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
