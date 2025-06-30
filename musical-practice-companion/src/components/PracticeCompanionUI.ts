/**
 * PracticeCompanionUI - Full-featured metronome with sheet music transcription
 */

import { MusicalPracticeCompanion } from '../MusicalPracticeCompanion';

export class PracticeCompanionUI {
  private companion: MusicalPracticeCompanion;
  private container: HTMLElement;
  private tapTimes: number[] = [];
  private lastTapTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.companion = new MusicalPracticeCompanion();
  }

  /**
   * Initialize the UI and companion
   */
  async init(): Promise<void> {
    try {
      // First render the UI
      this.render();
      
      // Then initialize the companion
      await this.companion.initialize();
      
      // Now set up event listeners since DOM elements exist
      this.setupEventListeners();
      
      console.log('Practice Companion UI initialized successfully');
      
    } catch (error) {
      this.showError(`Failed to initialize: ${error}`);
    }
  }

  /**
   * Render the main UI
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="practice-companion">
        <header class="header">
          <h1>🎵 Musical Practice Companion</h1>
          <p class="subtitle">Professional metronome with harmonic accompaniment and sheet music transcription</p>
        </header>

        <div class="main-content">
          <!-- Core Metronome Section -->
          <section class="section metronome-section">
            <h2>Metronome</h2>
            
            <div class="metronome-controls">
              <div class="transport-controls">
                <button id="play-pause" class="primary-button">▶ Start Practice</button>
                <button id="stop" class="secondary-button">⏹ Stop</button>
                <button id="tap-tempo" class="secondary-button">👆 Tap Tempo</button>
              </div>
              
              <div class="tempo-controls">
                <div class="control-group">
                  <label for="bpm">Tempo (BPM):</label>
                  <input type="number" id="bpm" min="30" max="300" value="120">
                  <input type="range" id="bpm-slider" min="30" max="300" value="120" class="slider">
                </div>
              </div>
              
              <div class="time-signature-controls">
                <div class="control-group">
                  <label for="time-sig-numerator">Time Signature:</label>
                  <select id="time-sig-numerator">
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4" selected>4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="9">9</option>
                    <option value="12">12</option>
                  </select>
                  <span>/</span>
                  <select id="time-sig-denominator">
                    <option value="2">2</option>
                    <option value="4" selected>4</option>
                    <option value="8">8</option>
                    <option value="16">16</option>
                  </select>
                </div>
                
                <div class="control-group">
                  <label for="subdivision">Subdivision:</label>
                  <select id="subdivision">
                    <option value="1" selected>Quarter notes</option>
                    <option value="2">Eighth notes</option>
                    <option value="3">Triplets</option>
                    <option value="4">Sixteenth notes</option>
                  </select>
                </div>
              </div>
              
              <div class="beat-indicator">
                <div class="beat-lights">
                  <div class="beat-light" id="beat-light-1"></div>
                  <div class="beat-light" id="beat-light-2"></div>
                  <div class="beat-light" id="beat-light-3"></div>
                  <div class="beat-light" id="beat-light-4"></div>
                  <div class="beat-light" id="beat-light-5"></div>
                  <div class="beat-light" id="beat-light-6"></div>
                  <div class="beat-light" id="beat-light-7"></div>
                  <div class="beat-light" id="beat-light-8"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Sound Settings Section -->
          <section class="section sound-section">
            <h2>Sound Settings</h2>
            
            <div class="sound-controls">
              <div class="control-group">
                <label for="click-sound">Click Sound:</label>
                <select id="click-sound">
                  <option value="click" selected>Click</option>
                  <option value="tick">Tick</option>
                  <option value="bell">Bell</option>
                  <option value="wood">Wood Block</option>
                  <option value="beep">Beep</option>
                </select>
              </div>
              
              <div class="control-group">
                <label for="accent-sound">Accent Sound:</label>
                <select id="accent-sound">
                  <option value="bell" selected>Bell</option>
                  <option value="click">Click</option>
                  <option value="tick">Tick</option>
                  <option value="wood">Wood Block</option>
                  <option value="beep">Beep</option>
                </select>
              </div>
              
              <div class="volume-controls">
                <div class="control-group">
                  <label for="master-volume">Master Volume:</label>
                  <input type="range" id="master-volume" min="0" max="100" value="80" class="slider">
                  <span id="master-volume-display">80%</span>
                </div>
                
                <div class="control-group">
                  <label for="click-volume">Click Volume:</label>
                  <input type="range" id="click-volume" min="0" max="100" value="70" class="slider">
                  <span id="click-volume-display">70%</span>
                </div>
                
                <div class="control-group">
                  <label for="harmony-volume">Harmony Volume:</label>
                  <input type="range" id="harmony-volume" min="0" max="100" value="60" class="slider">
                  <span id="harmony-volume-display">60%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Tuning Section -->
          <section class="section tuning-section">
            <h2>Tuning System</h2>
            
            <div class="tuning-controls">
              <div class="control-group">
                <label for="tuning-system">Reference Tuning:</label>
                <select id="tuning-system">
                  <option value="A440" selected>A440 (Concert Pitch)</option>
                  <option value="A442">A442 (Baroque/Harmonium)</option>
                  <option value="A432">A432 (Natural Tuning)</option>
                </select>
              </div>
              
              <div class="drone-controls">
                <h3>Drone Notes</h3>
                <div class="control-group">
                  <input type="checkbox" id="drone-enabled">
                  <label for="drone-enabled">Enable Drone</label>
                </div>
                
                <div class="drone-notes" id="drone-notes">
                  <label>Notes:</label>
                  <div class="note-buttons">
                    <button class="note-button" data-note="A">A</button>
                    <button class="note-button" data-note="B">B</button>
                    <button class="note-button" data-note="C">C</button>
                    <button class="note-button" data-note="D">D</button>
                    <button class="note-button" data-note="E">E</button>
                    <button class="note-button" data-note="F">F</button>
                    <button class="note-button" data-note="G">G</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Harmony Section -->
          <section class="section harmony-section">
            <h2>Harmonic Accompaniment</h2>
            
            <div class="harmony-controls">
              <div class="voicing-controls">
                <div class="control-group">
                  <label for="voicing-instrument">Instrument:</label>
                  <select id="voicing-instrument">
                    <option value="piano" selected>Piano</option>
                    <option value="organ">Organ</option>
                    <option value="harmonium">Harmonium</option>
                    <option value="harp">Harp</option>
                    <option value="strings">Strings</option>
                  </select>
                </div>
                
                <div class="control-group">
                  <label for="voicing-register">Register:</label>
                  <select id="voicing-register">
                    <option value="low">Low</option>
                    <option value="mid" selected>Mid</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div class="control-group">
                  <label for="voicing-density">Density:</label>
                  <select id="voicing-density">
                    <option value="sparse">Sparse</option>
                    <option value="medium" selected>Medium</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>
              
              <div class="chord-progression">
                <h3>Chord Progression</h3>
                <div class="chord-input">
                  <div class="control-group">
                    <label for="chord-measure">Measure:</label>
                    <input type="number" id="chord-measure" min="1" value="1">
                  </div>
                  <div class="control-group">
                    <label for="chord-symbol">Chord:</label>
                    <input type="text" id="chord-symbol" placeholder="C, Am, F, G7..." autocomplete="off">
                  </div>
                  <button id="add-chord" class="primary-button">Add Chord</button>
                </div>
                
                <div class="progression-display" id="progression-display">
                  <p class="empty-state">No chord progression set. Add chords above to create harmonic accompaniment.</p>
                </div>
                
                <div class="progression-actions">
                  <button id="generate-progression" class="secondary-button">Generate Basic Progression</button>
                  <button id="clear-progression" class="secondary-button">Clear All</button>
                  <button id="export-progression" class="secondary-button">Export</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Sheet Music Transcription Section -->
          <section class="section sheet-music-section">
            <h2>Sheet Music Transcription</h2>
            <p class="section-description">Upload sheet music for transcription and playback (separate from metronome)</p>
            
            <div class="upload-area" id="upload-area">
              <div class="upload-placeholder" id="upload-placeholder">
                <div class="upload-icon">📄</div>
                <p>Click to upload or drag and drop</p>
                <p class="upload-hint">PDF files or images (JPG, PNG, etc.)</p>
              </div>
              
              <div class="upload-preview hidden" id="upload-preview">
                <div class="preview-content">
                  <img id="preview-image" alt="Uploaded sheet music" />
                  <div class="preview-info">
                    <p id="preview-filename"></p>
                    <button id="clear-upload" class="secondary-button small">✕ Clear</button>
                  </div>
                </div>
              </div>
              
              <input type="file" id="sheet-music-upload" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp" hidden>
            </div>
            
            <div class="transcription-controls">
              <div class="control-group">
                <input type="checkbox" id="auto-apply-tempo" checked>
                <label for="auto-apply-tempo">Auto-detect tempo and time signature</label>
              </div>
              
              <button id="transcribe-music" class="primary-button" disabled>
                🎼 Transcribe Music
              </button>
            </div>
            
            <div class="demo-notice">
              <h4>⚠️ Demo Mode Notice</h4>
              <p>Backend transcription is not available. Using mock transcription system for demonstration purposes. Results may not accurately reflect your actual sheet music content.</p>
            </div>
            
            <div class="transcription-results hidden" id="transcription-results">
              <h3>Transcription Results</h3>
              <div class="results-content">
                <div class="confidence-score">
                  <label>Confidence:</label>
                  <div class="confidence-bar">
                    <div class="confidence-fill" id="confidence-fill"></div>
                  </div>
                  <span id="confidence-percent"></span>
                </div>
                
                <div class="detected-info">
                  <div class="info-item">
                    <label>Notes Count:</label>
                    <span id="notes-count">0</span>
                  </div>
                  
                  <div class="info-item">
                    <label>Duration:</label>
                    <span id="transcription-duration">0 seconds</span>
                  </div>
                  
                  <div class="info-item">
                    <label>Tempo:</label>
                    <span id="detected-tempo">120 BPM</span>
                  </div>
                  
                  <div class="info-item">
                    <label>Time Signature:</label>
                    <span id="detected-time-signature">4/4</span>
                  </div>
                  
                  <div class="info-item">
                    <label>Key:</label>
                    <span id="detected-key-signature">C major</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Playback Controls (initially hidden) -->
          <section class="section playback-section hidden" id="playback-controls">
            <h2>Transcription Playback</h2>
            <div class="controls-group">
              <div class="control playback-buttons">
                <button id="play-transcription" class="primary-button">▶ Play</button>
                <button id="pause-transcription" class="secondary-button">⏸ Pause</button>
                <button id="stop-transcription" class="secondary-button">⏹ Stop</button>
              </div>
              
              <div class="control">
                <label for="playback-tempo">Playback Tempo:</label>
                <input type="range" id="playback-tempo" min="60" max="200" value="120" class="slider">
                <span id="playback-tempo-display">120 BPM</span>
              </div>
            </div>
          </section>

          <!-- Transcription History -->
          <section class="section history-section hidden" id="transcription-history">
            <h2>Transcription History</h2>
            <div class="history-controls">
              <button id="clear-history" class="secondary-button">Clear History</button>
            </div>
            <div class="history-list" id="history-list">
              <p class="empty-state">No transcriptions yet.</p>
            </div>
          </section>

          <!-- Practice Status -->
          <section class="section status-section">
            <h2>Practice Status</h2>
            <div class="status-display">
              <div class="status-item">
                <label>Current Measure:</label>
                <span id="current-measure">1</span>
              </div>
              
              <div class="status-item">
                <label>Current Beat:</label>
                <span id="current-beat">1</span>
              </div>
              
              <div class="status-item">
                <label>Current Chord:</label>
                <span id="current-chord">-</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Success/Error Messages -->
        <div id="message-area" class="message-area"></div>
      </div>
    `;
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    // Transport controls
    this.getElementById('play-pause').addEventListener('click', () => this.togglePractice());
    this.getElementById('stop').addEventListener('click', () => this.stopPractice());
    this.getElementById('tap-tempo').addEventListener('click', () => this.handleTapTempo());

    // Tempo controls
    this.getElementById('bpm').addEventListener('input', (e: Event) => {
      const bpm = parseInt((e.target as HTMLInputElement).value);
      (this.getElementById('bpm-slider') as HTMLInputElement).value = bpm.toString();
      this.companion.setTempo(bpm);
    });

    (this.getElementById('bpm-slider') as HTMLInputElement).addEventListener('input', (e: Event) => {
      const bpm = parseInt((e.target as HTMLInputElement).value);
      (this.getElementById('bpm') as HTMLInputElement).value = bpm.toString();
      this.companion.setTempo(bpm);
    });

    // Time signature controls
    this.getElementById('time-sig-numerator').addEventListener('change', () => this.updateTimeSignature());
    this.getElementById('time-sig-denominator').addEventListener('change', () => this.updateTimeSignature());
    this.getElementById('subdivision').addEventListener('change', (e: Event) => {
      this.companion.setSubdivision(parseInt((e.target as HTMLSelectElement).value));
    });

    // Sound controls
    this.getElementById('click-sound').addEventListener('change', () => this.updateSoundSettings());
    this.getElementById('accent-sound').addEventListener('change', () => this.updateSoundSettings());
    
    // Volume controls
    this.getElementById('master-volume').addEventListener('input', () => this.updateVolumeSettings());
    this.getElementById('click-volume').addEventListener('input', () => this.updateVolumeSettings());
    this.getElementById('harmony-volume').addEventListener('input', () => this.updateVolumeSettings());

    // Tuning controls
    this.getElementById('tuning-system').addEventListener('change', (e: Event) => {
      this.companion.setTuningSystem((e.target as HTMLSelectElement).value);
    });

    // Drone controls
    this.getElementById('drone-enabled').addEventListener('change', () => this.updateDroneSettings());
    document.querySelectorAll('.note-button').forEach(button => {
      button.addEventListener('click', () => {
        // Toggle the note button state
        button.classList.toggle('active');
        this.updateDroneSettings();
      });
    });

    // Voicing controls
    this.getElementById('voicing-instrument').addEventListener('change', () => this.updateDefaultVoicing());
    this.getElementById('voicing-register').addEventListener('change', () => this.updateDefaultVoicing());
    this.getElementById('voicing-density').addEventListener('change', () => this.updateDefaultVoicing());

    // Chord progression controls
    this.getElementById('add-chord').addEventListener('click', () => this.addChord());
    this.getElementById('generate-progression').addEventListener('click', () => this.generateProgression());
    this.getElementById('clear-progression').addEventListener('click', () => this.clearProgression());
    this.getElementById('export-progression').addEventListener('click', () => this.exportProgression());

    // Sheet music upload
    this.setupSheetMusicEventListeners();

    // Status updates (with error handling)
    try {
      (this.companion as any).tempoAgent.on('beat', () => this.updateStatusDisplay());
    } catch (error) {
      console.warn('Could not set up beat event listener:', error);
    }
  }

  /**
   * Set up sheet music upload event listeners
   */
  private setupSheetMusicEventListeners(): void {
    const uploadArea = this.getElementById('upload-area');
    const fileInput = this.getElementById('sheet-music-upload') as HTMLInputElement;
    const clearButton = this.getElementById('clear-upload');
    const transcribeButton = this.getElementById('transcribe-music');

    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileUpload(file);
      }
    });

    // Clear upload
    clearButton.addEventListener('click', () => this.clearUpload());

    // Transcribe music
    transcribeButton.addEventListener('click', () => this.handleTranscription());

    // Playback controls
    this.setupPlaybackEventListeners();

    // History controls
    this.getElementById('clear-history').addEventListener('click', () => this.clearTranscriptionHistory());
  }

  /**
   * Set up playback event listeners
   */
  private setupPlaybackEventListeners(): void {
    this.getElementById('play-transcription').addEventListener('click', () => this.startPlayback());
    this.getElementById('pause-transcription').addEventListener('click', () => this.pausePlayback());
    this.getElementById('stop-transcription').addEventListener('click', () => this.stopPlayback());
    
    this.getElementById('playback-tempo').addEventListener('input', (e: Event) => {
      const tempo = parseInt((e.target as HTMLInputElement).value);
      this.getElementById('playback-tempo-display').textContent = `${tempo} BPM`;
      this.companion.setPlaybackTempo(tempo);
    });
  }

  /**
   * Handle file upload
   */
  private handleFileUpload(file: File): void {
    console.log('File uploaded:', file.name);
    
    const placeholder = this.getElementById('upload-placeholder');
    const preview = this.getElementById('upload-preview');
    const previewImage = this.getElementById('preview-image') as HTMLImageElement;
    const previewFilename = this.getElementById('preview-filename');
    const transcribeButton = this.getElementById('transcribe-music') as HTMLButtonElement;

    // Show preview
    placeholder.classList.add('hidden');
    preview.classList.remove('hidden');
    
    // Set filename
    previewFilename.textContent = file.name;
    
    // Show image preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target?.result as string;
        previewImage.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      previewImage.classList.add('hidden');
    }
    
    // Enable transcribe button
    transcribeButton.disabled = false;
  }

  /**
   * Clear upload
   */
  private clearUpload(): void {
    const placeholder = this.getElementById('upload-placeholder');
    const preview = this.getElementById('upload-preview');
    const fileInput = this.getElementById('sheet-music-upload') as HTMLInputElement;
    const transcribeButton = this.getElementById('transcribe-music') as HTMLButtonElement;
    const results = this.getElementById('transcription-results');
    const playbackControls = this.getElementById('playback-controls');

    // Reset upload area
    preview.classList.add('hidden');
    placeholder.classList.remove('hidden');
    fileInput.value = '';
    transcribeButton.disabled = true;
    
    // Hide results and playback controls
    results.classList.add('hidden');
    playbackControls.classList.add('hidden');
  }

  /**
   * Handle transcription
   */
  private async handleTranscription(): Promise<void> {
    const fileInput = this.getElementById('sheet-music-upload') as HTMLInputElement;
    const transcribeButton = this.getElementById('transcribe-music') as HTMLButtonElement;
    const file = fileInput.files?.[0];
    
    if (!file) return;

    const originalText = transcribeButton.textContent;
    
    try {
      // Update button state
      transcribeButton.textContent = '🎼 Transcribing...';
      transcribeButton.disabled = true;

      // Process the sheet music for transcription
      const transcription = await this.companion.processSheetMusic(file);
      
      // Display results
      this.displayTranscriptionResults(transcription);
      
      // Only show playback controls if transcription succeeded
      this.showPlaybackControls();
      this.showSuccess('Sheet music transcribed successfully');

    } catch (error) {
      console.error('Sheet music transcription failed:', error);
      this.showError(`Transcription failed: ${error}`);
    } finally {
      // Reset button state
      transcribeButton.textContent = originalText;
      transcribeButton.disabled = false;
    }
  }

  /**
   * Display transcription results
   */
  private displayTranscriptionResults(transcription: any): void {
    const resultsSection = this.getElementById('transcription-results');
    const confidenceElement = this.getElementById('confidence-percent');
    const confidenceFill = this.getElementById('confidence-fill');
    const notesCountElement = this.getElementById('notes-count');
    const durationElement = this.getElementById('transcription-duration');
    const tempoElement = this.getElementById('detected-tempo');
    const timeSignatureElement = this.getElementById('detected-time-signature');
    const keySignatureElement = this.getElementById('detected-key-signature');

    if (confidenceElement && confidenceFill) {
      const confidence = Math.round(transcription.confidence * 100);
      confidenceElement.textContent = `${confidence}%`;
      confidenceFill.style.width = `${confidence}%`;
      
      // Color code confidence
      if (confidence >= 80) {
        confidenceFill.className = 'confidence-fill high';
      } else if (confidence >= 60) {
        confidenceFill.className = 'confidence-fill medium';
      } else {
        confidenceFill.className = 'confidence-fill low';
      }
    }

    if (notesCountElement) {
      notesCountElement.textContent = transcription.notes?.length?.toString() || '0';
    }

    if (durationElement) {
      const duration = transcription.estimatedDuration || 0;
      durationElement.textContent = `${duration} seconds`;
    }

    if (tempoElement) {
      tempoElement.textContent = `${transcription.detectedTempo || 120} BPM`;
    }

    if (timeSignatureElement) {
      timeSignatureElement.textContent = transcription.detectedTimeSignature || '4/4';
    }

    if (keySignatureElement) {
      keySignatureElement.textContent = transcription.detectedKey || 'C major';
    }

    // Show results
    resultsSection.classList.remove('hidden');

    // Add to history
    this.addToTranscriptionHistory(transcription);
  }

  /**
   * Show playback controls
   */
  private showPlaybackControls(): void {
    this.getElementById('playback-controls').classList.remove('hidden');
    this.getElementById('transcription-history').classList.remove('hidden');
  }

  /**
   * Start playback
   */
  private startPlayback(): void {
    this.companion.startMusicPlayback();
    this.updatePlaybackButtonStates(true);
  }

  /**
   * Pause playback
   */
  private pausePlayback(): void {
    this.companion.pauseMusicPlayback();
    this.updatePlaybackButtonStates(false);
  }

  /**
   * Stop playback
   */
  private stopPlayback(): void {
    this.companion.stopMusicPlayback();
    this.updatePlaybackButtonStates(false);
  }

  /**
   * Update playback button states
   */
  private updatePlaybackButtonStates(isPlaying: boolean): void {
    const playButton = this.getElementById('play-transcription');
    const pauseButton = this.getElementById('pause-transcription');
    
    if (isPlaying) {
      playButton.textContent = '⏸ Playing...';
      pauseButton.textContent = '⏸ Pause';
    } else {
      playButton.textContent = '▶ Play';
      pauseButton.textContent = '⏸ Pause';
    }
  }

  /**
   * Add to transcription history
   */
  private addToTranscriptionHistory(transcription: any): void {
    const historyList = this.getElementById('history-list');
    const emptyState = historyList.querySelector('.empty-state');
    
    if (emptyState) {
      emptyState.remove();
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-info">
        <strong>${transcription.filename}</strong>
        <span class="history-meta">${new Date().toLocaleTimeString()} • ${Math.round(transcription.confidence * 100)}% confidence</span>
      </div>
      <div class="history-actions">
        <button class="secondary-button small" onclick="this.closest('.history-item').remove()">Remove</button>
      </div>
    `;

    historyList.insertBefore(historyItem, historyList.firstChild);
  }

  /**
   * Clear transcription history
   */
  private clearTranscriptionHistory(): void {
    const historyList = this.getElementById('history-list');
    historyList.innerHTML = '<p class="empty-state">No transcriptions yet.</p>';
  }

  // Metronome methods (keeping all original functionality)
  private async togglePractice(): Promise<void> {
    const button = this.getElementById('play-pause');
    
    try {
      if (button.textContent?.includes('Start')) {
        await this.companion.startPractice();
        button.textContent = '⏸ Pause Practice';
      } else {
        await this.companion.stopPractice();
        button.textContent = '▶ Start Practice';
      }
    } catch (error) {
      this.showError(`Error toggling practice: ${error}`);
    }
  }

  private async stopPractice(): Promise<void> {
    try {
      await this.companion.stopPractice();
      this.getElementById('play-pause').textContent = '▶ Start Practice';
    } catch (error) {
      this.showError(`Error stopping practice: ${error}`);
    }
  }

  private updateTimeSignature(): void {
    const numerator = parseInt((this.getElementById('time-sig-numerator') as HTMLSelectElement).value);
    const denominator = parseInt((this.getElementById('time-sig-denominator') as HTMLSelectElement).value);
    this.companion.setTimeSignature(numerator, denominator);
  }

  private updateSoundSettings(): void {
    const clickSound = (this.getElementById('click-sound') as HTMLSelectElement).value;
    const accentSound = (this.getElementById('accent-sound') as HTMLSelectElement).value;
    this.companion.setSoundTypes(clickSound, accentSound);
  }

  private updateVolumeSettings(): void {
    const masterVolume = parseInt((this.getElementById('master-volume') as HTMLInputElement).value);
    const clickVolume = parseInt((this.getElementById('click-volume') as HTMLInputElement).value);
    const harmonyVolume = parseInt((this.getElementById('harmony-volume') as HTMLInputElement).value);

    this.getElementById('master-volume-display').textContent = `${masterVolume}%`;
    this.getElementById('click-volume-display').textContent = `${clickVolume}%`;
    this.getElementById('harmony-volume-display').textContent = `${harmonyVolume}%`;

    this.companion.setVolumes({
      master: masterVolume / 100,
      click: clickVolume / 100,
      harmony: harmonyVolume / 100
    });
  }

  private updateDroneSettings(): void {
    const enabled = (this.getElementById('drone-enabled') as HTMLInputElement).checked;
    const activeNotes = Array.from(document.querySelectorAll('.note-button.active'))
      .map(btn => btn.textContent!);
    
    this.companion.setDroneNotes(enabled, activeNotes);
  }

  private updateDefaultVoicing(): void {
    const instrument = (this.getElementById('voicing-instrument') as HTMLSelectElement).value;
    const register = (this.getElementById('voicing-register') as HTMLSelectElement).value;
    const density = (this.getElementById('voicing-density') as HTMLSelectElement).value;

    this.companion.setDefaultVoicing({
      type: instrument as any,
      register: register as any,
      density: density as any,
      style: 'block'
    });
  }

  private addChord(): void {
    const measure = parseInt((this.getElementById('chord-measure') as HTMLInputElement).value);
    const chord = (this.getElementById('chord-symbol') as HTMLInputElement).value.trim();
    
    if (chord) {
      this.companion.addChord(measure, chord);
      this.updateProgressionDisplay();
      
      // Clear inputs and advance measure
      (this.getElementById('chord-symbol') as HTMLInputElement).value = '';
      (this.getElementById('chord-measure') as HTMLInputElement).value = (measure + 1).toString();
    }
  }

  private generateProgression(): void {
    const progression = this.companion.generateBasicProgression('C', 8);
    this.companion.setChordProgression(progression);
    this.updateProgressionDisplay();
  }

  private clearProgression(): void {
    this.companion.setChordProgression([]);
    this.updateProgressionDisplay();
  }

  private exportProgression(): void {
    const exported = this.companion.exportProgression();
    console.log('Exported progression:', exported);
    this.showSuccess('Progression exported to console');
  }

  private updateProgressionDisplay(): void {
    const display = this.getElementById('progression-display');
    const state = this.companion.getCurrentState();
    const progression = state.chordProgression;

    if (progression.length === 0) {
      display.innerHTML = '<p class="empty-state">No chord progression set. Add chords above to create harmonic accompaniment.</p>';
      return;
    }

    const progressionHtml = progression
      .sort((a: any, b: any) => a.measure - b.measure)
      .map((chord: any) => `
        <div class="chord-item">
          <span class="chord-measure">m.${chord.measure}</span>
          <span class="chord-symbol">${chord.chord}</span>
          <button class="remove-chord" data-measure="${chord.measure}">×</button>
        </div>
      `).join('');

    display.innerHTML = progressionHtml;

    // Add event listeners for remove buttons
    display.querySelectorAll('.remove-chord').forEach((btn: Element) => {
      btn.addEventListener('click', (e: Event) => {
        const measure = parseInt((e.target as HTMLElement).dataset.measure!);
        this.companion.removeChord(measure);
        this.updateProgressionDisplay();
      });
    });
  }

  private handleTapTempo(): void {
    const now = performance.now();
    
    // Reset if too much time has passed since last tap
    if (now - this.lastTapTime > 3000) {
      this.tapTimes = [];
    }
    
    this.tapTimes.push(now);
    this.lastTapTime = now;
    
    // Need at least 2 taps to calculate tempo
    if (this.tapTimes.length >= 2) {
      // Calculate average time between taps
      const intervals: number[] = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round(60000 / avgInterval); // Convert ms to BPM
      
      // Clamp to reasonable range
      const clampedBpm = Math.max(30, Math.min(300, bpm));
      
      // Update UI and companion
      (this.getElementById('bpm') as HTMLInputElement).value = clampedBpm.toString();
      (this.getElementById('bpm-slider') as HTMLInputElement).value = clampedBpm.toString();
      this.companion.setTempo(clampedBpm);
      
      console.log(`Tap tempo: ${clampedBpm} BPM (from ${this.tapTimes.length} taps)`);
    }
    
    // Keep only last 8 taps for calculation
    if (this.tapTimes.length > 8) {
      this.tapTimes = this.tapTimes.slice(-8);
    }
  }

  private updateStatusDisplay(): void {
    try {
      const state = this.companion.getCurrentState();
      this.getElementById('current-measure').textContent = state.tempo.measure?.toString() || '1';
      this.getElementById('current-beat').textContent = state.tempo.beat?.toString() || '1';
      
      // Find current chord
      const chordProgression = state.chordProgression;
      let currentChord = null;
      
      if (chordProgression.length > 0) {
        const currentMeasure = state.tempo.measure || 1;
        const sortedProgression = [...chordProgression].sort((a: any, b: any) => a.measure - b.measure);
        
        for (const chord of sortedProgression) {
          if (chord.measure <= currentMeasure) {
            currentChord = chord;
          } else {
            break;
          }
        }
      }
      
      this.getElementById('current-chord').textContent = currentChord?.chord || '-';
    } catch (error) {
      // Silently handle errors to avoid breaking the UI
      console.warn('Error updating status display:', error);
    }
  }

  /**
   * Utility methods
   */
  private getElementById(id: string): any {
    const element = this.container.querySelector(`#${id}`);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  private showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  private showError(message: string): void {
    this.showMessage(message, 'error');
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    const messageArea = this.getElementById('message-area');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    messageArea.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }
}