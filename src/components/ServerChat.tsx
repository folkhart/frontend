import { useState, useEffect, useRef } from "react";
import { Send, X, Smile } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useGameStore } from "@/store/gameStore";
import { dungeonApi, guildApi, friendApi } from "@/lib/api";
import worldIcon from "@/assets/ui/world.png";
import ratCellarIcon from "@/assets/ui/dungeonIcons/ratCellar.png";
import goblinCaveIcon from "@/assets/ui/dungeonIcons/goblinCave.png";
import slimeDenIcon from "@/assets/ui/dungeonIcons/slimeDen.png";
import darkForestIcon from "@/assets/ui/dungeonIcons/darkForest.png";
import dragonLairIcon from "@/assets/ui/dungeonIcons/dragonLair.png";
import obsidianVaultIcon from "@/assets/ui/dungeonIcons/obsidianVault.png";
import hollowrootSanctuaryIcon from "@/assets/ui/dungeonIcons/hollowrootSanctuary.png";
import theMawOfSilenceIcon from "@/assets/ui/dungeonIcons/theMawOfSilence.png";
import clockworkNecropolisIcon from "@/assets/ui/dungeonIcons/clockworkNecropolis.png";
import paleCitadelIcon from "@/assets/ui/dungeonIcons/paleCitadel.png";
import theAbyssalSpireIcon from "@/assets/ui/dungeonIcons/theAbyssalSpire.png";
import eclipticThroneIcon from "@/assets/ui/dungeonIcons/eclipticThrone.png";
import attackIconCP from "@/assets/ui/character_panel/attack.png";
import defenseIconCP from "@/assets/ui/character_panel/defense.png";
import hpIconCP from "@/assets/ui/character_panel/hp.png";
import speedIconCP from "@/assets/ui/character_panel/speed.png";
import addFriendIcon from "@/assets/ui/add_friend.png";
import guildInviteIcon from "@/assets/ui/guild_invite.png";
import removeFriendIcon from "@/assets/ui/remove_friend.png";
import Lightning from "@/components/effects/Lightning";
import ColorBends from "@/components/effects/ColorBends";
import { useElectron } from "@/hooks/useElectron";
import FramedAvatar from "@/components/FramedAvatar";

const getDungeonIconByName = (dungeonName: string) => {
  const iconMap: Record<string, string> = {
    "Rat Cellar": ratCellarIcon,
    "Goblin Cave": goblinCaveIcon,
    "Slime Den": slimeDenIcon,
    "Dark Forest": darkForestIcon,
    "Dragon's Lair": dragonLairIcon,
    "Shattered Obsidian Vault": obsidianVaultIcon,
    "Hollowroot Sanctuary": hollowrootSanctuaryIcon,
    "The Maw of Silence": theMawOfSilenceIcon,
    "The Clockwork Necropolis": clockworkNecropolisIcon,
    "The Pale Citadel": paleCitadelIcon,
    "The Abyssal Spire": theAbyssalSpireIcon,
    "The Ecliptic Throne": eclipticThroneIcon,
  };
  return iconMap[dungeonName] || ratCellarIcon;
};

interface ChatMessage {
  id: string;
  message: string;
  createdAt: Date | string;
  player: {
    username: string;
    level: number;
    class?: string;
    titleIcon?: string;
    isAdmin?: boolean;
    avatarId?: string;
  };
}

const EMOJIS = [
  "Coins_Animated_32x32",
  "Diamond_Animated_32x32",
  "Dragon_Animated_32x32",
  "Emerald_Animated_32x32",
  "Enchanter_Animated_32x32",
  "Royal_Animated_32x32",
  "Skull_Animated_32x32",
  "Sword_Animated_32x32",
  "blood",
  "book",
  "chest",
  "eye",
  "goldfish",
  "goldpile",
  "heart",
  "hp",
  "questionmark",
  "shield",
  "silverpile",
  "skull",
  "staff",
  "star",
  "swords",
  "Icon1",
  "Icon2",
  "Icon3",
  "Icon4",
  "Icon5",
  "Icon6",
  "Icon7",
  "Icon8",
  "Icon9",
  "Icon10",
  "Icon11",
  "Icon12",
  "Icon13",
  "Icon14",
  "Icon15",
  "Icon16",
  "Icon17",
  "Icon18",
  "Icon19",
  "Icon20",
  "Icon21",
  "Icon22",
  "Icon23",
  "Icon24",
  "Icon25",
  "Icon26",
  "Icon27",
  "Icon28",
  "Icon29",
  "Icon30",
  "Icon31",
  "Icon32",
  "Icon33",
  "Icon34",
  "Icon35",
  "Icon36",
  "Icon37",
  "Icon38",
  "Icon39",
  "Icon40",
  "Icon41",
  "Icon42",
  "Icon43",
  "Icon44",
  "Icon45",
  "Icon46",
  "Icon47",
  "Icon48",
];

export default function ServerChat() {
  const { player, character, setHasUnreadServerMessages } = useGameStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendServerChatMention } = useElectron();

  // Mark server chat as read when component mounts
  useEffect(() => {
    setHasUnreadServerMessages(false);
  }, [setHasUnreadServerMessages]);

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
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState<
    string | null
  >(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();

  // Load initial server chat messages
  const { data: initialMessages } = useQuery({
    queryKey: ["server-chat-messages"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/serverchat/messages`
      );
      return data;
    },
  });

  // Set initial messages when loaded
  useEffect(() => {
    if (initialMessages) {
      console.log("Initial messages loaded:", initialMessages);
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Fetch friends list
  const { data: friendsList } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await friendApi.getFriends();
      return data;
    },
  });

  // Fetch player character data when selected
  const {
    data: playerCharacter,
    isLoading: isLoadingCharacter,
    error: characterError,
  } = useQuery({
    queryKey: ["player-character", selectedPlayerUsername],
    queryFn: async () => {
      if (!selectedPlayerUsername) return null;
      console.log("Fetching character for:", selectedPlayerUsername);
      const { data } = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/players/${selectedPlayerUsername}/character`
      );
      console.log("Character data received:", data);
      console.log("Companion slot data:", data.companionSlot);
      return data;
    },
    enabled: !!selectedPlayerUsername,
    retry: false,
  });

  // Check if selected player is already a friend
  useEffect(() => {
    if (playerCharacter && friendsList) {
      const isFriend = friendsList.some(
        (friend: any) =>
          friend.friend?.character?.name === selectedPlayerUsername
      );
      setIsAlreadyFriend(isFriend);
    }
  }, [playerCharacter, friendsList, selectedPlayerUsername]);

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data } = await friendApi.sendRequest(username);
      return data;
    },
    onSuccess: () => {
      setFriendRequestSent(true);
      (window as any).showToast?.("Friend request sent!", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to send friend request",
        "error"
      );
    },
  });

  // Cancel friend request mutation
  const cancelFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data } = await friendApi.cancelRequest(username);
      return data;
    },
    onSuccess: () => {
      setFriendRequestSent(false);
      (window as any).showToast?.("Friend request cancelled", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to cancel request",
        "error"
      );
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { data } = await friendApi.removeFriend(playerId);
      return data;
    },
    onSuccess: () => {
      setIsAlreadyFriend(false);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      (window as any).showToast?.("Friend removed", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to remove friend",
        "error"
      );
    },
  });

  // Send guild invitation mutation
  const sendGuildInviteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { data } = await guildApi.invitePlayer(playerId);
      return data;
    },
    onSuccess: () => {
      (window as any).showToast?.("Guild invitation sent!", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to send guild invitation",
        "error"
      );
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !character) return;

    // Listen for server chat messages
    socket.on("server_chat_message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);

      // Mark as unread if message is from another player (not yourself)
      if (message.player.username !== character.name) {
        setHasUnreadServerMessages(true);
      }

      // Check if this message mentions the current user
      const mentionPattern = new RegExp(`@${character.name}\\b`, "i");
      if (
        mentionPattern.test(message.message) &&
        message.player.username !== character.name
      ) {
        // Send notification for mention
        sendServerChatMention(message.player.username, message.message);
      }
    });

    return () => {
      socket.off("server_chat_message");
    };
  }, [socket, character, sendServerChatMention]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit("server_chat_message", { message: inputMessage.trim() });
    setInputMessage("");
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSystemMessage = (username: string) => {
    return username === "SYSTEM" || username === "System";
  };

  const getClassIcon = (className: string) => {
    switch (className) {
      case "Warrior":
        return "⚔️";
      case "Mage":
        return "🔮";
      case "Rogue":
        return "🗡️";
      case "Ranger":
        return "🏹";
      case "Cleric":
        return "✨";
      default:
        return "⚔️";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "border-gray-500";
      case "Uncommon":
        return "border-green-500";
      case "Rare":
        return "border-blue-500";
      case "Epic":
        return "border-purple-500";
      case "Legendary":
        return "border-orange-500";
      default:
        return "border-stone-700";
    }
  };

  const getGuildItemPath = (spriteId: string) => {
    let fileName = spriteId;
    const tierMap: { [key: string]: string } = {
      bronze: "1",
      silver: "2",
      gold: "3",
      diamond: "4",
    };
    for (const [tier, number] of Object.entries(tierMap)) {
      if (fileName.includes(`_${tier}`)) {
        fileName = fileName.replace(`_${tier}`, number);
        break;
      }
    }
    if (spriteId === "guild_key") return `chests_and_keys/key1.png`;
    if (fileName.startsWith("guild_chest"))
      return `chests_and_keys/Chest${fileName.replace("guild_chest", "")}.png`;
    if (fileName.startsWith("guild_sword"))
      return `weapons/guild_sword/${fileName.replace(
        "guild_sword",
        "guildsword"
      )}.png`;
    if (fileName.startsWith("guild_bow"))
      return `weapons/guild_bow/${fileName}.png`;
    if (fileName.startsWith("guild_dagger"))
      return `weapons/guild_dagger/${fileName}.png`;
    if (fileName.startsWith("guild_shield"))
      return `weapons/guild_shield/${fileName}.png`;
    if (fileName.startsWith("guild_staff"))
      return `weapons/guild_staff/${fileName}.png`;
    if (fileName.startsWith("guild_armor"))
      return `armors/warrior_armors/${fileName}.png`;
    if (fileName.includes("glove"))
      return `guild_armor_pieces/gloves/${fileName}.png`;
    if (fileName.includes("boot") || fileName.includes("shoe")) {
      return `guild_armor_pieces/shoes/${fileName
        .replace("guild_boot", "guild_shoes")
        .replace("guild_shoe", "guild_shoes")}.png`;
    }
    return `${fileName}.png`;
  };

  const getItemImage = (spriteId: string, itemType?: string): string | null => {
    try {
      if (
        spriteId.startsWith("guild_") ||
        spriteId.startsWith("Chest") ||
        spriteId.startsWith("key")
      ) {
        return `/assets/items/guildshop_items/${getGuildItemPath(spriteId)}`;
      }

      if (spriteId.includes("/")) {
        // If it already starts with weapons/, armors/, accessories/, or craft/, use as-is
        // Otherwise, for bare set names (woodenSet, ironSet, steelSet, dungeonDrops), prepend accessories/
        let fullPath = spriteId;
        if (
          !spriteId.startsWith("weapons/") &&
          !spriteId.startsWith("armors/") &&
          !spriteId.startsWith("accessories/") &&
          !spriteId.startsWith("craft/") &&
          (spriteId.startsWith("woodenSet/") ||
            spriteId.startsWith("ironSet/") ||
            spriteId.startsWith("steelSet/") ||
            spriteId.startsWith("dungeonDrops/"))
        ) {
          fullPath = `accessories/${spriteId}`;
        }
        return `/assets/items/${fullPath}.png`;
      }

      let folder = "weapons";
      if (itemType === "Armor") folder = "armors";
      else if (itemType === "Accessory") folder = "accessories";
      else if (itemType === "Consumable") folder = "consumables";

      return `/assets/items/${folder}/${spriteId}.png`;
    } catch (e) {
      return null;
    }
  };

  const handlePlayerClick = (username: string) => {
    setSelectedPlayerUsername(username);
  };

  const insertEmoji = (emoji: string) => {
    const emojiCode = `:${emoji}:`;
    setInputMessage((prev) => prev + emojiCode);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const renderMessageWithEmojis = (text: string) => {
    // First, split by mentions (@username)
    const mentionPattern = /(@\w+)/g;
    const segments = text.split(mentionPattern);

    return segments.map((segment, segmentIndex) => {
      // Check if this segment is a mention
      if (segment.match(mentionPattern)) {
        const mentionedName = segment.substring(1); // Remove @
        const isCurrentUser = character?.name === mentionedName;

        return (
          <span
            key={`mention-${segmentIndex}`}
            className={`font-bold ${
              isCurrentUser
                ? "text-amber-400 bg-amber-900/30 px-1 rounded"
                : "text-blue-400"
            }`}
          >
            {segment}
          </span>
        );
      }

      // Replace :emoji: codes with actual emoji images
      const parts = segment.split(
        /(:(?:Coins|Diamond|Dragon|Emerald|Enchanter|Royal|Skull|Sword|Icon\d+|blood|book|chest|eye|goldfish|goldpile|heart|hp|questionmark|shield|silverpile|skull|staff|star|swords)(?:_Animated_32x32)?:)/g
      );

      return parts.map((part, index) => {
        const match = part.match(/:(.+):/);
        if (match) {
          const emojiName = match[1];
          const ext = emojiName.includes("Animated") ? "gif" : "png";
          return (
            <img
              key={`${segmentIndex}-${index}`}
              src={`/assets/ui/chat/emojis/${emojiName}.${ext}`}
              alt={emojiName}
              className="inline-block w-6 h-6 mx-0.5"
              style={{ imageRendering: "pixelated", verticalAlign: "middle" }}
            />
          );
        }
        return <span key={`${segmentIndex}-${index}`}>{part}</span>;
      });
    });
  };

  return (
    <div
      className="flex flex-col h-full bg-stone-900 border-2 border-amber-600"
      style={{ borderRadius: "0" }}
    >
      {/* Header */}
      <div className="bg-stone-800 border-b-2 border-amber-600 p-3">
        <h2
          className="text-xl font-bold text-amber-400 flex items-center gap-2"
          style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
        >
          <img
            src={worldIcon}
            alt="World"
            className="w-6 h-6"
            style={{ imageRendering: "pixelated" }}
          />
          SERVER CHAT
        </h2>
        <p
          className="text-xs text-gray-400"
          style={{ fontFamily: "monospace" }}
        >
          Chat with players across the entire server
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No messages yet. Be the first to say hello to the server!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-stone-800 border border-stone-700 p-2 rounded"
            >
              <div className="flex items-start gap-2">
                {/* Player Avatar - Clickable */}
                {isSystemMessage(msg.player.username) ? (
                  <FramedAvatar
                    src="/assets/ui/avatar_frames/system_avatar.png"
                    alt="System"
                    frame="system_frame"
                    size="small"
                    borderColor="border-orange-600"
                  />
                ) : (
                  <FramedAvatar
                    src={
                      msg.player.avatarId
                        ? getDungeonIcon(msg.player.avatarId)
                        : `/assets/ui/chat/classIcons/${
                            msg.player.class?.toLowerCase() || "warrior"
                          }.png`
                    }
                    alt={msg.player.username}
                    frame={msg.player.avatarFrame || "default"}
                    size="small"
                    onClick={() => handlePlayerClick(msg.player.username)}
                    borderColor="border-amber-500"
                  />
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Username, Class & Level */}
                  <div className="flex items-center gap-2 mb-1">
                    {msg.player.titleIcon && (
                      <img
                        src={`/assets/ui/titleIcons/${msg.player.titleIcon}.png`}
                        alt="Title"
                        className="w-4 h-4"
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                    <span
                      className={`font-bold ${
                        isSystemMessage(msg.player.username)
                          ? "text-orange-500"
                          : msg.player.isAdmin
                          ? "text-red-500 cursor-pointer hover:text-red-400"
                          : "text-amber-400 cursor-pointer hover:text-amber-300"
                      } transition`}
                      style={
                        msg.player.isAdmin
                          ? {
                              textShadow:
                                "0 0 15px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.7), 0 0 45px rgba(239, 68, 68, 0.4), 2px 2px 0 #000",
                              filter:
                                "drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))",
                            }
                          : undefined
                      }
                      onClick={() =>
                        !isSystemMessage(msg.player.username) &&
                        handlePlayerClick(msg.player.username)
                      }
                    >
                      {msg.player.username}
                    </span>
                    {msg.player.class &&
                      !isSystemMessage(msg.player.username) && (
                        <img
                          src={`/assets/ui/chat/classIcons/${msg.player.class.toLowerCase()}.png`}
                          alt={msg.player.class}
                          className="w-4 h-4"
                          style={{ imageRendering: "pixelated" }}
                          title={msg.player.class}
                        />
                      )}
                    {!isSystemMessage(msg.player.username) && (
                      <span className="text-gray-500 text-xs">
                        Lv.{msg.player.level}
                      </span>
                    )}
                    <span className="text-gray-600 text-xs ml-auto">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Message Text with Emojis */}
                  <div
                    className={`text-sm break-words ${
                      isSystemMessage(msg.player.username)
                        ? "text-orange-300 font-bold italic"
                        : "text-gray-200"
                    }`}
                  >
                    {isSystemMessage(msg.player.username) ? (
                      <div className="bg-orange-900/20 border-l-4 border-orange-500 pl-2 py-1">
                        {msg.message}
                      </div>
                    ) : (
                      renderMessageWithEmojis(msg.message)
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-stone-700 bg-stone-800 p-2 relative">
        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 right-0 bg-stone-900 border-2 border-stone-700 rounded-t-lg p-3 mb-1 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold text-xs">Chat Emojis</h4>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => {
                const ext = emoji.includes("Animated") ? "gif" : "png";
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition"
                  >
                    <img
                      src={`/assets/ui/chat/emojis/${emoji}.${ext}`}
                      alt={emoji}
                      className="w-8 h-8 mx-auto"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={sendMessage}>
          <div className="flex gap-2">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-700 border-2 border-stone-700 text-amber-400 rounded transition"
              title="Insert emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Message Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value.slice(0, 200))}
              placeholder="Message the server..."
              className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white rounded focus:border-amber-600 focus:outline-none"
              maxLength={200}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-bold transition flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {inputMessage.length}/200
          </div>
        </form>
      </div>

      {/* Player Character Stats Modal - Same as GuildChat */}
      {selectedPlayerUsername && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-2 sm:p-4"
          onClick={() => {
            setSelectedPlayerUsername(null);
            setFriendRequestSent(false);
            setIsAlreadyFriend(false);
          }}
        >
          <div
            className="bg-stone-800 border-2 sm:border-4 border-amber-600 p-3 sm:p-4 md:p-6 max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
            style={{ borderRadius: "0", boxShadow: "0 8px 0 rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-600">
              <h2
                className="text-3xl font-bold text-amber-400"
                style={{
                  fontFamily: "monospace",
                  textShadow:
                    "2px 2px 0 #000, 0 0 10px rgba(251, 191, 36, 0.5)",
                }}
              >
                CHARACTER STATS
              </h2>
              <button
                onClick={() => {
                  setSelectedPlayerUsername(null);
                  setFriendRequestSent(false);
                  setIsAlreadyFriend(false);
                }}
                className="text-amber-400 hover:text-amber-300 transition"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Loading State */}
            {isLoadingCharacter && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  Character details loading...
                </p>
              </div>
            )}

            {/* Error State */}
            {characterError && (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg">
                  Failed to load character data
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {characterError instanceof Error
                    ? characterError.message
                    : "Unknown error"}
                </p>
              </div>
            )}

            {/* Character Data */}
            {playerCharacter && (
              <>
                <div
                  className="flex items-center gap-4 mb-6 bg-stone-950 border-2 border-amber-700 p-4"
                  style={{
                    borderRadius: "8px",
                    boxShadow: "inset 0 2px 0 rgba(0,0,0,0.5), 0 4px 0 #78350f",
                  }}
                >
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl border-4 border-amber-500 overflow-hidden"
                    style={{
                      borderRadius: "50%",
                      boxShadow:
                        "0 4px 0 #92400e, inset 0 2px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    {playerCharacter.avatarId ? (
                      <img
                        src={getDungeonIcon(playerCharacter.avatarId)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      getClassIcon(playerCharacter.class)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {playerCharacter.equippedTitle?.iconId && (
                        <img
                          src={`/assets/ui/titleIcons/${playerCharacter.equippedTitle.iconId}.png`}
                          alt={playerCharacter.equippedTitle.title}
                          className="w-5 h-5"
                          style={{ imageRendering: "pixelated" }}
                          title={playerCharacter.equippedTitle.title}
                        />
                      )}
                      <h3
                        className={`text-2xl font-bold ${
                          playerCharacter.isAdmin
                            ? "text-red-500"
                            : "text-white"
                        }`}
                        style={{
                          fontFamily: "monospace",
                          textShadow: playerCharacter.isAdmin
                            ? "0 0 15px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.7), 0 0 45px rgba(239, 68, 68, 0.4), 2px 2px 0 #000"
                            : "2px 2px 0 #000, 0 0 10px rgba(255,255,255,0.3)",
                        }}
                      >
                        {playerCharacter.name}
                      </h3>
                    </div>
                    <p
                      className="text-amber-400 font-bold text-sm"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      Lv.{playerCharacter.level} {playerCharacter.class}
                    </p>
                    <p
                      className="text-xs text-gray-300 font-bold"
                      style={{ fontFamily: "monospace" }}
                    >
                      CP: {playerCharacter.combatPower}
                    </p>
                  </div>
                </div>

                {/* Experience Bar */}
                <div
                  className="mb-6 bg-stone-950 border-2 border-purple-700 p-3"
                  style={{ borderRadius: "8px" }}
                >
                  <div
                    className="flex justify-between text-sm font-bold mb-2"
                    style={{ fontFamily: "monospace" }}
                  >
                    <span
                      className="text-purple-400"
                      style={{ textShadow: "1px 1px 0 #000" }}
                    >
                      EXPERIENCE
                    </span>
                    <span
                      className="text-purple-300"
                      style={{ textShadow: "1px 1px 0 #000" }}
                    >
                      {playerCharacter.experience} /{" "}
                      {playerCharacter.level * 100}
                    </span>
                  </div>
                  <div
                    className="w-full bg-stone-900 h-4 border-2 border-purple-900"
                    style={{
                      borderRadius: "0",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all"
                      style={{
                        width: `${
                          (playerCharacter.experience /
                            (playerCharacter.level * 100)) *
                          100
                        }%`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 10px rgba(168, 85, 247, 0.5)",
                      }}
                    />
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Equipment Grid */}
                  <div>
                    <h3
                      className="text-lg font-bold text-amber-400 mb-3"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      Equipment
                    </h3>
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: "repeat(3, 70px)",
                        gridTemplateRows: "repeat(3, 70px)",
                        justifyContent: "center",
                      }}
                    >
                      {/* Row 1 */}
                      {[
                        ["earring", playerCharacter.earring, "Earring"],
                        ["helmet", playerCharacter.helmet, "Helmet"],
                        ["necklace", playerCharacter.necklace, "Necklace"],
                      ].map(([slot, item, label]) => {
                        const enhLevel = (item as any)?.enhancementLevel || 0;
                        const getAnimation = () => {
                          if (enhLevel >= 1 && enhLevel <= 2)
                            return "shimmer 2s ease-in-out infinite";
                          if (enhLevel >= 3 && enhLevel <= 4)
                            return "glow-pulse 1.5s ease-in-out infinite";
                          if (enhLevel === 5)
                            return "sparkle-shine 1.2s ease-in-out infinite";
                          return "";
                        };
                        return (
                          <div
                            key={slot as string}
                            className={`relative aspect-square bg-stone-900 border-2 ${
                              item
                                ? enhLevel >= 9
                                  ? "border-purple-500"
                                  : enhLevel >= 8
                                  ? "border-pink-500"
                                  : enhLevel >= 7
                                  ? "border-indigo-500"
                                  : enhLevel >= 6
                                  ? "border-cyan-400"
                                  : getRarityBorder((item as any).rarity)
                                : "border-stone-700"
                            }`}
                            style={{
                              boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                              animation: getAnimation(),
                            }}
                          >
                            {item ? (
                              <>
                                {(item as any).enhancementLevel >= 9 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <Lightning
                                      hue={270}
                                      xOffset={0}
                                      speed={1.5}
                                      intensity={0.8}
                                      size={2}
                                    />
                                  </div>
                                )}
                                {(item as any).enhancementLevel === 8 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <ColorBends
                                      colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                                      rotation={30}
                                      speed={0.3}
                                      scale={1.2}
                                      frequency={1.4}
                                      warpStrength={1.2}
                                      mouseInfluence={0}
                                      parallax={0}
                                      noise={0.08}
                                      transparent
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center p-1">
                                  {getItemImage(
                                    (item as any).spriteId,
                                    (item as any).type
                                  ) && (
                                    <img
                                      src={
                                        getItemImage(
                                          (item as any).spriteId,
                                          (item as any).type
                                        )!
                                      }
                                      alt={(item as any).name}
                                      className="w-full h-full object-contain"
                                      style={{ imageRendering: "pixelated" }}
                                    />
                                  )}
                                </div>
                                {(item as any).enhancementLevel > 0 && (
                                  <div
                                    className={`absolute top-0 right-0 text-white text-xs font-bold px-1.5 py-0.5 border-2 ${
                                      (item as any).enhancementLevel >= 9
                                        ? "bg-purple-500 border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                        : (item as any).enhancementLevel >= 8
                                        ? "bg-pink-500 border-pink-700 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                        : (item as any).enhancementLevel >= 7
                                        ? "bg-indigo-500 border-indigo-700 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                                        : (item as any).enhancementLevel >= 6
                                        ? "bg-cyan-500 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                        : "bg-amber-600 border-amber-800"
                                    }`}
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    +{(item as any).enhancementLevel}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                <p
                                  className="text-[9px] font-bold"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {label as string}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Row 2 */}
                      {[
                        ["weapon", playerCharacter.weapon, "Weapon"],
                        ["armor", playerCharacter.armor, "Armor"],
                        ["gloves", playerCharacter.gloves, "Gloves"],
                      ].map(([slot, item, label]) => {
                        const enhLevel = (item as any)?.enhancementLevel || 0;
                        const getAnimation = () => {
                          if (enhLevel >= 1 && enhLevel <= 2)
                            return "shimmer 2s ease-in-out infinite";
                          if (enhLevel >= 3 && enhLevel <= 4)
                            return "glow-pulse 1.5s ease-in-out infinite";
                          if (enhLevel === 5)
                            return "sparkle-shine 1.2s ease-in-out infinite";
                          return "";
                        };
                        return (
                          <div
                            key={slot as string}
                            className={`relative aspect-square bg-stone-900 border-2 ${
                              item
                                ? enhLevel >= 9
                                  ? "border-purple-500"
                                  : enhLevel >= 8
                                  ? "border-pink-500"
                                  : enhLevel >= 7
                                  ? "border-indigo-500"
                                  : enhLevel >= 6
                                  ? "border-cyan-400"
                                  : getRarityBorder((item as any).rarity)
                                : "border-stone-700"
                            }`}
                            style={{
                              boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                              animation: getAnimation(),
                            }}
                          >
                            {item ? (
                              <>
                                {(item as any).enhancementLevel >= 9 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <Lightning
                                      hue={270}
                                      xOffset={0}
                                      speed={1.5}
                                      intensity={0.8}
                                      size={2}
                                    />
                                  </div>
                                )}
                                {(item as any).enhancementLevel === 8 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <ColorBends
                                      colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                                      rotation={30}
                                      speed={0.3}
                                      scale={1.2}
                                      frequency={1.4}
                                      warpStrength={1.2}
                                      mouseInfluence={0}
                                      parallax={0}
                                      noise={0.08}
                                      transparent
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center p-1">
                                  {getItemImage(
                                    (item as any).spriteId,
                                    (item as any).type
                                  ) && (
                                    <img
                                      src={
                                        getItemImage(
                                          (item as any).spriteId,
                                          (item as any).type
                                        )!
                                      }
                                      alt={(item as any).name}
                                      className="w-full h-full object-contain"
                                      style={{ imageRendering: "pixelated" }}
                                    />
                                  )}
                                </div>
                                {(item as any).enhancementLevel > 0 && (
                                  <div
                                    className={`absolute top-0 right-0 text-white text-xs font-bold px-1.5 py-0.5 border-2 ${
                                      (item as any).enhancementLevel >= 9
                                        ? "bg-purple-500 border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                        : (item as any).enhancementLevel >= 8
                                        ? "bg-pink-500 border-pink-700 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                        : (item as any).enhancementLevel >= 7
                                        ? "bg-indigo-500 border-indigo-700 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                                        : (item as any).enhancementLevel >= 6
                                        ? "bg-cyan-500 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                        : "bg-amber-600 border-amber-800"
                                    }`}
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    +{(item as any).enhancementLevel}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                <p
                                  className="text-[9px] font-bold"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {label as string}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Row 3 */}
                      {[
                        ["ring", playerCharacter.ring, "Ring"],
                        ["shoes", playerCharacter.shoes, "Shoes"],
                        ["belt", playerCharacter.belt, "Belt"],
                      ].map(([slot, item, label]) => {
                        const enhLevel = (item as any)?.enhancementLevel || 0;
                        const getAnimation = () => {
                          if (enhLevel >= 1 && enhLevel <= 2)
                            return "shimmer 2s ease-in-out infinite";
                          if (enhLevel >= 3 && enhLevel <= 4)
                            return "glow-pulse 1.5s ease-in-out infinite";
                          if (enhLevel === 5)
                            return "sparkle-shine 1.2s ease-in-out infinite";
                          return "";
                        };
                        return (
                          <div
                            key={slot as string}
                            className={`relative aspect-square bg-stone-900 border-2 ${
                              item
                                ? enhLevel >= 9
                                  ? "border-purple-500"
                                  : enhLevel >= 8
                                  ? "border-pink-500"
                                  : enhLevel >= 7
                                  ? "border-indigo-500"
                                  : enhLevel >= 6
                                  ? "border-cyan-400"
                                  : getRarityBorder((item as any).rarity)
                                : "border-stone-700"
                            }`}
                            style={{
                              boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                              animation: getAnimation(),
                            }}
                          >
                            {item ? (
                              <>
                                {(item as any).enhancementLevel >= 9 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <Lightning
                                      hue={270}
                                      xOffset={0}
                                      speed={1.5}
                                      intensity={0.8}
                                      size={2}
                                    />
                                  </div>
                                )}
                                {(item as any).enhancementLevel === 8 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <ColorBends
                                      colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                                      rotation={30}
                                      speed={0.3}
                                      scale={1.2}
                                      frequency={1.4}
                                      warpStrength={1.2}
                                      mouseInfluence={0}
                                      parallax={0}
                                      noise={0.08}
                                      transparent
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center p-1">
                                  {getItemImage(
                                    (item as any).spriteId,
                                    (item as any).type
                                  ) && (
                                    <img
                                      src={
                                        getItemImage(
                                          (item as any).spriteId,
                                          (item as any).type
                                        )!
                                      }
                                      alt={(item as any).name}
                                      className="w-full h-full object-contain"
                                      style={{ imageRendering: "pixelated" }}
                                    />
                                  )}
                                </div>
                                {(item as any).enhancementLevel > 0 && (
                                  <div
                                    className={`absolute top-0 right-0 text-white text-xs font-bold px-1.5 py-0.5 border-2 ${
                                      (item as any).enhancementLevel >= 9
                                        ? "bg-purple-500 border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                        : (item as any).enhancementLevel >= 8
                                        ? "bg-pink-500 border-pink-700 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                        : (item as any).enhancementLevel >= 7
                                        ? "bg-indigo-500 border-indigo-700 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                                        : (item as any).enhancementLevel >= 6
                                        ? "bg-cyan-500 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                        : "bg-amber-600 border-amber-800"
                                    }`}
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    +{(item as any).enhancementLevel}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                <p
                                  className="text-[9px] font-bold"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {label as string}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Row 4 - Companion */}
                      {playerCharacter.companionSlot && (
                        <div className="col-span-3 flex justify-center">
                          <div
                            className="relative w-20 h-20 bg-stone-900 border-2 border-pink-600"
                            style={{
                              boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center p-1">
                              <img
                                src={`/assets/ui/${playerCharacter.companionSlot.spriteId}.png`}
                                alt={playerCharacter.companionSlot.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: "pixelated" }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                            {/* Tier Badge */}
                            {playerCharacter.companionSlot.tier > 0 && (
                              <div
                                className="absolute top-0 right-0 px-1.5 py-0.5 text-[10px] font-bold border-2 bg-gradient-to-b from-pink-500 to-pink-700 border-pink-300 text-white"
                                style={{
                                  fontFamily: "monospace",
                                  textShadow: "1px 1px 0 #000",
                                  boxShadow: "0 2px 0 rgba(0,0,0,0.5)",
                                }}
                              >
                                T{playerCharacter.companionSlot.tier}
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-pink-800 py-0.5">
                              <p
                                className="text-[8px] font-bold text-center text-white"
                                style={{ fontFamily: "monospace" }}
                              >
                                PET
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Character Stats */}
                  <div>
                    <h3
                      className="text-lg font-bold text-amber-400 mb-3"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                        style={{ borderRadius: "8px" }}
                      >
                        <img
                          src={hpIconCP}
                          alt="HP"
                          className="w-8 h-8"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <div>
                          <p
                            className="text-[10px] text-gray-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            Health
                          </p>
                          <p
                            className="text-lg font-bold text-red-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            {playerCharacter.maxHealth}
                          </p>
                        </div>
                      </div>
                      <div
                        className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                        style={{ borderRadius: "8px" }}
                      >
                        <img
                          src={attackIconCP}
                          alt="Attack"
                          className="w-8 h-8"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <div>
                          <p
                            className="text-[10px] text-gray-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            Attack
                          </p>
                          <p
                            className="text-lg font-bold text-orange-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            {playerCharacter.attack}
                          </p>
                        </div>
                      </div>
                      <div
                        className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                        style={{ borderRadius: "8px" }}
                      >
                        <img
                          src={defenseIconCP}
                          alt="Defense"
                          className="w-8 h-8"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <div>
                          <p
                            className="text-[10px] text-gray-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            Defense
                          </p>
                          <p
                            className="text-lg font-bold text-blue-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            {playerCharacter.defense}
                          </p>
                        </div>
                      </div>
                      <div
                        className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                        style={{ borderRadius: "8px" }}
                      >
                        <img
                          src={speedIconCP}
                          alt="Speed"
                          className="w-8 h-8"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <div>
                          <p
                            className="text-[10px] text-gray-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            Speed
                          </p>
                          <p
                            className="text-lg font-bold text-green-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            {playerCharacter.speed}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {playerCharacter && (
                  <div
                    className={`flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 pt-6 border-t-2 border-amber-700 ${
                      !(player as any)?.guildId ||
                      ((player as any)?.guildRank !== "Leader" &&
                        (player as any)?.guildRank !== "Officer")
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (isAlreadyFriend) {
                          removeFriendMutation.mutate(playerCharacter.playerId);
                        } else if (friendRequestSent) {
                          cancelFriendRequestMutation.mutate(
                            selectedPlayerUsername!
                          );
                        } else {
                          sendFriendRequestMutation.mutate(
                            selectedPlayerUsername!
                          );
                        }
                      }}
                      disabled={
                        sendFriendRequestMutation.isPending ||
                        cancelFriendRequestMutation.isPending ||
                        removeFriendMutation.isPending
                      }
                      className={`${
                        (player as any)?.guildId &&
                        ((player as any)?.guildRank === "Leader" ||
                          (player as any)?.guildRank === "Officer")
                          ? "flex-1"
                          : "w-full"
                      } bg-gradient-to-b ${
                        isAlreadyFriend || friendRequestSent
                          ? "from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-400"
                          : "from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400"
                      } text-white font-bold py-2 sm:py-3 px-4 border-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{
                        borderRadius: "0",
                        boxShadow:
                          isAlreadyFriend || friendRequestSent
                            ? "0 4px 0 #991b1b, inset 0 2px 0 rgba(255,255,255,0.3)"
                            : "0 4px 0 #1e40af, inset 0 2px 0 rgba(255,255,255,0.3)",
                        fontFamily: "monospace",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      <img
                        src={
                          isAlreadyFriend || friendRequestSent
                            ? removeFriendIcon
                            : addFriendIcon
                        }
                        alt={
                          isAlreadyFriend
                            ? "Remove Friend"
                            : friendRequestSent
                            ? "Cancel Request"
                            : "Add Friend"
                        }
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <span className="text-sm sm:text-base">
                        {isAlreadyFriend
                          ? "Remove Friend"
                          : friendRequestSent
                          ? "Cancel Request"
                          : "Add Friend"}
                      </span>
                    </button>
                    {/* Only show guild invite if player is guild leader or officer */}
                    {(player as any)?.guildId &&
                      ((player as any)?.guildRank === "Leader" ||
                        (player as any)?.guildRank === "Officer") && (
                        <button
                          onClick={() =>
                            sendGuildInviteMutation.mutate(
                              playerCharacter.playerId
                            )
                          }
                          disabled={
                            sendGuildInviteMutation.isPending ||
                            !playerCharacter?.playerId
                          }
                          className="flex-1 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2 sm:py-3 px-4 border-2 border-purple-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            borderRadius: "0",
                            boxShadow:
                              "0 4px 0 #6b21a8, inset 0 2px 0 rgba(255,255,255,0.3)",
                            fontFamily: "monospace",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          <img
                            src={guildInviteIcon}
                            alt="Guild Invite"
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            style={{ imageRendering: "pixelated" }}
                          />
                          <span className="text-sm sm:text-base">
                            Invite to Guild
                          </span>
                        </button>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
