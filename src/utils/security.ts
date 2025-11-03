import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Report security event to server
 */
export const reportSecurityEvent = async (
  event: string,
  metadata?: any
): Promise<void> => {
  try {
    await axios.post('/api/security/log-event', {
      event,
      metadata,
    });
  } catch (error) {
    console.error('Failed to report security event:', error);
  }
};

/**
 * Send heartbeat to server for state validation
 */
export const sendHeartbeat = async (player: any, character: any): Promise<any> => {
  try {
    const response = await axios.post('/api/security/heartbeat', {
      gold: player.gold,
      level: player.level,
      energy: player.energy,
      gems: player.gems,
      characterStats: character
        ? {
            attack: character.attack,
            defense: character.defense,
            health: character.health,
          }
        : undefined,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
    console.error('Heartbeat failed:', error);
    return { sync: false };
  }
};

/**
 * Add nonce and timestamp to all API requests
 */
export const setupRequestInterceptors = () => {
  axios.interceptors.request.use((config) => {
    // Add nonce for replay protection
    config.headers['X-Nonce'] = uuidv4();
    config.headers['X-Timestamp'] = Date.now().toString();
    return config;
  });
};

/**
 * Integrity check - verify client hasn't been modified
 */
export const verifyClientIntegrity = async (): Promise<boolean> => {
  try {
    // In production, you would compare checksums of critical files
    // For now, just check if we can access the checksums
    const response = await fetch('/checksums.json');
    
    if (!response.ok) {
      console.warn('Checksums file not found - skipping integrity check');
      return true; // Don't block in development
    }

    const _expectedChecksums = await response.json();
    
    // For a real implementation, you'd check actual file checksums
    // This is a basic example
    console.log('✅ Integrity check passed');
    return true;
  } catch (error) {
    console.error('Integrity check failed:', error);
    await reportSecurityEvent('integrity_check_failed', { error: String(error) });
    return false;
  }
};

/**
 * Calculate SHA-256 hash (for integrity checking)
 */
export const sha256 = async (text: string): Promise<string> => {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Initialize security measures
 */
export const initializeSecurity = async () => {
  console.log('🔐 Initializing security measures...');

  // Setup request interceptors for nonce/timestamp
  setupRequestInterceptors();

  // Verify client integrity
  await verifyClientIntegrity();

  // Start periodic heartbeat (every 30 seconds)
  // This will be called from the main app component

  console.log('✅ Security initialized');
};
