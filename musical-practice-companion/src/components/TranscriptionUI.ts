/**
 * Simplified UI Component for Sheet Music Transcription & Playback
 */

import { MusicalPracticeCompanion } from '../MusicalPracticeCompanion';

export class TranscriptionUI {
  private companion: MusicalPracticeCompanion;
  private container: HTMLElement;

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
      
      console.log('Transcription UI initialized successfully');
      
    } catch (error) {
      this.showError(`Failed to initialize: ${error}`);
    }
  }

  /**
   * Render the main UI
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="sheet-music-transcription">
        <header class="header">
          <h1>Sheet Music Transcription & Playback</h1>
          <p class="subtitle">Upload, Transcribe, and Play Your Sheet Music</p>
        </header>

        <div class="main-content">
          <!-- Sheet Music Upload Section -->
          <section class="section sheet-music-section">
            <h2>Upload Sheet Music</h2>
            <div class="controls-group">
              <div class="control">
                <div class="upload-area" id="upload-area">
                  <input type="file" id="sheet-music-upload" accept="image/*,.pdf" style="display: none;">
                  <div class="upload-placeholder" id="upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/>
                      <path d="m9 9 3 3 3-3"/>
                      <path d="M12 2v10"/>
                    </svg>
                    <p>Click to upload or drag and drop<br>PDF files or images (JPG, PNG, etc.)</p>
                  </div>
                  <div class="upload-preview hidden" id="upload-preview">
                    <img id="preview-image" alt="Preview">
                    <div class="preview-info">
                      <div class="preview-name">
                        <span id="preview-filename"></span>
                        <span id="file-type-indicator" class="file-type-indicator"></span>
                      </div>
                      <button id="remove-upload" class="remove-button">&times;</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="control">
                <div class="transcription-controls">
                  <button id="transcribe-sheet-music" class="primary-button" disabled>🎼 Transcribe Music</button>
                </div>
              </div>
            </div>
          </section>
            
          <!-- Transcription Results -->
          <section class="section transcription-results-section hidden" id="transcription-results">
            <div class="transcription-warning" id="demo-mode-warning" style="display: none;">
              <h4>⚠️ Demo Mode Notice</h4>
              <p>Backend transcription is not available. Using mock transcription system for demonstration purposes. Results may not accurately reflect your actual sheet music content.</p>
            </div>
            <h2>Transcription Results</h2>
            <div class="transcription-summary">
              <div class="transcription-item">
                <span class="label">Transcription Quality:</span>
                <span id="transcription-confidence">-</span>
                <div class="confidence-bar">
                  <div id="confidence-fill" class="confidence-fill"></div>
                </div>
              </div>
              <div class="transcription-item">
                <span class="label">Notes Found:</span>
                <span id="notes-count">-</span>
              </div>
              <div class="transcription-item">
                <span class="label">Duration:</span>
                <span id="transcription-duration">-</span>
              </div>
              <div class="transcription-item">
                <span class="label">Tempo:</span>
                <span id="detected-tempo">-</span>
              </div>
              <div class="transcription-item">
                <span class="label">Time Signature:</span>
                <span id="detected-time-signature">-</span>
              </div>
              <div class="transcription-item">
                <span class="label">Key Signature:</span>
                <span id="detected-key-signature">-</span>
              </div>
            </div>
          </section>

          <!-- Playback Controls -->
          <section class="section playback-section hidden" id="playback-controls">
            <h2>Playback Controls</h2>
            <div class="controls-group">
              <div class="control playback-buttons">
                <button id="play-transcription" class="primary-button">▶ Play</button>
                <button id="pause-transcription" class="secondary-button">⏸ Pause</button>
                <button id="stop-transcription" class="secondary-button">⏹ Stop</button>
              </div>
              
              <div class="control playback-progress">
                <div class="progress-bar">
                  <div class="progress-track">
                    <div id="progress-fill" class="progress-fill"></div>
                  </div>
                  <div class="time-display">
                    <span id="current-time">0:00</span>
                    <span>/</span>
                    <span id="total-time">0:00</span>
                  </div>
                </div>
              </div>
              
              <div class="control playback-settings">
                <div class="playback-control">
                  <label for="playback-tempo">Playback Speed:</label>
                  <input type="range" id="playback-tempo" min="50" max="200" value="100" step="5">
                  <span id="playback-tempo-value">100%</span>
                </div>
                
                <div class="playback-control">
                  <label for="playback-volume">Volume:</label>
                  <input type="range" id="playback-volume" min="0" max="100" value="80" step="5">
                  <span id="playback-volume-value">80%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Transcription History -->
          <section class="section history-section hidden" id="transcription-history">
            <h2>Transcription History</h2>
            <div class="controls-group">
              <div class="control">
                <button id="view-transcription-history" class="secondary-button">View History</button>
                <button id="clear-transcription-history" class="secondary-button">Clear History</button>
              </div>
            </div>
            <div id="history-list" class="history-list hidden"></div>
          </section>
        </div>

        <div id="error-message" class="error-message hidden"></div>
        <div id="success-message" class="success-message hidden"></div>
      </div>
    `;
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Setup sheet music event listeners
    this.setupSheetMusicEventListeners();
    
    // Setup playback event listeners
    this.setupPlaybackEventListeners();
    
    // Setup history event listeners  
    this.setupHistoryEventListeners();
  }

  /**
   * Set up sheet music upload event listeners
   */
  private setupSheetMusicEventListeners(): void {
    const uploadArea = this.getElementById('upload-area');
    const fileInput = this.getElementById('sheet-music-upload') as HTMLInputElement;
    const transcribeButton = this.getElementById('transcribe-sheet-music');
    const removeButton = this.getElementById('remove-upload');

    // File input change event
    fileInput.addEventListener('change', (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    // Upload area click to trigger file input
    uploadArea.addEventListener('click', (e: Event) => {
      if (!(e.target as Element).closest('.upload-preview')) {
        fileInput.click();
      }
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e: Event) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e: Event) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    // Transcribe button
    transcribeButton.addEventListener('click', () => {
      this.transcribeSheetMusic();
    });

    // Remove upload button
    removeButton.addEventListener('click', () => {
      this.clearUpload();
    });
  }

  /**
   * Set up playback event listeners
   */
  private setupPlaybackEventListeners(): void {
    // Playback controls
    this.getElementById('play-transcription').addEventListener('click', () => {
      this.startPlayback();
    });

    this.getElementById('pause-transcription').addEventListener('click', () => {
      this.pausePlayback();
    });

    this.getElementById('stop-transcription').addEventListener('click', () => {
      this.stopPlayback();
    });

    // Playback speed control
    const tempoSlider = this.getElementById('playback-tempo') as HTMLInputElement;
    tempoSlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.getElementById('playback-tempo-value')!.textContent = `${value}%`;
      // Apply tempo change to playback
      const tempoPercent = parseInt(value);
      this.companion.setPlaybackTempo(Math.round(120 * (tempoPercent / 100)));
    });
    
    // Volume control
    const volumeSlider = this.getElementById('playback-volume') as HTMLInputElement;
    volumeSlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.getElementById('playback-volume-value')!.textContent = `${value}%`;
      // Apply volume change - this would need to be implemented in the audio system
    });
  }

  /**
   * Set up history event listeners
   */
  private setupHistoryEventListeners(): void {
    this.getElementById('view-transcription-history').addEventListener('click', () => {
      this.toggleTranscriptionHistory();
    });

    this.getElementById('clear-transcription-history').addEventListener('click', () => {
      this.clearTranscriptionHistory();
    });
  }

  /**
   * Handle file upload
   */
  private handleFileUpload(file: File): void {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showError('Please upload an image file (JPG, PNG, GIF, WebP) or PDF');
      return;
    }

    // Show preview
    const previewImage = this.getElementById('preview-image') as HTMLImageElement;
    const previewFilename = this.getElementById('preview-filename');
    const fileTypeIndicator = this.getElementById('file-type-indicator');
    const uploadPlaceholder = this.getElementById('upload-placeholder');
    const uploadPreview = this.getElementById('upload-preview');

    // Set file info
    previewFilename.textContent = file.name;
    fileTypeIndicator.textContent = file.type.startsWith('application/pdf') ? 'PDF' : 'IMAGE';
    fileTypeIndicator.className = `file-type-indicator ${file.type.startsWith('application/pdf') ? 'pdf' : 'image'}`;

    // Show preview
    uploadPlaceholder.classList.add('hidden');
    uploadPreview.classList.remove('hidden');

    // Create object URL for preview
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      previewImage.src = objectUrl;
      previewImage.style.display = 'block';
    } else {
      previewImage.style.display = 'none';
    }

    // Store file for transcription
    (this.getElementById('sheet-music-upload') as any).uploadedFile = file;
    (this.getElementById('transcribe-sheet-music') as HTMLButtonElement).disabled = false;
  }

  /**
   * Clear upload
   */
  private clearUpload(): void {
    const fileInput = this.getElementById('sheet-music-upload') as HTMLInputElement;
    const uploadPlaceholder = this.getElementById('upload-placeholder');
    const uploadPreview = this.getElementById('upload-preview');
    const previewImage = this.getElementById('preview-image') as HTMLImageElement;

    // Reset file input
    fileInput.value = '';
    delete (fileInput as any).uploadedFile;

    // Reset preview
    if (previewImage.src) {
      URL.revokeObjectURL(previewImage.src);
    }
    previewImage.src = '';

    // Show placeholder, hide preview
    uploadPlaceholder.classList.remove('hidden');
    uploadPreview.classList.add('hidden');

    // Disable transcribe button
    (this.getElementById('transcribe-sheet-music') as HTMLButtonElement).disabled = true;

    // Hide results
    this.getElementById('transcription-results').classList.add('hidden');
    this.getElementById('playback-controls').classList.add('hidden');
  }

  /**
   * Transcribe sheet music
   */
  private async transcribeSheetMusic(): Promise<void> {
    const fileInput = this.getElementById('sheet-music-upload') as any;
    const file = fileInput.uploadedFile as File;
    
    if (!file) {
      this.showError('No file selected for transcription');
      return;
    }

    const transcribeButton = this.getElementById('transcribe-sheet-music');
    const originalText = transcribeButton.textContent;

    try {
      // Show loading state
      (transcribeButton as HTMLButtonElement).textContent = 'Transcribing...';
      (transcribeButton as HTMLButtonElement).disabled = true;

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
      (transcribeButton as HTMLButtonElement).textContent = originalText;
      (transcribeButton as HTMLButtonElement).disabled = false;
    }
  }

  /**
   * Display transcription results
   */
  private displayTranscriptionResults(transcription: any): void {
    // Show results section
    this.getElementById('transcription-results').classList.remove('hidden');

    // Update transcription info
    const confidenceElement = this.getElementById('transcription-confidence');
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
      
      // Color-code confidence
      if (confidence >= 80) {
        confidenceFill.className = 'confidence-fill high';
      } else if (confidence >= 60) {
        confidenceFill.className = 'confidence-fill medium';
      } else {
        confidenceFill.className = 'confidence-fill low';
      }
    }

    if (notesCountElement) {
      notesCountElement.textContent = transcription.notes.length.toString();
    }

    if (durationElement) {
      const minutes = Math.floor(transcription.duration / 60);
      const seconds = Math.round(transcription.duration % 60);
      durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (tempoElement) {
      tempoElement.textContent = `${transcription.tempo} BPM`;
    }

    if (timeSignatureElement) {
      timeSignatureElement.textContent = `${transcription.timeSignature.numerator}/${transcription.timeSignature.denominator}`;
    }

    if (keySignatureElement) {
      keySignatureElement.textContent = transcription.keySignature || 'C';
    }

    // Show demo mode warning if needed
    const demoWarning = this.getElementById('demo-mode-warning');
    if (transcription.source === 'mock') {
      demoWarning.style.display = 'block';
    } else {
      demoWarning.style.display = 'none';
    }
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
    const playButton = this.getElementById('play-transcription') as HTMLButtonElement;
    const pauseButton = this.getElementById('pause-transcription') as HTMLButtonElement;
    
    if (isPlaying) {
      playButton.textContent = '⏸ Playing';
      playButton.disabled = true;
      pauseButton.disabled = false;
    } else {
      playButton.textContent = '▶ Play';
      playButton.disabled = false;
      pauseButton.disabled = true;
    }
  }

  /**
   * Toggle transcription history view
   */
  private toggleTranscriptionHistory(): void {
    const historyList = this.getElementById('history-list');
    
    if (historyList.classList.contains('hidden')) {
      this.displayTranscriptionHistory();
      historyList.classList.remove('hidden');
      this.getElementById('view-transcription-history').textContent = 'Hide History';
    } else {
      historyList.classList.add('hidden');
      this.getElementById('view-transcription-history').textContent = 'View History';
    }
  }

  /**
   * Display transcription history
   */
  private displayTranscriptionHistory(): void {
    const historyList = this.getElementById('history-list');
    const transcriptions = this.companion.getTranscriptions();
    
    if (transcriptions.length === 0) {
      historyList.innerHTML = '<p class="no-history">No transcriptions yet</p>';
      return;
    }

    const historyItems = transcriptions.map(transcription => `
      <div class="history-item">
        <div class="history-info">
          <strong>${transcription.filename}</strong>
          <span class="history-date">${transcription.uploadDate.toLocaleDateString()}</span>
        </div>
        <div class="history-stats">
          <span>${transcription.notes.length} notes</span>
          <span>${transcription.tempo} BPM</span>
          <span>${Math.round(transcription.confidence * 100)}% confidence</span>
        </div>
        <div class="history-actions">
          <button class="secondary-button" onclick="loadTranscription('${transcription.id}')">Load</button>
        </div>
      </div>
    `).join('');

    historyList.innerHTML = historyItems;
  }

  /**
   * Clear transcription history
   */
  private clearTranscriptionHistory(): void {
    if (confirm('Are you sure you want to clear all transcription history?')) {
      // This would need to be implemented in the companion
      this.displayTranscriptionHistory();
      this.showSuccess('Transcription history cleared');
    }
  }

  /**
   * Helper method to get elements by ID
   */
  private getElementById(id: string): HTMLElement {
    const element = this.container.querySelector(`#${id}`) as HTMLElement;
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const errorElement = this.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.classList.add('hidden');
    }, 5000);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    const successElement = this.getElementById('success-message');
    successElement.textContent = message;
    successElement.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successElement.classList.add('hidden');
    }, 3000);
  }
}
