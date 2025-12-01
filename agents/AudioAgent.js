export class AudioAgent extends EventTarget {
  constructor({ volume = 1 } = {}) {
    super();
    this.ctx = null;
    this.masterGain = null;
    this.volume = volume;
    this._unlocked = false;
    this._lastError = null;
    this._attachUnlockHandlers();
  }

  /**
   * Emit an error event and store the last error
   * @private
   */
  _emitError(type, message, originalError = null) {
    this._lastError = { type, message, originalError, timestamp: Date.now() };
    this.dispatchEvent(new CustomEvent('error', { 
      detail: this._lastError 
    }));
  }

  /**
   * Get the last error that occurred
   */
  get lastError() {
    return this._lastError;
  }

  /**
   * Clear the last error
   */
  clearError() {
    this._lastError = null;
  }

  _createContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this._emitError('unsupported', 'Web Audio API is not supported in this browser');
        return null;
      }
      const ctx = new AudioContext();
      ctx.onstatechange = async () => {
        // Try to auto-recover if possible; some browsers require a gesture
        if (ctx.state === 'suspended' && this._unlocked) {
          try { 
            await ctx.resume(); 
          } catch (err) {
            this._emitError('resume-failed', 'Failed to resume AudioContext', err);
          }
        }
        // Emit state change event
        this.dispatchEvent(new CustomEvent('statechange', { 
          detail: { state: ctx.state } 
        }));
      };
      return ctx;
    } catch (err) {
      this._emitError('context-creation-failed', 'Failed to create AudioContext', err);
      return null;
    }
  }

  _ensureCtx() {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = this._createContext();
        if (!this.ctx) return false;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended' && this._unlocked) {
        // Best effort resume; safe to fire-and-forget
        this.ctx.resume().catch((err) => {
          this._emitError('resume-failed', 'Failed to resume AudioContext', err);
        });
      }
      return true;
    } catch (err) {
      this._emitError('context-setup-failed', 'Failed to set up AudioContext', err);
      return false;
    }
  }

  async unlock() {
    // Explicitly resume in response to a user gesture
    const ready = this._ensureCtx();
    if (!ready || !this.ctx) {
      this._emitError('unlock-failed', 'Cannot unlock: AudioContext not available');
      return false;
    }
    
    try { 
      await this.ctx.resume(); 
    } catch (err) {
      this._emitError('unlock-resume-failed', 'Failed to resume AudioContext during unlock', err);
      return false;
    }
    
    // Play a very short, quiet tick to fully unlock on iOS
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      g.gain.value = 0.0001; // inaudible
      osc.connect(g).connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.005);
    } catch (err) {
      this._emitError('unlock-sound-failed', 'Failed to play unlock sound', err);
      // Don't return false - context may still be running
    }
    
    this._unlocked = this.ctx?.state === 'running';
    
    if (this._unlocked) {
      this.dispatchEvent(new Event('unlocked'));
    }
    
    return this._unlocked;
  }

  _attachUnlockHandlers() {
    const handler = () => {
      this.unlock();
      ['pointerdown','touchstart','keydown','mousedown'].forEach(evt =>
        window.removeEventListener(evt, handler, { capture: true })
      );
    };
    ['pointerdown','touchstart','keydown','mousedown'].forEach(evt =>
      window.addEventListener(evt, handler, { capture: true, once: true })
    );
  }

  playPrimary() {
    this._playClick(true);
  }

  playSubdivision() {
    this._playClick(false);
  }

  _playClick(primary) {
    try {
      const ready = this._ensureCtx();
      if (!ready || !this.ctx || this.ctx.state !== 'running') {
        // Silent fail for audio - don't spam errors on every beat
        return false;
      }
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = primary ? 'square' : 'sine';
      osc.frequency.value = primary ? 1000 : 600;
      gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      osc.connect(gain).connect(this.masterGain);
      const now = this.ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.05);
      return true;
    } catch (err) {
      this._emitError('playback-failed', `Failed to play ${primary ? 'primary' : 'subdivision'} click`, err);
      return false;
    }
  }

  setVolume(v) {
    try {
      if (typeof v !== 'number' || isNaN(v)) {
        this._emitError('invalid-volume', 'Volume must be a valid number');
        return false;
      }
      if (v < 0 || v > 1) {
        this._emitError('invalid-volume', 'Volume must be between 0 and 1');
        return false;
      }
      this.volume = v;
      if (this.masterGain) this.masterGain.gain.value = v;
      return true;
    } catch (err) {
      this._emitError('volume-set-failed', 'Failed to set volume', err);
      return false;
    }
  }

  /**
   * Check if audio is ready to play
   */
  get isReady() {
    return this.ctx && this.ctx.state === 'running';
  }

  /**
   * Get current audio context state
   */
  get state() {
    return this.ctx?.state ?? 'closed';
  }

  /**
   * Clean up resources
   */
  async destroy() {
    try {
      if (this.ctx && this.ctx.state !== 'closed') {
        await this.ctx.close();
      }
      this.ctx = null;
      this.masterGain = null;
      this._unlocked = false;
    } catch (err) {
      this._emitError('destroy-failed', 'Failed to clean up AudioAgent', err);
    }
  }
}
