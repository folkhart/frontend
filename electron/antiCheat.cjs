const { app } = require('electron');
const { exec } = require('child_process');
const axios = require('axios');

/**
 * Enable anti-debug protection
 */
function enableAntiDebug(mainWindow) {
  console.log('🛡️ Enabling anti-debug protection...');

  // Detect DevTools opening
  mainWindow.webContents.on('devtools-opened', () => {
    console.warn('⚠️ DevTools detected!');
    
    // Report to server
    reportToServer('devtools_opened');

    // In production, close the app
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ DevTools are not allowed in production - closing app');
      app.quit();
    }
  });

  // Disable right-click context menu in production
  if (process.env.NODE_ENV === 'production') {
    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault();
    });
  }

  // Prevent DevTools from being opened via keyboard shortcut
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (process.env.NODE_ENV === 'production') {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key === 'I') ||
        (input.control && input.shift && input.key === 'J') ||
        (input.control && input.shift && input.key === 'C')
      ) {
        event.preventDefault();
        console.warn('⚠️ DevTools shortcut blocked');
        reportToServer('devtools_shortcut_blocked');
      }
    }
  });
}

/**
 * Process monitoring - detect cheat tools
 */
let processMonitorInterval = null;

function startProcessMonitoring() {
  console.log('🔍 Starting process monitoring...');

  const suspiciousProcesses = [
    'cheatengine',
    'cheat engine',
    'ce-x64',
    'ce-i386',
    'processhacker',
    'x64dbg',
    'x32dbg',
    'ollydbg',
    'ida',
    'ida64',
    'wireshark',
    'fiddler',
    'charles',
    'mitmproxy',
  ];

  const checkProcesses = () => {
    if (process.platform === 'win32') {
      exec('tasklist', (error, stdout) => {
        if (error) {
          console.error('Error checking processes:', error);
          return;
        }

        const processes = stdout.toLowerCase();
        
        for (const cheatTool of suspiciousProcesses) {
          if (processes.includes(cheatTool)) {
            console.warn(`⚠️ Suspicious process detected: ${cheatTool}`);
            
            // Report to server
            reportToServer('cheat_tool_detected', { tool: cheatTool });

            // In production, exit
            if (process.env.NODE_ENV === 'production') {
              console.warn('⚠️ Cheat tool detected - closing app');
              app.quit();
            }
          }
        }
      });
    } else if (process.platform === 'darwin') {
      // macOS - use 'ps' command
      exec('ps aux', (error, stdout) => {
        if (error) return;

        const processes = stdout.toLowerCase();
        
        for (const cheatTool of suspiciousProcesses) {
          if (processes.includes(cheatTool)) {
            console.warn(`⚠️ Suspicious process detected: ${cheatTool}`);
            reportToServer('cheat_tool_detected', { tool: cheatTool });
            
            if (process.env.NODE_ENV === 'production') {
              app.quit();
            }
          }
        }
      });
    }
  };

  // Check every 5 seconds
  processMonitorInterval = setInterval(checkProcesses, 5000);
  
  // Initial check
  checkProcesses();
}

function stopProcessMonitoring() {
  if (processMonitorInterval) {
    clearInterval(processMonitorInterval);
    processMonitorInterval = null;
    console.log('🛑 Process monitoring stopped');
  }
}

/**
 * Report security event to server
 */
async function reportToServer(event, metadata) {
  try {
    // Get the API URL from environment or use default
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
    
    await axios.post(`${apiUrl}/api/security/log-event`, {
      event,
      metadata,
    }, {
      timeout: 5000,
    });
  } catch (error) {
    console.error('Failed to report to server:', error.message);
  }
}

/**
 * Initialize all anti-cheat measures
 */
function initializeAntiCheat(mainWindow) {
  console.log('🛡️ Initializing Electron anti-cheat system...');

  enableAntiDebug(mainWindow);
  
  // Only monitor processes in production
  if (process.env.NODE_ENV === 'production') {
    startProcessMonitoring();
  }

  console.log('✅ Anti-cheat system initialized');
}

/**
 * Clean up on app quit
 */
function cleanupAntiCheat() {
  stopProcessMonitoring();
}

module.exports = {
  enableAntiDebug,
  startProcessMonitoring,
  stopProcessMonitoring,
  initializeAntiCheat,
  cleanupAntiCheat,
};
