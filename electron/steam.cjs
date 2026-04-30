const steamworks = require('steamworks.js');

let client = null;
let isInitialized = false;

function initSteam() {
  try {
    // Try to initialize Steam
    client = steamworks.init();
    isInitialized = true;
    
    console.log('🎮 [Steam] Initialized successfully!');
    console.log(`👤 [Steam] User: ${client.localplayer.getName()}`);
    
    // Check if we are running with the correct AppID
    if (client.utils.isSteamRunning()) {
      console.log('✅ [Steam] Steam is running.');
    }
    
    return true;
  } catch (err) {
    console.error('❌ [Steam] Failed to initialize:', err.message);
    return false;
  }
}

function unlockAchievement(achievementId) {
  if (!isInitialized || !client) return;
  
  try {
    const achievement = client.achievement.get(achievementId);
    if (achievement && !achievement.unlocked) {
      client.achievement.activate(achievementId);
      console.log(`🏆 [Steam] Achievement Unlocked: ${achievementId}`);
    }
  } catch (err) {
    console.error(`❌ [Steam] Failed to unlock achievement ${achievementId}:`, err.message);
  }
}

function setStat(statName, value) {
  if (!isInitialized || !client) return;
  
  try {
    client.stats.set(statName, value);
    client.stats.store();
  } catch (err) {
    console.error(`❌ [Steam] Failed to set stat ${statName}:`, err.message);
  }
}

function getSteamClient() {
  return client;
}

module.exports = {
  initSteam,
  unlockAchievement,
  setStat,
  getSteamClient,
  isInitialized: () => isInitialized
};
