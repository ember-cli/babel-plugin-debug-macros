export function normalizeOptions(features, debugTools, envFlags, packageVersion) {
  let featuresImport;
  let featureFlags = {};
  if (features) {
    featuresImport = features.importSpecifier;
    if (features.flags) {
      featureFlags = features.flags;
    }
  }

  if (!debugTools) {
    throw new Error('You must specify `debugTools.importSpecifier`');
  }

  let debugToolsImport;
  if (debugTools) {
    debugToolsImport = debugTools.importSpecifier;
  }

  let envFlagsImport;
  let _envFlags = {};

  if (envFlags) {
    envFlagsImport = envFlags.importSpecifier;
    if (envFlags.flags) {
      _envFlags = envFlags.flags;
    }
  } else {
    throw new Error('You must specify envFlags.flags.DEBUG at minimum.')
  }

  return {
    packageVersion,
    features: {
      featuresImport,
      flags: featureFlags
    },
    envFlags: {
      envFlagsImport,
      flags: _envFlags
    },
    debugTools: {
      debugToolsImport
    }
  };
}