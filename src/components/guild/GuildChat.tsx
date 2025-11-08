import { useState, useEffect, useRef } from "react";
import { Send, Smile, X, Circle } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useGameStore } from "@/store/gameStore";
import { dungeonApi, friendApi } from "@/lib/api";
import ratCellarIcon from "@/assets/ui/dungeonIcons/ratCellar.png";
import goblinCaveIcon from "@/assets/ui/dungeonIcons/goblinCave.png";
import slimeDenIcon from "@/assets/ui/dungeonIcons/slimeDen.png";
import dragonLairIcon from "@/assets/ui/dungeonIcons/dragonLair.png";
import darkForestIcon from "@/assets/ui/dungeonIcons/darkForest.png";
import obsidianVaultIcon from "@/assets/ui/dungeonIcons/obsidianVault.png";
import hollowrootSanctuaryIcon from "@/assets/ui/dungeonIcons/hollowrootSanctuary.png";
import theMawOfSilenceIcon from "@/assets/ui/dungeonIcons/theMawOfSilence.png";
import clockworkNecropolisIcon from "@/assets/ui/dungeonIcons/clockworkNecropolis.png";
import paleCitadelIcon from "@/assets/ui/dungeonIcons/paleCitadel.png";
import theAbyssalSpireIcon from "@/assets/ui/dungeonIcons/theAbyssalSpire.png";
import eclipticThroneIcon from "@/assets/ui/dungeonIcons/eclipticThrone.png";
import addFriendIcon from "@/assets/ui/add_friend.png";

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
    avatarId?: string;
  };
}

const EMOJIS = [
  "Coins_Animated_32x32",
  "Diamond_Animated_32x32",
  "Dragon_Animated_32x32",
  "Emerald_Animated_32x32",
  "Enchanter_Animated_32x32",
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
];

interface GuildChatProps {
  initialMessages?: ChatMessage[];
  guildName: string;
}

export default function GuildChat({
  initialMessages = [],
  guildName,
}: GuildChatProps) {
  const { character, setHasUnreadGuildMessages } = useGameStore();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState<
    string | null
  >(null);
  const [selectedItemDetails, setSelectedItemDetails] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();

  // Mark guild chat as read when component mounts
  useEffect(() => {
    setHasUnreadGuildMessages(false);
  }, [setHasUnreadGuildMessages]);

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

  // Fetch player character data when selected
  const { data: playerCharacter } = useQuery({
    queryKey: ["player-character", selectedPlayerUsername],
    queryFn: async () => {
      if (!selectedPlayerUsername) return null;
      const { data } = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/players/${selectedPlayerUsername}/character`
      );
      return data;
    },
    enabled: !!selectedPlayerUsername,
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data } = await friendApi.sendRequest(username);
      return data;
    },
    onSuccess: () => {
      (window as any).showToast?.('Friend request sent!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to send friend request', 'error');
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for new guild chat messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      
      // Mark as unread if message is from another player (not yourself)
      if (character && message.player.username !== character.name) {
        setHasUnreadGuildMessages(true);
      }
    };

    socket.on("guild_chat_message", handleNewMessage);

    return () => {
      socket.off("guild_chat_message", handleNewMessage);
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socket) return;

    // Send via Socket.io
    socket.emit("guild_chat_message", { message: inputMessage });

    // Clear input
    setInputMessage("");
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getClassColor = (playerClass?: string) => {
    switch (playerClass) {
      case "Mage":
        return "bg-purple-600 border-purple-800";
      case "Warrior":
        return "bg-red-600 border-red-800";
      case "Rogue":
        return "bg-green-600 border-green-800";
      case "Ranger":
        return "bg-emerald-600 border-emerald-800";
      case "Cleric":
        return "bg-blue-600 border-blue-800";
      default:
        return "bg-amber-600 border-amber-800";
    }
  };

  const getClassIcon = (playerClass?: string) => {
    switch (playerClass) {
      case "Mage":
        return "🔮";
      case "Warrior":
        return "⚔️";
      case "Rogue":
        return "🗡️";
      case "Ranger":
        return "🏹";
      case "Cleric":
        return "✨";
      default:
        return "👤";
    }
  };

  const handlePlayerClick = (username: string) => {
    setSelectedPlayerUsername(username);
  };

  // Helper functions for equipment display
  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;
    try {
      const images = import.meta.glob("../../assets/items/**/*.png", {
        eager: true,
        as: "url",
      });

      if (/^\d+$/.test(spriteId)) {
        const num = parseInt(spriteId);
        if (num >= 985 && num <= 992) {
          const potsPath = `../../assets/items/consumables/${spriteId}.png`;
          return images[potsPath] || null;
        }
      }

      if (
        spriteId.startsWith("guild_") ||
        spriteId.startsWith("Chest") ||
        spriteId.startsWith("key")
      ) {
        return `/assets/items/guildshop_items/${getGuildItemPath(
          spriteId,
          itemType
        )}`;
      }

      if (spriteId.includes("/")) {
        // Handle accessories with path prefixes (woodenSet/, ironSet/, dungeonDrops/)
        const fullPath =
          spriteId.startsWith("woodenSet/") ||
          spriteId.startsWith("ironSet/") ||
          spriteId.startsWith("dungeonDrops/")
            ? `accessories/${spriteId}`
            : spriteId;
        const path = `../../assets/items/${fullPath}.png`;
        return images[path] || null;
      }

      let folder = "weapons";
      if (itemType === "Armor") folder = "armors";
      else if (itemType === "Accessory") folder = "accessories";
      else if (itemType === "Consumable") folder = "consumables";
      else if (itemType === "Material" || itemType === "Gem") {
        const path = `../../assets/items/craft/gems/${spriteId}.png`;
        return images[path] || null;
      }

      const path = `../../assets/items/${folder}/${spriteId}.png`;
      return images[path] || null;
    } catch (e) {
      return null;
    }
  };

  const getGuildItemPath = (spriteId: string, itemType?: string) => {
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-400";
      case "Uncommon":
        return "text-green-400";
      case "Rare":
        return "text-blue-400";
      case "Epic":
        return "text-purple-400";
      case "Legendary":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const insertEmoji = (emoji: string) => {
    const emojiCode = `:${emoji}:`;
    setInputMessage((prev) => prev + emojiCode);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const renderMessageWithEmojis = (text: string) => {
    // Replace :emoji: codes with actual emoji images
    const parts = text.split(
      /(:(?:Coins|Diamond|Dragon|Emerald|Enchanter|Icon\d+)(?:_Animated_32x32)?:)/g
    );

    return parts.map((part, index) => {
      const match = part.match(/:([^:]+):/);
      if (match) {
        const emojiName = match[1];
        const ext = emojiName.includes("Animated") ? "gif" : "png";
        return (
          <img
            key={index}
            src={`/assets/ui/guild/guild_emojis/${emojiName}.${ext}`}
            alt={emojiName}
            className="inline-block w-6 h-6 mx-0.5"
            style={{ imageRendering: "pixelated", verticalAlign: "middle" }}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-2 border-stone-700">
      {/* Chat Header */}
      <div className="bg-amber-600 border-b-2 border-amber-800 px-3 py-2">
        <h3 className="text-white font-bold text-sm">💬 {guildName} Chat</h3>
      </div>

      {/* Messages Container - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-stone-800 border border-stone-700 p-2 rounded"
            >
              <div className="flex items-start gap-2">
                {/* Player Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-500 cursor-pointer hover:opacity-80 transition overflow-hidden bg-stone-900"
                  onClick={() => handlePlayerClick(msg.player.username)}
                >
                  {msg.player.avatarId ? (
                    <img
                      src={getDungeonIcon(msg.player.avatarId)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: "pixelated" }}
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).src = `/assets/ui/chat/classIcons/${
                          msg.player.class?.toLowerCase() || "warrior"
                        }.png`;
                      }}
                    />
                  ) : (
                    <img
                      src={`/assets/ui/chat/classIcons/${
                        msg.player.class?.toLowerCase() || "warrior"
                      }.png`}
                      alt={msg.player.class}
                      className="w-6 h-6"
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                </div>

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
                      className="text-amber-400 font-bold cursor-pointer hover:text-amber-300 transition"
                      onClick={() => handlePlayerClick(msg.player.username)}
                    >
                      {msg.player.username}
                    </span>
                    {msg.player.class && (
                      <img
                        src={`/assets/ui/chat/classIcons/${msg.player.class.toLowerCase()}.png`}
                        alt={msg.player.class}
                        className="w-4 h-4"
                        style={{ imageRendering: "pixelated" }}
                        title={msg.player.class}
                      />
                    )}
                    <span className="text-gray-500 text-xs">
                      Lv.{msg.player.level}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Message Text with Emojis */}
                  <div className="text-gray-200 text-sm break-words">
                    {renderMessageWithEmojis(msg.message)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Mobile Optimized */}
      <div className="border-t-2 border-stone-700 bg-stone-800 p-2 relative">
        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 right-0 bg-stone-900 border-2 border-stone-700 rounded-t-lg p-3 mb-1 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold text-xs">Guild Emojis</h4>
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
                      src={`/assets/ui/guild/guild_emojis/${emoji}.${ext}`}
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
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 rounded text-white text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none"
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

      {/* Player Character Stats Modal */}
      {selectedPlayerUsername && playerCharacter && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-2 sm:p-4"
          onClick={() => setSelectedPlayerUsername(null)}
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
                onClick={() => setSelectedPlayerUsername(null)}
                className="text-amber-400 hover:text-amber-300 transition"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <div
              className="flex items-center gap-4 mb-6 bg-stone-950 border-2 border-amber-700 p-4"
              style={{
                borderRadius: "8px",
                boxShadow: "inset 0 2px 0 rgba(0,0,0,0.5), 0 4px 0 #78350f",
              }}
            >
              <div
                className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl border-4 border-amber-500"
                style={{
                  borderRadius: "50%",
                  boxShadow:
                    "0 4px 0 #92400e, inset 0 2px 0 rgba(255,255,255,0.3)",
                }}
              >
                {getClassIcon(playerCharacter.class)}
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
                    className="text-2xl font-bold text-white"
                    style={{
                      fontFamily: "monospace",
                      textShadow:
                        "2px 2px 0 #000, 0 0 10px rgba(255,255,255,0.3)",
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
                  {playerCharacter.experience} / {playerCharacter.level * 100}
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
                  ].map(([slot, item, label]) => (
                    <div
                      key={slot as string}
                      className={`relative aspect-square bg-stone-900 border-2 ${
                        item
                          ? getRarityBorder((item as any).rarity) +
                            " cursor-pointer hover:border-amber-500"
                          : "border-stone-700"
                      }`}
                      style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      onClick={() => item && setSelectedItemDetails(item)}
                    >
                      {item ? (
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
                  ))}
                  {/* Row 2 */}
                  {[
                    ["weapon", playerCharacter.weapon, "Weapon"],
                    ["armor", playerCharacter.armor, "Armor"],
                    ["gloves", playerCharacter.gloves, "Gloves"],
                  ].map(([slot, item, label]) => (
                    <div
                      key={slot as string}
                      className={`relative aspect-square bg-stone-900 border-2 ${
                        item
                          ? getRarityBorder((item as any).rarity) +
                            " cursor-pointer hover:border-amber-500"
                          : "border-stone-700"
                      }`}
                      style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      onClick={() => item && setSelectedItemDetails(item)}
                    >
                      {item ? (
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
                  ))}
                  {/* Row 3 */}
                  {[
                    ["ring", playerCharacter.ring, "Ring"],
                    ["shoes", playerCharacter.shoes, "Shoes"],
                    ["belt", playerCharacter.belt, "Belt"],
                  ].map(([slot, item, label]) => (
                    <div
                      key={slot as string}
                      className={`relative aspect-square bg-stone-900 border-2 ${
                        item
                          ? getRarityBorder((item as any).rarity) +
                            " cursor-pointer hover:border-amber-500"
                          : "border-stone-700"
                      }`}
                      style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      onClick={() => item && setSelectedItemDetails(item)}
                    >
                      {item ? (
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
                  ))}
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
                    <span className="text-2xl">❤️</span>
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
                    <span className="text-2xl">⚔️</span>
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
                    <span className="text-2xl">🛡️</span>
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
                    <span className="text-2xl">⚡</span>
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

            {/* Pet Companion Section */}
            {playerCharacter.companionSlot?.item && (
              <div className="mt-6">
                <h3
                  className="text-lg font-bold text-pink-400 mb-3"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  🐾 Pet Companion
                </h3>
                <div
                  className="bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-pink-600 p-3 sm:p-4"
                  style={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 0 #831843, inset 0 2px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Companion Image */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 bg-black/40 rounded-lg border-2 border-pink-500 flex items-center justify-center flex-shrink-0 relative"
                      style={{ imageRendering: "pixelated" }}
                    >
                      <img
                        src={`/assets/ui/${playerCharacter.companionSlot.item.spriteId}.png`}
                        alt={playerCharacter.companionSlot.item.name}
                        className="w-full h-full object-contain p-2 relative z-10"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <div
                        className={`absolute inset-0 ${
                          playerCharacter.companionSlot.item.rarity === "Legendary"
                            ? "border-yellow-500"
                            : playerCharacter.companionSlot.item.rarity === "Epic"
                            ? "border-purple-500"
                            : playerCharacter.companionSlot.item.rarity === "Rare"
                            ? "border-blue-500"
                            : "border-gray-500"
                        } opacity-50 rounded-lg pointer-events-none`}
                      />
                    </div>

                    {/* Companion Info */}
                    <div className="flex-1 w-full sm:w-auto">
                      <h4
                        className={`font-bold text-base sm:text-lg ${getRarityColor(
                          playerCharacter.companionSlot.item.rarity
                        )}`}
                        style={{ fontFamily: "monospace" }}
                      >
                        {playerCharacter.companionSlot.item.name}
                      </h4>
                      <p
                        className="text-xs sm:text-sm text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {playerCharacter.companionSlot.item.companionType} •{" "}
                        {playerCharacter.companionSlot.item.rarity}
                      </p>

                      {/* Stats */}
                      <div
                        className="flex flex-wrap gap-1 sm:gap-2 mt-2 text-xs"
                        style={{ fontFamily: "monospace" }}
                      >
                        {playerCharacter.companionSlot.item.attackBonus > 0 && (
                          <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-700/50">
                            +{playerCharacter.companionSlot.item.attackBonus} ATK
                          </span>
                        )}
                        {playerCharacter.companionSlot.item.defenseBonus > 0 && (
                          <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-700/50">
                            +{playerCharacter.companionSlot.item.defenseBonus} DEF
                          </span>
                        )}
                        {playerCharacter.companionSlot.item.healthBonus > 0 && (
                          <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-700/50">
                            +{playerCharacter.companionSlot.item.healthBonus} HP
                          </span>
                        )}
                      </div>

                      {/* Ability */}
                      {playerCharacter.companionSlot.item.abilityName && (
                        <div className="mt-2 bg-purple-900/30 px-2 sm:px-3 py-2 rounded border border-purple-700/50">
                          <p
                            className="text-purple-300 text-xs font-bold"
                            style={{ fontFamily: "monospace" }}
                          >
                            ⚡ {playerCharacter.companionSlot.item.abilityName}
                          </p>
                          <p
                            className="text-purple-400 text-xs"
                            style={{ fontFamily: "monospace" }}
                          >
                            Power: {playerCharacter.companionSlot.item.abilityPower}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t-2 border-amber-700">
              <button
                onClick={() => sendFriendRequestMutation.mutate(selectedPlayerUsername!)}
                disabled={sendFriendRequestMutation.isPending}
                className="w-full bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2 sm:py-3 px-4 border-2 border-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "0",
                  boxShadow: "0 4px 0 #1e40af, inset 0 2px 0 rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                <img 
                  src={addFriendIcon} 
                  alt="Add Friend" 
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-sm sm:text-base">Add Friend</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItemDetails && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] p-4"
          onClick={() => setSelectedItemDetails(null)}
        >
          <div
            className="bg-stone-900 border-4 border-amber-600 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {getItemImage(
                    selectedItemDetails.spriteId,
                    selectedItemDetails.type
                  ) && (
                    <img
                      src={
                        getItemImage(
                          selectedItemDetails.spriteId,
                          selectedItemDetails.type
                        )!
                      }
                      alt={selectedItemDetails.name}
                      className="w-16 h-16 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${getRarityColor(
                      selectedItemDetails.rarity
                    )}`}
                  >
                    {selectedItemDetails.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedItemDetails.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Base Stats */}
            <div className="bg-stone-800 p-3 rounded mb-3">
              <h4 className="text-sm font-bold text-amber-400 mb-2">Stats</h4>
              <div className="space-y-1 text-sm">
                {selectedItemDetails.attackBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="text-red-400">
                      +{selectedItemDetails.attackBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.defenseBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="text-blue-400">
                      +{selectedItemDetails.defenseBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.healthBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-green-400">
                      +{selectedItemDetails.healthBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.speedBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-purple-400">
                      +{selectedItemDetails.speedBonus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
