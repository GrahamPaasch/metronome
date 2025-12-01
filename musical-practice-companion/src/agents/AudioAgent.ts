/**
 * AudioAgent - Handles audio generation, sound synthesis, and playback
 */

import { BaseAgent } from './BaseAgent';
import { AudioContextManager } from './AudioContextManager';
import type { AudioAgentConfig, TuningSystem, InstrumentVoicing, BeatEvent } from '../types';
import { DEFAULT_TUNING } from '../types';
import { Chord } from 'tonal';

export class AudioAgent extends BaseAgent {
  private config: AudioAgentConfig;
  private contextManager: AudioContextManager;
  private clickGainNode: GainNode | null = null;
  private harmonyGainNode: GainNode | null = null;
  private droneGainNode: GainNode | null = null;
  
  // Sound settings
  private clickSoundType = 'click';
  private accentSoundType = 'click';
  
  // Polyrhythm settings
  private polyrhythmSoundType = 'click';
  private polyrhythmVolume = 0.7;

  // Active oscillators for cleanup
  private activeOscillators: Set<OscillatorNode> = new Set();
  private droneOscillators: Map<number, { oscillator: OscillatorNode; gainNode: GainNode }> = new Map();

  constructor(config: Partial<AudioAgentConfig> = {}) {
    super();
    this.contextManager = AudioContextManager.getInstance();
    this.config = {
      tuningSystem: config.tuningSystem ?? DEFAULT_TUNING,
      masterVolume: config.masterVolume ?? 0.7,
      clickVolume: config.clickVolume ?? 0.8,
      harmonyVolume: config.harmonyVolume ?? 0.6,
      droneVolume: config.droneVolume ?? 0.4
    };
  }

  /**
   * Get the shared AudioContext
   */
  private get audioContext(): AudioContext | null {
    return this.contextManager.getContext();
  }

  /**
   * Get the shared master gain node
   */
  private get masterGainNode(): GainNode | null {
    return this.contextManager.getMasterGainNode();
  }

  async initialize(): Promise<void> {
    try {
      // Don't create AudioContext here - defer until user interaction
      // Just mark as initialized for now
      this.setInitialized();
    } catch (error) {
      throw new Error(`Failed to initialize AudioAgent: ${error}`);
    }
  }

  /**
   * Initialize AudioContext with user interaction (uses shared manager)
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext && this.clickGainNode) return;

    try {
      // Initialize shared AudioContext
      const ctx = await this.contextManager.initialize();

      // Create gain nodes for different audio types (agent-specific)
      this.clickGainNode = ctx.createGain();
      this.harmonyGainNode = ctx.createGain();
      this.droneGainNode = ctx.createGain();

      // Connect to shared master gain
      const masterGain = this.contextManager.getMasterGainNode();
      if (masterGain) {
        this.clickGainNode.connect(masterGain);
        this.harmonyGainNode.connect(masterGain);
        this.droneGainNode.connect(masterGain);
      }

      // Set initial volumes
      this.updateVolumes();
    } catch (error) {
      throw new Error(`Failed to initialize AudioContext: ${error}`);
    }
  }

  async start(): Promise<void> {
    this.requireInitialized();
    
    // Initialize AudioContext on first start (requires user interaction)
    await this.initializeAudioContext();
    
    this.isActive = true;
  }

  async stop(): Promise<void> {
    this.isActive = false;
    
    // Stop all active oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();

    // Stop drone oscillators
    this.stopAllDrones();
  }

  /**
   * Update tuning system
   */
  setTuningSystem(tuning: TuningSystem): void {
    this.config.tuningSystem = tuning;
    // Restart any active drones with new tuning
    if (this.droneOscillators.size > 0) {
      const activeFrequencies = Array.from(this.droneOscillators.keys());
      this.stopAllDrones();
      activeFrequencies.forEach(freq => this.startDroneFrequency(freq));
    }
  }

  /**
   * Update volume settings
   */
  setVolumes(volumes: Partial<Pick<AudioAgentConfig, 'masterVolume' | 'clickVolume' | 'harmonyVolume' | 'droneVolume'>>): void {
    Object.assign(this.config, volumes);
    this.updateVolumes();
  }

  /**
   * Play metronome click sound
   */
  playClick(type: 'beat' | 'subdivision' | 'accent' = 'beat', when?: number): void {
    if (!this.audioContext || !this.clickGainNode) {
      console.warn('AudioContext not initialized, skipping click sound');
      return;
    }

    const playTime = when ?? this.audioContext.currentTime;
    
    // Choose sound type based on beat type
    const soundType = type === 'accent' ? this.accentSoundType : this.clickSoundType;
    
    // Different click sounds for different beat types - made more prominent
    const volume = type === 'accent' ? 1.0 : type === 'beat' ? 0.9 : 0.6;

    this.playMetronomeSound(soundType, type, volume, this.clickGainNode, playTime);
  }

  /**
   * Play polyrhythm click sound
   */
  playPolyrhythmClick(when?: number): void {
    if (!this.audioContext || !this.clickGainNode) {
      console.warn('AudioContext not initialized, skipping polyrhythm sound');
      return;
    }

    const playTime = when ?? this.audioContext.currentTime;
    this.playMetronomeSound(this.polyrhythmSoundType, 'beat', this.polyrhythmVolume, this.clickGainNode, playTime);
  }

  /**
   * Set polyrhythm sound settings
   */
  setPolyrhythmSettings(soundType: string, volume: number): void {
    this.polyrhythmSoundType = soundType;
    this.polyrhythmVolume = volume;
  }

  /**
   * Play a chord with specified voicing
   */
  playChord(chordSymbol: string, voicing: InstrumentVoicing, when?: number): void {
    if (!this.audioContext || !this.harmonyGainNode) return;

    const playTime = when ?? this.audioContext.currentTime;
    
    console.log('AudioAgent: Playing chord:', chordSymbol, 'at time:', playTime);
    
    try {
      // Parse chord using Tonal library
      const chordNotes = Chord.get(chordSymbol).notes;
      if (chordNotes.length === 0) {
        console.warn(`Invalid chord symbol: ${chordSymbol}`);
        return;
      }

      // Generate frequencies for chord notes
      const frequencies = this.generateChordVoicing(chordNotes, voicing);
      
      console.log('Chord frequencies:', frequencies);
      
      // Play each note in the chord
      frequencies.forEach((freq, index) => {
        const delay = voicing.style === 'arpeggiated' ? index * 0.05 : 0;
        const duration = voicing.style === 'sustained' ? 8.0 : 3.0; // Longer duration for better sustain
        const noteVolume = 0.6 / frequencies.length; // Increased volume so chords are more audible
        
        this.playInstrumentTone(freq, duration, noteVolume, voicing.type, playTime + delay);
      });

    } catch (error) {
      console.error(`Error playing chord ${chordSymbol}:`, error);
    }
  }

  /**
   * Start a drone at a specific frequency
   */
  startDroneFrequency(frequency: number): void {
    if (!this.audioContext || !this.droneGainNode) return;

    // Stop existing drone at this frequency
    this.stopDroneFrequency(frequency);

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Use a more complex waveform for better pitch identification
      // Sawtooth has more harmonics making it easier to tune to
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // Set up gain envelope with stable volume
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.droneGainNode);

      oscillator.start();
      this.droneOscillators.set(frequency, { oscillator, gainNode });

      console.log(`Started drone at ${frequency.toFixed(2)} Hz`);

    } catch (error) {
      console.error(`Error starting drone at ${frequency} Hz:`, error);
    }
  }

  /**
   * Stop a specific drone frequency
   */
  stopDroneFrequency(frequency: number): void {
    const droneData = this.droneOscillators.get(frequency);
    if (droneData && this.audioContext) {
      try {
        const { oscillator, gainNode } = droneData;
        
        // Gradual fade out using the existing gain node
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        // Clean up after fade out
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (error) {
            // Already disconnected
          }
        }, 150);
        
        this.droneOscillators.delete(frequency);
        console.log(`Stopped drone at ${frequency.toFixed(2)} Hz`);
      } catch (error) {
        console.error(`Error stopping drone at ${frequency} Hz:`, error);
      }
    }
  }

  /**
   * Legacy method - start drone by note name (for backward compatibility)
   */
  startDrone(note: string, octave = 3): void {
    const frequency = this.noteToFrequency(note, octave);
    this.startDroneFrequency(frequency);
  }

  /**
   * Legacy method - stop drone by note name (for backward compatibility)
   */
  stopDrone(note: string): void {
    // Find and stop all drones that match this note (any octave)
    const notesToStop: number[] = [];
    
    this.droneOscillators.forEach((_, frequency) => {
      // Check if this frequency corresponds to the note in any octave
      for (let octave = 0; octave <= 8; octave++) {
        try {
          const noteFreq = this.noteToFrequency(note, octave);
          if (Math.abs(frequency - noteFreq) < 1) { // Within 1 Hz
            notesToStop.push(frequency);
            break;
          }
        } catch (error) {
          // Invalid note, skip
        }
      }
    });
    
    notesToStop.forEach(freq => this.stopDroneFrequency(freq));
  }

  /**
   * Stop all drone notes
   */
  stopAllDrones(): void {
    this.droneOscillators.forEach((_, frequency) => this.stopDroneFrequency(frequency));
  }

  /**
   * Handle beat events from TempoAgent
   */
  handleBeatEvent(event: BeatEvent): void {
    if (!this.isActive) return;

    console.log('AudioAgent: Received beat event:', event);

    switch (event.type) {
      case 'measure':
        this.playClick('accent', event.audioTime);
        break;
      case 'beat':
        this.playClick('beat', event.audioTime);
        break;
      case 'subdivision':
        this.playClick('subdivision', event.audioTime);
        break;
      case 'polyrhythm':
        this.playPolyrhythmClick(event.audioTime);
        break;
    }
  }

  /**
   * Generate chord voicing frequencies
   */
  private generateChordVoicing(notes: string[], voicing: InstrumentVoicing): number[] {
    const baseOctave = voicing.register === 'low' ? 3 : voicing.register === 'high' ? 5 : 4;
    const frequencies: number[] = [];

    // Limit notes based on density
    let chordsToUse = notes;
    if (voicing.density === 'sparse') {
      chordsToUse = [notes[0], notes[2] || notes[1]]; // Root and 5th (or 3rd)
    } else if (voicing.density === 'medium') {
      chordsToUse = notes.slice(0, 3); // Root, 3rd, 5th
    }

    chordsToUse.forEach((note, index) => {
      const octave = baseOctave + Math.floor(index / 3);
      frequencies.push(this.noteToFrequency(note, octave));
    });

    return frequencies;
  }

  /**
   * Play a tone with basic oscillator
   */
  private playTone(
    frequency: number, 
    duration: number, 
    volume: number, 
    destination: AudioNode,
    when: number
  ): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, when);

    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start(when);
    oscillator.stop(when + duration);

    this.activeOscillators.add(oscillator);
    
    // Clean up after oscillator finishes
    setTimeout(() => {
      this.activeOscillators.delete(oscillator);
      try {
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (error) {
        // Already disconnected
      }
    }, (duration + 0.1) * 1000);
  }

  /**
   * Play instrument-specific tone
   */
  private playInstrumentTone(
    frequency: number,
    duration: number,
    volume: number,
    instrument: InstrumentVoicing['type'],
    when: number
  ): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    let filterNode: BiquadFilterNode | null = null;

    // Configure oscillator based on instrument type
    switch (instrument) {
      case 'piano':
        oscillator.type = 'triangle';
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(3000, when);
        break;
      case 'organ':
        oscillator.type = 'sawtooth';
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, when);
        break;
      case 'harmonium':
        oscillator.type = 'sawtooth';
        // Add slight detuning for harmonium character
        break;
      case 'harp':
        oscillator.type = 'triangle';
        // Shorter decay for plucked sound
        duration = Math.min(duration, 2.0);
        break;
      case 'strings':
        oscillator.type = 'sawtooth';
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(4000, when);
        break;
    }

    oscillator.frequency.setValueAtTime(frequency, when);

    // Set up gain envelope
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);

    // Connect audio nodes
    if (filterNode) {
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }
    gainNode.connect(this.harmonyGainNode!);

    oscillator.start(when);
    oscillator.stop(when + duration);

    this.activeOscillators.add(oscillator);
    
    // Clean up after oscillator finishes
    setTimeout(() => {
      this.activeOscillators.delete(oscillator);
      try {
        oscillator.disconnect();
        gainNode.disconnect();
        if (filterNode) filterNode.disconnect();
      } catch (error) {
        // Already disconnected
      }
    }, (duration + 0.1) * 1000);
  }

  /**
   * Update all gain node volumes
   */
  private updateVolumes(): void {
    if (!this.masterGainNode || !this.clickGainNode || !this.harmonyGainNode || !this.droneGainNode) {
      return;
    }

    this.masterGainNode.gain.setValueAtTime(this.config.masterVolume, this.audioContext?.currentTime ?? 0);
    this.clickGainNode.gain.setValueAtTime(this.config.clickVolume, this.audioContext?.currentTime ?? 0);
    this.harmonyGainNode.gain.setValueAtTime(this.config.harmonyVolume, this.audioContext?.currentTime ?? 0);
    this.droneGainNode.gain.setValueAtTime(this.config.droneVolume, this.audioContext?.currentTime ?? 0);
  }

  /**
   * Convert note and octave to frequency using current tuning system
   */
  private noteToFrequency(note: string, octave: number): number {
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
    return this.config.tuningSystem.a4Frequency * Math.pow(2, a4Offset / 12);
  }

  /**
   * Set sound types for different click types
   */
  setSoundTypes(clickSound: string, accentSound: string): void {
    this.clickSoundType = clickSound;
    this.accentSoundType = accentSound;
  }

  /**
   * Play metronome sound with different types
   */
  private playMetronomeSound(
    soundType: string,
    beatType: 'beat' | 'subdivision' | 'accent',
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    if (!this.audioContext) return;

    const duration = beatType === 'accent' ? 0.15 : beatType === 'beat' ? 0.1 : 0.08;

    switch (soundType) {
      case 'click':
        this.playClickSound(beatType, duration, volume, destination, when);
        break;
      case 'tick':
        this.playTickSound(beatType, duration, volume, destination, when);
        break;
      case 'bell':
        this.playBellSound(beatType, duration, volume, destination, when);
        break;
      case 'wood':
        this.playWoodSound(beatType, duration, volume, destination, when);
        break;
      case 'beep':
        this.playBeepSound(beatType, duration, volume, destination, when);
        break;
      default:
        this.playClickSound(beatType, duration, volume, destination, when);
    }
  }

  /**
   * Play traditional click sound
   */
  private playClickSound(
    beatType: 'beat' | 'subdivision' | 'accent',
    duration: number,
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    const frequency = beatType === 'accent' ? 1200 : beatType === 'beat' ? 800 : 600;
    this.playTone(frequency, duration, volume, destination, when);
  }

  /**
   * Play tick sound (higher pitched)
   */
  private playTickSound(
    beatType: 'beat' | 'subdivision' | 'accent',
    duration: number,
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    const frequency = beatType === 'accent' ? 2000 : beatType === 'beat' ? 1500 : 1200;
    this.playTone(frequency, duration * 0.8, volume, destination, when);
  }

  /**
   * Play bell sound (triangle wave with harmonics)
   */
  private playBellSound(
    beatType: 'beat' | 'subdivision' | 'accent',
    duration: number,
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    if (!this.audioContext) return;

    const frequency = beatType === 'accent' ? 880 : beatType === 'beat' ? 660 : 440;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, when);

    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration * 2);

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start(when);
    oscillator.stop(when + duration * 2);

    this.activeOscillators.add(oscillator);
    setTimeout(() => this.activeOscillators.delete(oscillator), (duration * 2 + 0.1) * 1000);
  }

  /**
   * Play wood block sound (noise burst)
   */
  private playWoodSound(
    beatType: 'beat' | 'subdivision' | 'accent',
    _duration: number,
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(beatType === 'accent' ? 800 : 400, when);
    filter.Q.setValueAtTime(10, when);

    gainNode.gain.setValueAtTime(volume, when);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);

    source.start(when);
  }

  /**
   * Play beep sound (sine wave)
   */
  private playBeepSound(
    beatType: 'beat' | 'subdivision' | 'accent',
    duration: number,
    volume: number,
    destination: AudioNode,
    when: number
  ): void {
    const frequency = beatType === 'accent' ? 1000 : beatType === 'beat' ? 800 : 600;
    
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, when);

    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.005);
    gainNode.gain.linearRampToValueAtTime(0, when + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start(when);
    oscillator.stop(when + duration);

    this.activeOscillators.add(oscillator);
    setTimeout(() => this.activeOscillators.delete(oscillator), (duration + 0.1) * 1000);
  }

  /**
   * Play a musical note with specified pitch, duration, and velocity
   */
  playMusicalNote(pitch: string, duration: number, velocity: number = 64, when?: number): void {
    if (!this.audioContext || !this.harmonyGainNode) return;

    const playTime = when ?? this.audioContext.currentTime;
    
    try {
      // Parse pitch to extract note and octave (e.g., "C4", "F#5")
      const match = pitch.match(/^([A-G][#b]?)(\d+)$/);
      if (!match) {
        console.warn(`Invalid pitch format: ${pitch}`);
        return;
      }
      
      const [, note, octaveStr] = match;
      const octave = parseInt(octaveStr);
      
      // Convert to frequency
      const frequency = this.noteToFrequency(note, octave);
      
      // Convert MIDI velocity (0-127) to volume (0-1)
      const volume = (velocity / 127) * 0.8;
      
      // Play the note using piano instrument by default
      this.playInstrumentTone(frequency, duration, volume, 'piano', playTime);
      
    } catch (error) {
      console.error(`Error playing note ${pitch}:`, error);
    }
  }
}
