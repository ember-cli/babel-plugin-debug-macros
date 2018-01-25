'use strict';

const Macros = require('./lib/utils/macros');
const normalizeOptions = require('./lib/utils/normalize-options').normalizeOptions;

const updateCallExpression = {
  CallExpression(path) {
    if (this.parent.node === path.parent) {
      this.plugin.macroBuilder.build(path, path.node);
    }
  }
};

function macros(babel) {
  const t = babel.types;

  let macroBuilder;
  let options;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          options = normalizeOptions(state.opts);
          this.macroBuilder = new Macros(t, options);

          let body = path.get('body');

          body.forEach((item) => {
            if (item.isImportDeclaration()) {
              let importPath = item.node.source.value;

              let featureSources = options.featureSources;
              let debugToolsImport = options.debugTools.debugToolsImport;
              let envFlagsImport = options.envFlags.envFlagsImport;

              let isFeaturesImport = featureSources.indexOf(importPath) > -1;

              if (debugToolsImport && debugToolsImport === importPath) {
                this.macroBuilder.collectDebugToolsSpecifiers(item.get('specifiers'));
              } if (envFlagsImport && envFlagsImport === importPath) {
                this.macroBuilder.collectEnvFlagSpecifiers(item.get('specifiers'));
              }
            }
          });

        },

        exit(path) {
          this.macroBuilder.expand(path);
        }
      },

      ExpressionStatement(path) {
        this.macroBuilder.build(path, path.node.expression);
      },

      ArrowFunctionExpression(path) {
        path.traverse(updateCallExpression, { parent: path, plugin: this });
      },

      ReturnStatement(path) {
        path.traverse(updateCallExpression, { parent: path, plugin: this });
      }
    }
  };
}

macros.baseDir = function() {
  return dirname(__dirname);
}

module.exports = macros;
