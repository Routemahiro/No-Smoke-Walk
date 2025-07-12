'use client';

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  plugins: string[];
  canvas?: string;
}

export class FingerprintGenerator {
  // Generate browser fingerprint
  static async generateFingerprint(): Promise<string> {
    const fingerprint = await this.collectBrowserData();
    const fingerprintString = this.createFingerprintString(fingerprint);
    return this.hashFingerprint(fingerprintString);
  }

  // Collect browser data for fingerprinting
  static async collectBrowserData(): Promise<BrowserFingerprint> {
    const fingerprint: BrowserFingerprint = {
      userAgent: navigator.userAgent || '',
      language: navigator.language || '',
      platform: navigator.platform || '',
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      plugins: this.getPluginList(),
    };

    // Add canvas fingerprint if available
    try {
      fingerprint.canvas = await this.generateCanvasFingerprint();
    } catch {
      // Canvas fingerprinting may be blocked, continue without it
      console.debug('Canvas fingerprinting blocked or failed');
    }

    return fingerprint;
  }

  // Get list of browser plugins
  static getPluginList(): string[] {
    const plugins: string[] = [];
    
    if (navigator.plugins && navigator.plugins.length > 0) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        if (plugin && plugin.name) {
          plugins.push(plugin.name);
        }
      }
    }

    return plugins.sort();
  }

  // Generate canvas fingerprint
  static generateCanvasFingerprint(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size
        canvas.width = 200;
        canvas.height = 50;

        // Draw text with different fonts and properties
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        
        ctx.fillStyle = '#069';
        ctx.fillText('No-Smoke Walk 🚭', 2, 15);
        
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18px Arial';
        ctx.fillText('Browser ID', 4, 25);

        // Convert to data URL
        const dataURL = canvas.toDataURL();
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create fingerprint string from collected data
  static createFingerprintString(fingerprint: BrowserFingerprint): string {
    const parts = [
      fingerprint.userAgent,
      fingerprint.language,
      fingerprint.platform,
      fingerprint.screenResolution,
      fingerprint.timezone,
      fingerprint.cookieEnabled.toString(),
      fingerprint.doNotTrack,
      fingerprint.plugins.join(','),
      fingerprint.canvas || ''
    ];

    return parts.join('|');
  }

  // Hash fingerprint string using SubtleCrypto API
  static async hashFingerprint(fingerprintString: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to simple hash if SubtleCrypto is not available
      console.warn('SubtleCrypto not available, using fallback hash');
      return this.simpleHash(fingerprintString);
    }
  }

  // Simple hash function as fallback
  static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Check if fingerprinting is likely to be blocked
  static isBlockingDetected(): boolean {
    // Check for common privacy tools
    const blockers = [
      'navigator.webdriver',
      'window.phantom',
      'window.callPhantom',
      '_phantom',
      'window.chrome?.app?.runtime'
    ];

    return blockers.some(blocker => {
      try {
        return eval(blocker) !== undefined;
      } catch {
        return false;
      }
    });
  }

  // Get minimal fingerprint (privacy-friendly)
  static async getMinimalFingerprint(): Promise<string> {
    const minimalData = {
      userAgent: navigator.userAgent?.substring(0, 50) || '', // Truncated
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screenResolution: `${Math.floor(screen.width / 100) * 100}x${Math.floor(screen.height / 100) * 100}` // Rounded
    };

    const fingerprintString = Object.values(minimalData).join('|');
    return this.hashFingerprint(fingerprintString);
  }
}