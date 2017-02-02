import { satisfies } from 'semver';

export function normalizeOptions(options) {
  let {
    features,
    debugTools,
    envFlags,
    packageVersion,
    externalizeHelpers,
    svelte
  } = options;


  let featureImportSpecifiers = [];
  if (features) {
    features = features.map((feature) => {
      let featuresImport = feature.importSpecifier;
      featureImportSpecifiers.push(featuresImport);
      let name = feature.name;

      let flags = {};
      Object.keys(feature.flags).forEach((flagName) => {
        let value = feature.flags[flagName];

        if (typeof value === 'string' && svelte[name]) {
          flags[flagName] = satisfies(value, `>=${svelte[name]}`) | 0;
        } else if (typeof value === 'number') {
          flags[flagName] = value;
        } else {
          throw new Error(`Flags must be a scalar value or semver version`);
        }

      });


      return {
        name,
        featuresImport,
        flags
      }
    });

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
    featureImportSpecifiers,
    packageVersion,
    externalizeHelpers,
    features,
    envFlags: {
      envFlagsImport,
      flags: _envFlags
    },
    debugTools: {
      debugToolsImport
    }
  };
}