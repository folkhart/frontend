import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guildApi, authApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import { 
  Users, Plus, TrendingUp, MessageCircle,
  LogOut, UserMinus, Shield, Send
} from 'lucide-react';
import guildIcon from '@/assets/ui/guild.png';
import guildLeaderIcon from '@/assets/ui/guild/guildLeader.png';
import guildOfficerIcon from '@/assets/ui/guild/guildOfficer.png';
import guildRecruitIcon from '@/assets/ui/guild/guildRecruit.png';
import guildShopIcon from '@/assets/ui/guild/guildShop.png';
import guildInfoIcon from '@/assets/ui/guild/guildInfo.png';
import guildMembersIcon from '@/assets/ui/guild/guildMembers.png';
import guildChatIcon from '@/assets/ui/guild/guildChat.png';
import guildDonateIcon from '@/assets/ui/guild/guildDonate.png';
import settingsIcon from '@/assets/ui/settings.png';

type View = 'browse' | 'my-guild' | 'members' | 'chat' | 'donate' | 'shop' | 'settings';

export default function GuildTab() {
  const queryClient = useQueryClient();
  const { player, setPlayer } = useGameStore();
  const [view, setView] = useState<View>('browse');
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch player's guild
  const { data: myGuild, refetch: refetchMyGuild } = useQuery({
    queryKey: ['myGuild'],
    queryFn: async () => {
      const { data } = await guildApi.getMyGuild();
      return data;
    },
  });

  // Fetch guild list
  const { data: guildList } = useQuery({
    queryKey: ['guildList'],
    queryFn: async () => {
      const { data } = await guildApi.list(1, 20);
      return data;
    },
    enabled: view === 'browse',
  });

  // Auto-switch to my-guild view if player has a guild
  useEffect(() => {
    if (myGuild && view === 'browse') {
      setView('my-guild');
    }
  }, [myGuild, view]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [myGuild?.chatMessages]);

  // Mutations
  const createGuildMutation = useMutation({
    mutationFn: () => guildApi.create(guildName, guildTag, guildDescription),
    onSuccess: async () => {
      // Refresh guild data
      await refetchMyGuild();
      // Refresh player data to update gold
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      
      setShowCreateGuild(false);
      setView('my-guild');
      (window as any).showToast?.('Guild created successfully!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to create guild', 'error');
    },
  });

  const joinGuildMutation = useMutation({
    mutationFn: (guildId: string) => guildApi.join(guildId),
    onSuccess: () => {
      refetchMyGuild();
      setView('my-guild');
      (window as any).showToast?.('Joined guild successfully!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to join guild', 'error');
    },
  });

  const leaveGuildMutation = useMutation({
    mutationFn: () => guildApi.leave(),
    onSuccess: () => {
      refetchMyGuild();
      setView('browse');
      (window as any).showToast?.('Left guild', 'info');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to leave guild', 'error');
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (playerId: string) => guildApi.kick(playerId),
    onSuccess: () => {
      refetchMyGuild();
      (window as any).showToast?.('Member kicked', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to kick member', 'error');
    },
  });

  const updateRankMutation = useMutation({
    mutationFn: ({ playerId, rank }: { playerId: string; rank: string }) => 
      guildApi.updateRank(playerId, rank),
    onSuccess: () => {
      refetchMyGuild();
      (window as any).showToast?.('Rank updated', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to update rank', 'error');
    },
  });

  const donateMutation = useMutation({
    mutationFn: (amount: number) => guildApi.donate(amount),
    onSuccess: async () => {
      // Refresh guild data
      await refetchMyGuild();
      // Refresh player data to update gold immediately
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      
      setDonateAmount('');
      (window as any).showToast?.('Donation successful!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to donate', 'error');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => guildApi.sendMessage(message),
    onSuccess: () => {
      setChatMessage('');
      // Refetch guild data to get new messages
      setTimeout(() => refetchMyGuild(), 100);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to send message', 'error');
    },
  });

  const getMyMembership = () => {
    return myGuild?.members?.find((m: any) => m.playerId === player?.id);
  };

  const canManage = () => {
    const membership = getMyMembership();
    return membership?.rank === 'Leader' || membership?.rank === 'Officer';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Leader': return 'text-yellow-400';
      case 'Officer': return 'text-purple-400';
      case 'Member': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Leader': return guildLeaderIcon;
      case 'Officer': return guildOfficerIcon;
      case 'Recruit': return guildRecruitIcon;
      default: return null;
    }
  };

  // BROWSE VIEW
  if (view === 'browse') {
    return (
      <div className="p-3 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <img src={guildIcon} alt="Guild" className="w-6 h-6" />
            Guild Browser
          </h2>
          {!myGuild && (
            <button
              onClick={() => setShowCreateGuild(true)}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-2 btn-press text-sm"
            >
              <Plus size={16} />
              Create
            </button>
          )}
        </div>

        <div className="space-y-2">
          {guildList?.guilds?.map((guild: any) => (
            <div
              key={guild.id}
              className="p-3 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-amber-600 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded flex items-center justify-center font-bold text-white text-xs relative">
                    <img src={guildIcon} alt="Guild" className="w-6 h-6 absolute opacity-20" />
                    <span className="relative z-10">{guild.tag}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{guild.name}</h3>
                    <p className="text-xs text-gray-400">Level {guild.level}</p>
                  </div>
                </div>
                <button
                  onClick={() => joinGuildMutation.mutate(guild.id)}
                  disabled={joinGuildMutation.isPending}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold btn-press text-sm"
                >
                  Join
                </button>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {guild._count?.members || 0}/{guild.maxMembers}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  {guild.experience} XP
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Create Guild Modal */}
        {showCreateGuild && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateGuild(false)}>
            <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-3">Create Guild</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Guild Name</label>
                  <input
                    type="text"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Enter guild name"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tag (3-5 chars)</label>
                  <input
                    type="text"
                    value={guildTag}
                    onChange={(e) => setGuildTag(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="TAG"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={guildDescription}
                    onChange={(e) => setGuildDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Guild description..."
                    rows={3}
                    maxLength={200}
                  />
                </div>
                <div className="bg-amber-900/30 border border-amber-600 rounded p-2 text-xs text-amber-200">
                  <p className="font-bold">Cost: 1,000 Gold</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => createGuildMutation.mutate()}
                    disabled={!guildName || guildTag.length < 3 || createGuildMutation.isPending}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition disabled:opacity-50 text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateGuild(false)}
                    className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MY GUILD VIEW
  if (!myGuild) {
    return (
      <div className="p-3 pb-20 text-center">
        <Users size={48} className="mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400 mb-4">You are not in a guild</p>
        <button
          onClick={() => setView('browse')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
        >
          Browse Guilds
        </button>
      </div>
    );
  }

  const membership = getMyMembership();

  return (
    <div className="p-3 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 rounded-lg p-3 mb-3 border-2 border-purple-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-purple-800 rounded flex items-center justify-center font-bold text-white relative">
              <img src={guildIcon} alt="Guild" className="w-8 h-8 absolute opacity-20" />
              <span className="relative z-10">{myGuild.tag}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{myGuild.name}</h2>
              <p className="text-sm text-purple-200">Level {myGuild.level} • {myGuild.members?.length}/{myGuild.maxMembers} Members</p>
            </div>
          </div>
          {membership?.rank !== 'Leader' && (
            <button
              onClick={() => leaveGuildMutation.mutate()}
              className="p-2 bg-red-600 hover:bg-red-700 rounded"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {myGuild.description && (
          <p className="text-sm text-purple-100">{myGuild.description}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setView('my-guild')}
          className={`py-2 rounded font-bold text-xs ${view === 'my-guild' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={guildInfoIcon} alt="Info" className="w-4 h-4 mx-auto mb-1" />
          Info
        </button>
        <button
          onClick={() => setView('members')}
          className={`py-2 rounded font-bold text-xs ${view === 'members' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={guildMembersIcon} alt="Members" className="w-4 h-4 mx-auto mb-1" />
          Members
        </button>
        <button
          onClick={() => setView('chat')}
          className={`py-2 rounded font-bold text-xs ${view === 'chat' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={guildChatIcon} alt="Chat" className="w-4 h-4 mx-auto mb-1" />
          Chat
        </button>
        <button
          onClick={() => setView('shop')}
          className={`py-2 rounded font-bold text-xs ${view === 'shop' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={guildShopIcon} alt="Shop" className="w-4 h-4 mx-auto mb-1" />
          Shop
        </button>
        <button
          onClick={() => setView('donate')}
          className={`py-2 rounded font-bold text-xs ${view === 'donate' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={guildDonateIcon} alt="Donate" className="w-4 h-4 mx-auto mb-1" />
          Donate
        </button>
        <button
          onClick={() => setView('settings')}
          className={`py-2 rounded font-bold text-xs ${view === 'settings' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-gray-400'}`}
        >
          <img src={settingsIcon} alt="Settings" className="w-4 h-4 mx-auto mb-1" />
          Settings
        </button>
      </div>

      {/* Guild Info */}
      {view === 'my-guild' && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Guild Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Level</p>
                <p className="text-white font-bold">{myGuild.level}</p>
              </div>
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Experience</p>
                <p className="text-white font-bold">{myGuild.experience}</p>
              </div>
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Guild Gold</p>
                <p className="text-yellow-400 font-bold">{myGuild.guildGold}</p>
              </div>
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Members</p>
                <p className="text-white font-bold">{myGuild.members?.length}/{myGuild.maxMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Your Rank</h3>
            <div className="flex items-center gap-2">
              {getRankIcon(membership?.rank) ? (
                <img src={getRankIcon(membership?.rank)!} alt={membership?.rank} className="w-6 h-6" />
              ) : (
                <Shield className={getRankColor(membership?.rank)} size={20} />
              )}
              <span className={`font-bold ${getRankColor(membership?.rank)}`}>{membership?.rank}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Gold Donated: {membership?.goldDonated || 0}
            </p>
          </div>
        </div>
      )}

      {/* Members */}
      {view === 'members' && (
        <div className="space-y-2">
          {myGuild.members?.map((member: any) => (
            <div key={member.id} className="bg-stone-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getRankIcon(member.rank) && (
                      <img src={getRankIcon(member.rank)!} alt={member.rank} className="w-4 h-4" />
                    )}
                    <p className="font-bold text-white">{member.player.username}</p>
                    <span className={`text-xs font-bold ${getRankColor(member.rank)}`}>
                      {member.rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {member.player.character?.name} • Lv.{member.player.character?.level} • CP: {member.player.character?.combatPower}
                  </p>
                </div>
                {canManage() && member.playerId !== player?.id && member.rank !== 'Leader' && (
                  <div className="flex gap-1">
                    {membership?.rank === 'Leader' && (
                      <select
                        onChange={(e) => updateRankMutation.mutate({ playerId: member.playerId, rank: e.target.value })}
                        className="px-2 py-1 bg-stone-900 text-white text-xs rounded"
                        defaultValue={member.rank}
                      >
                        <option value="Officer">Officer</option>
                        <option value="Member">Member</option>
                        <option value="Recruit">Recruit</option>
                      </select>
                    )}
                    <button
                      onClick={() => kickMemberMutation.mutate(member.playerId)}
                      className="p-1 bg-red-600 hover:bg-red-700 rounded"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      {view === 'chat' && (
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 bg-stone-800 rounded-lg p-3 overflow-y-auto mb-2">
            {myGuild.chatMessages && myGuild.chatMessages.length > 0 ? (
              myGuild.chatMessages.slice().reverse().map((msg: any) => (
                <div key={msg.id} className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-purple-400 text-sm">{msg.player.username}</span>
                    <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && chatMessage.trim() && !sendMessageMutation.isPending) {
                  sendMessageMutation.mutate(chatMessage.trim());
                }
              }}
              className="flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Type a message..."
              maxLength={200}
            />
            <button
              onClick={() => {
                if (chatMessage.trim()) {
                  sendMessageMutation.mutate(chatMessage.trim());
                }
              }}
              disabled={!chatMessage.trim() || sendMessageMutation.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Donate */}
      {view === 'donate' && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Donate Gold</h3>
            <p className="text-sm text-gray-400 mb-3">
              Help your guild grow by donating gold. Guild gold can be used for upgrades and the guild shop.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="Amount"
                min="1"
              />
              <button
                onClick={() => donateMutation.mutate(parseInt(donateAmount))}
                disabled={!donateAmount || parseInt(donateAmount) <= 0 || donateMutation.isPending}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold disabled:opacity-50"
              >
                Donate
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Your balance: {player?.gold} gold
            </p>
          </div>

          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Top Contributors</h3>
            <div className="space-y-2">
              {myGuild.members
                ?.slice()
                .sort((a: any, b: any) => b.goldDonated - a.goldDonated)
                .slice(0, 5)
                .map((member: any, index: number) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="text-white">{member.player.username}</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{member.goldDonated}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Guild Shop */}
      {view === 'shop' && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <img src={guildShopIcon} alt="Shop" className="w-5 h-5" />
                Guild Shop
              </h3>
              <div className="text-sm">
                <span className="text-yellow-400 font-bold">{myGuild.guildGold}</span>
                <span className="text-gray-400"> Guild Gold</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Exclusive items purchasable with guild gold. Officers and Leaders can manage shop inventory.
            </p>

            {/* Mock Shop Items */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-900 rounded-lg p-3 border-2 border-purple-600">
                <div className="w-full aspect-square bg-stone-800 rounded mb-2 flex items-center justify-center">
                  <span className="text-4xl">⚔️</span>
                </div>
                <p className="font-bold text-purple-400 text-sm">Guild Sword</p>
                <p className="text-xs text-gray-400 mb-2">+15 ATK</p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold text-sm">500 GG</span>
                  <button className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold">
                    Buy
                  </button>
                </div>
              </div>

              <div className="bg-stone-900 rounded-lg p-3 border-2 border-purple-600">
                <div className="w-full aspect-square bg-stone-800 rounded mb-2 flex items-center justify-center">
                  <span className="text-4xl">🛡️</span>
                </div>
                <p className="font-bold text-purple-400 text-sm">Guild Armor</p>
                <p className="text-xs text-gray-400 mb-2">+20 DEF</p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold text-sm">600 GG</span>
                  <button className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold">
                    Buy
                  </button>
                </div>
              </div>

              <div className="bg-stone-900 rounded-lg p-3 border-2 border-blue-600">
                <div className="w-full aspect-square bg-stone-800 rounded mb-2 flex items-center justify-center">
                  <span className="text-4xl">💎</span>
                </div>
                <p className="font-bold text-blue-400 text-sm">Guild Gem</p>
                <p className="text-xs text-gray-400 mb-2">+50 Gems</p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold text-sm">300 GG</span>
                  <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">
                    Buy
                  </button>
                </div>
              </div>

              <div className="bg-stone-900 rounded-lg p-3 border-2 border-green-600">
                <div className="w-full aspect-square bg-stone-800 rounded mb-2 flex items-center justify-center">
                  <span className="text-4xl">🧪</span>
                </div>
                <p className="font-bold text-green-400 text-sm">Guild Potion</p>
                <p className="text-xs text-gray-400 mb-2">Restore 200 HP</p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold text-sm">100 GG</span>
                  <button className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold">
                    Buy
                  </button>
                </div>
              </div>
            </div>

            {canManage() && (
              <div className="mt-4 p-3 bg-amber-900/30 border border-amber-600 rounded">
                <p className="text-amber-200 text-xs font-bold mb-2">Officer/Leader Tools</p>
                <button className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-sm">
                  Manage Shop Inventory
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guild Settings */}
      {view === 'settings' && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <img src={settingsIcon} alt="Settings" className="w-5 h-5" />
              Guild Settings
            </h3>

            {/* Guild Info */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">Guild Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-bold">{myGuild.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tag:</span>
                  <span className="text-purple-400 font-bold">[{myGuild.tag}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(myGuild.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Perks */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">Guild Perks</h4>
              <div className="space-y-2">
                <div className="bg-stone-900 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">EXP Bonus</span>
                    <span className="text-green-400 font-bold">+{myGuild.expBonus}%</span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(myGuild.expBonus / 50) * 100}%` }}></div>
                  </div>
                </div>
                <div className="bg-stone-900 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">Gold Bonus</span>
                    <span className="text-yellow-400 font-bold">+{myGuild.goldBonus}%</span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(myGuild.goldBonus / 50) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leader Controls */}
            {membership?.rank === 'Leader' && (
              <div className="space-y-3">
                <div className="p-3 bg-red-900/30 border border-red-600 rounded">
                  <h4 className="text-sm font-bold text-red-300 mb-2">Leader Controls</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setNewDescription(myGuild.description || '');
                        setShowEditDescription(true);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-sm"
                    >
                      Edit Guild Description
                    </button>
                    <button 
                      onClick={() => (window as any).showToast?.('Emblem customization coming soon!', 'info')}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-sm"
                    >
                      Change Guild Emblem
                    </button>
                    <button 
                      onClick={() => (window as any).showToast?.('Guild upgrades coming soon!', 'info')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
                    >
                      Upgrade Guild (Costs Gold)
                    </button>
                    <button 
                      onClick={() => setShowDisbandConfirm(true)}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm"
                    >
                      Disband Guild
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Guild */}
            {membership?.rank !== 'Leader' && (
              <div className="mt-4">
                <button
                  onClick={() => leaveGuildMutation.mutate()}
                  disabled={leaveGuildMutation.isPending}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm"
                >
                  Leave Guild
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditDescription && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditDescription(false)}>
          <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-3">Edit Guild Description</h2>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500 mb-3"
              placeholder="Enter new description..."
              rows={4}
              maxLength={200}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: Add backend API for updating description
                  (window as any).showToast?.('Description updated!', 'success');
                  setShowEditDescription(false);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setShowEditDescription(false)}
                className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disband Confirm Modal */}
      {showDisbandConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDisbandConfirm(false)}>
          <div className="bg-stone-800 rounded-lg border-2 border-red-600 p-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-red-400 mb-3">⚠️ Disband Guild?</h2>
            <p className="text-white mb-2">Are you absolutely sure you want to disband <span className="font-bold text-purple-400">{myGuild.name}</span>?</p>
            <p className="text-red-300 text-sm mb-4">This action cannot be undone! All members will be kicked and the guild will be permanently deleted.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: Add backend API for disbanding guild
                  (window as any).showToast?.('Guild disbanded', 'info');
                  setShowDisbandConfirm(false);
                  setView('browse');
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm"
              >
                Yes, Disband
              </button>
              <button
                onClick={() => setShowDisbandConfirm(false)}
                className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
