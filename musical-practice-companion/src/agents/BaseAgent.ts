/**
 * Base Agent class providing event handling and lifecycle management
 */

export type EventHandler<T = any> = (data: T) => void;

export abstract class BaseAgent {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private isInitialized = false;
  protected isActive = false;

  /**
   * Initialize the agent. Must be called before using the agent.
   */
  abstract initialize(): Promise<void>;

  /**
   * Start the agent's operations
   */
  abstract start(): Promise<void>;

  /**
   * Stop the agent's operations
   */
  abstract stop(): Promise<void>;

  /**
   * Clean up resources and event handlers
   */
  async destroy(): Promise<void> {
    await this.stop();
    this.eventHandlers.clear();
    this.isInitialized = false;
  }

  /**
   * Subscribe to an event
   */
  on<T>(eventName: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  protected emit<T>(eventName: string, data: T): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Check if agent is initialized
   */
  protected requireInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} must be initialized before use`);
    }
  }

  /**
   * Mark agent as initialized
   */
  protected setInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get active status
   */
  get active(): boolean {
    return this.isActive;
  }
}
