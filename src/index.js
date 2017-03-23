import Macros from './lib/utils/macros';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOptions } from './lib/utils/normalize-options';

function macros(babel) {
  const { types: t } = babel;
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

              let {
                featureSources,
                debugTools: { debugToolsImport },
                envFlags: { envFlagsImport, flags }
              } = options;

              let isFeaturesImport = featureSources.includes(importPath);

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

macros.cacheKey = function() {
  return macros.toString();
}

export default macros;