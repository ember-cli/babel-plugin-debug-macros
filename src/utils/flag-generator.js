export default class FlagGenerator {
  constructor(t) {
    this.t = t;
  }

  generate(path, lookupTable) {
    let replacements = [];
    let { t } = this;
    path.node.specifiers.forEach((specifier) => {
      let flag = lookupTable[specifier.imported.name];
      if (flag !== undefined) {
        replacements.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(specifier.imported.name), t.numericLiteral(flag))]))
      } else {
        throw new Error('Imported ${path.node.source} from library-name/flags which is not a supported flag.');
      }
    });

    path.replaceWithMultiple(replacements);
  }
}
