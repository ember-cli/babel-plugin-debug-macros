'use strict';

const gte = require('semver').gte;

function normalizeOptions(options) {
  let features = options.features || [];
  let debugTools = options.debugTools;
  let envFlags = options.envFlags;
  let externalizeHelpers = options.externalizeHelpers;
  let svelte = options.svelte;

  let featureSources = [];
  let featuresMap = {};
  let svelteMap = {};
  let hasSvelteBuild = false;

  if (!Array.isArray(features)) {
    features = [features];
  }

  features = features.map(feature => {
    let featuresSource = feature.source;
    featureSources.push(featuresSource);
    let name = feature.name;

    let flags = {};
    featuresMap[featuresSource] = {};
    svelteMap[featuresSource] = {};

    Object.keys(feature.flags).forEach(flagName => {
      let value = feature.flags[flagName];

      if (svelte !== undefined && typeof value === 'string' && svelte[name]) {
        hasSvelteBuild = true;
        flags[flagName] = svelteMap[featuresSource][flagName] = gte(value, svelte[name]);
      } else if (typeof value === 'boolean' || value === null) {
        flags[flagName] = featuresMap[featuresSource][flagName] = value;
      } else {
        flags[flagName] = featuresMap[featuresSource][flagName] = true;
      }
    });

    return {
      name,
      source: feature.source,
      flags,
    };
  });

  if (!debugTools) {
    throw new Error('You must specify `debugTools.source`');
  }

  let debugToolsImport = debugTools.source;
  let assertPredicateIndex = debugTools.assertPredicateIndex;

  let envFlagsImport;
  let _envFlags = {};

  if (envFlags) {
    envFlagsImport = envFlags.source;
    if (envFlags.flags) {
      _envFlags = envFlags.flags;
    }
  } else {
    throw new Error('You must specify envFlags.flags.DEBUG at minimum.');
  }

  return {
    featureSources,
    externalizeHelpers,
    features,
    featuresMap,
    svelteMap,
    hasSvelteBuild,
    svelte,
    envFlags: {
      envFlagsImport,
      flags: _envFlags,
    },
    debugTools: {
      debugToolsImport,
      assertPredicateIndex,
    },
  };
}

module.exports = {
  normalizeOptions,
};
