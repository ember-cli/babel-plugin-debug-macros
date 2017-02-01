# Babel Debug Macros And Feature Flags

This provides debug macros and feature flagging.

## Setup

The plugin takes 4 types options: `envFlags`, `features`, `debugTools` and `packageVersion`. The `importSpecifier` is used as a hint to this plugin as to where macros are being imported and completely configurable by the host. The `packageVersion` is used to strip any deprecations that expired when compared with the `deprecate` CallExpressions.

```
{
  plugins: [
    ['babel-debug-macros', {
      packageVersion: '3.0.0',
      envFlags: {
        importSpecifier: '@ember/env-flags',
        flags: { DEBUG: 1 }
      },
      features: {
        importSpecifier: '@ember/features',
        flags: { FEATURE_A: 0, FEATURE_B: 1 }
      },
      debugTools: {
        importSpecifier: 'debug-tools'
      }
    }]
  ]
}
```

Flags and features are inlined into consuming module so that something like UglifyJS with DCE them when they are unreachable.

## Simple environment and fetaure flags

```javascript
import { DEBUG } from '@ember/env-flags';
import { FEATURE_A, FEATURE_B } from '@ember/features';

if (DEBUG) {
  console.log('Hello from debug');
}

let woot;
if (FEATURE_A) {
  woot = () => 'woot';
} else if (FEATURE_B) {
  woot = () => 'toow';
}

woot();
```

Transforms to:

```javascript
const DEBUG = 1;
const FEATURE_A = 0;
cosnt FEATURE_B = 1;

if (DEBUG) {
  console.log('Hello from debug');
}

let woot;
if (FEATURE_A) {
  woot = () => 'woot';
} else if (FEATURE_B) {
  woot = () => 'toow';
}

woot();
```

## `warn` macro expansion

```javascript
import { warn } from 'debug-tools';

warn('this is a warning');
```

Expands into:

```javascript
const DEBUG = 1;

(DEBUG && console.warn('this is a warning'));
```

## `assert` macro expansion

```javascript
import { assert } from 'debug-tools';

assert((() => {
  return 1 === 1;
})(), 'You bad!');
```

Expands into:

```javascript
const DEBUG = 1;

(DEBUG && console.assert((() => { return 1 === 1;})(), 'this is a warning'));
```

## `deprecate` macro expansion

```javascript
import { deprecate } from 'debug-tools';

let foo = 2;

deprecate('This is deprecated.', foo % 2, {
  id: 'old-and-busted',
  url: 'http://example.com',
  until: '4.0.0'
});
```

Expands into:

```javascript
const DEBUG = 1;

let foo = 2;

(DEBUG && foo % 2 && console.warn('DEPRECATED [old-and-busted]: This is deprecated. Will be removed in 4.0.0. Please see http://example.com for more details.'));
```

# Hygenic

As you may notice that we inject `DEBUG` into the code when we expand the macro. We gurantee that the binding is unique when injected and follow the local binding name if it is imported directly.
