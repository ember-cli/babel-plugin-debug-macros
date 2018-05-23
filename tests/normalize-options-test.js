'use strict';

const normalizeOptions = require('../src/utils/normalize-options').normalizeOptions;

describe('normalizeOptions', function() {
  it('sets flag to false when svelte version matches the flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      flags: [
        { name: 'ember-source', source: '@glimmer/env', flags: { DEBUG: true } },
        {
          name: 'ember-source',
          source: '@ember/deprecated-features',
          flags: { PARTIALS: '1.2.0' },
        },
        {
          name: 'ember-source',
          source: '@ember/canary-features',
          flags: { TRACKED: null, GETTERS: true },
        },
      ],
      svelte: { 'ember-source': '1.2.0' },
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      flags: {
        '@glimmer/env': {
          DEBUG: true,
        },
        '@ember/deprecated-features': {
          PARTIALS: false,
        },
        '@ember/canary-features': {
          TRACKED: null,
          GETTERS: true,
        },
      },
      externalizeHelpers: undefined,
      svelte: { 'ember-source': '1.2.0' },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to false when svelte version is higher than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      svelte: { foo: '1.2.0' },
      flags: [
        { name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0' } },
        { source: 'whatever', flags: { DEBUG: true } },
      ],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      flags: {
        'foo/features': { ABC: false },
        whatever: { DEBUG: true },
      },
      externalizeHelpers: undefined,
      svelte: { foo: '1.2.0' },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to true when svelte version is lower than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      svelte: { foo: '1.0.0' },
      flags: [
        { name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0' } },
        { source: 'whatever', flags: { DEBUG: true } },
      ],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      flags: {
        'foo/features': { ABC: true },
        whatever: { DEBUG: true },
      },
      externalizeHelpers: undefined,
      svelte: { foo: '1.0.0' },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to true when svelte version is a beta version higher than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      svelte: { foo: '1.2.0' },
      flags: [
        { name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0-beta.1' } },
        { source: 'whatever', flags: { DEBUG: true } },
      ],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      flags: {
        'foo/features': { ABC: false },
        whatever: { DEBUG: true },
      },
      externalizeHelpers: undefined,
      svelte: { foo: '1.2.0' },
    };

    expect(actual).toEqual(expected);
  });
});
