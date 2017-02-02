const DEPRECATED_PARTIALS = 0;
const DEPRECATED_CONTROLLERS = 1;


export let PartialComponentManager;
if (DEPRECATED_PARTIALS) {
  PartialComponentManager = class {
    constructor() {
      this.isDone = true;
    }
  };
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