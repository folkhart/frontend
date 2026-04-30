import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useElectron } from './useElectron';

export function useDiscordRPC() {
  const { character, activeTab, isAuthenticated } = useGameStore();
  const { updatePresence, clearPresence, isElectron } = useElectron();

  useEffect(() => {
    const isDiscordEnabled = localStorage.getItem('discordRPCEnabled') !== 'false';

    if (!isElectron || !isAuthenticated || !character || !isDiscordEnabled) {
      if (isElectron) {
        clearPresence();
      }
      return;
    }

    const performUpdate = () => {
      let details = `${character.class} | Level ${character.level}`;
      let state = 'Playing Folkhart';
      let endTimestamp = undefined;

      // 1. Try to get active dungeon from localStorage
      const savedRun = localStorage.getItem('activeDungeonRun');
      let dungeonName = '';
      if (savedRun) {
        try {
          const run = JSON.parse(savedRun);
          if (run.dungeon?.name && !run.completed) {
            dungeonName = run.dungeon.name;
            if (run.completesAt) {
              endTimestamp = Math.floor(new Date(run.completesAt).getTime() / 1000);
            }
          }
        } catch (e) {}
      }

      // 2. Determine state based on priority: Active Tab > Dungeon > Idle
      if (activeTab !== 'adventure' && activeTab !== 'village') {
        // If user is actively looking at a specific feature, show that
        switch (activeTab) {
          case 'shop': state = 'Browsing the Shops'; break;
          case 'guild': state = 'Hanging out at the Guild'; break;
          case 'leaderboard': state = 'Checking the Rankings'; break;
          case 'friends': state = 'Chatting with Friends'; break;
          case 'worldboss': state = 'Fighting a World Boss'; break;
          default: state = 'Playing Folkhart';
        }
      } else if (dungeonName) {
        // If in adventure/village tab but a dungeon is running, show the dungeon
        state = `Exploring ${dungeonName}`;
      } else if (character.currentActivityType === 'idle' || character.currentActivityType === 'farming') {
        state = 'Idle Farming';
        if (character.activityEndsAt) {
          endTimestamp = Math.floor(new Date(character.activityEndsAt).getTime() / 1000);
        }
      } else if (activeTab === 'village') {
        state = 'Resting in the Village';
      } else {
        state = 'Preparing for Adventure';
      }

      updatePresence({
        details,
        state,
        largeImageKey: 'game_logo',
        largeImageText: 'Folkhart',
        smallImageKey: `class_${character.class.toLowerCase().replace(/\s+/g, '_')}`,
        smallImageText: character.class,
        ...(endTimestamp ? { endTimestamp } : { startTimestamp: Math.floor(Date.now() / 1000) })
      });
    };

    // Run immediately and then every 5 seconds
    performUpdate();
    const intervalId = setInterval(performUpdate, 5000);

    return () => clearInterval(intervalId);
  }, [character, activeTab, isAuthenticated, isElectron, updatePresence, clearPresence]);
}
