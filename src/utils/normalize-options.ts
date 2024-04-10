import { gt } from 'semver';

function parseDebugTools(options: any): NormalizedOptions["debugTools"] {
  let debugTools = options.debugTools || {
    isDebug: false,
    source: '',
    assertPredicateIndex: undefined,
  };

  let isDebug = debugTools.isDebug;
  let debugToolsImport = debugTools.source;
  let assertPredicateIndex = debugTools.assertPredicateIndex;

  if (options.envFlags && isDebug === undefined) {
    isDebug = options.envFlags.flags.DEBUG;
  }

  return {
    isDebug,
    debugToolsImport,
    assertPredicateIndex,
  };
}

function evaluateFlagValue(options, name, flagName, flagValue) {
  let svelte = options.svelte;

  if (typeof flagValue === 'string') {
    if (svelte && svelte[name]) {
      return gt(flagValue, svelte[name]);
    } else {
      return null;
    }
  } else if (typeof flagValue === 'boolean' || flagValue === null) {
    return flagValue;
  } else {
    throw new Error(`Invalid value specified (${flagValue}) for ${flagName} by ${name}`);
  }
}

function parseFlags(options) {
  let flagsProvided = options.flags || [];

  let combinedFlags = {};
  flagsProvided.forEach((flagsDefinition) => {
    let source = flagsDefinition.source;
    let flagsForSource = (combinedFlags[source] = combinedFlags[source] || {});

    for (let flagName in flagsDefinition.flags) {
      let flagValue = flagsDefinition.flags[flagName];

      flagsForSource[flagName] = evaluateFlagValue(
        options,
        flagsDefinition.name,
        flagName,
        flagValue
      );
    }
  });

  return combinedFlags;
}

export interface NormalizedOptions {
  externalizeHelpers: unknown;
  flags: unknown;
  svelte: unknown;
  debugTools: unknown;
}

export function normalizeOptions(options: any): NormalizedOptions {
  let features = options.features || [];
  let externalizeHelpers = options.externalizeHelpers;
  let svelte = options.svelte;

  if (!Array.isArray(features)) {
    features = [features];
  }

  return {
    externalizeHelpers,
    flags: parseFlags(options),
    svelte,
    debugTools: parseDebugTools(options),
  };
}


