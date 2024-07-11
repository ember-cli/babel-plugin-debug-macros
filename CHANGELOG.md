# Changelog

## Release (2024-07-11)

babel-plugin-debug-macros 1.0.1 (patch)

#### :memo: Documentation
* `babel-plugin-debug-macros`
  * [#97](https://github.com/ember-cli/babel-plugin-debug-macros/pull/97) docs(README.md)/ Fix a typo in the name of the plugin ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

#### :house: Internal
* `babel-plugin-debug-macros`
  * [#100](https://github.com/ember-cli/babel-plugin-debug-macros/pull/100) remove security warnings from github ([@mansona](https://github.com/mansona))
  * [#98](https://github.com/ember-cli/babel-plugin-debug-macros/pull/98) start using release-plan ([@mansona](https://github.com/mansona))

#### Committers: 2
- Chris Manson ([@mansona](https://github.com/mansona))
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))




## v1.0.0 (2024-04-27)

#### :boom: Breaking Change
* [#94](https://github.com/ember-cli/babel-plugin-debug-macros/pull/94) Drop deprecated config format ([@ef4](https://github.com/ef4))
* [#91](https://github.com/ember-cli/babel-plugin-debug-macros/pull/91) Drop support Node < 16 and babel < 7 ([@ef4](https://github.com/ef4))

#### :rocket: Enhancement
* [#96](https://github.com/ember-cli/babel-plugin-debug-macros/pull/96) Add a mode that converts to @embroider/macros ([@ef4](https://github.com/ef4))
* [#95](https://github.com/ember-cli/babel-plugin-debug-macros/pull/95) Don't expose typescript's esm/cjs interop from the entrypoint ([@ef4](https://github.com/ef4))

#### :house: Internal
* [#92](https://github.com/ember-cli/babel-plugin-debug-macros/pull/92) TS conversion ([@ef4](https://github.com/ef4))
* [#93](https://github.com/ember-cli/babel-plugin-debug-macros/pull/93) re-add utils-macros-test ([@ef4](https://github.com/ef4))
* [#88](https://github.com/ember-cli/babel-plugin-debug-macros/pull/88) Add tests for Ember 3.27+ modules based API. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Edward Faulkner ([@ef4](https://github.com/ef4))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v1.0.0-alpha.2 (2024-04-17)

#### :rocket: Enhancement
* [#96](https://github.com/ember-cli/babel-plugin-debug-macros/pull/96) Add a mode that converts to @embroider/macros ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## v1.0.0-alpha.1 (2024-04-11)

#### :bug: Bug Fix
* [#95](https://github.com/ember-cli/babel-plugin-debug-macros/pull/95) Don't expose typescript's esm/cjs interop from the entrypoint ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## v1.0.0-alpha.0 (2024-04-11)

#### :boom: Breaking Change
* [#94](https://github.com/ember-cli/babel-plugin-debug-macros/pull/94) Drop deprecated config format ([@ef4](https://github.com/ef4))
* [#91](https://github.com/ember-cli/babel-plugin-debug-macros/pull/91) Drop support Node < 16 and babel < 7 ([@ef4](https://github.com/ef4))

#### :house: Internal
* [#92](https://github.com/ember-cli/babel-plugin-debug-macros/pull/92) TS conversion ([@ef4](https://github.com/ef4))
* [#93](https://github.com/ember-cli/babel-plugin-debug-macros/pull/93) re-add utils-macros-test ([@ef4](https://github.com/ef4))
* [#88](https://github.com/ember-cli/babel-plugin-debug-macros/pull/88) Add tests for Ember 3.27+ modules based API. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Edward Faulkner ([@ef4](https://github.com/ef4))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v0.3.4 (2021-01-27)

#### :rocket: Enhancement
* [#83](https://github.com/ember-cli/babel-plugin-debug-macros/pull/83) Remove validation check for deprecation `until` ([@pzuraq](https://github.com/pzuraq))

#### :bug: Bug Fix
* [#81](https://github.com/ember-cli/babel-plugin-debug-macros/pull/81) Improve v1 API warning ([@hjdivad](https://github.com/hjdivad))

#### :house: Internal
* [#86](https://github.com/ember-cli/babel-plugin-debug-macros/pull/86) Update release automation setup ([@rwjblue](https://github.com/rwjblue))
* [#85](https://github.com/ember-cli/babel-plugin-debug-macros/pull/85) Update to ensure `npm test` runs linting. ([@rwjblue](https://github.com/rwjblue))
* [#84](https://github.com/ember-cli/babel-plugin-debug-macros/pull/84) Setup GitHub Actions. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 3
- Chris Garrett ([@pzuraq](https://github.com/pzuraq))
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.3.3 (2019-08-26)

#### :bug: Bug Fix
* [#80](https://github.com/ember-cli/babel-plugin-debug-macros/pull/80) Fix bug when key attribute is a literal for debug macros (`deprecate`, `assert`, `warn`) ([@martony38](https://github.com/martony38))

#### Committers: 1
- Laurent Sehabiague ([@martony38](https://github.com/martony38))

# Changelog

## v0.3.2 (2019-06-20)

#### :bug: Bug Fix
* [#79](https://github.com/ember-cli/babel-plugin-debug-macros/pull/79) [BUGFIX] if our ancestor import declaration is removed short-circuit … ([@stefanpenner](https://github.com/stefanpenner))

#### Committers: 1
- Stefan Penner ([@stefanpenner](https://github.com/stefanpenner))

## v0.3.1 (2019-04-11)

#### :rocket: Enhancement
* [#77](https://github.com/ember-cli/babel-plugin-debug-macros/pull/77) Remove requirement for 'debugTools' options ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([@chadhietala](https://github.com/chadhietala))

## v0.3.0 (2019-01-29)

#### :boom: Breaking Change
* [#76](https://github.com/ember-cli/babel-plugin-debug-macros/pull/76) [Breaking] Drop node 4 support ([@jrjohnson](https://github.com/jrjohnson))

#### :rocket: Enhancement
* [#75](https://github.com/ember-cli/babel-plugin-debug-macros/pull/75) Update from beta to final babel 7 ([@jrjohnson](https://github.com/jrjohnson))

#### :memo: Documentation
* [#74](https://github.com/ember-cli/babel-plugin-debug-macros/pull/74) fix: Correct typo in README subtitle ([@dmuneras](https://github.com/dmuneras))

#### Committers: 2
- Daniel Múnera Sánchez ([@dmuneras](https://github.com/dmuneras))
- Jonathan Johnson ([@jrjohnson](https://github.com/jrjohnson))


## v0.2.0 (2018-10-03)

#### :bug: Bug Fix
* [#73](https://github.com/ember-cli/babel-plugin-debug-macros/pull/73) Use state to store normalized options ([@pzuraq](https://github.com/pzuraq))
* [#69](https://github.com/ember-cli/babel-plugin-debug-macros/pull/69) remove imports without specifiers ([@kellyselden](https://github.com/kellyselden))

#### Committers: 2
- Chris Garrett ([@pzuraq](https://github.com/pzuraq))
- Kelly Selden ([@kellyselden](https://github.com/kellyselden))


## v0.2.0-beta.6 (2018-05-23)

#### :boom: Breaking Change
* [#67](https://github.com/ember-cli/babel-plugin-debug-macros/pull/67) Unify flag handling... ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0-beta.5 (2018-05-22)

#### :bug: Bug Fix
* [#66](https://github.com/ember-cli/babel-plugin-debug-macros/pull/66) Fix same version matching for svelte flags. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0-beta.4 (2018-05-22)

#### :bug: Bug Fix
* [#65](https://github.com/ember-cli/babel-plugin-debug-macros/pull/65) Fix invalid feature flag detection. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0-beta.3 (2018-05-22)

#### :rocket: Enhancement
* [#64](https://github.com/ember-cli/babel-plugin-debug-macros/pull/64) Remove error throwing for svelte guarded features. ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#63](https://github.com/ember-cli/babel-plugin-debug-macros/pull/63) Cleanup / fix some svelte related functionality. ([@rwjblue](https://github.com/rwjblue))
* [#62](https://github.com/ember-cli/babel-plugin-debug-macros/pull/62) Fix for beta versions with svelte. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#61](https://github.com/ember-cli/babel-plugin-debug-macros/pull/61) Add linting! ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0-beta.2 (2018-04-19)

#### :bug: Bug Fix
* [#60](https://github.com/ember-cli/babel-plugin-debug-macros/pull/60) Ensure `Plugin.baseDir()` functions properly. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#59](https://github.com/ember-cli/babel-plugin-debug-macros/pull/59) Remove extra nesting in directory structure. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0-beta.1 (2018-04-19)

#### :rocket: Enhancement
* [#58](https://github.com/ember-cli/babel-plugin-debug-macros/pull/58) Update to floating dep on @babel/core. ([@rwjblue](https://github.com/rwjblue))
* [#57](https://github.com/ember-cli/babel-plugin-debug-macros/pull/57) Upgraded to Babel 7 beta ([@t-sauer](https://github.com/t-sauer))

#### :house: Internal
* [#55](https://github.com/ember-cli/babel-plugin-debug-macros/pull/55) Replace Mocha + Chai with Jest ([@Turbo87](https://github.com/Turbo87))
* [#54](https://github.com/ember-cli/babel-plugin-debug-macros/pull/54) tests: Simplify test generator code ([@Turbo87](https://github.com/Turbo87))
* [#52](https://github.com/ember-cli/babel-plugin-debug-macros/pull/52) Simplify test code ([@Turbo87](https://github.com/Turbo87))
* [#51](https://github.com/ember-cli/babel-plugin-debug-macros/pull/51) Remove Babel transpilation step ([@Turbo87](https://github.com/Turbo87))

#### Committers: 3
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Thomas Sauer ([@t-sauer](https://github.com/t-sauer))
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))
