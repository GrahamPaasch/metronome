/**
 * SheetMusicAgent - Handles sheet music transcription and playback
 * Simplified to focus on note transcription and audio playback instead of harmonic analysis
 */

import { BaseAgent } from './BaseAgent';
import { AudioContextManager } from './AudioContextManager';
import * as pdfjsLib from 'pdfjs-dist';
import type { 
  SheetMusicTranscription, 
  TranscribedNote,
  TimeSignature
} from '../types';

export class SheetMusicAgent extends BaseAgent {
  private transcriptions: SheetMusicTranscription[] = [];
  private currentTranscription: SheetMusicTranscription | null = null;
  private playbackState: 'stopped' | 'playing' | 'paused' = 'stopped';
  private playbackPosition: number = 0; // current beat position
  private playbackInterval: number | null = null;
  private contextManager: AudioContextManager;
  private currentTempo: number = 120;
  private readonly backendUrl: string;

  constructor() {
    super();
    this.contextManager = AudioContextManager.getInstance();
    this.backendUrl = 'http://localhost:8000';
    this.initializePdfJs();
  }

  /**
   * Get the shared AudioContext
   */
  private get audioContext(): AudioContext | null {
    return this.contextManager.getContext();
  }

  private initializePdfJs(): void {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
    }
  }

  async initialize(): Promise<void> {
    try {
      this.setInitialized();
    } catch (error) {
      throw new Error(`Failed to initialize SheetMusicAgent: ${error}`);
    }
  }

  async start(): Promise<void> {
    this.requireInitialized();
    this.isActive = true;
  }

  async stop(): Promise<void> {
    this.stopPlayback();
    this.isActive = false;
  }

  /**
   * Transcribe uploaded sheet music into playable notes
   */
  async transcribeSheetMusic(file: File): Promise<SheetMusicTranscription> {
    console.log('Transcribing sheet music:', file.name, 'Type:', file.type);
    
    try {
      // Try backend transcription first
      const transcription = await this.transcribeWithBackend(file);
      
      // Store transcription
      this.transcriptions.push(transcription);
      this.currentTranscription = transcription;
      
      // Emit transcription complete event
      this.emit('transcriptionComplete', transcription);
      
      return transcription;
      
    } catch (error) {
      console.error('Backend transcription failed, using mock:', error);
      // Fallback to mock transcription
      return await this.createMockTranscription(file);
    }
  }

  /**
   * Transcribe using backend API
   */
  private async transcribeWithBackend(file: File): Promise<SheetMusicTranscription> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.backendUrl}/transcribe-sheet-music`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend transcription failed: ${response.status}`);
    }

    const backendResult = await response.json();
    
    // Convert backend result to our format
    const transcription: SheetMusicTranscription = {
      id: this.generateId(),
      filename: file.name,
      uploadDate: new Date(),
      timeSignature: this.parseTimeSignature(backendResult.time_signature),
      keySignature: backendResult.key_signature || 'C',
      tempo: backendResult.tempo_bpm || 120,
      notes: backendResult.notes.map((note: any) => ({
        pitch: note.pitch,
        startTime: note.start_time,
        duration: note.duration,
        measure: note.measure,
        velocity: note.velocity || 80
      })),
      measures: backendResult.measures || 0,
      confidence: backendResult.confidence_score || 0.8,
      duration: backendResult.duration || 60,
      source: 'backend'
    };
    
    return transcription;
  }

  /**
   * Create a mock transcription for testing
   */
  private async createMockTranscription(file: File): Promise<SheetMusicTranscription> {
    // Generate a simple melody for demonstration
    const notes: TranscribedNote[] = [
      { pitch: 'C4', startTime: 0, duration: 1, measure: 1, velocity: 80 },
      { pitch: 'D4', startTime: 1, duration: 1, measure: 1, velocity: 75 },
      { pitch: 'E4', startTime: 2, duration: 1, measure: 1, velocity: 80 },
      { pitch: 'F4', startTime: 3, duration: 1, measure: 1, velocity: 75 },
      { pitch: 'G4', startTime: 4, duration: 1, measure: 2, velocity: 80 },
      { pitch: 'A4', startTime: 5, duration: 1, measure: 2, velocity: 75 },
      { pitch: 'B4', startTime: 6, duration: 1, measure: 2, velocity: 80 },
      { pitch: 'C5', startTime: 7, duration: 1, measure: 2, velocity: 85 },
    ];

    const transcription: SheetMusicTranscription = {
      id: this.generateId(),
      filename: file.name,
      uploadDate: new Date(),
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: 'C',
      tempo: 120,
      notes,
      measures: 2,
      confidence: 0.6,
      duration: 8, // 8 beats
      source: 'mock'
    };

    this.transcriptions.push(transcription);
    this.currentTranscription = transcription;
    
    return transcription;
  }

  /**
   * Start playback of current transcription
   */
  startPlayback(): void {
    if (!this.currentTranscription) {
      console.warn('No transcription loaded for playback');
      return;
    }

    if (this.playbackState === 'playing') {
      return;
    }

    this.playbackState = 'playing';
    this.initializeAudioContext();
    this.schedulePlayback();
  }

  /**
   * Pause playback
   */
  pausePlayback(): void {
    this.playbackState = 'paused';
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  /**
   * Stop playback and reset position
   */
  stopPlayback(): void {
    this.playbackState = 'stopped';
    this.playbackPosition = 0;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  /**
   * Resume playback from current position
   */
  resumePlayback(): void {
    if (this.playbackState === 'paused') {
      this.startPlayback();
    }
  }

  /**
   * Set playback tempo
   */
  setTempo(bpm: number): void {
    this.currentTempo = bpm;
    if (this.playbackState === 'playing') {
      // Restart playback with new tempo
      this.pausePlayback();
      this.startPlayback();
    }
  }

  /**
   * Initialize Web Audio Context (uses shared manager)
   */
  private async initializeAudioContext(): Promise<void> {
    if (!this.contextManager.isReady) {
      await this.contextManager.initialize();
    }
  }

  /**
   * Schedule note playback
   */
  private schedulePlayback(): void {
    if (!this.currentTranscription || !this.audioContext) return;

    const beatDuration = 60 / this.currentTempo; // seconds per beat
    
    this.playbackInterval = window.setInterval(() => {
      if (this.playbackState !== 'playing') return;

      // Find notes that should play at current position
      const currentNotes = this.currentTranscription!.notes.filter(note => 
        Math.abs(note.startTime - this.playbackPosition) < 0.1
      );

      // Play each note
      currentNotes.forEach(note => {
        this.playNote(note);
      });

      // Advance position
      this.playbackPosition += 0.1; // Advance by 0.1 beats

      // Check if we've reached the end
      if (this.playbackPosition >= this.currentTranscription!.duration) {
        this.stopPlayback();
      }

    }, beatDuration * 100); // Check every 0.1 beats
  }

  /**
   * Play a single note using Web Audio API
   */
  private playNote(note: TranscribedNote): void {
    if (!this.audioContext) return;

    const frequency = this.noteToFrequency(note.pitch);
    const volume = note.velocity / 127;
    const duration = (60 / this.currentTempo) * note.duration; // Convert beats to seconds

    // Create oscillator for the note
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine'; // Clean tone for practice

    // Envelope for natural sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Convert note name to frequency
   */
  private noteToFrequency(noteName: string): number {
    const noteFrequencies: Record<string, number> = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
      'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
    };

    return noteFrequencies[noteName] || 440; // Default to A4
  }

  /**
   * Parse time signature string
   */
  private parseTimeSignature(timeSignatureStr: string): TimeSignature {
    try {
      const [numerator, denominator] = timeSignatureStr.split('/').map(Number);
      return { numerator, denominator };
    } catch {
      return { numerator: 4, denominator: 4 };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get all transcriptions
   */
  getTranscriptions(): SheetMusicTranscription[] {
    return this.transcriptions;
  }

  /**
   * Load a specific transcription for playback
   */
  loadTranscription(id: string): boolean {
    const transcription = this.transcriptions.find(t => t.id === id);
    if (transcription) {
      this.currentTranscription = transcription;
      this.stopPlayback();
      return true;
    }
    return false;
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): {
    state: 'stopped' | 'playing' | 'paused';
    position: number;
    transcription: SheetMusicTranscription | null;
  } {
    return {
      state: this.playbackState,
      position: this.playbackPosition,
      transcription: this.currentTranscription
    };
  }
}
