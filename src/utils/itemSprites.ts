/**
 * Centralized utility for loading item sprites across the application
 */

// Load all item images eagerly
const images = import.meta.glob("../assets/items/**/*.png", {
  eager: true,
  as: "url",
});

/**
 * Get the correct path for guild items with special naming conventions
 */
const getGuildItemPath = (spriteId: string): string => {
  let fileName = spriteId;
  
  // Convert tier names to numbers (bronze→1, silver→2, gold→3, diamond→4)
  const tierMap: { [key: string]: string } = {
    bronze: "1",
    silver: "2",
    gold: "3",
    diamond: "4",
  };

  Object.entries(tierMap).forEach(([tierName, tierNum]) => {
    if (fileName.includes(tierName)) {
      fileName = fileName.replace(tierName, tierNum);
    }
  });

  // Handle guild_key (no tier, maps to key1.png)
  if (spriteId === "guild_key") {
    return `chests_and_keys/key1.png`;
  }

  // Map guild items to their correct paths
  const guildItemMap: { [key: string]: string } = {
    guild_1_sword: "weaponry/sword1.png",
    guild_2_sword: "weaponry/sword2.png",
    guild_3_sword: "weaponry/sword3.png",
    guild_4_sword: "weaponry/sword4.png",
    guild_1_dagger: "weaponry/dagger1.png",
    guild_2_dagger: "weaponry/dagger2.png",
    guild_3_dagger: "weaponry/dagger3.png",
    guild_4_dagger: "weaponry/dagger4.png",
    guild_1_bow: "weaponry/bow1.png",
    guild_2_bow: "weaponry/bow2.png",
    guild_3_bow: "weaponry/bow3.png",
    guild_4_bow: "weaponry/bow4.png",
    guild_1_staff: "weaponry/staff1.png",
    guild_2_staff: "weaponry/staff2.png",
    guild_3_staff: "weaponry/staff3.png",
    guild_4_staff: "weaponry/staff4.png",
    guild_1_shield: "defensive/shield1.png",
    guild_2_shield: "defensive/shield2.png",
    guild_3_shield: "defensive/shield3.png",
    guild_4_shield: "defensive/shield4.png",
    Chest1: "chests_and_keys/chest1.png",
    Chest2: "chests_and_keys/chest2.png",
    Chest3: "chests_and_keys/chest3.png",
    Chest4: "chests_and_keys/chest4.png",
    key1: "chests_and_keys/key1.png",
    key2: "chests_and_keys/key2.png",
    key3: "chests_and_keys/key3.png",
    key4: "chests_and_keys/key4.png",
  };

  return guildItemMap[fileName] || `${fileName}.png`;
};

/**
 * Get the image URL for an item based on its spriteId and type
 * @param spriteId - The sprite identifier from the database
 * @param itemType - The item type (Weapon, Armor, Accessory, Consumable, etc.)
 * @returns The image URL or null if not found
 */
export const getItemImage = (spriteId: string, itemType?: string): string | null => {
  if (!spriteId) return null;

  try {
    // Check if it's a companion (from public/assets/ui/companions folder)
    if (itemType === "Companion" || spriteId.startsWith("companions/")) {
      return `/assets/ui/${spriteId}.png`;
    }

    // Check if it's a potion (numeric sprite ID)
    if (/^\d+$/.test(spriteId)) {
      const num = parseInt(spriteId);
      if (num >= 985 && num <= 992) {
        const path = `../assets/items/potions/hp/${spriteId}.png`;
        return images[path] || null;
      } else if (num >= 1001 && num <= 1008) {
        const path = `../assets/items/potions/mp/${spriteId}.png`;
        return images[path] || null;
      } else if (num >= 1033 && num <= 1040) {
        const path = `../assets/items/potions/attack/${spriteId}.png`;
        return images[path] || null;
      } else if (num >= 1065 && num <= 1072) {
        const path = `../assets/items/potions/energy/${spriteId}.png`;
        return images[path] || null;
      }
    }

    // Check for guild shop items
    if (
      spriteId.startsWith("guild_") ||
      spriteId.startsWith("Chest") ||
      spriteId.startsWith("key")
    ) {
      return `/assets/items/guildshop_items/${getGuildItemPath(spriteId)}`;
    }

    // Check if spriteId contains a path (e.g., weapons/ironSword, accessories/steelSet/steelRing)
    if (spriteId.includes("/")) {
      let fullPath = spriteId;
      
      // Handle special set paths that need to be prefixed with accessories/
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
      
      const path = `../assets/items/${fullPath}.png`;
      return images[path] || null;
    }

    // Determine folder based on item type
    let folder = "weapons"; // default
    if (itemType === "Armor") {
      folder = "armors";
    } else if (itemType === "Accessory") {
      folder = "accessories";
    } else if (itemType === "Consumable") {
      folder = "consumables";
    } else if (itemType === "Material" || itemType === "Gem") {
      const path = `../assets/items/craft/gems/${spriteId}.png`;
      return images[path] || null;
    }

    const path = `../assets/items/${folder}/${spriteId}.png`;
    return images[path] || null;
  } catch (e) {
    console.error("Failed to load item image:", spriteId, itemType, e);
    return null;
  }
};

/**
 * Fallback/placeholder image for items
 */
export const ITEM_PLACEHOLDER = "/assets/ui/placeholder-item.png";

/**
 * Get item image with fallback to placeholder
 */
export const getItemImageWithFallback = (spriteId: string, itemType?: string): string => {
  return getItemImage(spriteId, itemType) || ITEM_PLACEHOLDER;
};
