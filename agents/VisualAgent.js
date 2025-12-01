export class VisualAgent {
  constructor({ 
    elementSelector, 
    beatStyle = {}, 
    subbeatStyle = {},
    beatDuration = 100,    // Duration of beat flash in ms
    subbeatDuration = 60   // Duration of subbeat flash in ms
  } = {}) {
    this.element = document.querySelector(elementSelector);
    this.beatStyle = beatStyle;
    this.subbeatStyle = subbeatStyle;
    this.beatDuration = beatDuration;
    this.subbeatDuration = subbeatDuration;
    this._activeTimeout = null;
    this._originalStyles = {};
  }

  flashBeat() {
    this._flash(this.beatStyle, this.beatDuration);
  }

  flashSubbeat() {
    this._flash(this.subbeatStyle, this.subbeatDuration);
  }

  /**
   * Set flash durations dynamically
   */
  setDurations({ beatDuration, subbeatDuration }) {
    if (beatDuration !== undefined) this.beatDuration = beatDuration;
    if (subbeatDuration !== undefined) this.subbeatDuration = subbeatDuration;
  }

  _flash(style, duration) {
    if (!this.element) return;
    
    // Cancel any pending reset
    if (this._activeTimeout) {
      clearTimeout(this._activeTimeout);
      this._restoreStyles();
    }
    
    // Store original styles before applying flash
    this._originalStyles = {};
    for (const key of Object.keys(style)) {
      this._originalStyles[key] = this.element.style[key] || '';
    }
    
    // Apply flash style
    Object.assign(this.element.style, style);
    
    // Reset after duration
    this._activeTimeout = setTimeout(() => {
      this._restoreStyles();
      this._activeTimeout = null;
    }, duration);
  }

  _restoreStyles() {
    if (!this.element) return;
    for (const [key, value] of Object.entries(this._originalStyles)) {
      this.element.style[key] = value;
    }
    this._originalStyles = {};
  }

  /**
   * Clean up any pending timeouts
   */
  destroy() {
    if (this._activeTimeout) {
      clearTimeout(this._activeTimeout);
      this._activeTimeout = null;
    }
    this._restoreStyles();
  }
}
