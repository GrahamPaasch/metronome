export class AudioAgent {
  constructor({ volume = 1 } = {}) {
    this.ctx = null;
    this.volume = volume;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPrimary() {
    this._playClick(true);
  }

  playSubdivision() {
    this._playClick(false);
  }

  _playClick(primary) {
    this._ensureCtx();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = primary ? 'square' : 'sine';
    osc.frequency.value = primary ? 1000 : 600;
    gain.gain.value = this.volume;
    osc.connect(gain).connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    osc.start(now);
    osc.stop(now + 0.05);
  }

  setVolume(v) {
    this.volume = v;
  }
}
