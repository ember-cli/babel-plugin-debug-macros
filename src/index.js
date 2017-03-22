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
        },

        exit(path) {
          if (this.macroBuilder.importedDebugTools) {
            this.macroBuilder.expand(path);
          }

          if (this.macroBuilder.hasEnvFlags) {
            this.macroBuilder.inlineEnvFlags(path);
          }
        }
      },

      ImportDeclaration(path, state) {
        let importPath = path.node.source.value;

        let {
          featureImportSpecifiers,
          debugTools: { debugToolsImport },
          envFlags: { envFlagsImport, flags }
        } = options;

        let isFeaturesImport = featureImportSpecifiers.includes(importPath);

        if (isFeaturesImport && !flags.DEBUG) {
          this.macroBuilder.inlineFeatureFlags(path);
        } else if (debugToolsImport && debugToolsImport === importPath) {
          this.macroBuilder.collectDebugToolsSpecifiers(path.get('specifiers'));
        } if (envFlagsImport && envFlagsImport === importPath) {
          this.macroBuilder.collectEnvFlagSpecifiers(path.get('specifiers'));
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