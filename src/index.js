import MacroBuilder from './lib/utils/macro-builder';
import FlagGenerator from './lib/utils/flag-generator';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function (babel) {
  const { types: t } = babel;
  let builder;
  let flagGenerator;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter(path, state) {
          let { flags, features, packageVersion } = state.opts;
          // flagGenerator = new FlagGenerator(t);
          builder = new MacroBuilder(t, flags, features, packageVersion);
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

        switch(importPath) {
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
}
