// Item database with actual sprite paths
export const weaponsByClass = {
  Warrior: [
    { name: "Wooden Sword", spriteId: "woodenSword", atk: 5, rarity: "Common", value: 50 },
    { name: "Wooden Axe", spriteId: "woodenAxe", atk: 6, rarity: "Common", value: 50 },
    { name: "Wooden Great Axe", spriteId: "woodenGreatAxe", atk: 12, rarity: "Uncommon", value: 150 },
  ],
  Mage: [
    { name: "Wooden Staff", spriteId: "woodenStaff", atk: 8, rarity: "Common", value: 50 },
    { name: "Wooden Great Staff", spriteId: "woodenGreatStaff", atk: 15, rarity: "Uncommon", value: 150 },
  ],
  Ranger: [
    { name: "Wooden Bow", spriteId: "woodenBow", atk: 6, rarity: "Common", value: 50 },
    { name: "Wooden Crossbow", spriteId: "woodenCrossBow", atk: 7, rarity: "Common", value: 50 },
    { name: "Wooden Great Bow", spriteId: "woodenGreatBow", atk: 13, rarity: "Uncommon", value: 150 },
  ],
  Cleric: [
    { name: "Wooden Stick", spriteId: "woodenStick", atk: 5, rarity: "Common", value: 50 },
    { name: "Wooden Shield", spriteId: "woodenShield", atk: 3, def: 5, rarity: "Common", value: 50 },
  ],
  Rogue: [
    { name: "Wooden Dagger", spriteId: "woodenDagger", atk: 7, spd: 2, rarity: "Common", value: 50 },
    { name: "Wooden Spike", spriteId: "woodenSpike", atk: 7, spd: 2, rarity: "Common", value: 50 },
    { name: "Wooden Scythe", spriteId: "woodenScythe", atk: 11, spd: 3, rarity: "Uncommon", value: 150 },
  ],
};

export const armorSets = {
  Body: [
    { name: "Leather Armor", spriteId: "woodenArmor", def: 5, rarity: "Common", value: 50, classRestriction: null },
    { name: "Leather Great Armor", spriteId: "woodenGreatArmor", def: 10, hp: 25, rarity: "Uncommon", value: 150, classRestriction: null },
    { name: "Leather Robe", spriteId: "woodenRobe", def: 3, hp: 20, rarity: "Common", value: 50, classRestriction: "Mage" },
    { name: "Leather Great Robe", spriteId: "woodenGreatRobe", def: 6, hp: 40, rarity: "Uncommon", value: 150, classRestriction: "Mage" },
    { name: "Leather Robe (Cleric)", spriteId: "woodenRobe_Cleric", def: 4, hp: 15, rarity: "Common", value: 50, classRestriction: "Cleric" },
  ],
  Helmet: [
    { name: "Leather Helmet", spriteId: "woodenHelmet", def: 3, rarity: "Common", value: 40, classRestriction: null },
    { name: "Leather Great Helmet", spriteId: "woodenGreatHelmet", def: 6, hp: 15, rarity: "Uncommon", value: 120, classRestriction: null },
    { name: "Leather Hood", spriteId: "woodenHood", def: 2, hp: 10, rarity: "Common", value: 40, classRestriction: "Mage" },
    { name: "Leather Hood (Cleric)", spriteId: "woodenHood_Cleric", def: 2, hp: 10, rarity: "Common", value: 40, classRestriction: "Cleric" },
  ],
  Gloves: [
    { name: "Leather Gloves", spriteId: "woodenGloves", def: 2, atk: 1, rarity: "Common", value: 35, classRestriction: null },
    { name: "Leather Great Gloves", spriteId: "woodenGreatGloves", def: 4, atk: 3, rarity: "Uncommon", value: 100, classRestriction: null },
  ],
  Shoes: [
    { name: "Leather Shoes", spriteId: "woodenShoes", def: 2, spd: 1, rarity: "Common", value: 35, classRestriction: null },
    { name: "Leather Great Shoes", spriteId: "woodenGreatShoes", def: 4, spd: 3, rarity: "Uncommon", value: 100, classRestriction: null },
  ],
};

export const accessories = {
  Rings: [
    { name: "Wooden Ring", spriteId: "woodenSet/woodenRing", hp: 10, rarity: "Common", value: 50 },
    { name: "Wooden Second Ring", spriteId: "woodenSet/woodenSecondRing", atk: 2, rarity: "Common", value: 45 },
    { name: "Wooden Bracelet", spriteId: "woodenSet/woodenBracelet", atk: 2, def: 2, rarity: "Common", value: 65 },
  ],
  Necklaces: [
    { name: "Wooden Necklace", spriteId: "woodenSet/woodenNecklace", atk: 3, rarity: "Common", value: 60 },
    { name: "Wooden Great Necklace", spriteId: "woodenSet/woodenGreatNecklace", atk: 5, hp: 5, rarity: "Uncommon", value: 90 },
  ],
  Belts: [
    { name: "Wooden Belt", spriteId: "woodenSet/woodenBelt", def: 5, rarity: "Common", value: 75 },
    { name: "Wooden Great Belt", spriteId: "woodenSet/woodenGreatBelt", def: 8, hp: 10, rarity: "Uncommon", value: 110 },
  ],
  Earrings: [
    { name: "Wooden Earrings", spriteId: "woodenSet/woodenEarrings", spd: 3, rarity: "Common", value: 55 },
    { name: "Wooden Second Earrings", spriteId: "woodenSet/woodenSecondEarrings", spd: 2, hp: 5, rarity: "Common", value: 60 },
  ],
};

export const gems = {
  Health: [
    { name: "Red Gem", spriteId: "craft/gems/red_gem", hp: 50, rarity: "Common", value: 200 },
    { name: "Greater Red Gem", spriteId: "craft/gems/greater_red_gem", hp: 100, rarity: "Uncommon", value: 500 },
    { name: "Perfect Red Gem", spriteId: "craft/gems/perfect_red_gem", hp: 200, rarity: "Rare", value: 1500 },
  ],
  Attack: [
    { name: "Topaz Gem", spriteId: "craft/gems/topaz_gem", atk: 10, rarity: "Common", value: 250 },
    { name: "Greater Topaz Gem", spriteId: "craft/gems/greater_topaz_gem", atk: 20, rarity: "Uncommon", value: 600 },
    { name: "Perfect Topaz Gem", spriteId: "craft/gems/perfect_topaz_gem", atk: 40, rarity: "Rare", value: 2000 },
  ],
  Defense: [
    { name: "Green Gem", spriteId: "craft/gems/green_gem", def: 10, rarity: "Common", value: 250 },
    { name: "Greater Green Gem", spriteId: "craft/gems/greater_green_gem", def: 20, rarity: "Uncommon", value: 600 },
    { name: "Perfect Green Gem", spriteId: "craft/gems/perfect_green_gem", def: 40, rarity: "Rare", value: 2000 },
  ],
  Speed: [
    { name: "Purple Gem", spriteId: "craft/gems/purple_gem", spd: 5, rarity: "Common", value: 300 },
    { name: "Greater Purple Gem", spriteId: "craft/gems/greater_purple_gem", spd: 10, rarity: "Uncommon", value: 700 },
    { name: "Perfect Purple Gem", spriteId: "craft/gems/perfect_purple_gem", spd: 20, rarity: "Rare", value: 2500 },
  ],
  Elemental: [
    { name: "Fire Ruby", spriteId: "craft/gems/fire_ruby", atk: 15, element: "Fire", rarity: "Rare", value: 1500 },
    { name: "Ice Sapphire", spriteId: "craft/gems/ice_sapphire", atk: 15, element: "Ice", rarity: "Rare", value: 1500 },
    { name: "Lightning Citrine", spriteId: "craft/gems/lightning_citrine", atk: 15, element: "Lightning", rarity: "Rare", value: 1500 },
    { name: "Poison Jade", spriteId: "craft/gems/poison_jade", atk: 15, element: "Poison", rarity: "Rare", value: 1500 },
  ],
};

export const materials = [
  { name: "Wooden Gem", spriteId: "craft/gems/woodenGem", description: "Basic crafting material", rarity: "Common", value: 50 },
  { name: "Enhancement Stone", spriteId: "craft/gems/enhancement_stone", description: "Used to enhance equipment", rarity: "Common", value: 100 },
  { name: "Protection Scroll", spriteId: "craft/gems/protection_scroll", description: "Prevents item destruction at +7/+8", rarity: "Rare", value: 1000 },
  { name: "Refining Stone", spriteId: "craft/gems/refining_stone", description: "Adds random bonus stats", rarity: "Uncommon", value: 500 },
  { name: "Socket Drill", spriteId: "craft/gems/socket_drill", description: "Adds a socket slot (max 3)", rarity: "Rare", value: 2000 },
];
