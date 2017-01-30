import MacroBuilder from './utils/macro-builder';
import FlagGenerator from './utils/flag-generator';
import { readFileSync } from 'fs';
import { join } from 'path';

const FEATURES = require(join(process.cwd(), 'feature-flags'));
const FLAGS = {
  DEBUG: !(!!process.env.EMBER_ENV === 'production')
};

export default function (babel) {
  const { types: t } = babel;
  const DEBUG = 'DEBUG';
  let builder;
  let importedDebugTools;
  let localBindings;
  let importedBindings;
  let flagGenerator;

  return {
    name: "babel-feature-flags-and-debug-macros",
    visitor: {

      Program: {
        enter() {
          flagGenerator = new FlagGenerator(t);
          builder = new MacroBuilder(t);
          importedDebugTools = false;
          localBindings = [];
          importedBindings = [];
        },
        exit(path) {
          if (importedDebugTools) {
            let debugBinding = path.scope.getBinding(DEBUG);
            let fromModule = debugBinding && debugBinding.kind === 'module';
            let moduleName = fromModule && debugBinding.path.parent.source.value;
            let hasDebugModule = moduleName === '@ember/env-flags';

            if (!hasDebugModule) {
              let { name } = path.hub.file.addImport('@ember/env-flags', DEBUG);
              builder.expand(name);
            } else {
              builder.expand(DEBUG);
            }
          }
        }
      },
      ImportDeclaration(path) {
        let importPath = path.node.source.value;

        switch(importPath) {
          case '@ember/env-flags':
            flagGenerator.generate(path, FLAGS);
            break;
          case 'feature-flags':
            flagGenerator.generate(path, FEATURES);
            break;
          case 'debug-tools':
            importedDebugTools = true;
            path.node.specifiers.forEach((specifier) => {
              importedBindings.push(specifier.imported.name);
              localBindings.push(specifier.local.name);
            });
            break;
        }
      },
      ExpressionStatement(path) {
        let expression = path.node.expression;
        if (t.isCallExpression(expression) && localBindings.indexOf(expression.callee.name) > -1) {
          let imported = importedBindings[localBindings.indexOf(expression.callee.name)];
          builder[imported](path, t);
        }
      }
    }
  };
}
