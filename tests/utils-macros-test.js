'use strict';

const macros = require('../src/index.js');
const { transformSync } = require('@babel/core');
const { expect } = require('chai');

describe('utils/macros.js', function () {
  it('does not fail if an import intended to be removed has already been removed', function () {
    const { code } = transformSync(`import { warn } from '@ember/debug-tools'`, {
      plugins: [
        {
          name: 'other plugin that removes stuff',
          visitor: {
            Program: {
              exit(path) {
                path.get('body').forEach((item) => {
                  if (item.isImportDeclaration()) {
                    item.remove();
                  }
                });
              },
            },
          },
        },
        [
          macros,
          {
            debugTools: {
              isDebug: true,
              source: '@ember/debug-tools',
            },
          },
        ],
      ],
      filename: 'some-file.js',
    });

    expect(code).to.eql('');
  });
});
