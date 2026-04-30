import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getRarityColor, getRarityBorder } from "@/utils/format";

interface ChestOpeningProps {
  chestName: string;
  chestImage: string;
  possibleItems: any[];
  chestTier: number;
  onOpen: () => void;
  result?: any;
  onComplete: (reward: any) => void;
  onClose: () => void;
}

export default function ChestOpening({
  chestName,
  chestImage,
  onComplete,
  onClose,
  possibleItems,
  onOpen,
  result,
}: ChestOpeningProps) {
  const [showReward, setShowReward] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rewardTimerSet = useRef(false);

  // Generate random items for the reel (duplicate items for smooth scrolling)
  const generateReel = () => {
    const reel = [];
    const itemCount = 50; // Number of items in the reel

    for (let i = 0; i < itemCount; i++) {
      const randomItem =
        possibleItems[Math.floor(Math.random() * possibleItems.length)];
      reel.push({ ...randomItem, key: i });
    }
    return reel;
  };

  const [reelItems] = useState(() => generateReel());

  useEffect(() => {
    // Only open chest once
    if (hasOpened) return;

    // Start spinning after a brief delay
    const timer = setTimeout(() => {
      setHasOpened(true);
      onOpen(); // Trigger backend chest opening

      if (scrollRef.current) {
        // Calculate the position to land on a random spot
        const itemWidth = 120; // Width of each item
        const centerOffset = window.innerWidth / 2 - itemWidth / 2;
        const randomIndex = Math.floor(Math.random() * 10) + 35; // Random position near end
        const finalPosition = randomIndex * itemWidth - centerOffset;

        // Animate the scroll
        scrollRef.current.style.transition =
          "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
        scrollRef.current.style.transform = `translateX(-${finalPosition}px)`;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasOpened, onOpen]);

  // When result arrives from backend, show it after animation
  useEffect(() => {
    if (result && !showReward && !rewardTimerSet.current) {
      rewardTimerSet.current = true; // Mark that we've set the timer

      // Wait a bit to ensure animation looks good
      setTimeout(() => {
        setShowReward(true);
        onComplete(result);
      }, 2000); // 2 seconds - don't save timer ref, just let it run
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, showReward]); // onComplete intentionally omitted to prevent timer cancellation

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;

    // Check if it's a potion (numeric sprite ID)
    if (/^\d+$/.test(spriteId)) {
      const num = parseInt(spriteId);
      if (num >= 985 && num <= 992)
        return `/assets/items/potions/hp/${spriteId}.png`;
      if (num >= 1001 && num <= 1008)
        return `/assets/items/potions/mp/${spriteId}.png`;
      if (num >= 1033 && num <= 1040)
        return `/assets/items/potions/attack/${spriteId}.png`;
      if (num >= 1065 && num <= 1072)
        return `/assets/items/potions/energy/${spriteId}.png`;
    }

    // Handle items with paths (like woodenSet/woodenRing)
    if (spriteId.includes("/")) {
      const fullPath =
        spriteId.startsWith("woodenSet/") || spriteId.startsWith("ironSet/")
          ? `accessories/${spriteId}`
          : spriteId;
      return `/assets/items/${fullPath}.png`;
    }

    // Determine folder based on item type
    let folder = "weapons";
    if (itemType === "Armor") folder = "armors";
    else if (itemType === "Accessory") folder = "accessories";
    else if (itemType === "Consumable") folder = "consumables";
    else if (itemType === "Material" || itemType === "Gem")
      return `/assets/items/craft/gems/${spriteId}.png`;

    return `/assets/items/${folder}/${spriteId}.png`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
      {/* Close Button */}
      {showReward && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-stone-800 hover:bg-stone-700 rounded-full transition"
        >
          <X className="text-white" size={24} />
        </button>
      )}

      {!showReward ? (
        <>
          {/* Chest Image */}
          <div className="mb-8">
            <img
              src={chestImage}
              alt={chestName}
              className="w-32 h-32 object-contain animate-bounce"
              style={{ imageRendering: "pixelated" }}
            />
            <h2
              className="text-2xl font-bold text-amber-400 text-center mt-4"
              style={{ fontFamily: "monospace" }}
            >
              {chestName}
            </h2>
          </div>

          {/* Spinning Reel */}
          <div className="relative w-full max-w-4xl h-40 overflow-hidden">
            {/* Center indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-400 z-10 transform -translate-x-1/2">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-amber-400"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-amber-400"></div>
              </div>
            </div>

            {/* Items Reel */}
            <div
              ref={scrollRef}
              className="flex gap-4 py-4"
              style={{ transform: "translateX(0)" }}
            >
              {reelItems.map((item, idx) => (
                <div
                  key={`${item.key}-${idx}`}
                  className={`flex-shrink-0 w-28 h-32 bg-stone-800 rounded-lg border-2 ${getRarityBorder(
                    item.rarity
                  )} flex flex-col items-center justify-center p-2`}
                >
                  {getItemImage(item.spriteId, item.type) ? (
                    <img
                      src={getItemImage(item.spriteId, item.type)!}
                      alt={item.name}
                      className="w-16 h-16 object-contain mb-2"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <div className="w-16 h-16 mb-2 flex items-center justify-center text-3xl">
                      {item.type === "Weapon" && "⚔️"}
                      {item.type === "Armor" && "🛡️"}
                      {item.type === "Accessory" && "💍"}
                      {item.type === "Material" && "💎"}
                    </div>
                  )}
                  <p
                    className={`text-xs font-bold text-center truncate w-full ${getRarityColor(
                      item.rarity
                    )}`}
                  >
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p
            className="text-white text-lg mt-8 animate-pulse"
            style={{ fontFamily: "monospace" }}
          >
            Opening...
          </p>
        </>
      ) : (
        <>
          {/* Reward Display */}
          <div className="text-center animate-scale-in">
            <h2
              className="text-4xl font-bold text-amber-400 mb-8 animate-pulse"
              style={{ fontFamily: "monospace" }}
            >
              YOU WON!
            </h2>

            <div
              className={`bg-stone-800 rounded-lg border-4 ${getRarityBorder(
                result?.rarity
              )} p-8 mx-auto max-w-md`}
            >
              {getItemImage(result?.spriteId, result?.type) ? (
                <img
                  src={getItemImage(result?.spriteId, result?.type)!}
                  alt={result?.name}
                  className="w-32 h-32 object-contain mx-auto mb-4"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center text-6xl">
                  {result?.type === "Weapon" && "⚔️"}
                  {result?.type === "Armor" && "🛡️"}
                  {result?.type === "Accessory" && "💍"}
                  {result?.type === "Material" && "💎"}
                </div>
              )}

              <h3
                className={`text-2xl font-bold mb-2 ${getRarityColor(
                  result?.rarity
                )}`}
              >
                {result?.name}
              </h3>

              <p className={`text-sm ${getRarityColor(result?.rarity)}`}>
                {result?.rarity}
              </p>

              {result?.description && (
                <p className="text-sm text-gray-400 mt-4 italic">
                  "{result.description}"
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-8 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition text-xl"
              style={{
                fontFamily: "monospace",
                boxShadow: "0 4px 0 #92400e",
              }}
            >
              CLAIM REWARD
            </button>
          </div>
        </>
      )}
    </div>
  );
}
