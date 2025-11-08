import { useState, useRef, useEffect } from 'react';
import { useGameStore } from "@/store/gameStore";
import adventureIcon from "@/assets/ui/adventure.png";
import villageIcon from "@/assets/ui/village.png";
import guildIcon from "@/assets/ui/guild.png";
import shopIcon from "@/assets/ui/shop.png";
import settingsIcon from "@/assets/ui/settings.png";
import bossIcon from "@/assets/ui/boss.png";

export default function BottomNav() {
  const { activeTab, setActiveTab, hasUnreadServerMessages, hasUnreadGuildMessages, hasUnreadFriendMessages, hasGuildInvitations } = useGameStore();
  const [showAdventureMenu, setShowAdventureMenu] = useState(false);
  const [adventureMode, setAdventureMode] = useState<'adventure' | 'worldboss'>('adventure');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAdventureMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: "village" as const, icon: villageIcon, label: "Village" },
    { id: "guild" as const, icon: guildIcon, label: "Guild" },
    { id: "adventure" as const, icon: adventureIcon, label: "Adventure" },
    { id: "shop" as const, icon: shopIcon, label: "Shop" },
    { id: "settings" as const, icon: settingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-stone-800 border-t-2 border-stone-700 flex justify-around py-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const showNotification = (tab.id === 'adventure' && hasUnreadServerMessages && !isActive) ||
                                 (tab.id === 'guild' && (hasUnreadGuildMessages || hasGuildInvitations) && !isActive) ||
                                 (tab.id === 'settings' && hasUnreadFriendMessages && !isActive);
        
        return (
          <div key={tab.id} className="relative" ref={tab.id === 'adventure' ? menuRef : undefined}>
            <button
              onClick={() => {
                if (tab.id === 'adventure') {
                  setShowAdventureMenu(!showAdventureMenu);
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded transition btn-press relative ${
                isActive
                  ? "bg-amber-700 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
            {showNotification && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-stone-800 animate-pulse" />
            )}
            <img
              src={tab.icon}
              alt={tab.label}
              className={`w-7 h-7 object-contain transition-all ${
                isActive
                  ? "brightness-125 scale-110"
                  : "brightness-75 hover:brightness-100"
              }`}
            />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>

            {/* Adventure Dropdown Menu */}
            {tab.id === 'adventure' && showAdventureMenu && (
              <div
                className="absolute bottom-full left-0 mb-2 bg-stone-800 border-2 border-amber-600 shadow-lg"
                style={{
                  borderRadius: '0',
                  minWidth: '180px',
                  boxShadow: '0 4px 0 #92400e, 0 8px 0 rgba(0,0,0,0.3)',
                }}
              >
                <button
                  onClick={() => {
                    setAdventureMode('adventure');
                    setActiveTab('adventure');
                    setShowAdventureMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-stone-700 transition ${
                    adventureMode === 'adventure' ? 'bg-amber-700 text-white' : 'text-gray-300'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  <img
                    src={adventureIcon}
                    alt="Adventure"
                    className="w-6 h-6"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="font-bold">ADVENTURE</span>
                </button>
                <button
                  onClick={() => {
                    setAdventureMode('worldboss');
                    setActiveTab('worldboss' as any);
                    setShowAdventureMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-stone-700 transition ${
                    adventureMode === 'worldboss' ? 'bg-red-700 text-white' : 'text-gray-300'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  <img
                    src={bossIcon}
                    alt="World Boss"
                    className="w-6 h-6"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="font-bold">WORLD BOSS</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
