# Browser Metronome

This repository hosts a simple metronome implemented in HTML and JavaScript. Open `index.html` in a modern browser to experiment with tempo, subdivisions, and accent patterns.

An alternative version built with [Vue 3](https://vuejs.org/) is available in
`vue-metronome.html`. It demonstrates modern framework integration along with
extra features like swing feel, polymeter, polyrhythm and programmable tone
drones.

The HTML metronome now includes a "Measure Tones" section where you can select
how many measures to cycle through and assign a different tone for each
measure.

The project also contains a small proof-of-concept for notation rendering under `notation_feature/demo.html` using VexFlow.

For details about the internal agents that drive the metronome (tempo, audio, visuals, input, persistence, and logging), see [AGENTS.md](AGENTS.md).

