/**
 * TempoAgent - Handles precise timing and metronome functionality
 */

import { BaseAgent } from './BaseAgent';
import type { 
  TempoAgentConfig, 
  BeatEvent, 
  TimeSignature,
  PolyrhythmConfig,
  TempoChange,
  PracticeRamping
} from '../types';
import { 
  DEFAULT_BPM, 
  DEFAULT_TIME_SIGNATURE, 
  DEFAULT_SUBDIVISION 
} from '../types';

export class TempoAgent extends BaseAgent {
  private config: TempoAgentConfig;
  private audioContext: AudioContext | null = null;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private currentMeasure = 1;
  private currentBeat = 0;
  private currentTick = 0;
  private lastScheduleTime = 0;

  // Polyrhythm tracking
  private nextPolyNoteTime = 0;
  private currentPolyBeat = 0;

  // Scheduling constants
  private readonly SCHEDULE_INTERVAL = 25; // milliseconds

  constructor(config: Partial<TempoAgentConfig> = {}) {
    super();
    this.config = {
      bpm: config.bpm ?? DEFAULT_BPM,
      timeSignature: config.timeSignature ?? DEFAULT_TIME_SIGNATURE,
      subdivision: config.subdivision ?? DEFAULT_SUBDIVISION,
      schedulingLookahead: config.schedulingLookahead ?? 100,
      polyrhythm: config.polyrhythm ?? {
        enabled: false,
        crossBeats: 3,
        soundType: 'click',
        volume: 0.7
      },
      tempoChanges: config.tempoChanges ?? [],
      practiceRamping: config.practiceRamping ?? {
        enabled: false,
        startBPM: 60,
        targetBPM: 120,
        incrementBPM: 5,
        measureInterval: 8,
        direction: 'up'
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      // Don't create AudioContext here - defer until user interaction
      this.setInitialized();
    } catch (error) {
      throw new Error(`Failed to initialize TempoAgent: ${error}`);
    }
  }

  /**
   * Initialize AudioContext with user interaction
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      throw new Error(`Failed to initialize AudioContext: ${error}`);
    }
  }

  async start(): Promise<void> {
    this.requireInitialized();
    
    if (this.isActive) {
      return; // Already running
    }

    // Initialize AudioContext on first start (requires user interaction)
    await this.initializeAudioContext();

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Reset timing
    this.nextNoteTime = this.audioContext.currentTime;
    this.nextPolyNoteTime = this.audioContext.currentTime;
    this.currentMeasure = 1;
    this.currentBeat = 0;
    this.currentTick = 0;
    this.currentPolyBeat = 0;
    this.lastScheduleTime = performance.now();

    this.isActive = true;
    this.scheduleNotes();
  }

  async stop(): Promise<void> {
    this.isActive = false;
    
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  /**
   * Update tempo without stopping
   */
  setBPM(bpm: number): void {
    if (bpm < 30 || bpm > 300) {
      throw new Error('BPM must be between 30 and 300');
    }
    this.config.bpm = bpm;
  }

  /**
   * Update time signature
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this.config.timeSignature = timeSignature;
    // Reset beat position to avoid issues
    this.currentBeat = 0;
    this.currentTick = 0;
  }

  /**
   * Update subdivision
   */
  setSubdivision(subdivision: number): void {
    if (subdivision < 1 || subdivision > 8) {
      throw new Error('Subdivision must be between 1 and 8');
    }
    this.config.subdivision = subdivision;
  }

  /**
   * Update polyrhythm settings
   */
  setPolyrhythm(polyrhythm: Partial<PolyrhythmConfig>): void {
    this.config.polyrhythm = { ...this.config.polyrhythm, ...polyrhythm };
    
    // Reset polyrhythm timing if it was enabled
    if (this.audioContext && this.isActive) {
      this.nextPolyNoteTime = this.audioContext.currentTime;
      this.currentPolyBeat = 0;
    }
  }

  /**
   * Add a tempo change at a specific measure
   */
  addTempoChange(change: TempoChange): void {
    // Remove any existing change at the same measure
    this.config.tempoChanges = this.config.tempoChanges.filter(c => c.measure !== change.measure);
    
    // Add the new change and sort by measure
    this.config.tempoChanges.push(change);
    this.config.tempoChanges.sort((a, b) => a.measure - b.measure);
  }

  /**
   * Remove tempo change at a specific measure
   */
  removeTempoChange(measure: number): void {
    this.config.tempoChanges = this.config.tempoChanges.filter(c => c.measure !== measure);
  }

  /**
   * Set practice ramping configuration
   */
  setPracticeRamping(ramping: Partial<PracticeRamping>): void {
    this.config.practiceRamping = { ...this.config.practiceRamping, ...ramping };
  }

  /**
   * Start practice ramping from the beginning
   */
  startPracticeRamping(): void {
    if (!this.config.practiceRamping.enabled) return;
    
    // Set BPM to start tempo
    this.config.bpm = this.config.practiceRamping.startBPM;
    console.log(`Starting practice ramping from ${this.config.practiceRamping.startBPM} BPM`);
  }

  /**
   * Get current configuration
   */
  getConfig(): TempoAgentConfig {
    return { ...this.config };
  }

  /**
   * Get current playback state
   */
  getCurrentState() {
    return {
      measure: this.currentMeasure,
      beat: this.currentBeat + 1, // 1-indexed for display
      tick: this.currentTick,
      bpm: this.config.bpm,
      timeSignature: this.config.timeSignature,
      subdivision: this.config.subdivision,
      polyrhythm: this.config.polyrhythm,
      isPlaying: this.isActive
    };
  }

  /**
   * Main scheduling loop
   */
  private scheduleNotes(): void {
    if (!this.isActive || !this.audioContext) {
      return;
    }

    const currentTime = this.audioContext.currentTime;
    const currentScheduleTime = performance.now();

    // Schedule all notes that need to be played in the next lookahead window
    while (this.nextNoteTime < currentTime + (this.config.schedulingLookahead / 1000)) {
      this.scheduleNote(this.nextNoteTime);
      this.advanceNote();
    }

    // Schedule polyrhythm beats if enabled
    if (this.config.polyrhythm.enabled) {
      while (this.nextPolyNoteTime < currentTime + (this.config.schedulingLookahead / 1000)) {
        this.schedulePolyrhythmNote(this.nextPolyNoteTime);
        this.advancePolyrhythmNote();
      }
    }

    // Implement adaptive scheduling to maintain precision
    const schedulingDrift = currentScheduleTime - this.lastScheduleTime;
    const nextInterval = Math.max(1, this.SCHEDULE_INTERVAL - (schedulingDrift - this.SCHEDULE_INTERVAL));
    
    this.lastScheduleTime = currentScheduleTime;
    this.schedulerId = window.setTimeout(() => this.scheduleNotes(), nextInterval);
  }

  /**
   * Schedule a single note/beat event
   */
  private scheduleNote(time: number): void {
    const isMainBeat = this.currentTick === 0;
    const isMeasureStart = this.currentBeat === 0 && this.currentTick === 0;
    
    // Check for tempo changes at measure start
    if (isMeasureStart) {
      this.checkTempoChanges();
    }
    
    const eventType = isMeasureStart ? 'measure' : isMainBeat ? 'beat' : 'subdivision';
    
    const beatEvent: BeatEvent = {
      type: eventType,
      measure: this.currentMeasure,
      beat: this.currentBeat + 1, // 1-indexed
      tick: this.currentTick,
      timestamp: performance.now(),
      audioTime: time
    };

    // Emit the event
    this.emit('beat', beatEvent);
  }

  /**
   * Schedule a polyrhythm beat event
   */
  private schedulePolyrhythmNote(time: number): void {
    const beatEvent: BeatEvent = {
      type: 'polyrhythm',
      measure: this.currentMeasure,
      beat: this.currentBeat + 1,
      tick: this.currentTick,
      polyBeat: this.currentPolyBeat + 1, // 1-indexed
      timestamp: performance.now(),
      audioTime: time
    };

    // Emit the polyrhythm event
    this.emit('beat', beatEvent);
  }

  /**
   * Check and apply tempo changes and practice ramping
   */
  private checkTempoChanges(): void {
    // Check for scheduled tempo changes
    const currentMeasure = this.currentMeasure;
    const applicableChange = this.config.tempoChanges.find(change => change.measure === currentMeasure);
    
    if (applicableChange) {
      this.applyTempoChange(applicableChange);
    }
    
    // Check for practice ramping
    if (this.config.practiceRamping.enabled) {
      this.checkPracticeRamping();
    }
  }

  /**
   * Apply a tempo change
   */
  private applyTempoChange(change: TempoChange): void {
    if (change.type === 'sudden') {
      console.log(`Sudden tempo change to ${change.targetBPM} BPM at measure ${change.measure}`);
      this.config.bpm = change.targetBPM;
      
      if (change.newTimeSignature) {
        this.setTimeSignature(change.newTimeSignature);
      }
    } else if (change.type === 'gradual') {
      // For gradual changes, we'll implement a smooth transition over the specified duration
      this.startGradualTempoChange(change);
    }
  }

  /**
   * Start a gradual tempo change
   */
  private startGradualTempoChange(change: TempoChange): void {
    const startBPM = this.config.bpm;
    const targetBPM = change.targetBPM;
    const durationMeasures = change.duration;
    
    console.log(`Starting gradual tempo change from ${startBPM} to ${targetBPM} BPM over ${durationMeasures} measures`);
    
    // Calculate BPM increment per measure
    const bpmIncrement = (targetBPM - startBPM) / durationMeasures;
    
    // Store gradual change info for processing in beat events
    (this as any).gradualChange = {
      startMeasure: change.measure,
      endMeasure: change.measure + durationMeasures,
      startBPM,
      targetBPM,
      bpmIncrement
    };
  }

  /**
   * Check and apply practice ramping
   */
  private checkPracticeRamping(): void {
    const ramping = this.config.practiceRamping;
    
    // Check if we should increment/decrement tempo
    const measuresElapsed = this.currentMeasure - 1; // 0-indexed for calculation
    
    if (measuresElapsed > 0 && measuresElapsed % ramping.measureInterval === 0) {
      const currentBPM = this.config.bpm;
      let newBPM = currentBPM;
      
      if (ramping.direction === 'up' && currentBPM < ramping.targetBPM) {
        newBPM = Math.min(currentBPM + ramping.incrementBPM, ramping.targetBPM);
      } else if (ramping.direction === 'down' && currentBPM > ramping.targetBPM) {
        newBPM = Math.max(currentBPM - ramping.incrementBPM, ramping.targetBPM);
      }
      
      if (newBPM !== currentBPM) {
        console.log(`Practice ramping: ${currentBPM} → ${newBPM} BPM at measure ${this.currentMeasure}`);
        this.config.bpm = newBPM;
      }
    }
  }

  /**
   * Advance to the next note position
   */
  private advanceNote(): void {
    // Calculate note length based on BPM and subdivision
    const secondsPerBeat = 60.0 / this.config.bpm;
    const secondsPerSubdivision = secondsPerBeat / this.config.subdivision;
    
    this.nextNoteTime += secondsPerSubdivision;
    
    // Advance position counters
    this.currentTick++;
    
    if (this.currentTick >= this.config.subdivision) {
      this.currentTick = 0;
      this.currentBeat++;
      
      if (this.currentBeat >= this.config.timeSignature.numerator) {
        this.currentBeat = 0;
        this.currentMeasure++;
      }
    }
  }

  /**
   * Advance to the next polyrhythm note position
   */
  private advancePolyrhythmNote(): void {
    // Calculate polyrhythm timing: crossBeats evenly distributed across one measure
    const secondsPerBeat = 60.0 / this.config.bpm;
    const secondsPerMeasure = secondsPerBeat * this.config.timeSignature.numerator;
    const secondsPerPolyBeat = secondsPerMeasure / this.config.polyrhythm.crossBeats;
    
    this.nextPolyNoteTime += secondsPerPolyBeat;
    this.currentPolyBeat++;
    
    // Reset polyrhythm counter at the end of each measure
    if (this.currentPolyBeat >= this.config.polyrhythm.crossBeats) {
      this.currentPolyBeat = 0;
    }
  }

  /**
   * Calculate the frequency for a given note and octave
   */
  static noteToFrequency(note: string, octave: number, a4Frequency = 440): number {
    const noteMap: Record<string, number> = {
      'C': -9, 'C#': -8, 'Db': -8,
      'D': -7, 'D#': -6, 'Eb': -6,
      'E': -5,
      'F': -4, 'F#': -3, 'Gb': -3,
      'G': -2, 'G#': -1, 'Ab': -1,
      'A': 0, 'A#': 1, 'Bb': 1,
      'B': 2
    };
    
    const noteOffset = noteMap[note];
    if (noteOffset === undefined) {
      throw new Error(`Invalid note: ${note}`);
    }
    
    const a4Offset = (octave - 4) * 12 + noteOffset;
    return a4Frequency * Math.pow(2, a4Offset / 12);
  }
}
