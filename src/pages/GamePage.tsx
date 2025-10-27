import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { authApi, characterApi } from '@/lib/api';
import { onIdleComplete, onDungeonComplete, onLevelUp } from '@/lib/socket';
import LoadingScreen from '@/components/LoadingScreen';
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
import NotificationToast from '@/components/NotificationToast';
import Toast from '@/components/Toast';
import Onboarding from '@/components/Onboarding';
import LevelUpModal from '@/components/modals/LevelUpModal';

export default function GamePage() {
  const navigate = useNavigate();
  const { activeTab, setPlayer, setCharacter, character, player } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; unlocks?: string[] } | null>(null);

  useEffect(() => {
    loadPlayerData();
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
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);

      if (!profile.character) {
        navigate('/create-character');
        return;
      }

      const { data: characterData } = await characterApi.get();
      setCharacter(characterData);
    } catch (err) {
      console.error('Failed to load player data:', err);
    } finally {
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
      loadPlayerData();
    });

    onDungeonComplete((data) => {
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Dungeon Complete!',
          message: `Earned ${data.goldEarned} gold and ${data.expEarned} exp`,
        });
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
      // Refresh character data
      loadPlayerData();
    });
  };

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

  return (
    <div className="h-screen bg-stone-900">
      <TopBar />
      
      <div className="overflow-y-auto" style={{ paddingTop: '72px', paddingBottom: '80px', height: '100vh' }}>
        {activeTab === 'village' && <VillageTab />}
        {activeTab === 'adventure' && <AdventureTab />}
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
    </div>
  );
}
