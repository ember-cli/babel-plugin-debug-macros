

export let PartialComponentManager;
if (0) {
  PartialComponentManager = class {
    constructor() {
      this.isDone = true;
    }
  };
}

export let ObjectController;
if (1) {
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