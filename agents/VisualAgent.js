export class VisualAgent {
  constructor({ elementSelector, beatStyle = {}, subbeatStyle = {} } = {}) {
    this.element = document.querySelector(elementSelector);
    this.beatStyle = beatStyle;
    this.subbeatStyle = subbeatStyle;
  }

  flashBeat() {
    this._flash(this.beatStyle);
  }

  flashSubbeat() {
    this._flash(this.subbeatStyle);
  }

  _flash(style) {
    if (!this.element) return;
    Object.assign(this.element.style, style);
    requestAnimationFrame(() => {
      for (const key of Object.keys(style)) {
        this.element.style[key] = '';
      }
    });
  }
}
