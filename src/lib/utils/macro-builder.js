import { satisfies } from 'semver';

const DEBUG = 'DEBUG';

export default class MacroBuilder {
  constructor(t, options) {
    this.t = t;
    this.expressions = [];
    this.localBindings = [];
    this.importedBindings = [];
    this.flagDeclarations = [];
    this.importedDebugTools = false;
    this.packageVersion = options.packageVersion;
    this.envFlags = options.envFlags.flags;
    this.featureFlags = options.features.flags;
    this.externalizeHelpers = !!options.externalizeHelpers;
    this.helpers = options.externalizeHelpers;
  }

  /**
   * Injects the either the env-flags module with the debug binding or
   * adds the debug binding if missing from the env-flags module.
   */
  injectFlags(path) {
    let debugBinding = path.scope.getBinding(DEBUG);
    let { t } = this;
    let name;

    let importsToClean;

    if (!this._hasDebugModule(debugBinding)) {
      name = path.scope.generateUidIdentifier(DEBUG);

      if (this.expressions.length > 0) {
        this._injectDebug(path, name);
      }

      this._expand(name.name);
    } else {
      name = DEBUG;
      this._expand(DEBUG);
      this.inlineEnvFlags(debugBinding.path.parentPath);
    }

    this._cleanImports(path);
  }

  _injectDebug(path, name) {
    let { t } = this;
    path.node.body.unshift(t.variableDeclaration('const', [t.variableDeclarator(name, t.numericLiteral(this.envFlags.DEBUG))]));
  }

  inlineEnvFlags(path) {
    let flagDeclarations = this.generateFlagConstants(path.node.specifiers, this.envFlags, path.node.source.value);
    path.replaceWithMultiple(flagDeclarations);
  }

  inlineFeatureFlags(path) {
    let flagDeclarations = this.generateFlagConstants(path.node.specifiers, this.featureFlags, path.node.source.value);
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
    if (this.localBindings.length > 0) {
      // Note this nukes the entire ImportDeclaration so we simply can
      // just grab one of the bindings to remove.
      path.scope.getBinding(this.localBindings[0]).path.parentPath.remove();
    }
  }

  _warn(expression) {
    let { t, externalizeHelpers, helpers } = this;
    let args = expression.node.expression.arguments;

    let warn;
    if (externalizeHelpers && helpers.global) {
      let ns = helpers.global;
      warn = this._createExternalHelper(ns, 'warn', args);
    } else {
      warn = this._createConsoleAPI('warn', args);
    }

    let identifiers = this._getIdentifiers(args);
    this.expressions.push([expression, this._buildLogicalExpressions([], warn)]);
  }

  _deprecate(expression) {
    let { t, externalizeHelpers, helpers } = this;
    let [ message, predicate, metaExpression ] = expression.node.expression.arguments;

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

    if (satisfies(this.packageVersion, `${meta.until}`)) {
      expression.remove();
    } else {
      let deprecationMessage = this.t.stringLiteral(`DEPRECATED [${meta.id}]: ${message.value}. Will be removed in ${meta.until}.${meta.url ? ` See ${meta.url} for more information.` : ''}`);

      let deprecate;
      if (externalizeHelpers && helpers.global) {
        let ns = helpers.global;
        deprecate = this._createExternalHelper(ns, 'deprecate', [deprecationMessage]);
      } else {
        deprecate = this._createConsoleAPI('warn', [deprecationMessage]);
      }

      this.expressions.push([expression, this._buildLogicalExpressions([predicate], deprecate)]);
    }

  }

  _assert(expression) {
    let { t, externalizeHelpers, helpers } = this;
    let args = expression.node.expression.arguments;
    let assert;

    if (externalizeHelpers && helpers.global) {
      let ns = helpers.global;
      assert = this._createExternalHelper(ns, 'assert', args);
    } else {
      assert = this._createConsoleAPI('assert', args);
    }

    let identifiers = this._getIdentifiers(args);
    this.expressions.push([expression, this._buildLogicalExpressions(identifiers, assert)]);
  }

  _getIdentifiers(args) {
    return args.filter((arg) => this.t.isIdentifier(arg));
  }

  _createExternalHelper(ns, type, args) {
    let { t } = this;
    return t.callExpression(t.memberExpression(t.identifier(ns), t.identifier(type)), args);
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
