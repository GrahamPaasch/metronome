/**
 * HarmonyAgent - Manages chord progressions, harmonic analysis, and accompaniment
 */

import { BaseAgent } from './BaseAgent';
import type { 
  HarmonyAgentConfig, 
  ChordProgression, 
  InstrumentVoicing, 
  BeatEvent, 
  HarmonyEvent 
} from '../types';

export class HarmonyAgent extends BaseAgent {
  private config: HarmonyAgentConfig;
  private currentMeasure = 1;
  private activeProgression: ChordProgression[] = [];

  constructor(config: Partial<HarmonyAgentConfig> = {}) {
    super();
    this.config = {
      defaultVoicing: config.defaultVoicing ?? {
        type: 'piano',
        register: 'mid',
        density: 'medium',
        style: 'block'
      },
      chordProgression: config.chordProgression ?? [],
      enableDrones: config.enableDrones ?? false,
      droneNotes: config.droneNotes ?? []
    };
    this.activeProgression = [...this.config.chordProgression];
  }

  async initialize(): Promise<void> {
    this.setInitialized();
  }

  async start(): Promise<void> {
    this.requireInitialized();
    this.isActive = true;
    this.currentMeasure = 1;

    // Start drones if enabled
    if (this.config.enableDrones && this.config.droneNotes.length > 0) {
      this.config.droneNotes.forEach(note => {
        this.emit('harmony', {
          type: 'drone-start',
          notes: [note],
          timestamp: performance.now(),
          audioTime: 0
        } as HarmonyEvent);
      });
    }
  }

  async stop(): Promise<void> {
    this.isActive = false;

    // Stop all drones
    if (this.config.enableDrones) {
      this.emit('harmony', {
        type: 'drone-stop',
        timestamp: performance.now(),
        audioTime: 0
      } as HarmonyEvent);
    }
  }

  /**
   * Handle beat events from TempoAgent
   */
  handleBeatEvent(event: BeatEvent): void {
    if (!this.isActive) return;

    // Update current measure
    this.currentMeasure = event.measure;

    // Only process chord changes on measure boundaries
    if (event.type === 'measure') {
      this.processChordChange(event);
    }
  }

  /**
   * Get current measure
   */
  getCurrentMeasure(): number {
    return this.currentMeasure;
  }

  /**
   * Set the chord progression
   */
  setChordProgression(progression: ChordProgression[]): void {
    this.activeProgression = [...progression];
    this.config.chordProgression = [...progression];
  }

  /**
   * Add a chord to the progression
   */
  addChord(chord: ChordProgression): void {
    // Insert chord in the correct position based on measure number
    const insertIndex = this.activeProgression.findIndex(c => c.measure > chord.measure);
    if (insertIndex === -1) {
      this.activeProgression.push(chord);
    } else {
      this.activeProgression.splice(insertIndex, 0, chord);
    }
    this.config.chordProgression = [...this.activeProgression];
  }

  /**
   * Remove a chord from the progression
   */
  removeChord(measure: number): void {
    this.activeProgression = this.activeProgression.filter(c => c.measure !== measure);
    this.config.chordProgression = [...this.activeProgression];
  }

  /**
   * Update default voicing
   */
  setDefaultVoicing(voicing: InstrumentVoicing): void {
    this.config.defaultVoicing = voicing;
  }

  /**
   * Enable/disable drone notes
   */
  setDroneSettings(enabled: boolean, notes: string[] = []): void {
    const wasEnabled = this.config.enableDrones;
    this.config.enableDrones = enabled;
    this.config.droneNotes = notes;

    if (this.isActive) {
      if (!wasEnabled && enabled && notes.length > 0) {
        // Start drones
        notes.forEach(note => {
          this.emit('harmony', {
            type: 'drone-start',
            notes: [note],
            timestamp: performance.now(),
            audioTime: 0
          } as HarmonyEvent);
        });
      } else if (wasEnabled && !enabled) {
        // Stop drones
        this.emit('harmony', {
          type: 'drone-stop',
          timestamp: performance.now(),
          audioTime: 0
        } as HarmonyEvent);
      }
    }
  }

  /**
   * Get the chord for a specific measure (with looping support)
   */
  getChordForMeasure(measure: number): ChordProgression | null {
    if (this.activeProgression.length === 0) {
      return null;
    }

    // Sort progression by measure number to ensure correct order
    const sortedProgression = [...this.activeProgression].sort((a, b) => a.measure - b.measure);
    
    // Calculate the progression length (from first to last measure)
    const firstMeasure = sortedProgression[0].measure;
    const lastMeasure = sortedProgression[sortedProgression.length - 1].measure;
    const progressionLength = lastMeasure - firstMeasure + 1;
    
    // Calculate the effective measure within the progression loop
    const effectiveMeasure = ((measure - firstMeasure) % progressionLength) + firstMeasure;
    
    console.log(`HarmonyAgent: Measure ${measure} -> Effective measure ${effectiveMeasure} (loop length: ${progressionLength})`);
    
    // Find the most recent chord at or before the effective measure
    let currentChord: ChordProgression | null = null;
    
    for (const chord of sortedProgression) {
      if (chord.measure <= effectiveMeasure) {
        currentChord = chord;
      } else {
        break;
      }
    }
    
    return currentChord;
  }

  /**
   * Get the full chord progression
   */
  getChordProgression(): ChordProgression[] {
    return [...this.activeProgression];
  }

  /**
   * Generate a simple chord progression for a given key
   */
  generateBasicProgression(key: string, measures: number): ChordProgression[] {
    // Basic progressions in major and minor keys
    const majorProgressions: Record<string, string[]> = {
      'I-V-vi-IV': ['maj', '5', 'm', 'maj'],
      'vi-IV-I-V': ['m', 'maj', 'maj', '5'],
      'I-vi-IV-V': ['maj', 'm', 'maj', '5']
    };

    const progression: ChordProgression[] = [];
    const chordTypes = majorProgressions['I-V-vi-IV']; // Default progression
    
    // Generate Roman numeral to chord mapping based on key
    const chordMap = this.generateChordMap(key);
    
    for (let measure = 1; measure <= measures; measure++) {
      const chordIndex = (measure - 1) % chordTypes.length;
      const chordSymbol = chordMap[chordIndex];
      
      progression.push({
        measure,
        chord: chordSymbol,
        duration: 1.0,
        voicing: this.config.defaultVoicing
      });
    }
    
    return progression;
  }

  /**
   * Analyze a chord symbol and provide educational information
   */
  analyzeChord(chordSymbol: string): {
    root: string;
    quality: string;
    extensions: string[];
    description: string;
  } {
    // Basic chord analysis - can be expanded with more sophisticated parsing
    const root = chordSymbol.charAt(0);
    let quality = 'major';
    const extensions: string[] = [];
    let description = '';

    if (chordSymbol.includes('m') && !chordSymbol.includes('maj')) {
      quality = 'minor';
    } else if (chordSymbol.includes('dim')) {
      quality = 'diminished';
    } else if (chordSymbol.includes('aug')) {
      quality = 'augmented';
    }

    if (chordSymbol.includes('7')) {
      extensions.push('7th');
    }
    if (chordSymbol.includes('9')) {
      extensions.push('9th');
    }
    if (chordSymbol.includes('11')) {
      extensions.push('11th');
    }
    if (chordSymbol.includes('13')) {
      extensions.push('13th');
    }

    description = `${root} ${quality}`;
    if (extensions.length > 0) {
      description += ` with ${extensions.join(', ')}`;
    }

    return { root, quality, extensions, description };
  }

  /**
   * Export progression as a readable format
   */
  exportProgression(): string {
    if (this.activeProgression.length === 0) {
      return 'No chord progression defined';
    }

    let output = 'Chord Progression:\n';
    output += 'Measure | Chord | Voicing\n';
    output += '--------|-------|--------\n';

    this.activeProgression.forEach(chord => {
      const voicing = `${chord.voicing?.type || 'piano'} (${chord.voicing?.register || 'mid'})`;
      output += `${chord.measure.toString().padStart(7)} | ${chord.chord.padEnd(5)} | ${voicing}\n`;
    });

    return output;
  }

  /**
   * Process chord changes based on current measure
   */
  private processChordChange(event: BeatEvent): void {
    const chord = this.getChordForMeasure(event.measure);
    
    console.log('HarmonyAgent: Processing chord change for measure:', event.measure, 'chord:', chord);
    
    if (chord) {
      const harmonyEvent: HarmonyEvent = {
        type: 'chord-change',
        chord: chord.chord,
        voicing: chord.voicing || this.config.defaultVoicing,
        timestamp: event.timestamp,
        audioTime: event.audioTime
      };

      console.log('HarmonyAgent: Emitting harmony event:', harmonyEvent);
      this.emit('harmony', harmonyEvent);
    }
  }

  /**
   * Generate chord map for a given key
   */
  private generateChordMap(key: string): string[] {
    // Simplified chord mapping - can be expanded with proper music theory
    const majorKeys: Record<string, string[]> = {
      'C': ['C', 'G', 'Am', 'F'],
      'G': ['G', 'D', 'Em', 'C'],
      'D': ['D', 'A', 'Bm', 'G'],
      'A': ['A', 'E', 'F#m', 'D'],
      'E': ['E', 'B', 'C#m', 'A'],
      'F': ['F', 'C', 'Dm', 'Bb'],
      'Bb': ['Bb', 'F', 'Gm', 'Eb'],
      'Eb': ['Eb', 'Bb', 'Cm', 'Ab']
    };

    return majorKeys[key] || majorKeys['C'];
  }
}
