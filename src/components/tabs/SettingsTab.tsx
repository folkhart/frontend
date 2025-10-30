import { useState } from "react";
import { LogOut, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, messageApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { disconnectSocket } from "@/lib/socket";
import leaderboardIcon from "@/assets/ui/leaderboard.png";
import settingsIcon from "@/assets/ui/settings.png";
import achievementIcon from "@/assets/ui/achievement.png";
import newsIcon from "@/assets/ui/news/news.png";
import friendsIcon from "@/assets/ui/friends.png";
import documentationIcon from "@/assets/ui/documentation.png";
import tutorialIcon from "@/assets/ui/tutorial.png";
import userIcon from "@/assets/ui/settings/user.png";
import changePasswordIcon from "@/assets/ui/settings/changePassword.png";
import changeCharacterNameIcon from "@/assets/ui/settings/changeCharacterName.png";
import AchievementTab from "./AchievementTab";

export default function SettingsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    player,
    character,
    clearAuth,
    setActiveTab,
    setPlayer,
    setCharacter,
    hasUnreadFriendMessages,
    setHasUnreadFriendMessages,
  } = useGameStore();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newCharacterName, setNewCharacterName] = useState("");

  // Query for unread friend messages count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadFriendMessages'],
    queryFn: async () => {
      try {
        const { data } = await messageApi.getUnreadCount();
        setHasUnreadFriendMessages(data.count > 0);
        return data.count;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    navigate("/");
  };

  if (showAchievements) {
    return (
      <div className="p-4 pb-20">
        <button
          onClick={() => setShowAchievements(false)}
          className="mb-3 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
        >
          ← Back to Settings
        </button>
        <AchievementTab />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <img
          src={settingsIcon}
          alt="Settings"
          className="w-6 h-6"
          style={{ imageRendering: "pixelated" }}
        />
        Settings
      </h2>

      {/* Profile Section - Retro Style - Collapsible */}
      <div
        className="bg-gradient-to-b from-stone-700 to-stone-800 p-4 mb-4 relative"
        style={{
          border: "4px solid #57534e",
          borderRadius: "0",
          boxShadow:
            "0 4px 0 #292524, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={() => setProfileExpanded(!profileExpanded)}
          className="w-full flex items-center justify-between mb-4 pb-3 border-b-2 border-stone-600 hover:opacity-80 transition"
        >
          <div className="flex items-center gap-2">
            <img
              src={userIcon}
              alt="Profile"
              className="w-6 h-6"
              style={{ imageRendering: "pixelated" }}
            />
            <h3
              className="font-bold text-amber-400 text-lg"
              style={{
                fontFamily: "monospace",
                textShadow: "2px 2px 0 #000",
                letterSpacing: "1px",
              }}
            >
              PROFILE
            </h3>
          </div>
          {profileExpanded ? (
            <ChevronUp className="text-amber-400" size={24} />
          ) : (
            <ChevronDown className="text-amber-400" size={24} />
          )}
        </button>

        {profileExpanded && <div className="space-y-3">
          {/* Username */}
          <div
            className="bg-stone-900 p-3 border-2 border-stone-600"
            style={{
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-gray-400 text-xs font-bold"
                style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
              >
                USERNAME:
              </span>
              <span
                className="text-white font-bold"
                style={{ fontFamily: "monospace" }}
              >
                {player?.username}
              </span>
            </div>
          </div>

          {/* Email */}
          <div
            className="bg-stone-900 p-3 border-2 border-stone-600"
            style={{
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-gray-400 text-xs font-bold"
                style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
              >
                EMAIL:
              </span>
              <span
                className="text-white font-bold text-sm"
                style={{ fontFamily: "monospace" }}
              >
                {player?.email}
              </span>
            </div>
          </div>

          {/* Character Level */}
          {character && (
            <div
              className="bg-stone-900 p-3 border-2 border-stone-600"
              style={{
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-gray-400 text-xs font-bold"
                  style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
                >
                  LEVEL:
                </span>
                <span
                  className="text-amber-400 font-bold text-lg"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  {character.level}
                </span>
              </div>
            </div>
          )}

          {/* Character Name with Edit Icon */}
          {character && (
            <div
              className="bg-stone-900 p-3 border-2 border-stone-600"
              style={{
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-gray-400 text-xs font-bold"
                  style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
                >
                  CHARACTER NAME:
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-white font-bold"
                    style={{ fontFamily: "monospace" }}
                  >
                    {character.name}
                  </span>
                  <button
                    onClick={() => setShowChangeName(true)}
                    className="hover:scale-110 transition-transform"
                    title="Change Character Name (100 Gems)"
                  >
                    <img
                      src={changeCharacterNameIcon}
                      alt="Change Name"
                      className="w-5 h-5"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Change Icon Button */}
          <div
            className="bg-stone-900 p-3 border-2 border-stone-600"
            style={{
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-gray-400 text-xs font-bold"
                style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
              >
                PASSWORD:
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-white font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  ••••••••
                </span>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="hover:scale-110 transition-transform"
                  title="Change Password (Free)"
                >
                  <img
                    src={changePasswordIcon}
                    alt="Change Password"
                    className="w-5 h-5"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              </div>
            </div>
          </div>

        {/* Change Password Form */}
        {showChangePassword && (
          <div className="mt-4 p-3 bg-stone-900 border-2 border-blue-600 rounded">
            <h4 className="text-sm font-bold text-blue-400 mb-2">
              Change Password
            </h4>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 text-white text-sm"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 text-white text-sm"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 text-white text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (
                      passwordData.newPassword !== passwordData.confirmPassword
                    ) {
                      (window as any).showToast?.(
                        "Passwords do not match",
                        "error"
                      );
                      return;
                    }
                    try {
                      await api.post('/player/change-password', {
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword,
                      });
                      (window as any).showToast?.(
                        "Password changed successfully!",
                        "success"
                      );
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setShowChangePassword(false);
                    } catch (error: any) {
                      (window as any).showToast?.(
                        error.response?.data?.error ||
                          "Failed to change password",
                        "error"
                      );
                    }
                  }}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold"
                >
                  CONFIRM
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Character Name Form */}
        {showChangeName && (
          <div className="mt-4 p-3 bg-stone-900 border-2 border-purple-600 rounded">
            <h4 className="text-sm font-bold text-purple-400 mb-2">
              Change Character Name
            </h4>
            <p className="text-xs text-gray-400 mb-2">Cost: 100 Gems 💎</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="New Character Name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 text-white text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!newCharacterName.trim()) {
                      (window as any).showToast?.(
                        "Please enter a name",
                        "error"
                      );
                      return;
                    }
                    if (player && player.gems < 100) {
                      (window as any).showToast?.("Not enough gems!", "error");
                      return;
                    }
                    try {
                      await api.post('/player/change-character-name', {
                        newName: newCharacterName,
                      });
                      (window as any).showToast?.(
                        "Character name changed successfully!",
                        "success"
                      );
                      setPlayer({ ...player!, gems: player!.gems - 100 });
                      setCharacter({ ...character!, name: newCharacterName });
                      queryClient.invalidateQueries({
                        queryKey: ["character"],
                      });
                      setNewCharacterName("");
                      setShowChangeName(false);
                    } catch (error: any) {
                      (window as any).showToast?.(
                        error.response?.data?.error || "Failed to change name",
                        "error"
                      );
                    }
                  }}
                  disabled={!player || player.gems < 100}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  CONFIRM (100 💎)
                </button>
                <button
                  onClick={() => {
                    setShowChangeName(false);
                    setNewCharacterName("");
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
        </div>}
      </div>

      {/* Friends Button */}
      <button
        onClick={() => {
          setActiveTab("friends");
          setHasUnreadFriendMessages(false);
        }}
        className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #1e3a8a",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #1e40af, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        {hasUnreadFriendMessages && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-700 animate-pulse z-20" />
        )}
        <img
          src={friendsIcon}
          alt="Friends"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">FRIENDS & MESSAGES</span>
        {unreadCount && unreadCount > 0 && (
          <span
            className="relative z-10 bg-red-600 text-white text-xs px-2 py-0.5 font-bold"
            style={{
              border: '2px solid #991b1b',
              fontFamily: 'monospace',
            }}
          >
            {unreadCount}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent"></div>
      </button>

      {/* News Button */}
      <button
        onClick={() => setActiveTab("news")}
        className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #6b21a8",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #7e22ce, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <img
          src={newsIcon}
          alt="News"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">NEWS & UPDATES</span>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent"></div>
      </button>

      {/* Achievements Button */}
      <button
        onClick={() => setShowAchievements(true)}
        className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #92400e",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <img
          src={achievementIcon}
          alt="Achievements"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">ACHIEVEMENTS</span>
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
      </button>

      {/* Leaderboard Button */}
      <button
        onClick={() => setActiveTab("leaderboard")}
        className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #92400e",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <img
          src={leaderboardIcon}
          alt="Leaderboard"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">LEADERBOARD</span>
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
      </button>

      {/* Documentation Button */}
      <button
        onClick={() => navigate("/docs")}
        className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #15803d",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #166534, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <img
          src={documentationIcon}
          alt="Documentation"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">DOCUMENTATION</span>
        <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent"></div>
      </button>

      {/* Restart Onboarding Button */}
      <button
        onClick={() => (window as any).restartOnboarding?.()}
        className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold transition relative overflow-hidden mb-4 flex items-center justify-center gap-2"
        style={{
          border: "3px solid #1e3a8a",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #1e40af, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <img
          src={tutorialIcon}
          alt="Restart tutorial"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        <span className="relative z-10">RESTART TUTORIAL</span>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent"></div>
      </button>

      {/* Admin Panel Button - Only show for admins */}
      {player?.isAdmin && (
        <button
          onClick={() => setActiveTab("admin")}
          className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition relative overflow-hidden mb-4"
          style={{
            border: "3px solid #7f1d1d",
            borderRadius: "0",
            boxShadow:
              "0 3px 0 #991b1b, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            textShadow: "1px 1px 0 #000",
            fontFamily: "monospace",
            letterSpacing: "1px",
          }}
        >
          <span className="relative z-10">🛡️ ADMIN PANEL</span>
          <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
        </button>
      )}

      {/* Game Info */}
      <div className="bg-stone-800 rounded-lg border-2 border-stone-700 p-4 mb-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Info size={20} />
          About
        </h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            <strong className="text-white">Folkhart</strong>
          </p>
          <p>Version: 1.0.0 (MVP)</p>
          <p className="text-xs text-gray-400">
            A cozy fantasy MMORPG browser game with idle and active gameplay.
          </p>
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-stone-800 rounded-lg border-2 border-stone-700 p-4 mb-4">
        <h3 className="font-bold text-white mb-3">📊 Statistics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-stone-900 rounded p-3">
            <p className="text-gray-400 text-xs mb-1">Total Gold</p>
            <p className="text-yellow-400 font-bold text-lg">
              {player?.gold || 0}
            </p>
          </div>
          <div className="bg-stone-900 rounded p-3">
            <p className="text-gray-400 text-xs mb-1">Total Gems</p>
            <p className="text-blue-400 font-bold text-lg">
              {player?.gems || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition relative overflow-hidden"
        style={{
          border: "3px solid #7f1d1d",
          borderRadius: "0",
          boxShadow:
            "0 3px 0 #991b1b, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "1px 1px 0 #000",
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        <LogOut size={20} className="inline mr-2" />
        <span className="relative z-10">LOGOUT</span>
        <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
      </button>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Made with 💖 for cozy gaming</p>
        <p className="mt-1">© 2025 Folkhart</p>
      </div>
    </div>
  );
}
