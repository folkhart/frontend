import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/store/gameStore';
import { authApi } from '@/lib/api';
import { onIdleComplete, onDungeonComplete, onLevelUp, getSocket } from '@/lib/socket';
import { useElectron, useTraySync, useEnergyTracking } from '@/hooks/useElectron';
import { notificationService } from '@/services/notificationService';
import { clearAllAuthData } from '@/utils/authUtils';
import LoadingScreen from '@/components/LoadingScreen';
import ElectronTitleBar from '@/components/ElectronTitleBar';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import VillageTab from '@/components/tabs/VillageTab';
import AdventureTab from '@/components/tabs/AdventureTab';
import GuildTab from '@/components/tabs/GuildTab';
import ShopTab from '@/components/tabs/ShopTab';
import LeaderboardTab from '@/components/tabs/LeaderboardTab';
import FriendsTab from '@/components/tabs/FriendsTab';
import NewsTab from '@/components/tabs/NewsTab';
import AdminTab from '@/components/tabs/AdminTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import WorldBossTab from '@/components/tabs/WorldBossTab';
import NotificationToast from '@/components/NotificationToast';
import Toast from '@/components/Toast';
import Onboarding from '@/components/Onboarding';
import LevelUpModal from '@/components/modals/LevelUpModal';
import DailyLoginPopup from '@/components/DailyLoginPopup';
import HalloweenFramePopup from '@/components/HalloweenFramePopup';

export default function GamePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTab, setPlayer, setCharacter, character, player, setHasUnreadGuildMessages } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; unlocks?: string[] } | null>(null);
  const [showVersionPopup, setShowVersionPopup] = useState(false);

  // Electron hooks
  const {
    sendIdleComplete,
    sendDungeonComplete,
    sendLevelUp,
    sendAchievementUnlocked
  } = useElectron();

  // Auto-sync tray and energy
  useTraySync(player, character);
  useEnergyTracking(player);

  useEffect(() => {
    checkVersionAndLoad();
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setupSocketListeners();
    
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const checkVersionAndLoad = async () => {
    try {
      console.log('🔍 Starting version check...');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Add 10-second timeout to version check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/api/version/check`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log('📦 Version data:', data);
      
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      console.log('⏰ Last login time:', lastLoginTime);
      
      // Force logout if user logged in before the force logout timestamp
      // OR if lastLoginTime doesn't exist (old users before this feature was added)
      if (!lastLoginTime || parseInt(lastLoginTime) < data.forceLogoutTimestamp) {
        console.log('🔄 Force logout triggered:', {
          lastLoginTime: lastLoginTime ? parseInt(lastLoginTime) : 'not set',
          forceLogoutTimestamp: data.forceLogoutTimestamp,
          shouldLogout: !lastLoginTime || parseInt(lastLoginTime) < data.forceLogoutTimestamp
        });
        setLoading(false); // Stop loading screen so popup is visible
        setShowVersionPopup(true);
        return;
      }
      
      console.log('✅ Version check passed, loading player data...');
      await loadPlayerData();
    } catch (error) {
      console.error('❌ Version check failed, proceeding with login:', error);
      await loadPlayerData();
    }
  };

  const handleVersionLogout = () => {
    clearAllAuthData();
    // Force full page reload to landing page to clear all state
    window.location.href = '/';
  };

  // Energy regeneration timer - regenerate 1 energy every 5 minutes
  useEffect(() => {
    if (!player || player.energy >= player.maxEnergy) return;

    // Calculate when next energy should regenerate
    const lastUpdate = player.energyUpdatedAt ? new Date(player.energyUpdatedAt).getTime() : Date.now();
    const timeSinceLastUpdate = Date.now() - lastUpdate;
    const timeUntilNextEnergy = 300000 - (timeSinceLastUpdate % 300000); // 5 minutes in ms

    const timeout = setTimeout(() => {
      // Refetch player data from server to get updated energy
      authApi.getProfile().then(({ data: profile }) => {
        setPlayer(profile);
      });
    }, timeUntilNextEnergy);

    return () => clearTimeout(timeout);
  }, [player?.energy, player?.energyUpdatedAt]);

  const loadPlayerData = async () => {
    try {
      console.log('📡 Fetching player profile...');
      const { data: profile } = await authApi.getProfile();
      console.log('✅ Profile loaded:', profile);
      setPlayer(profile);

      // Check if player has a character
      if (!profile.character) {
        console.log('⚠️ No character found, redirecting to character creation');
        navigate('/create-character');
        return;
      }

      console.log('✅ Character found:', profile.character.name);
      // Use character data from profile (it's already included)
      setCharacter(profile.character);
      console.log('✅ Game loaded successfully!');
    } catch (err: any) {
      console.error('❌ Failed to load player data:', err);
      console.error('Error details:', err.response?.data || err.message);
      // If profile fetch fails, redirect to login
      console.log('🔄 Redirecting to login...');
      navigate('/');
    } finally {
      console.log('🏁 Loading finished, hiding loading screen');
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    onIdleComplete((data) => {
      setNotification({
        type: 'success',
        title: 'Idle Farming Complete!',
        message: `Earned ${data.goldEarned} gold and ${data.expEarned} exp`,
      });
      
      // Electron notification
      sendIdleComplete(data.goldEarned, data.expEarned);
      
      // Mobile/Web notification
      notificationService.notifyIdleFarmingComplete(data.goldEarned, data.expEarned);
      
      loadPlayerData();
    });

    onDungeonComplete((data) => {
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Dungeon Complete!',
          message: `Earned ${data.goldEarned} gold and ${data.expEarned} exp`,
        });
        
        // Electron notification
        sendDungeonComplete(
          data.dungeonName || 'Dungeon',
          data.goldEarned,
          data.expEarned,
          data.items?.map((item: any) => item.name)
        );
      } else {
        setNotification({
          type: 'error',
          title: 'Dungeon Failed',
          message: 'Better luck next time!',
        });
      }
      loadPlayerData();
    });

    onLevelUp((data) => {
      // Show level-up modal instead of toast
      setLevelUpData({
        newLevel: data.newLevel,
        unlocks: data.unlocks || [],
      });
      
      // Electron notification
      sendLevelUp(data.newLevel);
      
      // Refresh character data
      loadPlayerData();
    });

    // Listen for guild chat messages globally
    // Note: GuildTab will handle clearing notifications when chat view is open
    const socket = getSocket();
    if (socket) {
      socket.on('guild_chat_message', () => {
        // Always set unread flag - GuildTab will clear it if chat is open
        setHasUnreadGuildMessages(true);
      });

      // Listen for achievement completions
      socket.on('achievement:completed', (data: any) => {
        (window as any).showToast?.(
          `🏆 Achievement Unlocked: ${data.name}! +${data.rewards.gold}g, +${data.rewards.gems} gems`,
          'success'
        );
        
        // Electron notification
        sendAchievementUnlocked(data.name, data.description || 'Achievement unlocked!');
        
        // Refresh achievement data
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
        queryClient.invalidateQueries({ queryKey: ['achievement-stats'] });
      });
    }
  };

  // Show version popup FIRST (highest priority)
  if (showVersionPopup) {
    return (
      <>
        <LoadingScreen />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-75 animate-fade-in">
          <div className="relative bg-stone-800 border-4 border-red-600 shadow-2xl max-w-lg w-full animate-bounce-in">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 border-b-4 border-red-700">
              <h2 className="text-white font-bold retro-text text-lg text-center">
                ⚠️ VERSION UPDATED ⚠️
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-900 border-2 border-red-700 p-4 text-center">
                <p className="text-red-200 retro-text text-sm mb-2">
                  The game has been updated!
                </p>
                <p className="text-red-400 retro-text text-base font-bold">
                  You will be logged out.
                </p>
              </div>

              <p className="text-red-200 retro-text text-xs text-center leading-relaxed">
                Please log in again to continue playing with the latest version.
              </p>

              {/* Button */}
              <button
                onClick={handleVersionLogout}
                className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold border-4 border-red-800 hover:from-red-600 hover:to-red-500 transform hover:scale-105 transition-all retro-text text-sm"
              >
                🔄 LOG OUT & CONTINUE
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!character) {
    return <LoadingScreen />;
  }

  // Expose showToast function globally for child components
  (window as any).showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // Expose restartOnboarding function globally for Settings tab
  (window as any).restartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  // Adjust padding based on Electron
  const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;
  const contentPaddingTop = isElectron ? '120px' : '72px'; // Titlebar (48px) + TopBar (72px) in Electron, just TopBar (72px) in browser

  return (
    <div className="h-screen bg-stone-900">
      <ElectronTitleBar />
      <TopBar />
      
      <div className="overflow-y-auto" style={{ paddingTop: contentPaddingTop, paddingBottom: '80px', height: '100vh' }}>
        {activeTab === 'village' && <VillageTab />}
        {activeTab === 'adventure' && <AdventureTab />}
        {activeTab === 'worldboss' && <WorldBossTab />}
        {activeTab === 'guild' && <GuildTab />}
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'news' && <NewsTab />}
        {activeTab === 'admin' && <AdminTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
      
      <BottomNav />

      {notification && (
        <NotificationToast
          {...notification}
          onClose={() => setNotification(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {levelUpData && (
        <LevelUpModal
          isOpen={true}
          onClose={() => setLevelUpData(null)}
          newLevel={levelUpData.newLevel}
          unlocks={levelUpData.unlocks}
        />
      )}

      {/* Daily Login Popup - Shows on login */}
      <DailyLoginPopup />

      {/* Halloween Frame Popup - Shows after login (one time) */}
      <HalloweenFramePopup />
    </div>
  );
}
