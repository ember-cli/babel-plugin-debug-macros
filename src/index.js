'use strict';

const Macros = require('./utils/macros');
const normalizeOptions = require('./utils/normalize-options').normalizeOptions;

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
        this.macroBuilder.build(path);
      }
    }
  };
}

macros.baseDir = function() {
  return dirname(__dirname);
}

module.exports = macros;
