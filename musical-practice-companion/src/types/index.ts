/**
 * Core type definitions for the Musical Practice Companion
 */

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface TuningSystem {
  name: string;
  a4Frequency: number; // Reference frequency for A4
  description?: string;
}

export interface ChordProgression {
  measure: number;
  chord: string; // Using standard chord notation (e.g., "Cmaj7", "Am", "G7")
  duration?: number; // Fraction of measure (default: 1.0 = whole measure)
  voicing?: InstrumentVoicing;
}

export interface InstrumentVoicing {
  type: 'piano' | 'organ' | 'harmonium' | 'harp' | 'strings';
  register: 'low' | 'mid' | 'high';
  density: 'sparse' | 'medium' | 'full'; // How many notes in the chord
  style: 'block' | 'arpeggiated' | 'sustained';
}

export interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: number;
  isPlaying: boolean;
  currentMeasure: number;
  currentBeat: number;
  currentTick: number;
}

export interface AudioContext {
  context: AudioContext;
  masterGainNode: GainNode;
  tuningSystem: TuningSystem;
}

export interface PracticeSession {
  id: string;
  name: string;
  tempo: number;
  timeSignature: TimeSignature;
  tuningSystem: TuningSystem;
  chordProgression: ChordProgression[];
  droneNotes?: string[]; // Notes to sustain as drones
  created: Date;
  lastModified: Date;
}

// Event types for agent communication
export interface BeatEvent {
  type: 'beat' | 'subdivision' | 'measure' | 'polyrhythm';
  measure: number;
  beat: number;
  tick: number;
  polyBeat?: number; // For polyrhythm events
  timestamp: number;
  audioTime: number; // Web Audio API time
}

export interface HarmonyEvent {
  type: 'chord-change' | 'drone-start' | 'drone-stop';
  chord?: string;
  voicing?: InstrumentVoicing;
  notes?: string[];
  timestamp: number;
  audioTime: number;
}

// Agent configuration interfaces
export interface TempoAgentConfig {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: number;
  schedulingLookahead: number; // milliseconds
  polyrhythm: PolyrhythmConfig;
  tempoChanges: TempoChange[];
  practiceRamping: PracticeRamping;
}

export interface AudioAgentConfig {
  tuningSystem: TuningSystem;
  masterVolume: number;
  clickVolume: number;
  harmonyVolume: number;
  droneVolume: number;
}

export interface HarmonyAgentConfig {
  defaultVoicing: InstrumentVoicing;
  chordProgression: ChordProgression[];
  enableDrones: boolean;
  droneNotes: string[];
}

export interface PolyrhythmConfig {
  enabled: boolean;
  crossBeats: number; // Number of polyrhythm beats per measure
  soundType: string;
  volume: number;
}

export interface TempoChange {
  measure: number;
  type: 'sudden' | 'gradual';
  targetBPM: number;
  duration: number; // measures for gradual changes
  newTimeSignature?: TimeSignature;
}

export interface PracticeRamping {
  enabled: boolean;
  startBPM: number;
  targetBPM: number;
  incrementBPM: number;
  measureInterval: number; // how many measures between changes
  direction: 'up' | 'down';
}

// Predefined tuning systems
export const TUNING_SYSTEMS: Record<string, TuningSystem> = {
  A440: {
    name: 'Concert Pitch (A440)',
    a4Frequency: 440,
    description: 'Standard modern concert pitch'
  },
  A442: {
    name: 'High Pitch (A442)', 
    a4Frequency: 442,
    description: 'Common for baroque and period instruments'
  },
  A432: {
    name: 'Natural Pitch (A432)',
    a4Frequency: 432,
    description: 'Alternative tuning system'
  }
};

// Default configurations
export const DEFAULT_TIME_SIGNATURE: TimeSignature = { numerator: 4, denominator: 4 };
export const DEFAULT_BPM = 100;
export const DEFAULT_SUBDIVISION = 1;
export const DEFAULT_TUNING = TUNING_SYSTEMS.A440;

export interface Measure {
  number: number;
  timeSignature?: TimeSignature;
  chords: ChordProgression[];
}

export interface SheetMusicAnalysis {
  id: string;
  filename: string;
  uploadDate: Date;
  timeSignature?: TimeSignature;
  keySignature?: string;
  tempo?: number;
  chordProgression: ChordProgression[];
  measures: Measure[] | number; // Support both old and new format
  confidence: number; // 0-1 score for analysis confidence
  analysisNotes?: string[]; // Notes about the analysis process
  harmonicAnalysis?: any; // Detailed harmonic analysis from backend
  source?: 'backend' | 'mock'; // Track analysis source
}

// Sheet Music Transcription Types
export interface SheetMusicTranscription {
  id: string;
  filename: string;
  uploadDate: Date;
  notes: TranscribedNote[];
  timeSignature: TimeSignature;
  keySignature: string;
  tempo: number;
  measures: number;
  confidence: number;
  duration: number; // in seconds
  source: 'backend' | 'mock';
}

export interface TranscribedNote {
  pitch: string; // e.g., "C4", "F#5"
  startTime: number; // in beats from start
  duration: number; // in beats
  measure: number;
  velocity: number; // 0-127 (MIDI-style)
}

export interface SheetMusicConfig {
  defaultTempo: number;
  autoPlay: boolean;
  loop: boolean;
  volume: number;
}
