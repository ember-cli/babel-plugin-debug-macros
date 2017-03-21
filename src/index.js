import Macros from './lib/utils/macros';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOptions } from './lib/utils/normalize-options';

export default function (babel) {
  const { types: t } = babel;
  let macroBuilder;
  let options;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          options = normalizeOptions(state.opts);
          macroBuilder = new Macros(t, options);
        },

        exit(path) {
          if (macroBuilder.importedDebugTools) {
            macroBuilder.expand(path);
          }

          if (macroBuilder.hasEnvFlags) {
            macroBuilder.inlineEnvFlags(path);
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
          macroBuilder.inlineFeatureFlags(path);
        } else if (debugToolsImport && debugToolsImport === importPath) {
          macroBuilder.collectDebugToolsSpecifiers(path.get('specifiers'));
        } if (envFlagsImport && envFlagsImport === importPath) {
          macroBuilder.collectEnvFlagSpecifiers(path.get('specifiers'));
        }
      },

      ExpressionStatement(path) {
        macroBuilder.build(path);
      }
    }
  };
}
