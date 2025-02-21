export class Input {
  constructor() {
    this.keys = {};

    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      delete this.keys[e.key];
    });
  }

  isKeyDown(key) {
    return this.keys[key] === true;
  }
}