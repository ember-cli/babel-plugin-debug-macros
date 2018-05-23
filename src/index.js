'use strict';

const path = require('path');
const Macros = require('./utils/macros');
const normalizeOptions = require('./utils/normalize-options').normalizeOptions;

function macros(babel) {
  let options;

  return {
    name: 'babel-feature-flags-and-debug-macros',
    visitor: {
      Program: {
        enter(path, state) {
          options = normalizeOptions(state.opts);
          this.macroBuilder = new Macros(babel, options);

          let body = path.get('body');

          body.forEach(item => {
            if (item.isImportDeclaration()) {
              let importPath = item.node.source.value;

              let debugToolsImport = options.debugTools.debugToolsImport;

              if (debugToolsImport && debugToolsImport === importPath) {
                this.macroBuilder.collectDebugToolsSpecifiers(item.get('specifiers'));
              }

              if (importPath in options.flags) {
                this.macroBuilder.collectFlagSpecifiers(item.get('specifiers'));
              }
            }
          });
        },

        exit(path) {
          this.macroBuilder.expand(path);
        },
      },

      ExpressionStatement(path) {
        this.macroBuilder.build(path);
      },
    },
  };
}

macros.baseDir = function() {
  return path.dirname(__dirname);
};

module.exports = macros;
