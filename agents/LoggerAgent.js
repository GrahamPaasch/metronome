/**
 * LoggerAgent - Record events and errors for debugging and metrics
 * 
 * Provides logging with multiple levels, optional remote transmission,
 * and event batching for performance.
 */

export class LoggerAgent extends EventTarget {
  // Log levels in order of severity
  static LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * @param {Object} options
   * @param {string} options.level - Minimum log level ('debug', 'info', 'warn', 'error')
   * @param {string} options.remoteEndpoint - URL for remote logging API (empty to disable)
   * @param {number} options.batchSize - Number of logs to batch before sending to remote
   * @param {number} options.batchInterval - Max milliseconds between batch sends
   * @param {boolean} options.includeTimestamp - Include timestamp in log entries
   * @param {boolean} options.includeStackTrace - Include stack trace for errors
   */
  constructor({
    level = 'info',
    remoteEndpoint = '',
    batchSize = 10,
    batchInterval = 5000,
    includeTimestamp = true,
    includeStackTrace = true
  } = {}) {
    super();
    this.level = level;
    this.remoteEndpoint = remoteEndpoint;
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;
    this.includeTimestamp = includeTimestamp;
    this.includeStackTrace = includeStackTrace;
    
    this._buffer = [];
    this._history = [];
    this._maxHistory = 100;
    this._batchTimer = null;
    this._isSending = false;
    
    // Start batch timer if remote endpoint is configured
    if (this.remoteEndpoint) {
      this._startBatchTimer();
    }
  }

  /**
   * Log a debug message
   */
  debug(message, data = {}) {
    this._log('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message, data = {}) {
    this._log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message, data = {}) {
    this._log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message, data = {}) {
    this._log('error', message, data);
  }

  /**
   * Log a metric/event for tracking
   */
  metric(name, value, tags = {}) {
    this._log('info', `METRIC: ${name}`, { 
      _isMetric: true,
      metricName: name,
      metricValue: value,
      tags 
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context) {
    const child = new LoggerAgent({
      level: this.level,
      remoteEndpoint: this.remoteEndpoint,
      batchSize: this.batchSize,
      batchInterval: this.batchInterval,
      includeTimestamp: this.includeTimestamp,
      includeStackTrace: this.includeStackTrace
    });
    child._context = { ...this._context, ...context };
    return child;
  }

  /**
   * Get recent log history
   */
  getHistory(count = 50, level = null) {
    let logs = this._history.slice(-count);
    
    if (level) {
      const minLevel = LoggerAgent.LEVELS[level] ?? 0;
      logs = logs.filter(log => LoggerAgent.LEVELS[log.level] >= minLevel);
    }
    
    return logs;
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this._history = [];
  }

  /**
   * Set the minimum log level
   */
  setLevel(level) {
    if (LoggerAgent.LEVELS[level] !== undefined) {
      this.level = level;
    }
  }

  /**
   * Flush any pending logs to remote
   */
  async flush() {
    if (this._buffer.length > 0 && this.remoteEndpoint) {
      await this._sendBatch();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this._batchTimer) {
      clearInterval(this._batchTimer);
      this._batchTimer = null;
    }
    // Attempt final flush
    this.flush().catch(() => {});
  }

  // Private methods

  _log(level, message, data) {
    // Check if this level should be logged
    const minLevel = LoggerAgent.LEVELS[this.level] ?? 0;
    const msgLevel = LoggerAgent.LEVELS[level] ?? 0;
    
    if (msgLevel < minLevel) {
      return;
    }

    const entry = {
      level,
      message,
      data: { ...this._context, ...data }
    };

    if (this.includeTimestamp) {
      entry.timestamp = new Date().toISOString();
    }

    if (level === 'error' && this.includeStackTrace) {
      entry.stack = new Error().stack;
    }

    // Add to history
    this._history.push(entry);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Output to console
    this._consoleOutput(entry);

    // Buffer for remote sending
    if (this.remoteEndpoint) {
      this._buffer.push(entry);
      
      // Send immediately if buffer is full
      if (this._buffer.length >= this.batchSize) {
        this._sendBatch();
      }
    }

    // Emit event
    this.dispatchEvent(new CustomEvent('log', { detail: entry }));
  }

  _consoleOutput(entry) {
    const prefix = this.includeTimestamp ? `[${entry.timestamp}]` : '';
    const msg = `${prefix} [${entry.level.toUpperCase()}] ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(msg, entry.data);
        break;
      case 'info':
        console.info(msg, entry.data);
        break;
      case 'warn':
        console.warn(msg, entry.data);
        break;
      case 'error':
        console.error(msg, entry.data, entry.stack || '');
        break;
    }
  }

  _startBatchTimer() {
    this._batchTimer = setInterval(() => {
      if (this._buffer.length > 0) {
        this._sendBatch();
      }
    }, this.batchInterval);
  }

  async _sendBatch() {
    if (this._isSending || this._buffer.length === 0) {
      return;
    }

    this._isSending = true;
    const batch = [...this._buffer];
    this._buffer = [];

    try {
      const response = await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch })
      });

      if (!response.ok) {
        // Re-add failed logs to buffer (at front)
        this._buffer = [...batch, ...this._buffer];
        this.dispatchEvent(new CustomEvent('sendError', { 
          detail: { 
            status: response.status, 
            batchSize: batch.length 
          } 
        }));
      } else {
        this.dispatchEvent(new CustomEvent('sent', { 
          detail: { batchSize: batch.length } 
        }));
      }
    } catch (err) {
      // Re-add failed logs to buffer (at front)
      this._buffer = [...batch, ...this._buffer];
      this.dispatchEvent(new CustomEvent('sendError', { 
        detail: { 
          error: err.message, 
          batchSize: batch.length 
        } 
      }));
    } finally {
      this._isSending = false;
    }
  }
}
