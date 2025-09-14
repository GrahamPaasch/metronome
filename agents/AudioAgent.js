export class AudioAgent {
  constructor({ volume = 1 } = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.volume = volume;
    this._unlocked = false;
    this._attachUnlockHandlers();
  }

  _createContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    ctx.onstatechange = async () => {
      // Try to auto-recover if possible; some browsers require a gesture
      if (ctx.state === 'suspended' && this._unlocked) {
        try { await ctx.resume(); } catch (_) {}
      }
    };
    return ctx;
  }

  _ensureCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = this._createContext();
      if (!this.ctx) return;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended' && this._unlocked) {
      // Best effort resume; safe to fire-and-forget
      this.ctx.resume().catch(() => {});
    }
  }

  async unlock() {
    // Explicitly resume in response to a user gesture
    this._ensureCtx();
    if (!this.ctx) return;
    try { await this.ctx.resume(); } catch (_) {}
    // Play a very short, quiet tick to fully unlock on iOS
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      g.gain.value = 0.0001; // inaudible
      osc.connect(g).connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.005);
    } catch (_) {}
    this._unlocked = this.ctx?.state === 'running';
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
    this._ensureCtx();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = primary ? 'square' : 'sine';
    osc.frequency.value = primary ? 1000 : 600;
    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    osc.connect(gain).connect(this.masterGain);
    const now = this.ctx.currentTime;
    osc.start(now);
    osc.stop(now + 0.05);
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }
}
