import { app, BrowserWindow } from 'electron';
import { exec } from 'child_process';
import axios from 'axios';

/**
 * Enable anti-debug protection
 */
export const enableAntiDebug = (mainWindow: BrowserWindow) => {
  console.log('🛡️ Enabling anti-debug protection...');

  // Detect DevTools opening
  mainWindow.webContents.on('devtools-opened', () => {
    console.warn('⚠️ DevTools detected!');
    
    // Report to server
    reportToServer('devtools_opened');

    // In production, you might want to close the app
    if (process.env.NODE_ENV === 'production') {
      // Option 1: Close app
      // app.quit();
      
      // Option 2: Just warn
      console.warn('⚠️ DevTools are not allowed in production');
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
};

/**
 * Process monitoring - detect cheat tools
 */
let processMonitorInterval: NodeJS.Timeout | null = null;

export const startProcessMonitoring = () => {
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

            // In production, you might want to exit
            if (process.env.NODE_ENV === 'production') {
              // Option 1: Exit immediately
              // app.quit();
              
              // Option 2: Just log and continue
              console.warn('⚠️ Cheat tool detected but continuing...');
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
          }
        }
      });
    }
  };

  // Check every 5 seconds
  processMonitorInterval = setInterval(checkProcesses, 5000);
  
  // Initial check
  checkProcesses();
};

export const stopProcessMonitoring = () => {
  if (processMonitorInterval) {
    clearInterval(processMonitorInterval);
    processMonitorInterval = null;
    console.log('🛑 Process monitoring stopped');
  }
};

/**
 * Report security event to server
 */
const reportToServer = async (event: string, metadata?: any) => {
  try {
    // Get the API URL from environment
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
    
    await axios.post(`${apiUrl}/api/security/log-event`, {
      event,
      metadata,
    });
  } catch (error) {
    console.error('Failed to report to server:', error);
  }
};

/**
 * Certificate pinning (for HTTPS connections)
 */
export const enableCertificatePinning = () => {
  // Note: Certificate pinning is complex and requires your actual certificate hash
  // This is a placeholder for the implementation
  
  console.log('🔒 Certificate pinning enabled (placeholder)');
  
  // In a real implementation, you would:
  // 1. Get your server's certificate hash
  // 2. Use session.setCertificateVerifyProc() to validate it
  // 3. Reject connections if the certificate doesn't match
  
  /*
  app.on('ready', () => {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      const { certificate } = request;
      const certHash = crypto.createHash('sha256').update(certificate.data).digest('hex');
      
      const PINNED_CERTIFICATES = ['your_cert_hash_here'];
      const isPinned = PINNED_CERTIFICATES.includes(certHash);
      
      if (!isPinned) {
        console.error('⛔ Certificate pinning failed! Possible MITM attack!');
        callback(-3); // Reject
      } else {
        callback(0); // Accept
      }
    });
  });
  */
};

/**
 * Disable Node integration in production
 */
export const secureWebPreferences = () => {
  return {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
  };
};

/**
 * Initialize all anti-cheat measures
 */
export const initializeAntiCheat = (mainWindow: BrowserWindow) => {
  console.log('🛡️ Initializing Electron anti-cheat system...');

  enableAntiDebug(mainWindow);
  
  // Only monitor processes in production
  if (process.env.NODE_ENV === 'production') {
    startProcessMonitoring();
  }

  // Certificate pinning would go here
  // enableCertificatePinning();

  console.log('✅ Anti-cheat system initialized');
};

/**
 * Clean up on app quit
 */
export const cleanupAntiCheat = () => {
  stopProcessMonitoring();
};
