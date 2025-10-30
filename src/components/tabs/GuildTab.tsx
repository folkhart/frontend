import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guildApi, authApi, dungeonApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { Users, Plus, TrendingUp, UserMinus, Shield } from "lucide-react";
import guildIcon from "@/assets/ui/guild.png";
import guildLeaderIcon from "@/assets/ui/guild/guildLeader.png";
import guildOfficerIcon from "@/assets/ui/guild/guildOfficer.png";
import guildMemberIcon from "@/assets/ui/guild/guildMember.png";
import guildRecruitIcon from "@/assets/ui/guild/guildRecruit.png";
import guildShopIcon from "@/assets/ui/guild/guildShop.png";
import guildInfoIcon from "@/assets/ui/guild/guildInfo.png";
import guildMembersIcon from "@/assets/ui/guild/guildMembers.png";
import guildLeaveIcon from "@/assets/ui/guild/guildLeave.png";
import guildChatIcon from "@/assets/ui/guild/guildChat.png";
import guildDonateIcon from "@/assets/ui/guild/guildDonate.png";
import settingsIcon from "@/assets/ui/settings.png";
import GuildShop from "@/components/guild/GuildShop";
import GuildChat from "@/components/guild/GuildChat";
import ratCellarIcon from "@/assets/ui/dungeonIcons/ratCellar.png";
import goblinCaveIcon from "@/assets/ui/dungeonIcons/goblinCave.png";
import slimeDenIcon from "@/assets/ui/dungeonIcons/slimeDen.png";
import dragonLairIcon from "@/assets/ui/dungeonIcons/dragonLair.png";
import eclipticThroneIcon from "@/assets/ui/dungeonIcons/eclipticThrone.png";
import darkForestIcon from "@/assets/ui/dungeonIcons/darkForest.png";

const getDungeonIconByName = (dungeonName: string) => {
  const iconMap: Record<string, string> = {
    "Rat Cellar": ratCellarIcon,
    "Goblin Cave": goblinCaveIcon,
    "Slime Den": slimeDenIcon,
    "Dark Forest": darkForestIcon,
    "Dragon's Lair": dragonLairIcon,
    "Shattered Obsidian Vault": ratCellarIcon,
    "Hollowroot Sanctuary": slimeDenIcon,
    "The Maw of Silence": goblinCaveIcon,
    "The Clockwork Necropolis": ratCellarIcon,
    "The Pale Citadel": eclipticThroneIcon,
    "The Abyssal Spire": dragonLairIcon,
    "The Ecliptic Throne": eclipticThroneIcon,
  };
  return iconMap[dungeonName] || ratCellarIcon;
};

function MembersView({
  myGuild,
  membership,
  canManage,
  getRankIcon,
  getRankColor,
  getDungeonIcon,
  kickMemberMutation,
  updateRankMutation,
  player,
}: any) {
  const queryClient = useQueryClient();

  // Fetch applications for leaders/officers
  const { data: applications } = useQuery({
    queryKey: ["guildApplications", myGuild.id],
    queryFn: async () => {
      const { data } = await guildApi.getApplications(myGuild.id);
      return data;
    },
    enabled: membership?.rank === "Leader" || membership?.rank === "Officer",
    refetchInterval: 10000,
  });

  const approveMutation = useMutation({
    mutationFn: (applicationId: string) =>
      guildApi.approveApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guildApplications"] });
      queryClient.invalidateQueries({ queryKey: ["myGuild"] });
      (window as any).showToast?.("Application approved!", "success");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) =>
      guildApi.rejectApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guildApplications"] });
      (window as any).showToast?.("Application rejected", "success");
    },
  });

  return (
    <div className="space-y-4">
      {/* Applications Section (Leaders/Officers only) */}
      {(membership?.rank === "Leader" || membership?.rank === "Officer") &&
        applications &&
        applications.length > 0 && (
          <div className="bg-amber-900/20 border-2 border-amber-600 rounded-lg p-3">
            <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded">
                {applications.length}
              </span>
              Pending Applications
            </h3>
            <div className="space-y-2">
              {applications.map((app: any) => (
                <div key={app.id} className="bg-stone-800 rounded p-2">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-bold text-white text-sm">
                        {app.player.character?.name || app.player.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        Lv.{app.player.character?.level}{" "}
                        {app.player.character?.class} • CP:{" "}
                        {app.player.character?.combatPower}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {app.message && (
                    <p className="text-xs text-gray-300 italic mb-2">
                      "{app.message}"
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(app.id)}
                      disabled={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                      className="flex-1 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-bold text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(app.id)}
                      disabled={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                      className="flex-1 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Members List */}
      <div className="space-y-2">
        <h3 className="font-bold text-white">
          Members ({myGuild.members?.length}/{myGuild.maxMembers})
        </h3>
        {myGuild.members?.map((member: any) => (
          <div key={member.id} className="bg-stone-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-500 overflow-hidden bg-stone-900">
                  {member.player.character?.avatarId ? (
                    <img
                      src={getDungeonIcon(member.player.character.avatarId)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: "pixelated" }}
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).src = `/assets/ui/chat/classIcons/${
                          member.player.character?.class?.toLowerCase() ||
                          "warrior"
                        }.png`;
                      }}
                    />
                  ) : (
                    <img
                      src={`/assets/ui/chat/classIcons/${
                        member.player.character?.class?.toLowerCase() ||
                        "warrior"
                      }.png`}
                      alt={member.player.character?.class}
                      className="w-6 h-6"
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getRankIcon(member.rank) && (
                      <img
                        src={getRankIcon(member.rank)!}
                        alt={member.rank}
                        className="w-4 h-4"
                      />
                    )}
                    <p className="font-bold text-white">
                      {member.player.username}
                    </p>
                    <span
                      className={`text-xs font-bold ${getRankColor(
                        member.rank
                      )}`}
                    >
                      {member.rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {member.player.character?.name} • Lv.
                    {member.player.character?.level} • CP:{" "}
                    {member.player.character?.combatPower}
                  </p>
                </div>
              </div>
              {canManage() &&
                member.playerId !== player?.id &&
                member.rank !== "Leader" && (
                  <div className="flex gap-1">
                    {membership?.rank === "Leader" && (
                      <select
                        onChange={(e) =>
                          updateRankMutation.mutate({
                            playerId: member.playerId,
                            rank: e.target.value,
                          })
                        }
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
    </div>
  );
}

type View =
  | "browse"
  | "my-guild"
  | "members"
  | "chat"
  | "donate"
  | "shop"
  | "settings";

export default function GuildTab() {
  const queryClient = useQueryClient();
  const {
    player,
    setPlayer,
    hasUnreadGuildMessages,
    setHasUnreadGuildMessages,
    setHasGuildInvitations,
  } = useGameStore();
  const [view, setView] = useState<View>("browse");
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [guildTag, setGuildTag] = useState("");
  const [guildDescription, setGuildDescription] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState(
    "Blank_Gold__Animated_32x32"
  );
  const [donateAmount, setDonateAmount] = useState("");
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [guildSearchQuery, setGuildSearchQuery] = useState("");
  const [guildInvitations, setGuildInvitations] = useState<any[]>([]);

  // Fetch guild invitations from database
  const { data: fetchedInvitations } = useQuery({
    queryKey: ['guildInvitations'],
    queryFn: async () => {
      const { data } = await guildApi.getInvitations();
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update local state when database invitations change
  useEffect(() => {
    if (fetchedInvitations) {
      setGuildInvitations(fetchedInvitations);
      setHasGuildInvitations(fetchedInvitations.length > 0);
    }
  }, [fetchedInvitations, setHasGuildInvitations]);

  // Fetch player's guild
  const { data: myGuild, refetch: refetchMyGuild } = useQuery({
    queryKey: ["myGuild"],
    queryFn: async () => {
      const { data } = await guildApi.getMyGuild();
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Fetch all dungeons for avatar icon mapping
  const { data: allDungeons } = useQuery({
    queryKey: ["dungeons"],
    queryFn: async () => {
      const { data } = await dungeonApi.getAll();
      return data;
    },
    staleTime: Infinity, // Dungeons don't change, cache forever
  });

  // Helper function to get dungeon icon by dungeon ID
  const getDungeonIcon = (dungeonId: string) => {
    if (!allDungeons) return ratCellarIcon;
    const dungeon = allDungeons.find((d: any) => d.id === dungeonId);
    if (!dungeon) return ratCellarIcon;
    return getDungeonIconByName(dungeon.name);
  };

  // Fetch guild list
  const { data: guildList } = useQuery({
    queryKey: ["guildList"],
    queryFn: async () => {
      const { data } = await guildApi.list(1, 20);
      return data;
    },
    enabled: view === "browse",
  });

  // Socket listener for guild invitations
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    const handleGuildInvitation = (invitation: any) => {
      // Refetch from database to get persistent version
      queryClient.invalidateQueries({ queryKey: ['guildInvitations'] });
      setHasGuildInvitations(true);
      (window as any).showToast?.(
        `Guild invitation from ${invitation.invitedBy.character?.name || invitation.invitedBy.username}!`,
        'info'
      );
    };

    socket.on('guild_invitation', handleGuildInvitation);

    return () => {
      socket.off('guild_invitation', handleGuildInvitation);
    };
  }, [setHasGuildInvitations, queryClient]);

  // Clear guild invitation flag when viewing guild tab
  useEffect(() => {
    if (view === "browse" && guildInvitations.length === 0) {
      setHasGuildInvitations(false);
    }
  }, [view, guildInvitations.length, setHasGuildInvitations]);

  // Auto-switch to my-guild view if player has a guild
  useEffect(() => {
    if (myGuild && view === "browse") {
      setView("my-guild");
    }
  }, [myGuild, view]);

  // Clear notifications when opening chat
  useEffect(() => {
    if (view === "chat") {
      setHasUnreadGuildMessages(false);
    }
  }, [view, setHasUnreadGuildMessages]);

  // Clear notifications for incoming messages when chat is visible
  useEffect(() => {
    if (view !== "chat") return;

    const socket = (window as any).socket;
    if (!socket) return;

    const handleGuildMessage = () => {
      // Clear notification immediately since user is viewing chat
      setHasUnreadGuildMessages(false);
    };

    socket.on("guild_chat_message", handleGuildMessage);

    return () => {
      socket.off("guild_chat_message", handleGuildMessage);
    };
  }, [view, setHasUnreadGuildMessages]);

  // Chat auto-scroll is now handled by GuildChat component

  // Accept guild invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await guildApi.acceptInvitation(invitationId);
      return { data, invitationId };
    },
    onSuccess: async ({ invitationId }) => {
      // Remove accepted invitation
      setGuildInvitations(prev => {
        const newInvites = prev.filter(inv => inv.id !== invitationId);
        if (newInvites.length === 0) {
          setHasGuildInvitations(false);
        }
        return newInvites;
      });
      queryClient.invalidateQueries({ queryKey: ['myGuild'] });
      queryClient.invalidateQueries({ queryKey: ['guildInvitations'] });
      // Refresh player data
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
      (window as any).showToast?.('Guild invitation accepted!', 'success');
      setView('my-guild');
    },
  });

  // Reject guild invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await guildApi.rejectInvitation(invitationId);
      return { invitationId };
    },
    onSuccess: (data) => {
      setGuildInvitations(prev => {
        const newInvites = prev.filter(inv => inv.id !== data.invitationId);
        if (newInvites.length === 0) {
          setHasGuildInvitations(false);
        }
        return newInvites;
      });
      queryClient.invalidateQueries({ queryKey: ['guildInvitations'] });
      (window as any).showToast?.('Guild invitation rejected', 'success');
    },
  });

  // Mutations
  const createGuildMutation = useMutation({
    mutationFn: () =>
      guildApi.create(guildName, guildTag, guildDescription, selectedEmblem),
    onSuccess: async () => {
      // Refresh guild data
      await refetchMyGuild();
      // Refresh player data to update gold
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
      queryClient.invalidateQueries({ queryKey: ["character"] });

      setShowCreateGuild(false);
      setView("my-guild");
      (window as any).showToast?.("Guild created successfully!", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to create guild",
        "error"
      );
    },
  });

  const joinGuildMutation = useMutation({
    mutationFn: (guildId: string) => guildApi.join(guildId),
    onSuccess: (response: any) => {
      // Check if it was an application or direct join
      if (response.data?.requiresApproval) {
        (window as any).showToast?.(
          response.data.message || "Application submitted!",
          "success"
        );
      } else {
        refetchMyGuild();
        setView("my-guild");
        (window as any).showToast?.("Joined guild successfully!", "success");
      }
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to join guild",
        "error"
      );
    },
  });

  const leaveGuildMutation = useMutation({
    mutationFn: () => guildApi.leave(),
    onSuccess: () => {
      refetchMyGuild();
      setView("browse");
      (window as any).showToast?.("Left guild", "info");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to leave guild",
        "error"
      );
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (playerId: string) => guildApi.kick(playerId),
    onSuccess: () => {
      refetchMyGuild();
      (window as any).showToast?.("Member kicked", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to kick member",
        "error"
      );
    },
  });

  const updateRankMutation = useMutation({
    mutationFn: ({ playerId, rank }: { playerId: string; rank: string }) =>
      guildApi.updateRank(playerId, rank),
    onSuccess: () => {
      refetchMyGuild();
      (window as any).showToast?.("Rank updated", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to update rank",
        "error"
      );
    },
  });

  const donateMutation = useMutation({
    mutationFn: (amount: number) => guildApi.donate(amount),
    onSuccess: async (data: any) => {
      // Force fresh refetch of all guild-related data
      queryClient.invalidateQueries({ queryKey: ["myGuild"] });
      await refetchMyGuild();
      
      // Update player gold immediately
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
      queryClient.invalidateQueries({ queryKey: ["character"] });

      setDonateAmount("");
      (window as any).showToast?.(
        `💰 Donated ${data.goldDonated}g! +${data.guildCoinsAdded} GC to shop, +${data.bankGoldAdded}g to bank`,
        "success"
      );
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to donate",
        "error"
      );
    },
  });

  // Guild chat now uses Socket.io via GuildChat component

  const updateEmblemMutation = useMutation({
    mutationFn: (iconId: string) => guildApi.updateEmblem(iconId),
    onSuccess: () => {
      (window as any).showToast?.("Guild emblem updated!", "success");
      setShowEmblemPicker(false);
      refetchMyGuild();
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to update emblem",
        "error"
      );
    },
  });

  const upgradeGuildMutation = useMutation({
    mutationFn: () => guildApi.upgrade(),
    onSuccess: async (response) => {
      const { guild, player: updatedPlayer, cost } = response.data;

      // Immediately update player gold
      if (player && updatedPlayer) {
        setPlayer({
          ...player,
          gold: updatedPlayer.gold,
        });
      }

      const memberCapIncrease = guild.maxMembers - (guild.level - 1) * 20;
      (window as any).showToast?.(
        `🎉 Guild upgraded to Level ${
          guild.level
        }!\n💰 -${cost.toLocaleString()} gold\n👥 Member cap: ${
          guild.maxMembers
        } (+${memberCapIncrease})`,
        "success"
      );

      // Refresh guild data
      refetchMyGuild();
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to upgrade guild",
        "error"
      );
    },
  });

  const getMyMembership = () => {
    return myGuild?.members?.find((m: any) => m.playerId === player?.id);
  };

  const canManage = () => {
    const membership = getMyMembership();
    return membership?.rank === "Leader" || membership?.rank === "Officer";
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Leader":
        return "text-yellow-400";
      case "Officer":
        return "text-purple-400";
      case "Member":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "Leader":
        return guildLeaderIcon;
      case "Officer":
        return guildOfficerIcon;
      case "Member":
        return guildMemberIcon;
      case "Recruit":
        return guildRecruitIcon;
      default:
        return null;
    }
  };

  // BROWSE VIEW
  if (view === "browse") {
    // Filter guilds by search query
    const filteredGuilds =
      guildList?.guilds?.filter((guild: any) => {
        if (!guildSearchQuery.trim()) return true;

        const query = guildSearchQuery.toLowerCase();
        const name = guild.name?.toLowerCase() || "";
        const tag = guild.tag?.toLowerCase() || "";

        return name.includes(query) || tag.includes(query);
      }) || [];

    return (
      <div className="p-3 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <img src={guildIcon} alt="Guild" className="w-6 h-6" />
            Join or Find a Guild
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

        {/* Search Bar */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search by guild name or tag..."
            value={guildSearchQuery}
            onChange={(e) => setGuildSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-600 rounded text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            style={{ fontFamily: "monospace" }}
          />
        </div>

        {/* Guild Invitations */}
        {guildInvitations.length > 0 && (
          <div className="mb-4 bg-amber-900/20 border-2 border-amber-600 rounded-lg p-3">
            <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded">
                {guildInvitations.length}
              </span>
              Guild Invitations
            </h3>
            <div className="space-y-2">
              {guildInvitations.map((invitation, index) => (
                <div
                  key={index}
                  className="bg-stone-800 rounded p-3 border-2 border-amber-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img
                          src={`/assets/ui/guild/guild_icons/${invitation.guild.iconId}.gif`}
                          alt="Guild Emblem"
                          className="w-10 h-10"
                          style={{ imageRendering: "pixelated" }}
                          onError={(e) => {
                            e.currentTarget.src = "/assets/ui/guild.png";
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">
                            {invitation.guild.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                            [{invitation.guild.tag}]
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Invited by {invitation.invitedBy.character?.name || invitation.invitedBy.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptInvitationMutation.mutate(invitation.id)}
                      disabled={acceptInvitationMutation.isPending}
                      className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold btn-press text-xs disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectInvitationMutation.mutate(invitation.id)}
                      disabled={rejectInvitationMutation.isPending}
                      className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold btn-press text-xs disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredGuilds.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No guilds found</p>
            </div>
          ) : (
            filteredGuilds.map((guild: any) => (
              <div
                key={guild.id}
                className="p-3 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-amber-600 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 flex items-center justify-center">
                      <img
                        src={`/assets/ui/guild/guild_icons/${guild.iconId}.gif`}
                        alt="Guild Emblem"
                        className="w-14 h-14"
                        style={{ imageRendering: "pixelated" }}
                        onError={(e) => {
                          e.currentTarget.src = "/assets/ui/guild.png";
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{guild.name}</h3>
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                          [{guild.tag}]
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Level {guild.level}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => joinGuildMutation.mutate(guild.id)}
                    disabled={joinGuildMutation.isPending}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold btn-press text-sm"
                  >
                    {guild.requiresApproval ? "Apply" : "Join"}
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
            ))
          )}
        </div>

        {/* Create Guild Modal */}
        {showCreateGuild && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateGuild(false)}
          >
            <div
              className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-3">
                Create Guild
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Guild Name
                  </label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tag (3-5 chars)
                  </label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={guildDescription}
                    onChange={(e) => setGuildDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Guild description..."
                    rows={3}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Choose Emblem
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "Blank_Gold__Animated_32x32",
                      "Blank_Purple_Animated_32x32",
                      "Blank_Silver_Animated_32x32",
                    ].map((iconId) => (
                      <button
                        key={iconId}
                        type="button"
                        onClick={() => setSelectedEmblem(iconId)}
                        className={`p-2 rounded border-2 transition ${
                          selectedEmblem === iconId
                            ? "border-amber-500 bg-amber-900/30"
                            : "border-stone-600 bg-stone-900 hover:border-amber-400"
                        }`}
                      >
                        <img
                          src={`/assets/ui/guild/guild_icons/${iconId}.gif`}
                          alt={iconId}
                          className="w-12 h-12 mx-auto"
                          style={{ imageRendering: "pixelated" }}
                          onError={(e) => {
                            e.currentTarget.src = "/assets/ui/guild.png";
                          }}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          {iconId
                            .replace("_Animated_32x32", "")
                            .replace("Blank_", "")
                            .replace(/_/g, " ")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-900/30 border border-amber-600 rounded p-2 text-xs text-amber-200">
                  <p className="font-bold">Cost: 1,000 Gold</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => createGuildMutation.mutate()}
                    disabled={
                      !guildName ||
                      guildTag.length < 3 ||
                      createGuildMutation.isPending
                    }
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
          onClick={() => setView("browse")}
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
      {/* Header - Retro Style */}
      <div
        className="bg-stone-800 p-3 mb-3 border-2 border-amber-600"
        style={{ boxShadow: "0 4px 0 #92400e" }}
      >
        <div className="flex items-center gap-3 mb-2">
          {/* Animated Guild Emblem */}
          <div className="relative">
            <div className="w-16 h-16 bg-stone-900 border-2 border-stone-700 flex items-center justify-center">
              <img
                src={`/assets/ui/guild/guild_icons/${
                  myGuild.iconId || "Blank_Gold__Animated_32x32"
                }.gif`}
                alt="Guild Emblem"
                className="w-14 h-14"
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/ui/guild.png";
                }}
              />
            </div>
            {/* Tag Badge */}
            <div className="absolute -bottom-1 -right-1 bg-amber-600 border-2 border-amber-800 px-2 py-0.5">
              <span
                className="text-xs font-bold text-white"
                style={{ fontFamily: "monospace" }}
              >
                {myGuild.tag}
              </span>
            </div>
          </div>

          {/* Guild Info */}
          <div className="flex-1">
            <h2
              className="text-xl font-bold text-white mb-1"
              style={{ fontFamily: "monospace" }}
            >
              {myGuild.name}
            </h2>
            <div
              className="flex gap-3 text-xs"
              style={{ fontFamily: "monospace" }}
            >
              <span className="text-amber-400">LV.{myGuild.level}</span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-400">
                {myGuild.members?.length}/{myGuild.maxMembers} Members
              </span>
            </div>
          </div>

          {/* Leave Button */}
          {membership?.rank !== "Leader" && (
            <button
              onClick={() => leaveGuildMutation.mutate()}
              className="p-2 bg-red-700 hover:bg-red-600"
              style={{
                border: "2px solid #7f1d1d",
                boxShadow: "0 2px 0 #7f1d1d",
              }}
              title="Leave Guild"
            >
              <img
                src={guildLeaveIcon}
                alt="Leave"
                className="w-5 h-5"
                style={{ imageRendering: "pixelated" }}
              />
            </button>
          )}
        </div>

        {/* Description */}
        {myGuild.description && (
          <div className="bg-stone-900 border border-stone-700 p-2 mt-2">
            <p
              className="text-sm text-gray-300"
              style={{ fontFamily: "monospace" }}
            >
              {myGuild.description}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setView("my-guild")}
          className={`py-2 rounded font-bold text-xs ${
            view === "my-guild"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          <img
            src={guildInfoIcon}
            alt="Info"
            className="w-4 h-4 mx-auto mb-1"
          />
          Info
        </button>
        <button
          onClick={() => setView("members")}
          className={`py-2 rounded font-bold text-xs ${
            view === "members"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          <img
            src={guildMembersIcon}
            alt="Members"
            className="w-4 h-4 mx-auto mb-1"
          />
          Members
        </button>
        <button
          onClick={() => setView("chat")}
          className={`py-2 rounded font-bold text-xs relative ${
            view === "chat"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          {hasUnreadGuildMessages && view !== "chat" && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-stone-800 animate-pulse" />
          )}
          <img
            src={guildChatIcon}
            alt="Chat"
            className="w-4 h-4 mx-auto mb-1"
          />
          Chat
        </button>
        <button
          onClick={() => setView("shop")}
          className={`py-2 rounded font-bold text-xs ${
            view === "shop"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          <img
            src={guildShopIcon}
            alt="Shop"
            className="w-4 h-4 mx-auto mb-1"
          />
          Shop
        </button>
        <button
          onClick={() => setView("donate")}
          className={`py-2 rounded font-bold text-xs ${
            view === "donate"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          <img
            src={guildDonateIcon}
            alt="Donate"
            className="w-4 h-4 mx-auto mb-1"
          />
          Donate
        </button>
        <button
          onClick={() => setView("settings")}
          className={`py-2 rounded font-bold text-xs ${
            view === "settings"
              ? "bg-purple-600 text-white"
              : "bg-stone-800 text-gray-400"
          }`}
        >
          <img
            src={settingsIcon}
            alt="Settings"
            className="w-4 h-4 mx-auto mb-1"
          />
          Settings
        </button>
      </div>

      {/* Guild Info */}
      {view === "my-guild" && (
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
                <p className="text-gray-400 text-xs">Guild Bank</p>
                <p className="text-yellow-400 font-bold">{myGuild.guildGold}g</p>
              </div>
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Guild Coins</p>
                <p className="text-purple-400 font-bold">{myGuild.guildCoins} GC</p>
              </div>
              <div className="bg-stone-900 rounded p-2">
                <p className="text-gray-400 text-xs">Members</p>
                <p className="text-white font-bold">
                  {myGuild.members?.length}/{myGuild.maxMembers}
                </p>
              </div>
            </div>
          </div>

          {/* Guild Perks - Retro Style */}
          <div
            className="bg-stone-800 border-2 border-purple-600 p-3"
            style={{ boxShadow: "0 4px 0 #7c3aed" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-sm">✨ Guild Perks</h3>
              {myGuild.level > 1 && (
                <span className="text-xs bg-purple-600 px-2 py-1 text-white font-bold border border-purple-800">
                  Active
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-900 border-2 border-blue-600 p-2">
                <p className="text-blue-400 text-xs font-bold mb-1">
                  📈 EXP Bonus
                </p>
                <p
                  className="text-white font-bold text-lg"
                  style={{ fontFamily: "monospace" }}
                >
                  {myGuild.expBonus > 0 ? `+${myGuild.expBonus}%` : "0%"}
                </p>
              </div>
              <div className="bg-stone-900 border-2 border-amber-600 p-2">
                <p className="text-amber-400 text-xs font-bold mb-1">
                  💰 Gold Bonus
                </p>
                <p
                  className="text-white font-bold text-lg"
                  style={{ fontFamily: "monospace" }}
                >
                  {myGuild.goldBonus > 0 ? `+${myGuild.goldBonus}%` : "0%"}
                </p>
              </div>
            </div>
            <div className="bg-purple-900 border border-purple-600 mt-2 p-2">
              <p className="text-xs text-purple-200 text-center font-bold">
                {myGuild.level === 1
                  ? "🎁 Upgrade guild to unlock perks!"
                  : "⚡ Applied to all dungeon rewards!"}
              </p>
            </div>
          </div>

          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Your Rank</h3>
            <div className="flex items-center gap-2">
              {getRankIcon(membership?.rank) ? (
                <img
                  src={getRankIcon(membership?.rank)!}
                  alt={membership?.rank}
                  className="w-6 h-6"
                />
              ) : (
                <Shield className={getRankColor(membership?.rank)} size={20} />
              )}
              <span className={`font-bold ${getRankColor(membership?.rank)}`}>
                {membership?.rank}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Gold Donated: {membership?.goldDonated || 0}
            </p>
          </div>
        </div>
      )}

      {/* Members */}
      {view === "members" && (
        <MembersView
          myGuild={myGuild}
          membership={membership}
          canManage={canManage}
          getRankIcon={getRankIcon}
          getRankColor={getRankColor}
          getDungeonIcon={getDungeonIcon}
          kickMemberMutation={kickMemberMutation}
          updateRankMutation={updateRankMutation}
          player={player}
        />
      )}

      {/* Chat - Mobile Optimized */}
      {view === "chat" && (
        <div className="h-[calc(100vh-240px)] sm:h-[500px]">
          <GuildChat
            initialMessages={myGuild.chatMessages || []}
            guildName={myGuild.name}
          />
        </div>
      )}

      {/* Donate */}
      {view === "donate" && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-2">Donate Gold</h3>
            <p className="text-sm text-gray-400 mb-3">
              Help your guild grow by donating gold. 95% converts to Guild Coins (GC) for the shop, 5% goes to the Guild Bank for upgrades.
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
                disabled={
                  !donateAmount ||
                  parseInt(donateAmount) <= 0 ||
                  donateMutation.isPending
                }
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
                  <div
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="text-white">
                        {member.player.username}
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold">
                      {member.goldDonated}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Guild Shop */}
      {view === "shop" && myGuild && <GuildShop guild={myGuild} />}

      {/* Guild Settings */}
      {view === "settings" && (
        <div className="space-y-3">
          <div className="bg-stone-800 rounded-lg p-3">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <img src={settingsIcon} alt="Settings" className="w-5 h-5" />
              Guild Settings
            </h3>

            {/* Guild Info */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">
                Guild Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-bold">{myGuild.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tag:</span>
                  <span className="text-purple-400 font-bold">
                    [{myGuild.tag}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(myGuild.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Perks */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">
                Guild Perks
              </h4>
              <div className="space-y-2">
                <div className="bg-stone-900 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">EXP Bonus</span>
                    <span className="text-green-400 font-bold">
                      +{myGuild.expBonus}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(myGuild.expBonus / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-stone-900 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">Gold Bonus</span>
                    <span className="text-yellow-400 font-bold">
                      +{myGuild.goldBonus}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${(myGuild.goldBonus / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leader Controls */}
            {membership?.rank === "Leader" && (
              <div className="space-y-3">
                <div className="p-3 bg-red-900/30 border border-red-600 rounded">
                  <h4 className="text-sm font-bold text-red-300 mb-2">
                    Leader Controls
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setNewDescription(myGuild.description || "");
                        setShowEditDescription(true);
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm relative overflow-hidden"
                      style={{
                        border: "3px solid #d97706",
                        boxShadow:
                          "0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                        textShadow: "1px 1px 0 #000",
                        fontFamily: "monospace",
                      }}
                    >
                      Edit Guild Description
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent" />
                    </button>
                    <button
                      onClick={() => setShowEmblemPicker(true)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm relative overflow-hidden"
                      style={{
                        border: "3px solid #7c3aed",
                        boxShadow:
                          "0 3px 0 #6d28d9, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                        textShadow: "1px 1px 0 #000",
                        fontFamily: "monospace",
                      }}
                    >
                      Change Guild Emblem
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent" />
                    </button>
                    <div className="flex items-center justify-between p-2 bg-stone-900 rounded">
                      <span className="text-sm text-white">
                        Require Approval to Join
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await guildApi.toggleApproval(
                              myGuild.id,
                              !myGuild.requiresApproval
                            );
                            queryClient.invalidateQueries({
                              queryKey: ["myGuild"],
                            });
                            (window as any).showToast?.(
                              myGuild.requiresApproval
                                ? "Auto-join enabled"
                                : "Applications required",
                              "success"
                            );
                          } catch (error: any) {
                            (window as any).showToast?.(
                              error.response?.data?.error ||
                                "Failed to update setting",
                              "error"
                            );
                          }
                        }}
                        className={`px-4 py-1 rounded font-bold text-xs ${
                          myGuild.requiresApproval
                            ? "bg-green-600 text-white"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {myGuild.requiresApproval ? "ON" : "OFF"}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const currentLevel = myGuild?.level || 1;
                        const upgradeCost = Math.floor(
                          10000 * Math.pow(2, currentLevel - 1)
                        );

                        if (currentLevel >= 10) {
                          (window as any).showToast?.(
                            "Guild is already at maximum level!",
                            "info"
                          );
                          return;
                        }

                        if (!player || player.gold < upgradeCost) {
                          (window as any).showToast?.(
                            `Not enough gold! Need ${upgradeCost.toLocaleString()} gold`,
                            "error"
                          );
                          return;
                        }

                        setShowUpgradeConfirm(true);
                      }}
                      disabled={upgradeGuildMutation.isPending}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold text-sm relative overflow-hidden disabled:opacity-50"
                      style={{
                        border: "3px solid #2563eb",
                        boxShadow: upgradeGuildMutation.isPending
                          ? "none"
                          : "0 3px 0 #1d4ed8, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                        textShadow: "1px 1px 0 #000",
                        fontFamily: "monospace",
                      }}
                    >
                      {upgradeGuildMutation.isPending
                        ? "Upgrading..."
                        : `Upgrade Guild (${Math.floor(
                            10000 * Math.pow(2, (myGuild?.level || 1) - 1)
                          ).toLocaleString()} Gold)`}
                      {!upgradeGuildMutation.isPending && (
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowDisbandConfirm(true)}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm relative overflow-hidden"
                      style={{
                        border: "3px solid #dc2626",
                        boxShadow:
                          "0 3px 0 #b91c1c, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                        textShadow: "1px 1px 0 #000",
                        fontFamily: "monospace",
                      }}
                    >
                      Disband Guild
                      <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Guild */}
            {membership?.rank !== "Leader" && (
              <div className="mt-4">
                <button
                  onClick={() => leaveGuildMutation.mutate()}
                  disabled={leaveGuildMutation.isPending}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm relative overflow-hidden disabled:opacity-50"
                  style={{
                    border: "3px solid #dc2626",
                    boxShadow: leaveGuildMutation.isPending
                      ? "none"
                      : "0 3px 0 #b91c1c, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "1px 1px 0 #000",
                    fontFamily: "monospace",
                  }}
                >
                  Leave Guild
                  {!leaveGuildMutation.isPending && (
                    <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditDescription && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditDescription(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-3">
              Edit Guild Description
            </h2>
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
                  (window as any).showToast?.(
                    "Description updated!",
                    "success"
                  );
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
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDisbandConfirm(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-red-600 p-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-red-400 mb-3">
              ⚠️ Disband Guild?
            </h2>
            <p className="text-white mb-2">
              Are you absolutely sure you want to disband{" "}
              <span className="font-bold text-purple-400">{myGuild.name}</span>?
            </p>
            <p className="text-red-300 text-sm mb-4">
              This action cannot be undone! All members will be kicked and the
              guild will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await guildApi.disband();
                    (window as any).showToast?.(
                      "Guild disbanded successfully!",
                      "success"
                    );
                    setShowDisbandConfirm(false);
                    setView("browse");
                    // Force refresh guild data
                    await refetchMyGuild();
                    queryClient.invalidateQueries({ queryKey: ["myGuild"] });
                  } catch (error: any) {
                    (window as any).showToast?.(
                      error.response?.data?.error || "Failed to disband guild",
                      "error"
                    );
                  }
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

      {/* Emblem Picker Modal */}
      {showEmblemPicker && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEmblemPicker(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-4 border-purple-600 p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)" }}
          >
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Choose Guild Emblem
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                "Blank_Gold__Animated_32x32",
                "Blank_Purple_Animated_32x32",
                "Blank_Silver_Animated_32x32",
                "Coins_Animated_32x32",
                "Diamond_Animated_32x32",
                "Dragon_Animated_32x32",
                "Emerald_Animated_32x32",
                "Enchanter_Animated_32x32",
                "Royal_Animated_32x32",
                "Skull_Animated_32x32",
                "Sword_Animated_32x32",
              ].map((iconId) => (
                <button
                  key={iconId}
                  onClick={() => updateEmblemMutation.mutate(iconId)}
                  disabled={updateEmblemMutation.isPending}
                  className={`p-3 rounded-lg border-2 transition hover:scale-105 ${
                    myGuild?.iconId === iconId
                      ? "border-purple-500 bg-purple-900/50"
                      : "border-stone-600 bg-stone-900 hover:border-purple-400"
                  }`}
                >
                  <img
                    src={`/assets/ui/guild/guild_icons/${iconId}.gif`}
                    alt={iconId}
                    className="w-16 h-16 mx-auto"
                    style={{ imageRendering: "pixelated" }}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/ui/guild.png";
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {iconId.replace("_Animated_32x32", "").replace(/_/g, " ")}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEmblemPicker(false)}
              className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Confirmation Modal */}
      {showUpgradeConfirm && myGuild && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpgradeConfirm(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-4 border-blue-600 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 0 20px rgba(37, 99, 235, 0.5)" }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              ⬆️ Upgrade Guild
            </h2>

            {/* Current Level */}
            <div className="bg-stone-900 rounded-lg p-4 mb-4">
              <div className="text-center mb-3">
                <span className="text-blue-400 text-lg font-bold">
                  Level {myGuild.level}
                </span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="text-amber-400 text-lg font-bold">
                  Level {myGuild.level + 1}
                </span>
              </div>

              {/* Cost */}
              <div className="bg-red-900/30 border-2 border-red-600 rounded p-3 mb-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-300 text-sm">Cost:</span>
                  <span className="text-amber-400 font-bold text-lg">
                    💰{" "}
                    {Math.floor(
                      10000 * Math.pow(2, myGuild.level - 1)
                    ).toLocaleString()}{" "}
                    Gold
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-green-900/30 border-2 border-green-600 rounded p-3">
                <h3 className="text-green-400 font-bold text-sm mb-2 text-center">
                  ✨ Benefits
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Member Cap:</span>
                    <span className="text-white font-bold">
                      {myGuild.level * 20} → {(myGuild.level + 1) * 20}
                    </span>
                    <span className="text-green-400">(+20)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">EXP Bonus:</span>
                    <span className="text-white font-bold">
                      {(myGuild.level - 1) * 5}% → {myGuild.level * 5}%
                    </span>
                    <span className="text-green-400">(+5%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Gold Bonus:</span>
                    <span className="text-white font-bold">
                      {(myGuild.level - 1) * 5}% → {myGuild.level * 5}%
                    </span>
                    <span className="text-green-400">(+5%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">
                      Increased guild prestige
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  upgradeGuildMutation.mutate();
                  setShowUpgradeConfirm(false);
                }}
                disabled={upgradeGuildMutation.isPending}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg text-sm transition"
              >
                {upgradeGuildMutation.isPending
                  ? "⏳ Upgrading..."
                  : "⬆️ Upgrade Now"}
              </button>
              <button
                onClick={() => setShowUpgradeConfirm(false)}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded-lg text-sm transition"
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
