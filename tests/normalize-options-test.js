'use strict';

const normalizeOptions = require('../src/utils/normalize-options').normalizeOptions;

describe('normalizeOptions', function() {
  it('sets flag to false when svelte version matches the flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      envFlags: {
        flags: {
          DEBUG: true,
        },
      },
      svelte: { foo: '1.2.0' },
      features: [{ name: 'foo', source: 'foo/features', flags: { ABC: '1.2.0' } }],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      envFlags: { envFlagsImport: undefined, flags: { DEBUG: true } },
      externalizeHelpers: undefined,
      featureSources: ['foo/features'],
      features: [{ flags: { ABC: false }, name: 'foo', source: 'foo/features' }],
      featuresMap: { 'foo/features': {} },
      hasSvelteBuild: true,
      svelte: { foo: '1.2.0' },
      svelteMap: { 'foo/features': { ABC: false } },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to false when svelte version is higher than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      envFlags: {
        flags: {
          DEBUG: true,
        },
      },
      svelte: { foo: '1.2.0' },
      features: [{ name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0' } }],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      envFlags: { envFlagsImport: undefined, flags: { DEBUG: true } },
      externalizeHelpers: undefined,
      featureSources: ['foo/features'],
      features: [{ flags: { ABC: false }, name: 'foo', source: 'foo/features' }],
      featuresMap: { 'foo/features': {} },
      hasSvelteBuild: true,
      svelte: { foo: '1.2.0' },
      svelteMap: { 'foo/features': { ABC: false } },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to true when svelte version is lower than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      envFlags: {
        flags: {
          DEBUG: true,
        },
      },
      svelte: { foo: '1.0.0' },
      features: [{ name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0' } }],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      envFlags: { envFlagsImport: undefined, flags: { DEBUG: true } },
      externalizeHelpers: undefined,
      featureSources: ['foo/features'],
      features: [{ flags: { ABC: true }, name: 'foo', source: 'foo/features' }],
      featuresMap: { 'foo/features': {} },
      hasSvelteBuild: true,
      svelte: { foo: '1.0.0' },
      svelteMap: { 'foo/features': { ABC: true } },
    };

    expect(actual).toEqual(expected);
  });

  it('sets flag to true when svelte version is a beta version higher than flag version', function() {
    let actual = normalizeOptions({
      debugTools: {
        source: 'whatever',
      },
      envFlags: {
        flags: {
          DEBUG: true,
        },
      },
      svelte: { foo: '1.2.0' },
      features: [{ name: 'foo', source: 'foo/features', flags: { ABC: '1.1.0-beta.1' } }],
    });

    let expected = {
      debugTools: { assertPredicateIndex: undefined, debugToolsImport: 'whatever' },
      envFlags: { envFlagsImport: undefined, flags: { DEBUG: true } },
      externalizeHelpers: undefined,
      featureSources: ['foo/features'],
      features: [{ flags: { ABC: false }, name: 'foo', source: 'foo/features' }],
      featuresMap: { 'foo/features': {} },
      hasSvelteBuild: true,
      svelte: { foo: '1.2.0' },
      svelteMap: { 'foo/features': { ABC: false } },
    };

    expect(actual).toEqual(expected);
  });
});
