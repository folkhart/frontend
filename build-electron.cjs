/**
 * Build script that loads .env before running electron-builder
 */

require('dotenv').config();
const { execSync } = require('child_process');

console.log('📦 Building Electron app...');
console.log('🔑 Loading environment variables from .env');

if (process.env.GH_TOKEN) {
  console.log('✅ GitHub token found');
} else {
  console.log('⚠️  Warning: GH_TOKEN not found in .env');
}

try {
  // Run electron-builder
  console.log('🚀 Running electron-builder...');
  execSync('electron-builder --win', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
