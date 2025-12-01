export class InputAgent extends EventTarget {
  // Valid BPM range
  static MIN_BPM = 30;
  static MAX_BPM = 300;

  constructor({ controlSelectors, minBpm = InputAgent.MIN_BPM, maxBpm = InputAgent.MAX_BPM } = {}) {
    super();
    this.minBpm = minBpm;
    this.maxBpm = maxBpm;
    this.controls = {};
    
    for (const [name, selector] of Object.entries(controlSelectors || {})) {
      this.controls[name] = document.querySelector(selector);
    }
    
    const { startButton, stopButton, bpmSlider } = this.controls;
    
    startButton?.addEventListener('click', () => this.dispatchEvent(new Event('start')));
    stopButton?.addEventListener('click', () => this.dispatchEvent(new Event('stop')));
    
    bpmSlider?.addEventListener('change', () => {
      const rawValue = bpmSlider.value;
      const result = this.validateBpm(rawValue);
      
      if (result.valid) {
        this.dispatchEvent(new CustomEvent('bpmChange', { detail: result.bpm }));
      } else {
        this.dispatchEvent(new CustomEvent('bpmError', { 
          detail: { 
            message: result.error, 
            rawValue,
            min: this.minBpm,
            max: this.maxBpm
          } 
        }));
        // Optionally reset slider to last valid value
        if (result.clampedBpm !== undefined) {
          bpmSlider.value = result.clampedBpm;
          this.dispatchEvent(new CustomEvent('bpmChange', { detail: result.clampedBpm }));
        }
      }
    });

    // Also listen for 'input' event for real-time feedback
    bpmSlider?.addEventListener('input', () => {
      const rawValue = bpmSlider.value;
      const result = this.validateBpm(rawValue);
      
      this.dispatchEvent(new CustomEvent('bpmInput', { 
        detail: { 
          bpm: result.valid ? result.bpm : result.clampedBpm,
          valid: result.valid,
          error: result.error
        } 
      }));
    });
  }

  /**
   * Validate a BPM value
   * @param {string|number} value - The BPM value to validate
   * @returns {Object} - { valid: boolean, bpm?: number, error?: string, clampedBpm?: number }
   */
  validateBpm(value) {
    const bpm = parseInt(value, 10);
    
    if (isNaN(bpm)) {
      return { 
        valid: false, 
        error: 'BPM must be a valid number',
        clampedBpm: this.minBpm
      };
    }
    
    if (bpm < this.minBpm) {
      return { 
        valid: false, 
        error: `BPM must be at least ${this.minBpm}`,
        clampedBpm: this.minBpm
      };
    }
    
    if (bpm > this.maxBpm) {
      return { 
        valid: false, 
        error: `BPM must be at most ${this.maxBpm}`,
        clampedBpm: this.maxBpm
      };
    }
    
    return { valid: true, bpm };
  }

  /**
   * Programmatically set the BPM value with validation
   * @param {number} bpm - The BPM to set
   * @returns {boolean} - Whether the value was valid
   */
  setBpm(bpm) {
    const result = this.validateBpm(bpm);
    const { bpmSlider } = this.controls;
    
    if (result.valid && bpmSlider) {
      bpmSlider.value = result.bpm;
      this.dispatchEvent(new CustomEvent('bpmChange', { detail: result.bpm }));
      return true;
    }
    
    return false;
  }
}
