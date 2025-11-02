# 🔌 Electron Integration Examples

Quick copy-paste examples for integrating Electron features into Folkhart

---

## 1. GamePage.tsx - Add Tray Sync

```typescript
// At the top of GamePage.tsx
import { useTraySync } from '@/hooks/useElectron';

// Inside the GamePage component
function GamePage() {
  const player = usePlayerStore(state => state.player);
  const character = usePlayerStore(state => state.character);
  
  // Auto-sync tray with player data (updates every time player/character changes)
  useTraySync(player, character);

  // ... rest of your component
}
```

---

## 2. DungeonService - Notify on Completion

```typescript
// In dungeon.service.ts or wherever you handle dungeon completion
import { useGameNotifications } from '@/hooks/useElectron';

// When dungeon completes
const { notifyDungeonComplete } = useGameNotifications();

await resolveDungeonRun(runId);

// Notify user
if (window.electron) {
  notifyDungeonComplete(dungeon.name, {
    gold: rewards.goldEarned,
    exp: rewards.expEarned,
    items: rewards.items.map(i => i.name)
  });
}
```

---

## 3. Energy System - Notify When Full

```typescript
// In GamePage.tsx or wherever you check energy
import { useGameNotifications } from '@/hooks/useElectron';

const { notifyEnergyFull } = useGameNotifications();

useEffect(() => {
  // Check if energy just became full
  if (player?.energy === player?.maxEnergy) {
    notifyEnergyFull();
  }
}, [player?.energy, player?.maxEnergy, notifyEnergyFull]);
```

---

## 4. Guild Chat - Notify on Message

```typescript
// In your socket handler or GuildTab
import { useGameNotifications } from '@/hooks/useElectron';

const { notifyGuildMessage } = useGameNotifications();

socket.on('guildMessage', (message) => {
  // ... existing logic
  
  // Notify if window is not focused and it's not your own message
  if (window.electron && message.username !== currentUser.name) {
    notifyGuildMessage(message.username, message.content);
  }
});
```

---

## 5. Level Up Notification

```typescript
// When character levels up
import { useGameNotifications } from '@/hooks/useElectron';

const { notifyLevelUp } = useGameNotifications();

// After level up
if (leveledUp) {
  notifyLevelUp(newLevel);
}
```

---

## 6. Idle Farming Complete

```typescript
// In socket handler for idle complete
import { useGameNotifications } from '@/hooks/useElectron';

const { notifyIdleComplete } = useGameNotifications();

socket.on('idleComplete', (data) => {
  // ... existing logic
  
  notifyIdleComplete({
    gold: data.goldEarned,
    exp: data.expEarned
  });
});
```

---

## 7. Show Electron Badge (Optional)

```typescript
// In GamePage.tsx - show a badge when running in desktop app
import { useElectron } from '@/hooks/useElectron';

function GamePage() {
  const { isElectron } = useElectron();

  return (
    <div className="h-screen bg-stone-900">
      {isElectron && (
        <div className="fixed top-2 right-2 z-50 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          🖥️ Desktop App
        </div>
      )}
      
      {/* Rest of your game */}
    </div>
  );
}
```

---

## 8. Check Electron in Any Component

```typescript
// Quick check if running in Electron
if (window.electron?.isElectron) {
  // Electron-specific code
  window.electron.notify({
    title: 'Hello!',
    body: 'Running in Electron'
  });
}
```

---

## 9. Platform-Specific Code

```typescript
import { useElectron } from '@/hooks/useElectron';

function MyComponent() {
  const { platform } = useElectron();

  return (
    <div>
      {platform.isWindows && <div>Windows-specific UI</div>}
      {platform.isMac && <div>Mac-specific UI</div>}
      {platform.isLinux && <div>Linux-specific UI</div>}
    </div>
  );
}
```

---

## 10. Custom Notification

```typescript
import { useElectron } from '@/hooks/useElectron';

function MyComponent() {
  const { notify } = useElectron();

  const showCustomNotif = () => {
    notify({
      title: '🎉 Achievement Unlocked!',
      body: 'You defeated the Dragon!',
      urgency: 'normal',
      onClick: { action: 'openGame', tab: 'achievements' }
    });
  };

  return <button onClick={showCustomNotif}>Show Notification</button>;
}
```

---

## 11. Badge Count (For Unread Messages)

```typescript
import { useElectron } from '@/hooks/useElectron';

function GuildTab() {
  const { setBadge } = useElectron();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Update badge when unread count changes
    setBadge(unreadCount);
  }, [unreadCount, setBadge]);
}
```

---

## 12. Get App Version

```typescript
import { useElectron } from '@/hooks/useElectron';
import { useEffect, useState } from 'react';

function SettingsTab() {
  const { getAppVersion, isElectron } = useElectron();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isElectron) {
      getAppVersion().then(setVersion);
    }
  }, [isElectron, getAppVersion]);

  return (
    <div>
      {version && (
        <div className="text-gray-400 text-sm">
          Desktop App v{version}
        </div>
      )}
    </div>
  );
}
```

---

## Quick Integration Steps:

1. **Add tray sync to GamePage.tsx** (Example 1)
2. **Add energy notification** (Example 3)
3. **Add dungeon completion notification** (Example 2)
4. **Add guild message notification** (Example 4)
5. **Add level up notification** (Example 5)
6. **Optional: Show desktop app badge** (Example 7)

---

## Testing Your Integration:

1. Run in development:
   ```bash
   npm run electron:dev
   ```

2. Trigger events:
   - Complete a dungeon → Should show notification
   - Wait for energy to fill → Should show notification
   - Send guild message → Should show notification
   - Level up → Should show notification

3. Check system tray:
   - Minimize window → Should go to tray
   - Right-click tray → Should show player stats
   - Energy changes → Tray should update

---

That's it! Your Folkhart game now has full desktop app integration! 🎉
