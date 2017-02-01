import MacroBuilder from './lib/utils/macro-builder';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function (babel) {
  const { types: t } = babel;
  let builder;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          let { flags, features, packageVersion } = state.opts;
          builder = new MacroBuilder(t, flags, features, packageVersion);
        },

        exit(path) {
          if (builder.importedDebugTools) {
            builder.injectFlags(path);
          }
        }
      },

      ImportDeclaration(path, state) {
        let importPath = path.node.source.value;

        switch(importPath) {
          case 'feature-flags':
            builder.inlineFeatureFlags(path);
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
}
