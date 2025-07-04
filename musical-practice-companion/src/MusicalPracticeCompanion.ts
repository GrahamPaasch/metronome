/**
 * MusicalPracticeCompanion - Main application coordinator
 */

import { TempoAgent } from './agents/TempoAgent';
import { AudioAgent } from './agents/AudioAgent';
import { HarmonyAgent } from './agents/HarmonyAgent';
import { SheetMusicAgent } from './agents/SheetMusicAgent';
import type { 
  PracticeSession, 
  TuningSystem, 
  ChordProgression, 
  InstrumentVoicing,
  BeatEvent,
  HarmonyEvent,
  SheetMusicTranscription
} from './types';
import { TUNING_SYSTEMS, DEFAULT_TUNING } from './types';

export class MusicalPracticeCompanion {
  private tempoAgent: TempoAgent;
  private audioAgent: AudioAgent;
  private harmonyAgent: HarmonyAgent;
  private sheetMusicAgent: SheetMusicAgent;
  private isInitialized = false;

  constructor() {
    // Initialize agents
    this.tempoAgent = new TempoAgent();
    this.audioAgent = new AudioAgent();
    this.harmonyAgent = new HarmonyAgent();
    this.sheetMusicAgent = new SheetMusicAgent();

    // Wire up agent communication
    this.setupAgentCommunication();
  }

  /**
   * Initialize the practice companion
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize all agents
      await this.tempoAgent.initialize();
      await this.audioAgent.initialize();
      await this.harmonyAgent.initialize();
      await this.sheetMusicAgent.initialize();

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Musical Practice Companion: ${error}`);
    }
  }

  /**
   * Start practice session
   */
  async startPractice(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Must call initialize() before starting practice');
    }

    await this.harmonyAgent.start();
    await this.audioAgent.start();
    await this.tempoAgent.start();
    await this.sheetMusicAgent.start();
  }

  /**
   * Stop practice session
   */
  async stopPractice(): Promise<void> {
    await this.tempoAgent.stop();
    await this.audioAgent.stop();
    await this.harmonyAgent.stop();
    await this.sheetMusicAgent.stop();
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm: number): void {
    this.tempoAgent.setBPM(bpm);
  }

  /**
   * Set time signature
   */
  setTimeSignature(numerator: number, denominator: number): void {
    this.tempoAgent.setTimeSignature({ numerator, denominator });
  }

  /**
   * Set subdivision
   */
  setSubdivision(subdivision: number): void {
    this.tempoAgent.setSubdivision(subdivision);
  }

  /**
   * Set tuning system
   */
  setTuningSystem(tuning: TuningSystem | string): void {
    const tuningSystem = typeof tuning === 'string' ? TUNING_SYSTEMS[tuning] : tuning;
    if (!tuningSystem) {
      throw new Error(`Invalid tuning system: ${tuning}`);
    }
    this.audioAgent.setTuningSystem(tuningSystem);
  }

  /**
   * Set chord progression
   */
  setChordProgression(progression: ChordProgression[]): void {
    this.harmonyAgent.setChordProgression(progression);
  }

  /**
   * Add a chord to the progression
   */
  addChord(measure: number, chord: string, voicing?: InstrumentVoicing): void {
    this.harmonyAgent.addChord({
      measure,
      chord,
      duration: 1.0,
      voicing
    });
  }

  /**
   * Remove a chord from the progression
   */
  removeChord(measure: number): void {
    this.harmonyAgent.removeChord(measure);
  }

  /**
   * Set default instrument voicing
   */
  setDefaultVoicing(voicing: InstrumentVoicing): void {
    this.harmonyAgent.setDefaultVoicing(voicing);
  }

  /**
   * Control drone notes
   */
  setDroneNotes(enabled: boolean, notes: string[] = []): void {
    this.harmonyAgent.setDroneSettings(enabled, notes);
  }

  /**
   * Start a specific drone note
   */
  startDrone(note: string, octave = 3): void {
    this.audioAgent.startDrone(note, octave);
  }

  /**
   * Start a drone at a specific frequency
   */
  startDroneFrequency(frequency: number): void {
    this.audioAgent.startDroneFrequency(frequency);
  }

  /**
   * Stop a specific drone note
   */
  stopDrone(note: string): void {
    this.audioAgent.stopDrone(note);
  }

  /**
   * Stop all active drones
   */
  stopAllDrones(): void {
    this.audioAgent.stopAllDrones();
  }

  /**
   * Add a tempo change at a specific measure
   */
  addTempoChange(measure: number, type: 'sudden' | 'gradual', targetBPM: number, duration?: number, newTimeSignature?: { numerator: number; denominator: number }): void {
    this.tempoAgent.addTempoChange({
      measure,
      type,
      targetBPM,
      duration: duration ?? 1,
      newTimeSignature: newTimeSignature
    });
  }

  /**
   * Remove tempo change at a specific measure
   */
  removeTempoChange(measure: number): void {
    this.tempoAgent.removeTempoChange(measure);
  }

  /**
   * Configure practice ramping (gradual tempo increase/decrease)
   */
  setPracticeRamping(enabled: boolean, startBPM?: number, targetBPM?: number, incrementBPM?: number, measureInterval?: number, direction?: 'up' | 'down'): void {
    this.tempoAgent.setPracticeRamping({
      enabled,
      startBPM: startBPM ?? 60,
      targetBPM: targetBPM ?? 120,
      incrementBPM: incrementBPM ?? 5,
      measureInterval: measureInterval ?? 8,
      direction: direction ?? 'up'
    });
  }

  /**
   * Start practice ramping from the beginning
   */
  startPracticeRamping(): void {
    this.tempoAgent.startPracticeRamping();
  }

  /**
   * Set polyrhythm configuration
   */
  setPolyrhythm(enabled: boolean, crossBeats?: number, soundType?: string, volume?: number): void {
    this.tempoAgent.setPolyrhythm({
      enabled,
      crossBeats: crossBeats ?? 3,
      soundType: soundType ?? 'click',
      volume: volume ?? 0.7
    });
    
    if (soundType && volume !== undefined) {
      this.audioAgent.setPolyrhythmSettings(soundType, volume);
    }
  }

  /**
   * Set metronome sound types
   */
  setSoundTypes(clickSound: string, accentSound: string): void {
    this.audioAgent.setSoundTypes(clickSound, accentSound);
  }

  /**
   * Set volume levels
   */
  setVolumes(volumes: {
    master?: number;
    click?: number; 
    harmony?: number;
    drone?: number;
  }): void {
    this.audioAgent.setVolumes({
      masterVolume: volumes.master,
      clickVolume: volumes.click,
      harmonyVolume: volumes.harmony,
      droneVolume: volumes.drone
    });
  }

  /**
   * Generate a basic chord progression
   */
  generateBasicProgression(key: string, measures: number): ChordProgression[] {
    return this.harmonyAgent.generateBasicProgression(key, measures);
  }

  /**
   * Get current practice state
   */
  getCurrentState() {
    return {
      tempo: this.tempoAgent.getCurrentState(),
      chordProgression: this.harmonyAgent.getChordProgression(),
      currentMeasure: this.harmonyAgent.getCurrentMeasure()
    };
  }

  /**
   * Load a practice session
   */
  loadSession(session: PracticeSession): void {
    this.setTempo(session.tempo);
    this.setTimeSignature(session.timeSignature.numerator, session.timeSignature.denominator);
    this.setTuningSystem(session.tuningSystem);
    this.setChordProgression(session.chordProgression);
    
    if (session.droneNotes && session.droneNotes.length > 0) {
      this.setDroneNotes(true, session.droneNotes);
    }
  }

  /**
   * Create a practice session from current state
   */
  createSession(name: string): PracticeSession {
    const state = this.getCurrentState();
    
    return {
      id: crypto.randomUUID(),
      name,
      tempo: state.tempo.bpm,
      timeSignature: state.tempo.timeSignature,
      tuningSystem: DEFAULT_TUNING, // Could be enhanced to track current tuning
      chordProgression: state.chordProgression,
      created: new Date(),
      lastModified: new Date()
    };
  }

  /**
   * Get available tuning systems
   */
  getAvailableTuningSystems(): Record<string, TuningSystem> {
    return TUNING_SYSTEMS;
  }

  /**
   * Analyze a chord symbol
   */
  analyzeChord(chordSymbol: string) {
    return this.harmonyAgent.analyzeChord(chordSymbol);
  }

  /**
   * Export current progression as text
   */
  exportProgression(): string {
    return this.harmonyAgent.exportProgression();
  }

  /**
   * Process uploaded sheet music for transcription
   */
  async processSheetMusic(file: File): Promise<SheetMusicTranscription> {
    if (!this.isInitialized) {
      throw new Error('Must call initialize() before processing sheet music');
    }
    
    return await this.sheetMusicAgent.transcribeSheetMusic(file);
  }

  /**
   * Start playback of current transcription
   */
  startMusicPlayback(): void {
    this.sheetMusicAgent.startPlayback();
  }

  /**
   * Pause music playback
   */
  pauseMusicPlayback(): void {
    this.sheetMusicAgent.pausePlayback();
  }

  /**
   * Stop music playback
   */
  stopMusicPlayback(): void {
    this.sheetMusicAgent.stopPlayback();
  }

  /**
   * Resume music playback
   */
  resumeMusicPlayback(): void {
    this.sheetMusicAgent.resumePlayback();
  }

  /**
   * Set music playback tempo
   */
  setMusicTempo(bpm: number): void {
    this.sheetMusicAgent.setTempo(bpm);
  }

  /**
   * Set playback tempo (alias for setMusicTempo for UI compatibility)
   */
  setPlaybackTempo(bpm: number): void {
    this.setMusicTempo(bpm);
  }

  /**
   * Get current playback state
   */
  getMusicPlaybackState(): {
    state: 'stopped' | 'playing' | 'paused';
    position: number;
    transcription: SheetMusicTranscription | null;
  } {
    return this.sheetMusicAgent.getPlaybackState();
  }

  /**
   * Get all transcriptions
   */
  getTranscriptions(): SheetMusicTranscription[] {
    return this.sheetMusicAgent.getTranscriptions();
  }

  /**
   * Load a specific transcription for playback
   */
  loadTranscription(id: string): boolean {
    return this.sheetMusicAgent.loadTranscription(id);
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.stopPractice();
    await this.tempoAgent.destroy();
    await this.audioAgent.destroy();
    await this.harmonyAgent.destroy();
    await this.sheetMusicAgent.destroy();
  }

  /**
   * Wire up communication between agents
   */
  private setupAgentCommunication(): void {
    // TempoAgent → AudioAgent: Beat events for click sounds
    this.tempoAgent.on<BeatEvent>('beat', (event) => {
      console.log('Coordinator: Routing beat event to AudioAgent:', event.type, event.measure, event.beat);
      this.audioAgent.handleBeatEvent(event);
    });

    // TempoAgent → HarmonyAgent: Beat events for chord changes
    this.tempoAgent.on<BeatEvent>('beat', (event) => {
      this.harmonyAgent.handleBeatEvent(event);
    });

    // HarmonyAgent → AudioAgent: Harmony events for chord playback
    this.harmonyAgent.on<HarmonyEvent>('harmony', (event) => {
      console.log('Coordinator: Routing harmony event to AudioAgent:', event.type, event.chord);
      switch (event.type) {
        case 'chord-change':
          if (event.chord && event.voicing) {
            this.audioAgent.playChord(event.chord, event.voicing, event.audioTime);
          }
          break;
        case 'drone-start':
          if (event.notes) {
            event.notes.forEach(note => this.audioAgent.startDrone(note));
          }
          break;
        case 'drone-stop':
          this.audioAgent.stopAllDrones();
          break;
      }
    });

    // SheetMusicAgent → AudioAgent: Note playback events  
    this.sheetMusicAgent.on('notePlay', (event: any) => {
      console.log('Playing note:', event.note.pitch);
      // Use the new public method to play musical notes
      this.audioAgent.playMusicalNote(event.note.pitch, event.note.duration, event.note.velocity);
    });

    // SheetMusicAgent → Application: Transcription complete events
    this.sheetMusicAgent.on('transcriptionComplete', (transcription: any) => {
      console.log('Sheet music transcription completed:', transcription.filename);
    });
  }
}
