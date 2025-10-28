import { useState, useMemo } from "react";
import { Book, ChevronRight, Home, Search, X } from "lucide-react";
import ItemShowcase from "../docs/ItemShowcase";

export default function DocsTab() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemGallery, setShowItemGallery] = useState<{ category: string; subcategory?: string } | null>(null);

  const docs = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🎮",
      category: "Basics",
      keywords: ["beginner", "start", "tutorial", "class", "character"],
      content: `# Getting Started

Welcome to Folkhart! Choose your class and begin your adventure.

## Character Classes

**⚔️ Warrior** - High HP and defense, excels in melee combat
- Starting Stats: High HP, Medium ATK, High DEF
- Best Weapons: Swords, Axes
- Playstyle: Tank and sustained damage

**🔮 Mage** - Powerful magic attacks, low defense
- Starting Stats: Low HP, High ATK, Low DEF
- Best Weapons: Staffs
- Playstyle: High burst damage, glass cannon

**🏹 Ranger** - Balanced ranged attacker
- Starting Stats: Medium HP, Medium ATK, Medium DEF
- Best Weapons: Bows, Crossbows
- Playstyle: Balanced, ranged combat

**✨ Cleric** - Support class with healing
- Starting Stats: Medium HP, Low ATK, Medium DEF
- Best Weapons: Sticks, Shields
- Playstyle: Support and survivability

**🗡️ Rogue** - Fast attacks with critical strikes
- Starting Stats: Low HP, High ATK, Low DEF, High SPD
- Best Weapons: Daggers, Scythes
- Playstyle: High speed, critical damage

## Equipment Slots

Your character has 9 equipment slots:
1. **Weapon** - Primary damage source
2. **Armor** (Body) - Main defense
3. **Helmet** - Head protection
4. **Gloves** - Hand protection + ATK bonus
5. **Shoes** - Foot protection + SPD bonus
6. **Ring** - Accessory slot
7. **Necklace** - Accessory slot
8. **Belt** - Accessory slot
9. **Earring** - Accessory slot`,
    },
    {
      id: "items-equipment",
      title: "Items & Equipment",
      icon: "⚔️",
      category: "Equipment",
      keywords: ["items", "equipment", "weapons", "armor", "accessories", "gear"],
      content: `# Items & Equipment

## Item Types

### Weapons
Class-specific weapons with attack bonuses:
- **Warrior**: Swords, Axes, Great Axes
- **Mage**: Staffs, Great Staffs
- **Ranger**: Bows, Crossbows, Great Bows
- **Cleric**: Sticks, Shields
- **Rogue**: Daggers, Spikes, Scythes

### Armor Sets
**Body Armor**
- Leather Armor (Common) - DEF +5
- Leather Great Armor (Uncommon) - DEF +10, HP +25
- Leather Robe (Mage) - DEF +3, HP +20
- Leather Great Robe (Mage) - DEF +6, HP +40

**Helmets**
- Leather Helmet - DEF +3
- Leather Great Helmet - DEF +6, HP +15
- Leather Hood (Mage) - DEF +2, HP +10

**Gloves**
- Leather Gloves - DEF +2, ATK +1
- Leather Great Gloves - DEF +4, ATK +3

**Shoes**
- Leather Shoes - DEF +2, SPD +1
- Leather Great Shoes - DEF +4, SPD +3

### Accessories
**Wooden Set** - Basic accessory set
- Wooden Ring - HP +10
- Wooden Second Ring - ATK +2
- Wooden Necklace - ATK +3
- Wooden Great Necklace - ATK +5, HP +5
- Wooden Belt - DEF +5
- Wooden Great Belt - DEF +8, HP +10
- Wooden Earrings - SPD +3
- Wooden Second Earrings - SPD +2, HP +5
- Wooden Bracelet - ATK +2, DEF +2

## Item Rarity

**Common** (Gray) - Basic items, easy to find
**Uncommon** (Green) - Better stats, moderate drop rate
**Rare** (Blue) - Excellent stats, low drop rate
**Epic** (Purple) - Exceptional stats, very rare
**Legendary** (Orange) - Best stats, extremely rare

## Item Enhancement

All equipment can be enhanced from +0 to +9:
- Each level adds approximately 2% to all stats
- Visual indicator shows enhancement level
- Higher levels have lower success rates`,
    },
    {
      id: "gems-socketing",
      title: "Gems & Socketing",
      icon: "💎",
      category: "Crafting",
      keywords: ["gems", "socket", "socketing", "craft", "upgrade"],
      content: `# Gems & Socketing System

## Socket System

Add up to **3 sockets** per item using Socket Drills.

### Socket Process
1. **Add Socket** - Use Socket Drill (costs gold)
2. **Insert Gem** - Place gem in empty socket
3. **Remove Gem** - Extract gem (destroys the gem!)

## Gem Types

### Health Gems (Red)
- **Red Gem** (Common) - +50 HP
- **Greater Red Gem** (Uncommon) - +100 HP
- **Perfect Red Gem** (Rare) - +200 HP

### Mana Gems (Blue)
- **Blue Gem** (Common) - +30 Mana
- **Greater Blue Gem** (Uncommon) - +60 Mana
- **Perfect Blue Gem** (Rare) - +120 Mana

### Attack Gems (Topaz/Yellow)
- **Topaz Gem** (Common) - +10 ATK
- **Greater Topaz Gem** (Uncommon) - +20 ATK
- **Perfect Topaz Gem** (Rare) - +40 ATK

### Defense Gems (Green/Emerald)
- **Green Gem** (Common) - +10 DEF
- **Greater Green Gem** (Uncommon) - +20 DEF
- **Perfect Green Gem** (Rare) - +40 DEF

### Speed Gems (Purple/Amethyst)
- **Purple Gem** (Common) - +5 SPD
- **Greater Purple Gem** (Uncommon) - +10 SPD
- **Perfect Purple Gem** (Rare) - +20 SPD

### Critical Gems (White/Diamond)
- **White Gem** (Uncommon) - +5% Crit Chance
- **Greater White Gem** (Rare) - +10% Crit Chance
- **Perfect White Gem** (Epic) - +20% Crit Chance

### Elemental Gems
- **Fire Ruby** (Rare) - +15 Fire ATK
- **Ice Sapphire** (Rare) - +15 Ice ATK
- **Lightning Citrine** (Rare) - +15 Lightning ATK
- **Poison Jade** (Rare) - +15 Poison ATK

## Gem Strategy

**Early Game**: Focus on HP and DEF gems for survivability
**Mid Game**: Balance ATK and DEF gems
**Late Game**: Optimize with Crit and Elemental gems`,
    },
    {
      id: "blacksmith",
      title: "Blacksmith System",
      icon: "🔨",
      category: "Crafting",
      keywords: ["blacksmith", "enhance", "refine", "upgrade", "craft"],
      content: `# Blacksmith System

Three ways to upgrade your equipment: Enhancement, Refining, and Socketing.

## Enhancement (+0 to +9)

### Success Rates
- **+0 to +3**: 100% success ✅
- **+4 to +6**: 60% success ⚠️
- **+7 to +9**: 40% success ❌

### Failure Consequences
- **+0 to +6**: Item stays at current level (safe)
- **+7 to +8**: Item may be **DESTROYED** 💥
- **+9**: Maximum level reached

### Materials Required
- **Enhancement Stones**: 1-5 per attempt (increases with level)
- **Gold**: 100-5000 (increases with level)
- **Protection Scroll**: Prevents destruction at +7/+8 (HIGHLY RECOMMENDED!)

### Enhancement Bonuses
Each +1 level adds approximately 2% to all item stats:
- +3 = +6% all stats
- +6 = +12% all stats
- +9 = +18% all stats

## Refining System

Add random bonus stats to equipment.

### Possible Bonuses
- Fire/Ice/Lightning/Poison Attack (+5-15)
- Critical Chance (+1-5%)
- Critical Damage (+10-30%)
- Elemental Resistance (+5-15%)
- HP Regeneration (+1-5 per second)
- Mana Regeneration (+1-3 per second)

### Materials
- **Refining Stone**: 1 per attempt
- **Gold**: 500 per attempt

### Tips
- Refining **replaces** previous bonuses
- Keep refining until you get desired stats
- Higher rarity items = better bonus ranges

## Socketing System

See "Gems & Socketing" guide for detailed information.

### Quick Reference
- **Socket Drill**: Adds 1 socket (max 3 per item)
- **Cost**: 2000 gold per socket
- **Gems**: Insert for permanent stat bonuses
- **Warning**: Removing gems destroys them!

## Blacksmith Strategy

**Recommended Order:**
1. Enhance to +3 (100% safe)
2. Add sockets (1-3 depending on budget)
3. Insert gems
4. Enhance to +6 (60% success, still safe)
5. Refine for bonus stats
6. Enhance to +7/+8/+9 with Protection Scrolls`,
    },
    {
      id: "dungeons",
      title: "Dungeons & Zones",
      icon: "🏰",
      category: "Combat",
      keywords: ["dungeon", "combat", "boss", "loot", "zone"],
      content: `# Dungeons & Zones

## Available Zones

### 🏘️ Peaceful Village (Level 1-5)

**Slime Den** (Level 1)
- Duration: 5 minutes
- Energy Cost: 5
- Recommended CP: 25
- Boss: King Slime
- Loot: Basic weapons, Small HP potions, Wooden accessories

**Rat Cellar** (Level 2)
- Duration: 7 minutes
- Energy Cost: 8
- Recommended CP: 35
- Boss: Rat King
- Loot: Leather armor pieces, Wooden Gems

**Goblin Cave** (Level 3)
- Duration: 10 minutes
- Energy Cost: 8
- Recommended CP: 50
- Boss: Goblin Chieftain
- Loot: Class-specific weapons, armor sets, accessories

### 🌲 Whispering Woods (Level 5-10)

**Dark Forest** (Level 7)
- Duration: 15 minutes
- Energy Cost: 15
- Recommended CP: 100
- Boss: Shadow Wolf Alpha
- Loot: Great weapons, Great armor, Better accessories

### ⛰️ Frozen Peaks (Level 10+)

**Dragon's Lair** (Level 15)
- Duration: 10 minutes
- Energy Cost: 20
- Recommended CP: 200
- Boss: Crimson Drake
- Loot: Rare weapons, Epic armor, Legendary items

## Dungeon Mechanics

### Energy System
- Max Energy: 100
- Regeneration: 1 energy per 6 minutes
- Plan your dungeon runs carefully!

### Loot System
**Class-Specific Loot**: Higher drop rate for your class
**Universal Loot**: Armor, accessories, potions
**Boss Drops**: Guaranteed rare items
**Material Drops**: Enhancement stones, gems, crafting materials

### Drop Rates
- **80% Drop**: Common consumables
- **40% Drop**: Basic equipment
- **25% Drop**: Uncommon equipment
- **15% Drop**: Rare equipment
- **5% Drop**: Epic equipment
- **1% Drop**: Legendary equipment

## Dungeon Modes

### Idle Mode
- Auto-complete dungeon
- Receive rewards after timer
- Can run while AFK
- Standard rewards

### Active Mode (Coming Soon)
- Manual combat
- Skill-based gameplay
- **1.5x rewards multiplier**
- Boss mechanics

## Dungeon Strategy

**Energy Management**
- Don't waste energy on dungeons you can't complete
- Farm lower dungeons for guaranteed materials
- Save energy for special events

**Loot Optimization**
- Run dungeons matching your level
- Class-specific dungeons for better gear
- Boss dungeons for rare materials

**Progression Path**
1. Slime Den (Lv 1-2)
2. Rat Cellar (Lv 2-3)
3. Goblin Cave (Lv 3-7)
4. Dark Forest (Lv 7-15)
5. Dragon's Lair (Lv 15+)`,
    },
    {
      id: "crafting",
      title: "Crafting System",
      icon: "⚒️",
      category: "Crafting",
      keywords: ["craft", "recipe", "materials", "create"],
      content: `# Crafting System

## Crafting Recipes

### Armor Upgrades

**Leather Great Armor**
- Materials: Leather Armor x1 + Wooden Gem x3
- Result: DEF +10, HP +25

**Leather Great Robe**
- Materials: Leather Robe x1 + Wooden Gem x3
- Result: DEF +6, HP +40 (Mage only)

**Leather Great Helmet**
- Materials: Leather Helmet x1 + Wooden Gem x2
- Result: DEF +6, HP +15

**Leather Great Gloves**
- Materials: Leather Gloves x1 + Wooden Gem x2
- Result: DEF +4, ATK +3

**Leather Great Shoes**
- Materials: Leather Shoes x1 + Wooden Gem x2
- Result: DEF +4, SPD +3

### Weapon Upgrades

**Wooden Great Axe**
- Materials: Wooden Axe x1 + Wooden Gem x3
- Result: ATK +12 (Warrior only)

**Wooden Great Staff**
- Materials: Wooden Staff x1 + Wooden Gem x3
- Result: ATK +15 (Mage only)

**Wooden Great Bow**
- Materials: Wooden Bow x1 + Wooden Gem x3
- Result: ATK +13 (Ranger only)

**Wooden Scythe**
- Materials: Wooden Dagger x1 + Wooden Gem x3
- Result: ATK +11, SPD +3 (Rogue only)

## Crafting Materials

### Wooden Gem
- Source: Dungeon drops, Shop
- Use: Equipment upgrades
- Stackable: Yes (999 max)

### Enhancement Stone
- Source: Dungeon drops, Shop
- Use: Equipment enhancement
- Stackable: Yes (999 max)

### Protection Scroll
- Source: Shop, Rare dungeon drops
- Use: Prevent item destruction at +7/+8
- Stackable: Yes (99 max)
- **VERY IMPORTANT!**

### Refining Stone
- Source: Dungeon drops, Shop
- Use: Add random bonus stats
- Stackable: Yes (999 max)

### Socket Drill
- Source: Shop, Boss drops
- Use: Add socket slot to equipment
- Stackable: Yes (999 max)

## Crafting Tips

1. **Save Wooden Gems** for important upgrades
2. **Stock up on Protection Scrolls** before enhancing past +6
3. **Farm dungeons** for crafting materials
4. **Upgrade strategically** - focus on main equipment first`,
    },
    {
      id: "shop",
      title: "Shop & Economy",
      icon: "🛒",
      category: "Economy",
      keywords: ["shop", "buy", "sell", "gold", "gems", "currency"],
      content: `# Shop & Economy

## Currency System

### Gold 💰
- Earned from: Dungeons, Idle farming, Selling items
- Used for: Buying items, Enhancement, Refining, Socketing
- No limit

### Gems 💎
- Earned from: Daily rewards, Achievements, Shop refresh
- Used for: Shop refresh, Premium items
- Premium currency

## Daily Rewards

**Free Daily Gems**: 10 gems every 24 hours
- Claim from Shop tab
- Timer shows next available claim
- Don't miss it!

## Shop System

### Personal Shop
- Refreshes with items for your class
- Mix of weapons, armor, accessories, consumables

### Shop Refresh
- Cost: 50 gems
- Generates new items
- Use strategically for specific items

### Shop Items

**Weapons** (Class-specific)
- Price: 100-500 gold
- Rarity: Common to Rare

**Armor** (Universal)
- Price: 75-400 gold
- All armor types available

**Accessories**
- Price: 100-300 gold
- Rings, necklaces, belts, earrings

**Consumables**
- HP Potions: 10-80 gold
- MP Potions: 10-80 gold
- Buff Potions: 50-500 gold

**Materials**
- Enhancement Stones: 100 gold
- Refining Stones: 500 gold
- Protection Scrolls: 1000 gold
- Socket Drills: 2000 gold
- Gems: 200-5000 gold

## Economy Tips

**Gold Management**
- Save gold for important enhancements
- Don't buy everything in shop
- Sell unwanted items

**Gem Management**
- Claim daily gems every day
- Save gems for shop refreshes
- Don't waste on unnecessary refreshes

**Shopping Strategy**
- Buy Protection Scrolls when available
- Stock up on Enhancement Stones
- Buy gems for specific stat needs
- Refresh shop for class-specific items`,
    },
    {
      id: "achievements",
      title: "Achievements & Titles",
      icon: "🏆",
      category: "Progression",
      keywords: ["achievement", "title", "reward", "bonus"],
      content: `# Achievements & Titles

## Achievement Categories

### 📈 Progression
**Level Milestones**
- Level 5: Novice (+1 ATK, +1 DEF, +10 HP)
- Level 10: Adventurer (+2 ATK, +2 DEF, +25 HP)
- Level 20: Warrior (+4 ATK, +3 DEF, +50 HP)
- Level 30: Veteran (+7 ATK, +5 DEF, +100 HP)
- Level 40: Elite (+12 ATK, +8 DEF, +200 HP)
- Level 50: Champion (+20 ATK, +15 DEF, +300 HP)

**Gold Accumulation**
- 10,000 Gold: Wealthy (+500 gold, +50 gems)
- 100,000 Gold: Tycoon (+10k gold, +200 gems, +10 ATK, +10 DEF, +100 HP)

### ⚔️ Combat
**Monster Slayer** - Defeat 100 monsters
- Reward: +500 gold, +20 gems, +3 ATK
- Title: "Slayer"

**Monster Hunter** - Defeat 500 monsters
- Reward: +2000 gold, +50 gems, +8 ATK, +3 DEF
- Title: "Hunter"

**Monster Annihilator** - Defeat 1000 monsters
- Reward: +10k gold, +150 gems, +15 ATK, +10 DEF, +100 HP
- Title: "Annihilator"

### 📦 Collection
**Weapon Collector** - Collect 10 different weapons
- Reward: +500 gold, +30 gems, +2 ATK
- Title: "Collector"

**Armor Enthusiast** - Collect 10 different armor pieces
- Reward: +500 gold, +30 gems, +5 DEF
- Title: "Armorer"

**Companion Master** - Collect all companion types
- Reward: +2000 gold, +100 gems, +5 ATK, +5 DEF, +50 HP
- Title: "Beast Master"

### 🔨 Crafting
**Blacksmith Apprentice** - Enhance item to +3
- Reward: +300 gold, +15 gems, +1 ATK
- Title: "Apprentice Smith"

**Master Blacksmith** - Enhance item to +6
- Reward: +1500 gold, +50 gems, +5 ATK, +5 DEF
- Title: "Master Smith"

**Legendary Blacksmith** - Enhance item to +9
- Reward: +10k gold, +200 gems, +15 ATK, +10 DEF, +100 HP
- Title: "Legendary Smith"

### 👥 Social
**Social Butterfly** - Add 5 friends
- Reward: +200 gold, +20 gems, +25 HP
- Title: "Friendly"

**Guild Member** - Join a guild
- Reward: +500 gold, +25 gems, +2 ATK, +2 DEF
- Title: "Guild Member"

## Achievement Rewards

**Titles** - Display your accomplishments
**Gold & Gems** - Currency rewards
**Stat Bonuses** - Permanent ATK, DEF, HP increases
**Achievement Points** - Track your progress

## Tips

- Focus on progression achievements first
- Combat achievements come naturally
- Collection achievements require exploration
- Crafting achievements need materials
- Social achievements need other players`,
    },
    {
      id: "item-weapons",
      title: "⚔️ Weapons Gallery",
      icon: "⚔️",
      category: "Items",
      keywords: ["weapon", "sword", "axe", "bow", "staff", "dagger", "warrior", "mage", "ranger", "cleric", "rogue"],
      isGallery: true,
      galleryType: "weapons",
      content: "Browse all weapons by class",
    },
    {
      id: "item-armors",
      title: "🛡️ Armor Gallery",
      icon: "🛡️",
      category: "Items",
      keywords: ["armor", "helmet", "gloves", "shoes", "body", "defense"],
      isGallery: true,
      galleryType: "armors",
      content: "Browse all armor pieces by slot",
    },
    {
      id: "item-accessories",
      title: "💍 Accessories Gallery",
      icon: "💍",
      category: "Items",
      keywords: ["accessory", "ring", "necklace", "belt", "earring", "wooden"],
      isGallery: true,
      galleryType: "accessories",
      content: "Browse all accessories",
    },
    {
      id: "item-gems",
      title: "💎 Gems Gallery",
      icon: "💎",
      category: "Items",
      keywords: ["gem", "socket", "ruby", "sapphire", "topaz", "emerald", "amethyst", "diamond"],
      isGallery: true,
      galleryType: "gems",
      content: "Browse all gems and their bonuses",
    },
    {
      id: "item-materials",
      title: "🔨 Materials Gallery",
      icon: "🔨",
      category: "Items",
      keywords: ["material", "craft", "enhancement", "refining", "socket", "protection"],
      isGallery: true,
      galleryType: "materials",
      content: "Browse all crafting materials",
    },
  ];

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    
    const query = searchQuery.toLowerCase();
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query) ||
      doc.keywords.some(keyword => keyword.includes(query)) ||
      doc.content.toLowerCase().includes(query)
    );
  }, [searchQuery, docs]);

  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-2xl font-bold text-amber-400 mb-4 mt-6" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-amber-300 mb-3 mt-5" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-lg font-bold text-green-400 mb-2 mt-4" style={{ fontFamily: 'monospace' }}>
            {line.substring(4)}
          </h3>
        );
      }
      // Bold
      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={i} className="text-gray-300 mb-2" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-white font-bold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // List items
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-gray-300 ml-4 mb-1" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {line.substring(2)}
          </li>
        );
      }
      // Numbers
      if (/^\d+\./.test(line)) {
        return (
          <li key={i} className="text-gray-300 ml-4 mb-1 list-decimal" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {line.substring(line.indexOf(".") + 2)}
          </li>
        );
      }
      // Empty lines
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      // Regular text
      return (
        <p key={i} className="text-gray-300 mb-2" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {line}
        </p>
      );
    });
  };

  // If showing item gallery, render ItemShowcase
  if (showItemGallery) {
    return (
      <div className="p-3 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            <Book size={24} className="text-amber-400" />
            Item Gallery
          </h2>
          <button
            onClick={() => setShowItemGallery(null)}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-sm font-bold"
            style={{ fontFamily: 'monospace' }}
          >
            <Home size={16} />
            Back
          </button>
        </div>
        <ItemShowcase category={showItemGallery.category as any} subcategory={showItemGallery.subcategory} />
      </div>
    );
  }

  return (
    <div className="p-3 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
          <Book size={24} className="text-amber-400" />
          Documentation
        </h2>
        {selectedDoc && (
          <button
            onClick={() => setSelectedDoc(null)}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-sm font-bold"
            style={{ fontFamily: 'monospace' }}
          >
            <Home size={16} />
            Back
          </button>
        )}
      </div>

      {!selectedDoc ? (
        <>
          {/* Search Bar */}
          <div className="mb-4 relative">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-10 pr-10 py-3 bg-stone-800 border-2 border-stone-700 text-white placeholder-gray-500 focus:border-amber-600 focus:outline-none"
                style={{
                  fontFamily: 'monospace',
                  borderRadius: '0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Doc List */}
          {filteredDocs.length > 0 ? (
            <div className="space-y-2">
              {filteredDocs.map((doc: any) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (doc.isGallery) {
                      setShowItemGallery({ category: doc.galleryType });
                    } else {
                      setSelectedDoc(doc.id);
                    }
                  }}
                  className="w-full p-4 bg-stone-800 hover:bg-stone-700 border-2 border-stone-700 hover:border-amber-600 transition flex items-center justify-between group"
                  style={{
                    borderRadius: '0',
                    boxShadow: '0 2px 0 #1c1917',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{doc.icon}</span>
                    <div className="text-left">
                      <span className="text-white font-bold block" style={{ fontFamily: 'monospace' }}>{doc.title}</span>
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>{doc.category}</span>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-500 group-hover:text-amber-400 transition"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400" style={{ fontFamily: 'monospace' }}>
              No results found for "{searchQuery}"
            </div>
          )}
        </>
      ) : (
        /* Doc Content */
        <div className="bg-stone-800 border-2 border-stone-700 p-4 rounded" style={{ borderRadius: '0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          <div className="prose prose-invert max-w-none">
            {renderMarkdown(
              docs.find((d) => d.id === selectedDoc)?.content || ""
            )}
          </div>
        </div>
      )}
    </div>
  );
}
