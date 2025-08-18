export class InputAgent extends EventTarget {
  constructor({ controlSelectors } = {}) {
    super();
    this.controls = {};
    for (const [name, selector] of Object.entries(controlSelectors || {})) {
      this.controls[name] = document.querySelector(selector);
    }
    const { startButton, stopButton, bpmSlider } = this.controls;
    startButton?.addEventListener('click', () => this.dispatchEvent(new Event('start')));
    stopButton?.addEventListener('click', () => this.dispatchEvent(new Event('stop')));
    bpmSlider?.addEventListener('change', () => {
      const bpm = parseInt(bpmSlider.value, 10);
      this.dispatchEvent(new CustomEvent('bpmChange', { detail: bpm }));
    });
  }
}
