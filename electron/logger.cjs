/**
 * Folkhart Game Logger
 * Logs anti-cheat events, errors, and game activity to local files
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class GameLogger {
  constructor() {
    this.logDir = this.getLogDirectory();
    this.ensureLogDirectory();
    this.currentLogFile = this.createLogFileName();
    this.maxLogSize = 5 * 1024 * 1024; // 5MB
    this.maxLogFiles = 10;
  }

  /**
   * Get OS-specific log directory
   */
  getLogDirectory() {
    const appName = 'Folkhart';
    let logPath;

    switch (process.platform) {
      case 'win32':
        // Windows: %APPDATA%\Folkhart\Logs
        logPath = path.join(process.env.APPDATA || app.getPath('appData'), appName, 'Logs');
        break;
      case 'darwin':
        // macOS: ~/Library/Logs/Folkhart
        logPath = path.join(app.getPath('home'), 'Library', 'Logs', appName);
        break;
      case 'linux':
        // Linux: ~/.local/share/Folkhart/logs
        logPath = path.join(app.getPath('home'), '.local', 'share', appName, 'logs');
        break;
      default:
        logPath = path.join(app.getPath('userData'), 'logs');
    }

    return logPath;
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Create log file name with timestamp
   */
  createLogFileName() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `folkhart-${dateStr}.log`);
  }

  /**
   * Format log message
   */
  formatMessage(level, category, message, metadata) {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    if (metadata) {
      logLine += ` | ${JSON.stringify(metadata)}`;
    }
    
    return logLine + '\n';
  }

  /**
   * Write to log file
   */
  write(level, category, message, metadata) {
    try {
      const logMessage = this.formatMessage(level, category, message, metadata);
      
      // Check if we need to rotate logs
      this.rotateLogsIfNeeded();
      
      // Append to current log file
      fs.appendFileSync(this.currentLogFile, logMessage, 'utf8');
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(logMessage.trim());
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Rotate logs if current file is too large
   */
  rotateLogsIfNeeded() {
    try {
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        
        if (stats.size >= this.maxLogSize) {
          // Create new log file with timestamp
          const timestamp = Date.now();
          const rotatedName = this.currentLogFile.replace('.log', `-${timestamp}.log`);
          fs.renameSync(this.currentLogFile, rotatedName);
          
          // Clean up old logs
          this.cleanOldLogs();
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Delete old log files, keeping only the most recent
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('folkhart-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only the most recent files
      if (files.length > this.maxLogFiles) {
        files.slice(this.maxLogFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  // Convenience methods
  info(category, message, metadata) {
    this.write('info', category, message, metadata);
  }

  warn(category, message, metadata) {
    this.write('warn', category, message, metadata);
  }

  error(category, message, metadata) {
    this.write('error', category, message, metadata);
  }

  security(message, metadata) {
    this.write('security', 'ANTI-CHEAT', message, metadata);
  }

  debug(category, message, metadata) {
    if (process.env.NODE_ENV === 'development') {
      this.write('debug', category, message, metadata);
    }
  }

  /**
   * Get log directory path for displaying to user
   */
  getLogPath() {
    return this.logDir;
  }

  /**
   * Open log directory in file explorer
   */
  openLogDirectory() {
    const { shell } = require('electron');
    shell.openPath(this.logDir);
  }
}

// Singleton instance
let loggerInstance = null;

function getLogger() {
  if (!loggerInstance) {
    loggerInstance = new GameLogger();
  }
  return loggerInstance;
}

module.exports = { getLogger, GameLogger };
