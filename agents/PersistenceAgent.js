/**
 * PersistenceAgent - Save and load user settings
 * 
 * Provides localStorage and optional remote API persistence for metronome settings.
 * Supports export/import of presets as JSON.
 */

export class PersistenceAgent extends EventTarget {
  /**
   * @param {Object} options
   * @param {string} options.storageKey - Key under which to save settings in localStorage
   * @param {boolean} options.useRemote - Toggle remote API persistence
   * @param {string} options.remoteEndpoint - URL for remote storage API (if useRemote is true)
   */
  constructor({ 
    storageKey = 'metronomeSettings', 
    useRemote = false,
    remoteEndpoint = ''
  } = {}) {
    super();
    this.storageKey = storageKey;
    this.useRemote = useRemote;
    this.remoteEndpoint = remoteEndpoint;
    this._lastError = null;
  }

  /**
   * Save settings to storage
   * @param {Object} settings - The settings object to save
   * @returns {Promise<boolean>} - Whether save was successful
   */
  async save(settings) {
    try {
      const data = {
        ...settings,
        _savedAt: new Date().toISOString(),
        _version: 1
      };
      
      // Always save to localStorage first
      this._saveToLocal(data);
      
      // Optionally save to remote
      if (this.useRemote && this.remoteEndpoint) {
        await this._saveToRemote(data);
      }
      
      this.dispatchEvent(new CustomEvent('saved', { detail: data }));
      return true;
    } catch (err) {
      this._emitError('save-failed', 'Failed to save settings', err);
      return false;
    }
  }

  /**
   * Load settings from storage
   * @returns {Object|null} - The loaded settings or null if none found
   */
  load() {
    try {
      const data = this._loadFromLocal();
      
      if (data) {
        this.dispatchEvent(new CustomEvent('loaded', { detail: data }));
      }
      
      return data;
    } catch (err) {
      this._emitError('load-failed', 'Failed to load settings', err);
      return null;
    }
  }

  /**
   * Load settings from remote API (async)
   * @returns {Promise<Object|null>} - The loaded settings or null
   */
  async loadFromRemote() {
    if (!this.useRemote || !this.remoteEndpoint) {
      return null;
    }
    
    try {
      const data = await this._loadFromRemote();
      
      if (data) {
        // Also update local storage with remote data
        this._saveToLocal(data);
        this.dispatchEvent(new CustomEvent('loaded', { detail: data }));
      }
      
      return data;
    } catch (err) {
      this._emitError('remote-load-failed', 'Failed to load settings from remote', err);
      return null;
    }
  }

  /**
   * Clear all saved settings
   * @returns {boolean} - Whether clear was successful
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(`${this.storageKey}_presets`);
      this.dispatchEvent(new Event('cleared'));
      return true;
    } catch (err) {
      this._emitError('clear-failed', 'Failed to clear settings', err);
      return false;
    }
  }

  /**
   * Export settings as JSON string (for file download)
   * @param {Object} settings - Settings to export (or current saved settings)
   * @returns {string} - JSON string of settings
   */
  exportAsJson(settings = null) {
    const data = settings || this.load() || {};
    return JSON.stringify({
      ...data,
      _exportedAt: new Date().toISOString(),
      _exportVersion: 1
    }, null, 2);
  }

  /**
   * Import settings from JSON string
   * @param {string} json - JSON string to import
   * @returns {Object|null} - Parsed settings or null if invalid
   */
  importFromJson(json) {
    try {
      const data = JSON.parse(json);
      
      // Validate basic structure
      if (typeof data !== 'object' || data === null) {
        this._emitError('import-invalid', 'Invalid settings format: not an object');
        return null;
      }
      
      // Remove meta fields before returning
      const { _exportedAt, _exportVersion, _savedAt, _version, ...settings } = data;
      
      this.dispatchEvent(new CustomEvent('imported', { detail: settings }));
      return settings;
    } catch (err) {
      this._emitError('import-failed', 'Failed to parse settings JSON', err);
      return null;
    }
  }

  /**
   * Save a named preset
   * @param {string} name - Preset name
   * @param {Object} settings - Settings for the preset
   * @returns {boolean} - Whether save was successful
   */
  savePreset(name, settings) {
    try {
      const presets = this._loadPresets();
      presets[name] = {
        ...settings,
        _createdAt: presets[name]?._createdAt || new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      };
      this._savePresets(presets);
      this.dispatchEvent(new CustomEvent('presetSaved', { detail: { name, settings } }));
      return true;
    } catch (err) {
      this._emitError('preset-save-failed', `Failed to save preset "${name}"`, err);
      return false;
    }
  }

  /**
   * Load a named preset
   * @param {string} name - Preset name
   * @returns {Object|null} - The preset settings or null
   */
  loadPreset(name) {
    try {
      const presets = this._loadPresets();
      const preset = presets[name] || null;
      
      if (preset) {
        const { _createdAt, _updatedAt, ...settings } = preset;
        return settings;
      }
      
      return null;
    } catch (err) {
      this._emitError('preset-load-failed', `Failed to load preset "${name}"`, err);
      return null;
    }
  }

  /**
   * Delete a named preset
   * @param {string} name - Preset name
   * @returns {boolean} - Whether delete was successful
   */
  deletePreset(name) {
    try {
      const presets = this._loadPresets();
      if (presets[name]) {
        delete presets[name];
        this._savePresets(presets);
        this.dispatchEvent(new CustomEvent('presetDeleted', { detail: { name } }));
        return true;
      }
      return false;
    } catch (err) {
      this._emitError('preset-delete-failed', `Failed to delete preset "${name}"`, err);
      return false;
    }
  }

  /**
   * Get list of all preset names
   * @returns {string[]} - Array of preset names
   */
  listPresets() {
    try {
      const presets = this._loadPresets();
      return Object.keys(presets);
    } catch (err) {
      this._emitError('preset-list-failed', 'Failed to list presets', err);
      return [];
    }
  }

  /**
   * Get the last error that occurred
   */
  get lastError() {
    return this._lastError;
  }

  // Private methods

  _saveToLocal(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  _loadFromLocal() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    const { _savedAt, _version, ...settings } = data;
    return settings;
  }

  async _saveToRemote(data) {
    const response = await fetch(this.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Remote save failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async _loadFromRemote() {
    const response = await fetch(this.remoteEndpoint);
    
    if (!response.ok) {
      throw new Error(`Remote load failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const { _savedAt, _version, ...settings } = data;
    return settings;
  }

  _loadPresets() {
    const stored = localStorage.getItem(`${this.storageKey}_presets`);
    return stored ? JSON.parse(stored) : {};
  }

  _savePresets(presets) {
    localStorage.setItem(`${this.storageKey}_presets`, JSON.stringify(presets));
  }

  _emitError(type, message, originalError = null) {
    this._lastError = { type, message, originalError, timestamp: Date.now() };
    this.dispatchEvent(new CustomEvent('error', { detail: this._lastError }));
  }
}
