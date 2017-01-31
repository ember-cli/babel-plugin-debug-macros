const DEBUG = 'DEBUG';

export default class MacroBuilder {
  constructor(t, flags, features) {
    this.t = t;
    this.expressions = [];
    this.localBindings = [];
    this.importedBindings = [];
    this.flagDeclarations = [];
    this.importedDebugTools = false;
    this.flags = flags;
    this.features = features;
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  injectFlags(path) {
    let debugBinding = path.scope.getBinding(DEBUG);
    let name;

    let importsToClean;

    if (!this._hasDebugModule(debugBinding)) {
      // name = path.hub.file.addImport('@ember/env-flags', DEBUG).name;
      this._expand(name);
    } else {
      name = DEBUG;
      this._expand(DEBUG);
      this.inlineEnvFlags(debugBinding.path.parentPath);
      // debugBinding.path.parentPath.remove();
    }

    this._cleanImports(path);
  }

  inlineEnvFlags(path) {
    let flagDeclarations = this.generateFlagConstants(path.node.specifiers, this.flags, path.node.source.value);
    path.replaceWithMultiple(flagDeclarations);
  }

  inlineFeatureFlags(path) {
    let flagDeclarations = this.generateFlagConstants(path.node.specifiers, this.features, path.node.source.value);
    path.replaceWithMultiple(flagDeclarations);
  }

  generateFlagConstants(specifiers, flagTable, source) {
    let { t } = this;
    return specifiers.map((specifier) => {
      let flag = flagTable[specifier.imported.name];
      if (flag !== undefined) {
        return t.variableDeclaration('const', [t.variableDeclarator(t.identifier(specifier.imported.name), t.numericLiteral(flag))]);
      }

      throw new Error(`Imported ${specifier.imported.name} from ${source} which is not a supported flag.`);
    });
  }

  /**
   * Collects the import bindings for the debug tools.
   */
  collectSpecifiers(specifiers) {
    this.importedDebugTools = true;
    specifiers.forEach((specifier) => {
      this.importedBindings.push(specifier.imported.name);
      this.localBindings.push(specifier.local.name);
    });
  }

  /**
   * Builds the expressions that the CallExpression will expand into.
   */
  buildExpression(path) {
    let expression = path.node.expression;
    let { t, localBindings, importedBindings } = this;
    if (t.isCallExpression(expression) && localBindings.indexOf(expression.callee.name) > -1) {
      let imported = importedBindings[localBindings.indexOf(expression.callee.name)];
      this[`_${imported}`](path, t);
    }
  }

  _hasDebugModule(debugBinding) {
    let fromModule = debugBinding && debugBinding.kind === 'module';
    let moduleName = fromModule && debugBinding.path.parent.source.value;
    return moduleName === '@ember/env-flags';
  }

  _expand(binding) {
    for (let i = 0; i < this.expressions.length; i++) {
      let [exp, logicalExp] = this.expressions[i];
      exp.replaceWith(this.t.parenthesizedExpression(logicalExp(binding)));
    }
  }

  _cleanImports(path) {
    this.localBindings.forEach((binding) => {
      path.scope.getBinding(binding).path.parentPath.remove();
    });
  }

  _warn(expression) {
    let { t } = this;
    let args = expression.node.expression.arguments;
    let consoleWarn = this._createConsoleAPI('warn', args);
    let identifiers = this._getIdentifiers(args);
    this.expressions.push([expression, this._buildLogicalExpressions([], consoleWarn)]);
  }

  _deprecate(expression) {

  }

  _assert(expression) {
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
