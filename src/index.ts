import path from 'path';
import Macros from './utils/macros';
import { UserOptions, NormalizedOptions, normalizeOptions } from './utils/normalize-options';
import * as Babel from '@babel/core';
import type { types as t } from '@babel/core';
import { ImportUtil } from 'babel-import-util';

interface State {
  opts: NormalizedOptions;
  macroBuilder: Macros;
  util: ImportUtil;
}

export default function macros(babel: typeof Babel): Babel.PluginObj<State> {
  let t = babel.types;

  function buildIdentifier(value: boolean, name: string) {
    let replacement = t.booleanLiteral(value);
    t.addComment(replacement, 'trailing', ` ${name} `);
    return replacement;
  }

  return {
    name: 'babel-feature-flags-and-debug-macros',
    visitor: {
      ImportSpecifier(path, state) {
        let importPath = (path.parent as t.ImportDeclaration).source.value;
        let flagsForImport = state.opts.flags[importPath];

        if (flagsForImport) {
          let flagName = t.isIdentifier(path.node.imported)
            ? path.node.imported.name
            : path.node.imported.value;
          let localBindingName = path.node.local.name;

          if (!(flagName in flagsForImport)) {
            throw new Error(
              `Imported ${flagName} from ${importPath} which is not a supported flag.`
            );
          }

          let flagValue = flagsForImport[flagName];
          if (flagValue === null) {
            return;
          }

          let binding = path.scope.getBinding(localBindingName)!;

          binding.referencePaths.forEach((p) => {
            if (flagValue === '@embroider/macros') {
              p.replaceWith(t.callExpression(state.util.import(p, "@embroider/macros", "isDevelopingApp"), []))
              p.scope.crawl();
            } else {
              p.replaceWith(buildIdentifier(flagValue, flagName));
            }
          });

          path.remove();
          path.scope.removeOwnBinding(localBindingName);
        }
      },

      ImportDeclaration: {
        exit(path, state) {
          let importPath = path.node.source.value;
          let flagsForImport = state.opts.flags[importPath];

          // remove flag source imports when no specifiers are left
          if (flagsForImport && path.get('specifiers').length === 0) {
            path.remove();
          }
        },
      },

      Program: {
        enter(path, state) {
          // most of our plugin declares state.opts as already being normalized.
          // This is the spot where we force it become so.
          state.opts = normalizeOptions(state.opts as unknown as UserOptions);
          state.util = new ImportUtil(t, path)
          this.macroBuilder = new Macros(babel, state.opts, state.util);

          let body = path.get('body');

          body.forEach((item) => {
            if (item.isImportDeclaration()) {
              let importPath = item.node.source.value;

              let debugToolsImport = state.opts.debugTools.debugToolsImport;

              if (debugToolsImport && debugToolsImport === importPath) {
                if (!item.node.specifiers.length) {
                  item.remove();
                } else {
                  this.macroBuilder.collectDebugToolsSpecifiers(item.get('specifiers'));
                }
              }
            }
          });
        },

        exit() {
          this.macroBuilder.cleanImports();
        },
      },

      ExpressionStatement(path) {
        this.macroBuilder.build(path);
      },
    },
  };
}

macros.baseDir = function () {
  return path.resolve(__dirname, '..', '..');
};
