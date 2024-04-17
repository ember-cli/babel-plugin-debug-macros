import { gt } from 'semver';

function parseDebugTools(options: UserOptions): {
  isDebug: boolean | '@embroider/macros';
  debugToolsImport: string;
  assertPredicateIndex: number | undefined;
} {
  let debugTools = options.debugTools || {
    isDebug: false,
    source: '',
    assertPredicateIndex: undefined,
  };

  let isDebug = debugTools.isDebug;
  let debugToolsImport = debugTools.source;
  let assertPredicateIndex = debugTools.assertPredicateIndex;

  return {
    isDebug,
    debugToolsImport,
    assertPredicateIndex,
  };
}

function evaluateFlagValue(
  options: UserOptions,
  name: string | undefined,
  flagName: string,
  flagValue: string | boolean | null | "@embroider/macros"
): boolean | null | "@embroider/macros" {
  let svelte = options.svelte;

  if (typeof flagValue === 'string' && name) {
    if (svelte && svelte[name]) {
      return gt(flagValue, svelte[name]);
    } else {
      return null;
    }
  } else if (typeof flagValue === 'boolean' || flagValue === null) {
    return flagValue;
  } else if (flagValue === '@embroider/macros') {
    return flagValue;
  } else {
    throw new Error(`Invalid value specified (${flagValue}) for ${flagName} by ${name}`);
  }
}

function parseFlags(
  options: UserOptions
): Record<string, Record<string, boolean | null | '@embroider/macros'>> {
  let flagsProvided = options.flags || [];

  let combinedFlags: Record<string, Record<string, boolean | null | '@embroider/macros'>> = {};
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
  externalizeHelpers?: {
    module?: boolean;
    global?: string;
  };
  flags: Record<string, Record<string, boolean | null | '@embroider/macros'>>;
  debugTools: {
    isDebug: boolean | '@embroider/macros';
    debugToolsImport: string;
    assertPredicateIndex: number | undefined;
  };
}

export interface UserOptions {
  externalizeHelpers?: {
    module?: boolean;
    global?: string;
  };
  svelte?: Record<string, string>;
  flags?: {
    source: string;
    name?: string;
    flags: Record<string, boolean | string | null | '@embroider/macros'>;
  }[];
  debugTools?: {
    isDebug: boolean | '@embroider/macros';
    source: string;
    assertPredicateIndex?: number;
  };
}

export function normalizeOptions(options: UserOptions): NormalizedOptions {
  return {
    externalizeHelpers: options.externalizeHelpers,
    flags: parseFlags(options),
    debugTools: parseDebugTools(options),
  };
}
