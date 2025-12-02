/**
 * RhythmBuilder - Visual rhythm pattern builder and player
 * 
 * Allows users to construct rhythms by clicking note buttons,
 * renders them with VexFlow, and plays them back.
 */

export class RhythmBuilder extends EventTarget {
  // Note duration values (in beats, where 1 = quarter note)
  static DURATIONS = {
    w: 4,      // whole
    h: 2,      // half
    q: 1,      // quarter
    e: 0.5,    // eighth
    s: 0.25,   // sixteenth
    t: 0.125   // thirty-second
  };

  // Rest equivalents
  static REST_DURATIONS = {
    wr: 4,
    hr: 2,
    qr: 1,
    er: 0.5,
    sr: 0.25,
    tr: 0.125
  };

  constructor({ 
    containerSelector,
    timeSignature = [4, 4],
    onUpdate = null 
  } = {}) {
    super();
    this.container = document.querySelector(containerSelector);
    this.timeSignature = timeSignature; // [numerator, denominator]
    this.onUpdate = onUpdate;
    
    // Pattern storage
    this.pattern = [];  // Array of rhythm elements
    this.measures = []; // Organized by measure
    
    // UI state
    this.selectedTuplet = null; // null, 3 (triplet), 5 (quintuplet), etc.
    this.pendingDot = false;
    this.pendingTie = false;
    
    // Build UI
    if (this.container) {
      this._buildUI();
    }
  }

  /**
   * Build the rhythm builder UI
   */
  _buildUI() {
    this.container.innerHTML = `
      <div class="rhythm-builder">
        <div class="rb-toolbar">
          <div class="rb-notes" role="group" aria-label="Note values">
            <button data-note="w" title="Whole note (4 beats)">𝅝</button>
            <button data-note="h" title="Half note (2 beats)">𝅗𝅥</button>
            <button data-note="q" title="Quarter note (1 beat)">♩</button>
            <button data-note="e" title="Eighth note (1/2 beat)">♪</button>
            <button data-note="s" title="Sixteenth note (1/4 beat)">𝅘𝅥𝅯</button>
          </div>
          <div class="rb-rests" role="group" aria-label="Rest values">
            <button data-rest="wr" title="Whole rest">𝄻</button>
            <button data-rest="hr" title="Half rest">𝄼</button>
            <button data-rest="qr" title="Quarter rest">𝄽</button>
            <button data-rest="er" title="Eighth rest">𝄾</button>
            <button data-rest="sr" title="Sixteenth rest">𝄿</button>
          </div>
          <div class="rb-modifiers" role="group" aria-label="Modifiers">
            <button data-mod="dot" title="Add dot (1.5x duration)" class="rb-toggle">•</button>
            <button data-mod="tie" title="Tie to previous note" class="rb-toggle">⁀</button>
            <button data-mod="triplet" title="Triplet grouping" class="rb-toggle">³</button>
            <button data-mod="quintuplet" title="Quintuplet grouping" class="rb-toggle">⁵</button>
          </div>
          <div class="rb-actions" role="group" aria-label="Actions">
            <button data-action="undo" title="Undo last">↩</button>
            <button data-action="clear" title="Clear all">✕</button>
            <button data-action="barline" title="Add barline">|</button>
          </div>
        </div>
        <div class="rb-display">
          <div class="rb-notation" aria-label="Rhythm notation display"></div>
          <div class="rb-text" aria-label="Rhythm as text"></div>
        </div>
        <div class="rb-playback">
          <button data-action="play" title="Play rhythm">▶ Play</button>
          <button data-action="stop" title="Stop" disabled>■ Stop</button>
          <button data-action="loop" title="Loop rhythm" class="rb-toggle">🔁 Loop</button>
          <label>
            <span>Tempo:</span>
            <input type="number" class="rb-tempo" value="100" min="30" max="300">
            <span>BPM</span>
          </label>
        </div>
        <div class="rb-info">
          <span class="rb-duration">Duration: 0 beats</span>
          <span class="rb-measures">Measures: 0</span>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this._updateDisplay();
  }

  /**
   * Attach event listeners to UI elements
   */
  _attachEventListeners() {
    const builder = this.container.querySelector('.rhythm-builder');
    
    // Note buttons
    builder.querySelectorAll('[data-note]').forEach(btn => {
      btn.addEventListener('click', () => this._addNote(btn.dataset.note));
    });

    // Rest buttons
    builder.querySelectorAll('[data-rest]').forEach(btn => {
      btn.addEventListener('click', () => this._addRest(btn.dataset.rest));
    });

    // Modifier buttons
    builder.querySelectorAll('[data-mod]').forEach(btn => {
      btn.addEventListener('click', () => this._toggleModifier(btn.dataset.mod, btn));
    });

    // Action buttons
    builder.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this._handleAction(btn.dataset.action));
    });

    // Tempo input
    const tempoInput = builder.querySelector('.rb-tempo');
    tempoInput.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('tempoChange', { 
        detail: { tempo: parseInt(tempoInput.value, 10) } 
      }));
    });
  }

  /**
   * Add a note to the pattern
   */
  _addNote(noteType) {
    let duration = RhythmBuilder.DURATIONS[noteType];
    
    // Apply dot modifier
    if (this.pendingDot) {
      duration *= 1.5;
      this.pendingDot = false;
      this._updateModifierButton('dot', false);
    }
    
    const element = {
      type: 'note',
      baseType: noteType,
      duration: duration,
      dotted: duration !== RhythmBuilder.DURATIONS[noteType],
      tuplet: this.selectedTuplet,
      tied: this.pendingTie
    };
    
    // Apply tuplet modifier (adjusts duration)
    if (this.selectedTuplet) {
      // Triplet: 3 notes in space of 2
      // Quintuplet: 5 notes in space of 4
      if (this.selectedTuplet === 3) {
        element.duration = duration * (2/3);
      } else if (this.selectedTuplet === 5) {
        element.duration = duration * (4/5);
      }
    }
    
    // Reset tie after use
    if (this.pendingTie) {
      this.pendingTie = false;
      this._updateModifierButton('tie', false);
    }
    
    this.pattern.push(element);
    this._updateDisplay();
    this._emitUpdate();
  }

  /**
   * Add a rest to the pattern
   */
  _addRest(restType) {
    let duration = RhythmBuilder.REST_DURATIONS[restType];
    
    // Apply dot modifier
    if (this.pendingDot) {
      duration *= 1.5;
      this.pendingDot = false;
      this._updateModifierButton('dot', false);
    }
    
    const element = {
      type: 'rest',
      baseType: restType.replace('r', ''),
      duration: duration,
      dotted: duration !== RhythmBuilder.REST_DURATIONS[restType],
      tuplet: this.selectedTuplet
    };
    
    // Apply tuplet modifier
    if (this.selectedTuplet) {
      if (this.selectedTuplet === 3) {
        element.duration = duration * (2/3);
      } else if (this.selectedTuplet === 5) {
        element.duration = duration * (4/5);
      }
    }
    
    this.pattern.push(element);
    this._updateDisplay();
    this._emitUpdate();
  }

  /**
   * Toggle a modifier (dot, tie, tuplet)
   */
  _toggleModifier(mod, button) {
    switch (mod) {
      case 'dot':
        this.pendingDot = !this.pendingDot;
        this._updateModifierButton('dot', this.pendingDot);
        break;
      case 'tie':
        this.pendingTie = !this.pendingTie;
        this._updateModifierButton('tie', this.pendingTie);
        break;
      case 'triplet':
        this.selectedTuplet = this.selectedTuplet === 3 ? null : 3;
        this._updateModifierButton('triplet', this.selectedTuplet === 3);
        this._updateModifierButton('quintuplet', false);
        break;
      case 'quintuplet':
        this.selectedTuplet = this.selectedTuplet === 5 ? null : 5;
        this._updateModifierButton('quintuplet', this.selectedTuplet === 5);
        this._updateModifierButton('triplet', false);
        break;
    }
  }

  /**
   * Update modifier button active state
   */
  _updateModifierButton(mod, active) {
    const btn = this.container.querySelector(`[data-mod="${mod}"]`);
    if (btn) {
      btn.classList.toggle('active', active);
    }
  }

  /**
   * Handle action buttons
   */
  _handleAction(action) {
    switch (action) {
      case 'undo':
        this.pattern.pop();
        this._updateDisplay();
        this._emitUpdate();
        break;
      case 'clear':
        this.pattern = [];
        this._updateDisplay();
        this._emitUpdate();
        break;
      case 'barline':
        this.pattern.push({ type: 'barline' });
        this._updateDisplay();
        this._emitUpdate();
        break;
      case 'play':
        this.play();
        break;
      case 'stop':
        this.stop();
        break;
      case 'loop':
        this._toggleLoop();
        break;
    }
  }

  /**
   * Update the display
   */
  _updateDisplay() {
    this._updateTextDisplay();
    this._updateInfoDisplay();
    this._updateNotationDisplay();
  }

  /**
   * Update the text representation
   */
  _updateTextDisplay() {
    const textEl = this.container.querySelector('.rb-text');
    if (!textEl) return;
    
    const text = this.pattern.map(el => {
      if (el.type === 'barline') return '|';
      
      let symbol = el.baseType;
      if (el.type === 'rest') symbol += 'r';
      if (el.dotted) symbol += '.';
      if (el.tuplet === 3) symbol = `{3:${symbol}}`;
      if (el.tuplet === 5) symbol = `{5:${symbol}}`;
      if (el.tied) symbol = '~' + symbol;
      
      return symbol;
    }).join(' ');
    
    textEl.textContent = text || '(empty)';
  }

  /**
   * Update info display (duration, measures)
   */
  _updateInfoDisplay() {
    const durationEl = this.container.querySelector('.rb-duration');
    const measuresEl = this.container.querySelector('.rb-measures');
    
    const totalDuration = this.getTotalDuration();
    const beatsPerMeasure = this.timeSignature[0] * (4 / this.timeSignature[1]);
    const measures = totalDuration / beatsPerMeasure;
    
    if (durationEl) {
      durationEl.textContent = `Duration: ${totalDuration.toFixed(2)} beats`;
    }
    if (measuresEl) {
      measuresEl.textContent = `Measures: ${measures.toFixed(2)}`;
    }
  }

  /**
   * Update VexFlow notation display
   */
  _updateNotationDisplay() {
    const notationEl = this.container.querySelector('.rb-notation');
    if (!notationEl || !window.Vex) return;
    
    // Clear previous
    notationEl.innerHTML = '';
    
    if (this.pattern.length === 0) {
      notationEl.innerHTML = '<div class="rb-empty">Click notes above to build a rhythm</div>';
      return;
    }
    
    try {
      const VF = Vex.Flow;
      const renderer = new VF.Renderer(notationEl, VF.Renderer.Backends.SVG);
      
      // Calculate width based on pattern length
      const width = Math.max(400, this.pattern.length * 50 + 100);
      renderer.resize(width, 120);
      const context = renderer.getContext();
      
      const stave = new VF.Stave(10, 20, width - 20);
      stave.addClef('percussion');
      stave.addTimeSignature(`${this.timeSignature[0]}/${this.timeSignature[1]}`);
      stave.setContext(context).draw();
      
      // Convert pattern to VexFlow notes
      const notes = this._patternToVexNotes(VF);
      
      if (notes.length > 0) {
        const voice = new VF.Voice({ 
          num_beats: this.getTotalDuration(),
          beat_value: 4
        }).setStrict(false);
        
        voice.addTickables(notes);
        
        new VF.Formatter()
          .joinVoices([voice])
          .format([voice], width - 60);
        
        voice.draw(context, stave);
        
        // Draw tuplet brackets
        this._drawTupletBrackets(context, notes, VF);
      }
    } catch (err) {
      console.error('VexFlow rendering error:', err);
      notationEl.innerHTML = `<div class="rb-error">Notation error: ${err.message}</div>`;
    }
  }

  /**
   * Convert pattern to VexFlow notes
   */
  _patternToVexNotes(VF) {
    const notes = [];
    
    for (const el of this.pattern) {
      if (el.type === 'barline') {
        // Skip barlines for now (VexFlow handles measures differently)
        continue;
      }
      
      // Map duration to VexFlow duration string
      const vexDuration = this._durationToVex(el.baseType, el.dotted, el.type === 'rest');
      
      const note = new VF.StaveNote({
        keys: ['b/4'],
        duration: vexDuration
      });
      
      if (el.dotted) {
        note.addDot(0);
      }
      
      // Store tuplet info for later bracket drawing
      note._tuplet = el.tuplet;
      note._tied = el.tied;
      
      notes.push(note);
    }
    
    return notes;
  }

  /**
   * Convert base duration to VexFlow duration string
   */
  _durationToVex(baseType, dotted, isRest) {
    const map = {
      w: 'w',
      h: 'h',
      q: 'q',
      e: '8',
      s: '16',
      t: '32'
    };
    
    let dur = map[baseType] || 'q';
    if (isRest) dur += 'r';
    
    return dur;
  }

  /**
   * Draw tuplet brackets
   */
  _drawTupletBrackets(context, notes, VF) {
    let tupletNotes = [];
    let currentTuplet = null;
    
    for (const note of notes) {
      if (note._tuplet) {
        if (currentTuplet === note._tuplet) {
          tupletNotes.push(note);
        } else {
          // Finish previous tuplet
          if (tupletNotes.length >= 2) {
            this._createTuplet(tupletNotes, currentTuplet, context, VF);
          }
          // Start new tuplet
          currentTuplet = note._tuplet;
          tupletNotes = [note];
        }
      } else {
        // Finish current tuplet
        if (tupletNotes.length >= 2) {
          this._createTuplet(tupletNotes, currentTuplet, context, VF);
        }
        tupletNotes = [];
        currentTuplet = null;
      }
    }
    
    // Handle final tuplet
    if (tupletNotes.length >= 2) {
      this._createTuplet(tupletNotes, currentTuplet, context, VF);
    }
  }

  /**
   * Create and draw a tuplet bracket
   */
  _createTuplet(notes, tupletNum, context, VF) {
    const tuplet = new VF.Tuplet(notes, {
      num_notes: tupletNum,
      notes_occupied: tupletNum === 3 ? 2 : 4
    });
    tuplet.setContext(context).draw();
  }

  /**
   * Get total duration in beats
   */
  getTotalDuration() {
    return this.pattern.reduce((sum, el) => {
      if (el.type === 'barline') return sum;
      return sum + el.duration;
    }, 0);
  }

  /**
   * Get pattern as timing array (for playback)
   */
  getTimingArray() {
    const timings = [];
    let currentTime = 0;
    
    for (const el of this.pattern) {
      if (el.type === 'barline') continue;
      
      if (el.type === 'note' && !el.tied) {
        timings.push({
          time: currentTime,
          duration: el.duration,
          accent: el.baseType === 'q' || el.baseType === 'h' || el.baseType === 'w'
        });
      }
      
      currentTime += el.duration;
    }
    
    return timings;
  }

  /**
   * Get tempo from UI
   */
  getTempo() {
    const tempoInput = this.container.querySelector('.rb-tempo');
    return parseInt(tempoInput?.value || 100, 10);
  }

  /**
   * Set tempo in UI
   */
  setTempo(bpm) {
    const tempoInput = this.container.querySelector('.rb-tempo');
    if (tempoInput) {
      tempoInput.value = bpm;
    }
  }

  /**
   * Play the rhythm
   */
  play() {
    const playBtn = this.container.querySelector('[data-action="play"]');
    const stopBtn = this.container.querySelector('[data-action="stop"]');
    
    if (playBtn) playBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    
    this.dispatchEvent(new CustomEvent('play', {
      detail: {
        timings: this.getTimingArray(),
        tempo: this.getTempo(),
        totalDuration: this.getTotalDuration(),
        loop: this._isLooping
      }
    }));
  }

  /**
   * Stop playback
   */
  stop() {
    const playBtn = this.container.querySelector('[data-action="play"]');
    const stopBtn = this.container.querySelector('[data-action="stop"]');
    
    if (playBtn) playBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    
    this.dispatchEvent(new Event('stop'));
  }

  /**
   * Toggle loop mode
   */
  _toggleLoop() {
    this._isLooping = !this._isLooping;
    const loopBtn = this.container.querySelector('[data-action="loop"]');
    if (loopBtn) {
      loopBtn.classList.toggle('active', this._isLooping);
    }
  }

  /**
   * Emit update event
   */
  _emitUpdate() {
    this.dispatchEvent(new CustomEvent('update', {
      detail: {
        pattern: this.pattern,
        totalDuration: this.getTotalDuration(),
        timings: this.getTimingArray()
      }
    }));
    
    if (this.onUpdate) {
      this.onUpdate(this.pattern);
    }
  }

  /**
   * Set the time signature
   */
  setTimeSignature(numerator, denominator) {
    this.timeSignature = [numerator, denominator];
    this._updateDisplay();
  }

  /**
   * Load a pattern
   */
  loadPattern(pattern) {
    this.pattern = pattern;
    this._updateDisplay();
    this._emitUpdate();
  }

  /**
   * Get the current pattern
   */
  getPattern() {
    return [...this.pattern];
  }

  /**
   * Export pattern as JSON string
   */
  exportPattern() {
    return JSON.stringify({
      timeSignature: this.timeSignature,
      pattern: this.pattern
    });
  }

  /**
   * Import pattern from JSON string
   */
  importPattern(json) {
    try {
      const data = JSON.parse(json);
      if (data.timeSignature) {
        this.timeSignature = data.timeSignature;
      }
      if (data.pattern) {
        this.pattern = data.pattern;
      }
      this._updateDisplay();
      this._emitUpdate();
      return true;
    } catch (err) {
      console.error('Failed to import pattern:', err);
      return false;
    }
  }
}
