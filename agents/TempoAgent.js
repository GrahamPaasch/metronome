export class TempoAgent extends EventTarget {
  constructor({ bpm = 120, timeSignature = [4, 4], subdivisions = 1 } = {}) {
    super();
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.subdivisions = subdivisions;
    this._timer = null;
    this._tick = 0;
  }

  start() {
    if (this._timer) return;
    const interval = 60000 / (this.bpm * this.subdivisions);
    let expected = performance.now() + interval;
    const step = () => {
      const now = performance.now();
      const drift = now - expected;
      expected += interval;
      this._tick++;
      if (this._tick % this.subdivisions === 0) {
        this.dispatchEvent(new Event('beat'));
      } else {
        this.dispatchEvent(new Event('subbeat'));
      }
      this._timer = setTimeout(step, Math.max(0, interval - drift));
    };
    this._timer = setTimeout(step, interval);
  }

  stop() {
    clearTimeout(this._timer);
    this._timer = null;
    this._tick = 0;
  }

  setBpm(bpm) {
    this.bpm = bpm;
    if (this._timer) {
      this.stop();
      this.start();
    }
  }

  setTimeSignature(sig) {
    this.timeSignature = sig;
  }

  setSubdivisions(sub) {
    this.subdivisions = sub;
    if (this._timer) {
      this.stop();
      this.start();
    }
  }
}
