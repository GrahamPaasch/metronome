/**
 * AudioContextManager - Singleton manager for shared AudioContext
 * 
 * Browsers limit the number of AudioContext instances. This manager
 * ensures all agents share a single AudioContext for efficient resource usage.
 */

export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private isUnlocked = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Initialize the AudioContext (requires user interaction)
   */
  async initialize(): Promise<AudioContext> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.ensureRunning();
      return this.audioContext;
    }

    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      await this.initPromise;
      return this.audioContext!;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
    this.initPromise = null;
    
    return this.audioContext!;
  }

  private async _doInitialize(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContextClass();
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = 1.0;
      this.masterGainNode.connect(this.audioContext.destination);

      await this.ensureRunning();
    } catch (error) {
      this.audioContext = null;
      this.masterGainNode = null;
      throw new Error(`Failed to initialize AudioContext: ${error}`);
    }
  }

  /**
   * Ensure the AudioContext is running (resume if suspended)
   */
  async ensureRunning(): Promise<void> {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.isUnlocked = true;
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    } else if (this.audioContext.state === 'running') {
      this.isUnlocked = true;
    }
  }

  /**
   * Get the shared AudioContext (null if not initialized)
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the master gain node for volume control
   */
  getMasterGainNode(): GainNode | null {
    return this.masterGainNode;
  }

  /**
   * Check if the AudioContext has been unlocked by user interaction
   */
  get unlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Check if AudioContext is ready for use
   */
  get isReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  /**
   * Get current audio time
   */
  get currentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  /**
   * Suspend the AudioContext to save resources
   */
  async suspend(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * Close and dispose of the AudioContext
   */
  async close(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGainNode = null;
      this.isUnlocked = false;
    }
  }

  /**
   * Reset the singleton (mainly for testing)
   */
  static reset(): void {
    if (AudioContextManager.instance) {
      AudioContextManager.instance.close();
      AudioContextManager.instance = null;
    }
  }
}
