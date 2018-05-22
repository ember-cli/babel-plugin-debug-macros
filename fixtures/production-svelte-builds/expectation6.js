

export let PartialComponentManager;
if (false) {
  PartialComponentManager = class {
    constructor() {
      this.isDone = true;
    }
  };
}

if (false && someOtherThing()) {
  doStuff();
}

export let ObjectController;
if (true) {
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