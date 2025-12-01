export class TempoAgent extends EventTarget {
  constructor({ bpm = 120, timeSignature = [4, 4], subdivisions = 1 } = {}) {
    super();
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.subdivisions = subdivisions;
    this._schedulerId = null;
    this._tick = 0;
    this._nextNoteTime = 0;
    this._audioContext = null;
    
    // Scheduling constants - lookahead for sample-accurate timing
    this._scheduleAheadTime = 0.1; // How far ahead to schedule (seconds)
    this._schedulerInterval = 25;   // How often to call scheduler (ms)
  }

  /**
   * Initialize or get the AudioContext for precise timing
   */
  _ensureAudioContext() {
    if (!this._audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this._audioContext = new AudioContextClass();
      }
    }
    if (this._audioContext?.state === 'suspended') {
      this._audioContext.resume().catch(() => {});
    }
    return this._audioContext;
  }

  /**
   * Schedule notes ahead of time using Web Audio API timing
   */
  _scheduler() {
    const ctx = this._audioContext;
    if (!ctx) return;

    // Schedule all notes that need to be played before the next interval
    while (this._nextNoteTime < ctx.currentTime + this._scheduleAheadTime) {
      this._scheduleNote(this._nextNoteTime);
      this._advanceNote();
    }
  }

  /**
   * Schedule a single note at the specified audio time
   */
  _scheduleNote(time) {
    this._tick++;
    const isBeat = this._tick % this.subdivisions === 0;
    
    // Calculate delay from now to when the event should fire
    const ctx = this._audioContext;
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    
    // Dispatch event at the correct time
    setTimeout(() => {
      if (this._schedulerId !== null) { // Only dispatch if still running
        if (isBeat) {
          this.dispatchEvent(new CustomEvent('beat', { 
            detail: { audioTime: time, tick: this._tick } 
          }));
        } else {
          this.dispatchEvent(new CustomEvent('subbeat', { 
            detail: { audioTime: time, tick: this._tick } 
          }));
        }
      }
    }, delayMs);
  }

  /**
   * Advance to the next note time based on current tempo
   */
  _advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerTick = secondsPerBeat / this.subdivisions;
    this._nextNoteTime += secondsPerTick;
  }

  start() {
    if (this._schedulerId !== null) return;
    
    const ctx = this._ensureAudioContext();
    if (!ctx) {
      console.error('TempoAgent: Web Audio API not available');
      return;
    }

    // Initialize timing
    this._nextNoteTime = ctx.currentTime;
    this._tick = 0;

    // Start the scheduler
    this._scheduler();
    this._schedulerId = setInterval(() => this._scheduler(), this._schedulerInterval);
  }

  stop() {
    if (this._schedulerId !== null) {
      clearInterval(this._schedulerId);
      this._schedulerId = null;
    }
    this._tick = 0;
  }

  setBpm(bpm) {
    this.bpm = bpm;
    // No need to restart - tempo change takes effect on next scheduled note
  }

  setTimeSignature(sig) {
    this.timeSignature = sig;
  }

  setSubdivisions(sub) {
    this.subdivisions = sub;
    // No need to restart - subdivision change takes effect on next beat
  }
}
