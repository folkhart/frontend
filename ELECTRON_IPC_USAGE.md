# 🔌 Electron IPC Usage Guide - All Features

Complete guide for using all Electron IPC handlers in your Folkhart game.

---

## ✅ What Was Added

### **IPC Handlers (Main Process):**
- ⚡ Energy tracking & notifications
- 💬 Guild messages & events
- 👋 Friend system notifications
- 🎮 Game event notifications
- 🪟 Window actions (flash, etc.)

### **React Hooks:**
- `useElectron()` - Main hook with all methods
- `useGameNotifications()` - Legacy notification helpers
- `useTraySync()` - Auto-sync tray stats
- `useEnergyTracking()` - Auto energy notifications

---

## 🎯 Quick Integration Examples

### 1. **GamePage.tsx - Auto Tracking**

```typescript
import { useElectron, useTraySync, useEnergyTracking } from '@/hooks/useElectron';

function GamePage() {
  const player = usePlayerStore(state => state.player);
  const character = usePlayerStore(state => state.character);

  // Auto-sync tray with player stats
  useTraySync(player, character);

  // Auto-track energy for notifications
  useEnergyTracking(player);

  return <div>{/* Your game UI */}</div>;
}
```

---

### 2. **Dungeon Complete - Socket Handler**

```typescript
import { useElectron } from '@/hooks/useElectron';

function setupSocketListeners() {
  const { sendDungeonComplete } = useElectron();

  onDungeonComplete((data) => {
    // ... your existing logic
    
    // Send notification
    sendDungeonComplete(
      data.dungeonName,
      data.gold,
      data.exp,
      data.items?.map(i => i.name)
    );
  });
}
```

---

### 3. **Guild Chat - Real-time Messages**

```typescript
import { useElectron } from '@/hooks/useElectron';

function GuildChatComponent() {
  const { sendGuildMessage } = useElectron();
  const currentUsername = usePlayerStore(state => state.character?.name);

  useEffect(() => {
    socket.on('guildMessage', (message) => {
      // Check if it's not your own message
      if (message.username !== currentUsername) {
        // Check if you're mentioned
        const isMention = message.content.includes(`@${currentUsername}`);
        
        sendGuildMessage(message.username, message.content, isMention);
      }
    });
  }, [currentUsername, sendGuildMessage]);
}
```

---

### 4. **Guild Invite**

```typescript
import { useElectron } from '@/hooks/useElectron';

function handleGuildInvite(invite) {
  const { sendGuildInvite } = useElectron();
  
  sendGuildInvite(invite.guildName, invite.inviterName);
}
```

---

### 5. **Friend Request**

```typescript
import { useElectron } from '@/hooks/useElectron';

function FriendRequestNotification() {
  const { sendFriendRequest } = useElectron();

  useEffect(() => {
    socket.on('friendRequest', (data) => {
      sendFriendRequest(data.username);
    });
  }, [sendFriendRequest]);
}
```

---

### 6. **Friend Online Status**

```typescript
import { useElectron } from '@/hooks/useElectron';

function FriendsList() {
  const { sendFriendOnline } = useElectron();

  useEffect(() => {
    socket.on('friendOnline', (data) => {
      sendFriendOnline(data.username);
    });
  }, [sendFriendOnline]);
}
```

---

### 7. **Direct Messages**

```typescript
import { useElectron } from '@/hooks/useElectron';

function DirectMessaging() {
  const { sendDirectMessage, flashWindow } = useElectron();

  useEffect(() => {
    socket.on('directMessage', (data) => {
      sendDirectMessage(data.username, data.message);
      flashWindow(); // Flash taskbar for important DMs
    });
  }, [sendDirectMessage, flashWindow]);
}
```

---

### 8. **Idle Farming Complete**

```typescript
import { useElectron } from '@/hooks/useElectron';

function setupSocketListeners() {
  const { sendIdleComplete } = useElectron();

  onIdleComplete((data) => {
    sendIdleComplete(data.gold, data.exp);
  });
}
```

---

### 9. **Level Up**

```typescript
import { useElectron } from '@/hooks/useElectron';

function CharacterStats() {
  const { sendLevelUp } = useElectron();
  const prevLevelRef = useRef(character?.level);

  useEffect(() => {
    if (character?.level && prevLevelRef.current && character.level > prevLevelRef.current) {
      sendLevelUp(character.level);
    }
    prevLevelRef.current = character?.level;
  }, [character?.level, sendLevelUp]);
}
```

---

### 10. **Achievement Unlocked**

```typescript
import { useElectron } from '@/hooks/useElectron';

function AchievementSystem() {
  const { sendAchievementUnlocked } = useElectron();

  const handleAchievement = (achievement) => {
    sendAchievementUnlocked(achievement.title, achievement.description);
  };
}
```

---

### 11. **Item Sold**

```typescript
import { useElectron } from '@/hooks/useElectron';

function InventoryTab() {
  const { sendItemSold } = useElectron();

  const sellItem = async (item) => {
    // ... sell logic
    sendItemSold(item.name, goldReceived);
  };
}
```

---

### 12. **Guild Events (Wars, Raids, etc.)**

```typescript
import { useElectron } from '@/hooks/useElectron';

function GuildEvents() {
  const { sendGuildEvent } = useElectron();

  useEffect(() => {
    socket.on('guildWar', (data) => {
      sendGuildEvent('War Started', `Guild war against ${data.enemyGuild}!`);
    });

    socket.on('guildRaid', (data) => {
      sendGuildEvent('Raid', `Guild raid on ${data.dungeon} starting soon!`);
    });
  }, [sendGuildEvent]);
}
```

---

### 13. **Badge Count (Unread Messages)**

```typescript
import { useElectron } from '@/hooks/useElectron';

function MessageSystem() {
  const { setBadge } = useElectron();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setBadge(unreadCount);
  }, [unreadCount, setBadge]);
}
```

---

### 14. **Flash Window (Important Events)**

```typescript
import { useElectron } from '@/hooks/useElectron';

function ImportantNotification() {
  const { flashWindow } = useElectron();

  const handleImportantEvent = () => {
    flashWindow(); // Flashes taskbar
  };
}
```

---

## 📋 Complete GamePage.tsx Example

```typescript
import { useEffect, useRef } from 'react';
import { useElectron, useTraySync, useEnergyTracking } from '@/hooks/useElectron';

export function GamePage() {
  const player = usePlayerStore(state => state.player);
  const character = usePlayerStore(state => state.character);
  const prevLevelRef = useRef(character?.level);
  
  const {
    sendGuildMessage,
    sendGuildInvite,
    sendFriendRequest,
    sendFriendOnline,
    sendDirectMessage,
    sendDungeonComplete,
    sendIdleComplete,
    sendLevelUp,
    sendAchievementUnlocked,
    flashWindow
  } = useElectron();

  // Auto-sync tray and energy
  useTraySync(player, character);
  useEnergyTracking(player);

  // Socket listeners
  useEffect(() => {
    // Guild messages
    socket.on('guildMessage', (msg) => {
      if (msg.username !== character?.name) {
        const isMention = msg.content.includes(`@${character?.name}`);
        sendGuildMessage(msg.username, msg.content, isMention);
      }
    });

    // Guild invites
    socket.on('guildInvite', (data) => {
      sendGuildInvite(data.guildName, data.inviterName);
      flashWindow();
    });

    // Friend requests
    socket.on('friendRequest', (data) => {
      sendFriendRequest(data.username);
    });

    // Friend online
    socket.on('friendOnline', (data) => {
      sendFriendOnline(data.username);
    });

    // Direct messages
    socket.on('directMessage', (data) => {
      sendDirectMessage(data.username, data.message);
      flashWindow();
    });

    // Dungeon complete
    socket.on('dungeonComplete', (data) => {
      sendDungeonComplete(
        data.dungeonName,
        data.gold,
        data.exp,
        data.items?.map(i => i.name)
      );
    });

    // Idle complete
    socket.on('idleComplete', (data) => {
      sendIdleComplete(data.gold, data.exp);
    });

    // Achievement
    socket.on('achievementUnlocked', (data) => {
      sendAchievementUnlocked(data.title, data.description);
    });

    return () => {
      socket.off('guildMessage');
      socket.off('guildInvite');
      socket.off('friendRequest');
      socket.off('friendOnline');
      socket.off('directMessage');
      socket.off('dungeonComplete');
      socket.off('idleComplete');
      socket.off('achievementUnlocked');
    };
  }, [character?.name]);

  // Level up detection
  useEffect(() => {
    if (character?.level && prevLevelRef.current && character.level > prevLevelRef.current) {
      sendLevelUp(character.level);
    }
    prevLevelRef.current = character?.level;
  }, [character?.level, sendLevelUp]);

  return (
    <div className="h-screen bg-stone-900">
      {/* Your game UI */}
    </div>
  );
}
```

---

## 🎯 Available Methods

### From `useElectron()`:

**Energy:**
- `sendEnergyStatus(energy, maxEnergy)` - Auto-handled by `useEnergyTracking()`

**Guild:**
- `sendGuildMessage(username, message, isMention?)` - Guild chat
- `sendGuildInvite(guildName, inviterName)` - Guild invitations
- `sendGuildEvent(eventType, message)` - Wars, raids, events

**Friends:**
- `sendFriendRequest(username)` - Friend requests
- `sendFriendOnline(username)` - Friend comes online
- `sendDirectMessage(username, message)` - Direct messages

**Game Events:**
- `sendIdleComplete(gold, exp)` - Idle farming done
- `sendDungeonComplete(name, gold, exp, items?)` - Dungeon cleared
- `sendLevelUp(newLevel)` - Character levels up
- `sendAchievementUnlocked(title, description)` - Achievement earned
- `sendItemSold(itemName, gold)` - Item sold

**Window:**
- `flashWindow()` - Flash taskbar
- `setBadge(count)` - Set app badge count
- `updateTray(playerData)` - Update tray menu

**Legacy (still works):**
- `notify(options)` - Custom notification

---

## ⚙️ Notification Features

### Smart Notifications:
- ✅ Only notifies if window is not focused (except mentions)
- ✅ Throttled (energy: 5 minutes between notifications)
- ✅ Queued (prevents spam)
- ✅ Urgency levels (low, normal, critical)
- ✅ Silent option for non-intrusive alerts

### Notification Types:
- **Low urgency** - Energy full, friend online
- **Normal urgency** - Dungeons, level ups, guild invites
- **Critical urgency** - Direct messages, @mentions

---

## 🧪 Testing

```typescript
// In your component
const { sendDungeonComplete, flashWindow } = useElectron();

// Test button
<button onClick={() => {
  sendDungeonComplete("Dragon's Lair", 1000, 500, ["Iron Sword", "Dragon Scale"]);
  flashWindow();
}}>
  Test Notification
</button>
```

---

## ✅ Integration Checklist

- [ ] Add `useTraySync(player, character)` to GamePage
- [ ] Add `useEnergyTracking(player)` to GamePage
- [ ] Add `sendGuildMessage()` to guild chat handler
- [ ] Add `sendGuildInvite()` to guild invite handler
- [ ] Add `sendFriendRequest()` to friend system
- [ ] Add `sendDungeonComplete()` to dungeon handler
- [ ] Add `sendIdleComplete()` to idle handler
- [ ] Add `sendLevelUp()` to level up detection
- [ ] Add `sendDirectMessage()` to DM handler
- [ ] Add `flashWindow()` to important events

---

## 🎉 Result

Your players will get:
- ⚡ Never miss energy refills
- 💬 Instant guild notifications
- 👋 Know when friends come online
- 🎮 All game events notified
- 📍 System tray with live stats
- 🔔 Smart, non-intrusive alerts

---

**Your desktop app now has complete notification support!** 🚀✨
