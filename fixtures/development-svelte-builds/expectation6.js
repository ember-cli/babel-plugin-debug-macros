import { DEPRECATED_PARTIALS, DEPRECATED_CONTROLLERS } from '@ember/features';

export let PartialComponentManager;
if (DEPRECATED_PARTIALS) {
  throw new Error('You indicated you don\'t have any deprecations, however you are relying on DEPRECATED_PARTIALS.');

  PartialComponentManager = class {
    constructor() {
      this.isDone = true;
    }
  };
}

if (DEPRECATED_PARTIALS && someOtherThing()) {
  doStuff();
}

export let ObjectController;
if (DEPRECATED_CONTROLLERS) {
  ObjectController = class {
    constructor() {
      this.isDoneAsWell = true;
    }
  };
}

export default class TheThingToReplaceControllers {
  constructor() {
    this.isNew = true;
  }
}