# Browser Metronome

This repository hosts a minimal metronome implemented in plain HTML and JavaScript.
Open `index.html` in a modern browser to start using it.  Enter a tempo in beats
per minute and press **Start** to hear and see the clicks.

The implementation is intentionally simple and is composed of small "agents" that
handle specific responsibilities:

* **TempoAgent** – emits `beat` and `subbeat` events at the configured BPM.
* **AudioAgent** – produces click sounds using the Web Audio API.
* **VisualAgent** – flashes a DOM element on beats and subdivisions.
* **InputAgent** – wires up the UI controls and broadcasts user actions.

These agents demonstrate how the application could be extended or replaced with
more sophisticated components.  For more background see
[AGENTS.md](AGENTS.md).

An experimental Vue 3 version remains available in `vue-metronome.html`.
