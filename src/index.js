import MacroBuilder from './lib/utils/macro-builder';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOptions } from './lib/utils/normalize-options';

export default function (babel) {
  const { types: t } = babel;
  let builder;
  let options;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          let { envFlags, features, debugTools, packageVersion } = state.opts;
          options = normalizeOptions(state.opts);
          builder = new MacroBuilder(t, options);
        },

        exit(path) {
          if (builder.importedDebugTools) {
            builder.injectFlags(path);
          }
        }
      },

      ImportDeclaration(path, state) {
        let importPath = path.node.source.value;

        let {
          featureImportSpecifiers,
          debugTools: { debugToolsImport },
          envFlags: { flags: { DEBUG } }
        } = options;

        let isFeaturesImport = featureImportSpecifiers.includes(importPath);

        if (isFeaturesImport && !DEBUG) {
          builder.inlineFeatureFlags(path);
        } else if (debugToolsImport && debugToolsImport === importPath) {
          builder.collectSpecifiers(path.node.specifiers);
        }
      },

      ExpressionStatement(path) {
        builder.buildExpression(path);
      }
    }
  };
}
