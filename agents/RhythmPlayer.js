/**
 * RhythmPlayer - Plays rhythm patterns with precise timing
 * 
 * Uses Web Audio API for sample-accurate playback of rhythm patterns.
 */

export class RhythmPlayer extends EventTarget {
  constructor({ audioAgent = null } = {}) {
    super();
    this.audioAgent = audioAgent;
    this.audioContext = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isLooping = false;
    this.schedulerId = null;
    this.scheduledNotes = [];
    this.currentTempo = 100;
    this.currentTimings = [];
    this.totalDuration = 0;
    this.startTime = 0;
    this.currentBeat = 0;
    
    // Scheduling constants
    this.scheduleAheadTime = 0.1; // seconds
    this.schedulerInterval = 25;  // ms
  }

  /**
   * Initialize audio context
   */
  async init() {
    if (this.audioContext) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }
    
    this.audioContext = new AudioContextClass();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);
    
    // Resume if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a rhythm pattern
   * @param {Array} timings - Array of {time, duration, accent} objects
   * @param {number} tempo - Tempo in BPM
   * @param {number} totalDuration - Total duration in beats
   * @param {boolean} loop - Whether to loop
   */
  async play(timings, tempo, totalDuration, loop = false) {
    await this.init();
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.stop();
    
    this.currentTimings = timings;
    this.currentTempo = tempo;
    this.totalDuration = totalDuration;
    this.isLooping = loop;
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.currentBeat = 0;
    
    this._scheduler();
    this.schedulerId = setInterval(() => this._scheduler(), this.schedulerInterval);
    
    this.dispatchEvent(new Event('started'));
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    
    // Stop any scheduled notes
    this.scheduledNotes.forEach(note => {
      try {
        note.oscillator?.stop();
        note.oscillator?.disconnect();
        note.gain?.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.scheduledNotes = [];
    
    this.isPlaying = false;
    this.dispatchEvent(new Event('stopped'));
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Scheduler function - schedules notes ahead of time
   */
  _scheduler() {
    if (!this.isPlaying || !this.audioContext) return;
    
    const secondsPerBeat = 60 / this.currentTempo;
    const currentTime = this.audioContext.currentTime;
    const elapsedTime = currentTime - this.startTime;
    const elapsedBeats = elapsedTime / secondsPerBeat;
    
    // Check if we've reached the end
    if (elapsedBeats >= this.totalDuration) {
      if (this.isLooping) {
        // Reset for next loop
        this.startTime = currentTime;
        this.currentBeat = 0;
        this.dispatchEvent(new Event('looped'));
      } else {
        this.stop();
        this.dispatchEvent(new Event('ended'));
        return;
      }
    }
    
    // Schedule notes that fall within the lookahead window
    const lookAheadBeats = this.scheduleAheadTime / secondsPerBeat;
    
    for (const timing of this.currentTimings) {
      const noteTime = this.startTime + (timing.time * secondsPerBeat);
      
      // Skip if already passed or already scheduled
      if (noteTime < currentTime - 0.1) continue;
      
      // Schedule if within lookahead
      if (noteTime < currentTime + this.scheduleAheadTime) {
        // Check if already scheduled
        const alreadyScheduled = this.scheduledNotes.some(n => 
          Math.abs(n.time - noteTime) < 0.01
        );
        
        if (!alreadyScheduled) {
          this._scheduleNote(noteTime, timing.accent);
          
          // Emit beat event at the right time
          const delay = (noteTime - currentTime) * 1000;
          setTimeout(() => {
            if (this.isPlaying) {
              this.dispatchEvent(new CustomEvent('beat', {
                detail: { time: timing.time, accent: timing.accent }
              }));
            }
          }, Math.max(0, delay));
        }
      }
    }
    
    // Clean up old scheduled notes
    this.scheduledNotes = this.scheduledNotes.filter(n => 
      n.time > currentTime - 0.5
    );
  }

  /**
   * Schedule a single note
   */
  _scheduleNote(time, accent) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Different sounds for accent vs regular
    osc.type = accent ? 'square' : 'sine';
    osc.frequency.value = accent ? 1000 : 800;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(accent ? 0.8 : 0.5, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.06);
    
    this.scheduledNotes.push({ oscillator: osc, gain, time });
  }

  /**
   * Get current playback position in beats
   */
  getCurrentBeat() {
    if (!this.isPlaying || !this.audioContext) return 0;
    
    const secondsPerBeat = 60 / this.currentTempo;
    const elapsed = this.audioContext.currentTime - this.startTime;
    return (elapsed / secondsPerBeat) % this.totalDuration;
  }

  /**
   * Get playback progress (0-1)
   */
  getProgress() {
    if (!this.isPlaying || this.totalDuration === 0) return 0;
    return this.getCurrentBeat() / this.totalDuration;
  }
}
