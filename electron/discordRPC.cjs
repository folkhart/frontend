const DiscordRPC = require('discord-rpc');

let rpc = null;
let isReady = false;
let pendingUpdate = null;
const clientId = '1499162924172705903';

function initDiscordRPC() {
  console.log('🔌 [Discord] Connecting...');
  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    isReady = true;
    console.log('✅ [Discord] Connected as:', rpc.user.username);
    
    if (pendingUpdate) {
      console.log('📤 [Discord] Sending queued update...');
      updatePresence(...pendingUpdate);
      pendingUpdate = null;
    }
  });

  rpc.login({ clientId }).catch(err => {
    console.error('❌ [Discord] Login Error:', err.message);
  });
}

function updatePresence(details, state, largeImageKey, largeImageText, startTimestamp, endTimestamp, smallImageKey, smallImageText) {
  if (!rpc) return;

  if (!isReady) {
    pendingUpdate = [details, state, largeImageKey, largeImageText, startTimestamp, endTimestamp, smallImageKey, smallImageText];
    return;
  }

  const activity = {
    details,
    state,
    largeImageKey: largeImageKey || 'game_logo',
    largeImageText: largeImageText || 'Folkhart',
    instance: false,
    buttons: [
      { label: "Join Discord", url: "https://discord.gg/tzT36qXbWr" }
    ]
  };

  if (startTimestamp) activity.startTimestamp = startTimestamp;
  if (endTimestamp) activity.endTimestamp = endTimestamp;
  if (smallImageKey) {
    activity.smallImageKey = smallImageKey;
    activity.smallImageText = smallImageText || details;
  }

  rpc.setActivity(activity).catch(err => {
    console.error('❌ [Discord] Activity Error:', err.message);
  });
}

function clearPresence() {
  if (!rpc || !isReady) return;
  rpc.clearActivity().catch(err => console.error(err));
}

module.exports = { initDiscordRPC, updatePresence, clearPresence };
