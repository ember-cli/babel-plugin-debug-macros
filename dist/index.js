'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (babel) {
  const { types: t } = babel;
  let builder;
  let flagGenerator;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          let { flags, features } = state.opts;
          // flagGenerator = new FlagGenerator(t);
          builder = new _macroBuilder2.default(t, flags, features);
        },

        exit(path) {
          if (builder.importedDebugTools) {
            builder.injectFlags(path);
          }
        }
      },

      ImportDeclaration(path, state) {
        let { envFlags, featureFlags } = state.opts;
        let importPath = path.node.source.value;

        switch (importPath) {
          case '@ember/env-flags':
            if (envFlags) {
              builder.generateEnvFlags(path, envFlags);
            }
            break;
          case 'feature-flags':
            builder.inlineFeatureFlags(path, featureFlags);
            break;
          case 'debug-tools':
            builder.collectSpecifiers(path.node.specifiers);
            break;
        }
      },

      ExpressionStatement(path) {
        builder.buildExpression(path);
      }
    }
  };
};

var _macroBuilder = require('./lib/utils/macro-builder');

var _macroBuilder2 = _interopRequireDefault(_macroBuilder);

var _flagGenerator = require('./lib/utils/flag-generator');

var _flagGenerator2 = _interopRequireDefault(_flagGenerator);

var _fs = require('fs');

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }