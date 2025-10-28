import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Book,
  Sword,
  Shield,
  Gem,
  Hammer,
  Trophy,
  Map,
  Users,
  ShoppingBag,
  Search,
  Menu,
  X,
  Package,
} from "lucide-react";
import ItemShowcase from "@/components/docs/ItemShowcase";

export default function DocsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("getting-started");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemGallery, setShowItemGallery] = useState<{
    category: string;
    subcategory?: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = [
    {
      id: "basics",
      name: "Getting Started",
      icon: <Book size={20} />,
      color: "text-blue-400",
      items: [
        { id: "getting-started", name: "Introduction", icon: "📖" },
        { id: "character-classes", name: "Character Classes", icon: "⚔️" },
        { id: "game-modes", name: "Game Modes", icon: "🎮" },
      ],
    },
    {
      id: "items",
      name: "Items & Equipment",
      icon: <Sword size={20} />,
      color: "text-amber-400",
      items: [
        {
          id: "weapons-gallery",
          name: "Weapons Gallery",
          icon: "⚔️",
          isGallery: true,
          galleryType: "weapons",
        },
        {
          id: "armors-gallery",
          name: "Armor Gallery",
          icon: "🛡️",
          isGallery: true,
          galleryType: "armors",
        },
        {
          id: "accessories-gallery",
          name: "Accessories",
          icon: "💍",
          isGallery: true,
          galleryType: "accessories",
        },
        { id: "item-enhancement", name: "Enhancement System", icon: "✨" },
      ],
    },
    {
      id: "crafting",
      name: "Crafting & Upgrading",
      icon: <Hammer size={20} />,
      color: "text-orange-400",
      items: [
        { id: "blacksmith-guide", name: "Blacksmith Guide", icon: "🔨" },
        {
          id: "gems-gallery",
          name: "Gems & Socketing",
          icon: "💎",
          isGallery: true,
          galleryType: "gems",
        },
        {
          id: "materials-gallery",
          name: "Materials",
          icon: "📦",
          isGallery: true,
          galleryType: "materials",
        },
        { id: "crafting-recipes", name: "Crafting Recipes", icon: "📜" },
      ],
    },
    {
      id: "combat",
      name: "Combat & Dungeons",
      icon: <Map size={20} />,
      color: "text-red-400",
      items: [
        { id: "dungeons-guide", name: "Dungeons & Zones", icon: "🏰" },
        { id: "combat-mechanics", name: "Combat Mechanics", icon: "⚔️" },
        { id: "boss-strategies", name: "Boss Strategies", icon: "👹" },
      ],
    },
    {
      id: "progression",
      name: "Progression",
      icon: <Trophy size={20} />,
      color: "text-yellow-400",
      items: [
        { id: "achievements", name: "Achievements & Titles", icon: "🏆" },
        { id: "leveling-guide", name: "Leveling Guide", icon: "📈" },
        { id: "leaderboard", name: "Leaderboard & Rewards", icon: "🥇" },
      ],
    },
    {
      id: "economy",
      name: "Economy & Trading",
      icon: <ShoppingBag size={20} />,
      color: "text-green-400",
      items: [
        { id: "shop-system", name: "Shop System", icon: "🛒" },
        { id: "currency-guide", name: "Currency Guide", icon: "💰" },
      ],
    },
    {
      id: "social",
      name: "Social Features",
      icon: <Users size={20} />,
      color: "text-purple-400",
      items: [
        { id: "guild-system", name: "Guild System", icon: "👥" },
        { id: "friends-messaging", name: "Friends & Messaging", icon: "💬" },
      ],
    },
  ];

  const content: Record<string, { title: string; body: string }> = {
    "getting-started": {
      title: "📖 Getting Started with Folkhart",
      body: `# Welcome to Folkhart!

Folkhart is an idle RPG where you build your character, enhance equipment, explore dungeons, and join guilds!

## Quick Start Guide

1. **Create Your Character** - Choose from 5 unique classes
2. **Complete Tutorial** - Learn the basics through interactive onboarding
3. **Start Adventuring** - Run dungeons to gain experience and loot
4. **Enhance Equipment** - Visit the Blacksmith to upgrade your gear
5. **Join a Guild** - Team up with other players

## Core Features

- **5 Character Classes** with unique playstyles
- **Equipment System** with 9 slots and visual enhancement levels
- **Blacksmith System** for enhancing, refining, and socketing
- **Dungeon Exploration** in idle or active modes
- **Achievement System** with permanent stat bonuses
- **Guild System** for cooperative play`,
    },
    "character-classes": {
      title: "⚔️ Character Classes",
      body: `# Character Classes

Choose your path! Each class has unique strengths and equipment.

## ⚔️ Warrior
**Role:** Tank / Melee DPS
**Starting Stats:** High HP, Medium ATK, High DEF
**Best Weapons:** Swords, Axes, Great Axes
**Playstyle:** Frontline fighter with sustained damage and survivability

**Strengths:**
- Highest HP and DEF in the game
- Excellent for solo dungeon runs
- Can equip heavy armor

**Weaknesses:**
- Lower damage output than DPS classes
- Slower attack speed

---

## 🔮 Mage
**Role:** Magic DPS
**Starting Stats:** Low HP, High ATK, Low DEF
**Best Weapons:** Staffs, Great Staffs
**Playstyle:** Glass cannon with devastating magic attacks

**Strengths:**
- Highest base ATK
- Powerful AoE abilities
- Elemental damage bonuses

**Weaknesses:**
- Very low HP and DEF
- Requires careful positioning
- Vulnerable to burst damage

---

## 🏹 Ranger
**Role:** Ranged DPS
**Starting Stats:** Medium HP, Medium ATK, Medium DEF
**Best Weapons:** Bows, Crossbows, Great Bows
**Playstyle:** Balanced ranged attacker

**Strengths:**
- Safe ranged combat
- Balanced stats
- Good for beginners

**Weaknesses:**
- No particular specialization
- Average in all areas

---

## ✨ Cleric
**Role:** Support / Healer
**Starting Stats:** Medium HP, Low ATK, Medium DEF
**Best Weapons:** Sticks, Shields
**Playstyle:** Support class with healing and survivability

**Strengths:**
- Self-healing abilities
- High survivability
- Great for long dungeon runs

**Weaknesses:**
- Lowest damage output
- Slower progression

---

## 🗡️ Rogue
**Role:** Assassin / Burst DPS
**Starting Stats:** Low HP, High ATK, Low DEF, High SPD
**Best Weapons:** Daggers, Spikes, Scythes
**Playstyle:** High-speed critical striker

**Strengths:**
- Highest SPD stat
- Critical hit specialist
- Burst damage potential

**Weaknesses:**
- Low HP and DEF
- Relies on critical hits
- High risk, high reward`,
    },
    "game-modes": {
      title: "🎮 Game Modes",
      body: `# Game Modes

Folkhart offers multiple ways to play and progress your character.

## 🏃 Idle Farming
**Duration:** 1-3 hours
**Energy Cost:** 5-15 per session
**Rewards:** Gold, Experience, Basic Materials

Set your character to farm while you're away! Idle farming is perfect for:
- Passive gold generation
- Steady experience gain
- Collecting basic crafting materials

**Tips:**
- Always start idle farming before logging off
- Higher level zones = better rewards
- Check back regularly to collect rewards

---

## 🏰 Dungeon Runs
**Duration:** 5-15 minutes per run
**Energy Cost:** 5-20 per dungeon
**Rewards:** Equipment, Gems, Enhancement Materials

Explore dungeons to find powerful loot!

### Idle Mode
- Auto-complete after timer
- Standard rewards
- Can run while AFK

### Active Mode (Coming Soon)
- Manual combat
- Skill-based gameplay
- **1.5x rewards multiplier**
- Boss mechanics

**Available Dungeons:**
- Slime Den (Lv 1) - Beginner dungeon
- Rat Cellar (Lv 2) - Basic equipment
- Goblin Cave (Lv 3) - Class-specific weapons
- Dark Forest (Lv 7) - Great equipment
- Dragon's Lair (Lv 15) - Legendary items

---

## ⚡ Energy System
**Max Energy:** 100
**Regeneration:** 1 energy per 6 minutes
**Full Recharge:** 10 hours

Energy is required for all activities. Plan your dungeon runs wisely!

**Energy Management Tips:**
- Don't waste energy on dungeons you can't complete
- Farm lower dungeons for guaranteed materials
- Save energy for special events`,
    },
    "blacksmith-guide": {
      title: "🔨 Blacksmith Guide",
      body: `# Blacksmith System

Upgrade your equipment through Enhancement, Refining, and Socketing!

## ⬆️ Enhancement (+0 to +9)

### Success Rates
- **+0 to +3:** 100% success ✅
- **+4 to +6:** 60% success ⚠️
- **+7 to +9:** 40% success ❌

### Failure Consequences
- **+0 to +6:** Item stays at current level (safe)
- **+7 to +8:** Item may be **DESTROYED** 💥
- **+9:** Maximum level reached

### Materials Required
- **Enhancement Stones:** 1-5 per attempt
- **Gold:** 100-5000 (increases with level)
- **Protection Scroll:** Prevents destruction at +7/+8 ⭐

### Enhancement Bonuses
Each +1 level adds ~2% to all item stats:
- **+3** = +6% all stats
- **+6** = +12% all stats
- **+9** = +18% all stats

---

## 🎲 Refining System

Add random bonus stats to equipment!

### Possible Bonuses
- Fire/Ice/Lightning/Poison Attack (+5-15)
- Critical Chance (+1-5%)
- Critical Damage (+10-30%)
- Elemental Resistance (+5-15%)
- HP/Mana Regeneration (+1-5 per second)

### Materials
- **Refining Stone:** 1 per attempt
- **Gold:** 500 per attempt

**Note:** Refining replaces previous bonuses!

---

## 💎 Socketing System

Add up to **3 sockets** per item for gem insertion.

### Process
1. **Add Socket** - Use Socket Drill (2000 gold)
2. **Insert Gem** - Place gem in empty socket
3. **Remove Gem** - Extract gem (destroys the gem!)

See **Gems & Socketing** guide for gem types.

---

## 📋 Recommended Upgrade Order

1. Enhance to **+3** (100% safe)
2. Add **1-3 sockets**
3. Insert **gems**
4. Enhance to **+6** (60% success, still safe)
5. **Refine** for bonus stats
6. Enhance to **+7/+8/+9** with **Protection Scrolls**`,
    },
    "dungeons-guide": {
      title: "🏰 Dungeons & Zones",
      body: `# Dungeons & Zones

Explore dangerous dungeons for powerful loot!

## 🏘️ Peaceful Village (Level 1-5)

### Slime Den (Level 1)
- **Duration:** 5 minutes
- **Energy:** 5
- **Recommended CP:** 25
- **Boss:** King Slime
- **Loot:** Basic weapons, Small HP potions, Wooden accessories

### Rat Cellar (Level 2)
- **Duration:** 7 minutes
- **Energy:** 8
- **Recommended CP:** 35
- **Boss:** Rat King
- **Loot:** Leather armor pieces, Wooden Gems

### Goblin Cave (Level 3)
- **Duration:** 10 minutes
- **Energy:** 8
- **Recommended CP:** 50
- **Boss:** Goblin Chieftain
- **Loot:** Class-specific weapons, armor sets, accessories

---

## 🌲 Whispering Woods (Level 5-10)

### Dark Forest (Level 7)
- **Duration:** 15 minutes
- **Energy:** 15
- **Recommended CP:** 100
- **Boss:** Shadow Wolf Alpha
- **Loot:** Great weapons, Great armor, Better accessories

---

## ⛰️ Frozen Peaks (Level 10+)

### Dragon's Lair (Level 15)
- **Duration:** 10 minutes
- **Energy:** 20
- **Recommended CP:** 200
- **Boss:** Crimson Drake
- **Loot:** Rare weapons, Epic armor, Legendary items

---

## 📊 Loot System

### Drop Rates
- **80%** - Common consumables
- **40%** - Basic equipment
- **25%** - Uncommon equipment
- **15%** - Rare equipment
- **5%** - Epic equipment
- **1%** - Legendary equipment

### Class-Specific Loot
Higher drop rate for your class's equipment!

### Boss Drops
Guaranteed rare items from boss kills!

---

## 💡 Dungeon Tips

1. **Match Your Level** - Run dungeons appropriate for your CP
2. **Energy Management** - Don't waste energy on impossible dungeons
3. **Farm Lower Dungeons** - Guaranteed materials for upgrades
4. **Class Advantage** - Run dungeons for your class's loot pool`,
    },
    achievements: {
      title: "🏆 Achievements & Titles",
      body: `# Achievements & Titles

Unlock achievements for permanent stat bonuses and titles!

## 📈 Progression Achievements

### Level Milestones
- **Level 5: Novice** - +1 ATK, +1 DEF, +10 HP
- **Level 10: Adventurer** - +2 ATK, +2 DEF, +25 HP
- **Level 20: Warrior** - +4 ATK, +3 DEF, +50 HP
- **Level 30: Veteran** - +7 ATK, +5 DEF, +100 HP
- **Level 40: Elite** - +12 ATK, +8 DEF, +200 HP
- **Level 50: Champion** - +20 ATK, +15 DEF, +300 HP

### Gold Accumulation
- **10,000 Gold: Wealthy** - +500 gold, +50 gems
- **100,000 Gold: Tycoon** - +10k gold, +200 gems, +10 ATK, +10 DEF, +100 HP

---

## ⚔️ Combat Achievements

### Monster Slayer (100 kills)
- **Reward:** +500 gold, +20 gems, +3 ATK
- **Title:** "Slayer"

### Monster Hunter (500 kills)
- **Reward:** +2000 gold, +50 gems, +8 ATK, +3 DEF
- **Title:** "Hunter"

### Monster Annihilator (1000 kills)
- **Reward:** +10k gold, +150 gems, +15 ATK, +10 DEF, +100 HP
- **Title:** "Annihilator"

---

## 🔨 Crafting Achievements

### Blacksmith Apprentice (+3 enhancement)
- **Reward:** +300 gold, +15 gems, +1 ATK
- **Title:** "Apprentice Smith"

### Master Blacksmith (+6 enhancement)
- **Reward:** +1500 gold, +50 gems, +5 ATK, +5 DEF
- **Title:** "Master Smith"

### Legendary Blacksmith (+9 enhancement)
- **Reward:** +10k gold, +200 gems, +15 ATK, +10 DEF, +100 HP
- **Title:** "Legendary Smith"

---

## 📦 Collection Achievements

### Weapon Collector (10 different weapons)
- **Reward:** +500 gold, +30 gems, +2 ATK
- **Title:** "Collector"

### Armor Enthusiast (10 different armor pieces)
- **Reward:** +500 gold, +30 gems, +5 DEF
- **Title:** "Armorer"

---

## 💡 Achievement Tips

- Focus on progression achievements first
- Combat achievements come naturally through gameplay
- Collection achievements require dungeon exploration
- Crafting achievements need materials investment
- All stat bonuses are **permanent**!`,
    },
    "shop-system": {
      title: "🛒 Shop System",
      body: `# Shop & Economy

## 💰 Currency System

### Gold 💰
- **Earned from:** Dungeons, Idle farming, Selling items
- **Used for:** Buying items, Enhancement, Refining, Socketing
- **No limit**

### Gems 💎
- **Earned from:** Daily rewards, Achievements, Shop refresh
- **Used for:** Shop refresh, Premium items
- **Premium currency**

---

## 🎁 Daily Rewards

**Free Daily Gems:** 10 gems every 24 hours
- Claim from Shop tab
- Timer shows next available claim
- Don't miss it!

---

## 🛍️ Personal Shop

### Shop Features
- Refreshes with items for your class
- Mix of weapons, armor, accessories, consumables
- Random quality (Common to Rare)

### Shop Refresh
- **Cost:** 50 gems
- Generates completely new items
- Use strategically for specific items

---

## 💵 Item Prices

### Weapons
- **Price:** 100-500 gold
- **Rarity:** Common to Rare

### Armor
- **Price:** 75-400 gold
- **All types available**

### Accessories
- **Price:** 100-300 gold
- **Rings, necklaces, belts, earrings**

### Consumables
- **HP Potions:** 10-80 gold
- **MP Potions:** 10-80 gold
- **Buff Potions:** 50-500 gold

### Materials
- **Enhancement Stones:** 100 gold
- **Refining Stones:** 500 gold
- **Protection Scrolls:** 1000 gold ⭐
- **Socket Drills:** 2000 gold
- **Gems:** 200-5000 gold

---

## 💡 Shopping Tips

### Gold Management
- Save gold for important enhancements
- Don't buy everything in shop
- Sell unwanted items for gold

### Gem Management
- Claim daily gems every day
- Save gems for shop refreshes
- Don't waste on unnecessary refreshes

### Shopping Strategy
- **Priority:** Protection Scrolls (always buy!)
- Stock up on Enhancement Stones
- Buy gems for specific stat needs
- Refresh shop for class-specific items`,
    },
    "item-enhancement": {
      title: "✨ Enhancement System",
      body: `# Enhancement System

Upgrade your equipment to increase its power!

## Enhancement Levels (+0 to +9)

Each enhancement level increases all item stats by approximately **2%**.

### Enhancement Progression
- **+0** - Base item stats
- **+1** - +2% all stats
- **+2** - +4% all stats
- **+3** - +6% all stats (Safe zone ends)
- **+4** - +8% all stats
- **+5** - +10% all stats
- **+6** - +12% all stats (Danger zone starts)
- **+7** - +14% all stats ⚠️
- **+8** - +16% all stats ⚠️
- **+9** - +18% all stats (Maximum)

---

## Success Rates

### Safe Zone (+0 to +3)
- **Success Rate:** 100% ✅
- **On Failure:** N/A (Always succeeds)
- **Cost:** Low (100-500 gold)

### Medium Risk (+4 to +6)
- **Success Rate:** 60% ⚠️
- **On Failure:** Item stays at current level
- **Cost:** Medium (1000-5000 gold)

### High Risk (+7 to +9)
- **Success Rate:** 40% ❌
- **On Failure:** Item may be **DESTROYED** 💥
- **Cost:** High (10,000-50,000 gold)
- **Protection:** Use Protection Scrolls!

---

## Materials Required

### Enhancement Stones
- **+0 to +3:** 1 stone per attempt
- **+4 to +6:** 2-3 stones per attempt
- **+7 to +9:** 4-5 stones per attempt
- **Source:** Dungeons, Shop (100 gold each)

### Gold Costs
- **+0:** 100 gold
- **+1:** 250 gold
- **+2:** 500 gold
- **+3:** 1,000 gold
- **+4:** 2,500 gold
- **+5:** 5,000 gold
- **+6:** 10,000 gold
- **+7:** 25,000 gold
- **+8:** 50,000 gold

### Protection Scrolls
- **Use:** Prevents item destruction at +7/+8
- **Cost:** 1,000 gold (Shop)
- **Recommendation:** ALWAYS use for +7/+8 attempts!

---

## Visual Indicators

Enhanced items show their level visually:
- **+1 to +3:** Green glow
- **+4 to +6:** Blue glow
- **+7 to +9:** Purple/Gold glow

---

## Enhancement Strategy

### Beginner Strategy
1. Enhance all equipment to **+3** (100% safe)
2. Save gold and materials
3. Focus on weapon first (highest damage increase)

### Intermediate Strategy
1. Enhance weapon to **+6**
2. Enhance armor pieces to **+3**
3. Start collecting Protection Scrolls

### Advanced Strategy
1. Attempt **+7** on weapon with Protection Scroll
2. Enhance all armor to **+6**
3. Push for **+9** weapon (endgame goal)

---

## Tips & Warnings

✅ **DO:**
- Always enhance to +3 first (free stats!)
- Use Protection Scrolls for +7/+8
- Enhance weapon before armor
- Save gold for high-level attempts

❌ **DON'T:**
- Attempt +7 without Protection Scroll
- Enhance accessories before main equipment
- Rush to +9 without preparation
- Waste gold on failed +4-+6 attempts

---

## Example: +9 Weapon Journey

**Total Investment:**
- ~100 Enhancement Stones
- ~150,000 gold
- 5-10 Protection Scrolls
- Multiple failed attempts

**Final Result:**
- +18% ATK, DEF, and all stats
- Visual purple/gold glow
- Massive power increase
- Prestigious achievement`,
    },
    "leaderboard": {
      title: "🥇 Leaderboard & Monthly Rewards",
      body: `# Leaderboard & Monthly Rewards

Compete with other players for exclusive monthly rewards!

## Leaderboard Types

### 🏆 Combat Power Leaderboard
Ranked by total Combat Power (CP)
- Includes all equipment stats
- Enhancement levels count
- Gem bonuses included

### 📈 Level Leaderboard
Ranked by character level
- Experience as tiebreaker
- Pure progression ranking

### 👥 Guild Leaderboard
Ranked by guild level and members
- Guild experience
- Total member count
- Guild achievements

---

## Monthly Reward Tiers

Rewards are distributed at the end of each month!

### 🥇 Rank #1 - Champion Tier
**The Ultimate Winner!**

**Rewards:**
- **50,000 Gold** 💰
- **5,000 Gems** 💎
- **Legendary Item Box** (Guaranteed legendary item)
- **Exclusive Title:** "Monthly Champion"
- **+50 ATK, +50 DEF, +500 HP** (Permanent for the month)
- **Champion Badge** (Profile decoration)

---

### 🥈 Ranks #2-5 - Elite Tier
**Top Performers**

**Rewards:**
- **25,000 Gold** 💰
- **2,500 Gems** 💎
- **Epic Item Box** (Guaranteed epic item)
- **Exclusive Title:** "Elite Competitor"
- **+25 ATK, +25 DEF, +250 HP** (Permanent for the month)
- **Elite Badge**

---

### 🥉 Ranks #6-10 - Master Tier
**High Achievers**

**Rewards:**
- **15,000 Gold** 💰
- **1,500 Gems** 💎
- **Rare Item Box** (Guaranteed rare item)
- **Exclusive Title:** "Master Competitor"
- **+15 ATK, +15 DEF, +150 HP** (Permanent for the month)
- **Master Badge**

---

### 🎖️ Ranks #11-100 - Challenger Tier
**Dedicated Players**

**Rewards:**
- **5,000 Gold** 💰
- **500 Gems** 💎
- **Uncommon Item Box**
- **Exclusive Title:** "Challenger"
- **+5 ATK, +5 DEF, +50 HP** (Permanent for the month)

---

### 🏅 Ranks #101+ - Participant Tier
**Everyone Else**

**Rewards:**
- **1,000 Gold** 💰
- **100 Gems** 💎
- **Common Item Box**
- **Participation Badge**

---

## How Rankings Work

### Combat Power Calculation
\`\`\`
CP = Base Stats + Equipment Stats + Enhancement Bonuses + Gem Bonuses + Achievement Bonuses
\`\`\`

### Tiebreakers
1. **Primary:** Combat Power / Level
2. **Secondary:** Total Experience
3. **Tertiary:** Account creation date (older = higher)

### Update Frequency
- Leaderboards update **every 5 minutes**
- Final rankings locked at **month end (11:59 PM UTC)**
- Rewards distributed within **24 hours**

---

## Leaderboard Strategy

### For Combat Power
1. **Enhance Equipment** - Biggest CP boost
2. **Socket Gems** - Permanent stat increases
3. **Complete Achievements** - Bonus stats
4. **Optimize Build** - Best equipment for your class

### For Level
1. **Run Dungeons** - Best experience per energy
2. **Idle Farming** - Passive experience
3. **Energy Management** - Never waste energy
4. **Efficient Progression** - Focus on level-appropriate content

### For Guilds
1. **Active Members** - More guild experience
2. **Guild Dungeons** - Cooperative progression
3. **Guild Achievements** - Bonus points
4. **Recruitment** - Grow your guild

---

## Monthly Reset

### What Resets
- Leaderboard rankings (back to 0)
- Monthly titles removed
- Monthly stat bonuses removed
- New competition begins

### What Stays
- Permanent achievements
- Equipment and progress
- Regular titles
- Item rewards

---

## Tips for Climbing

✅ **DO:**
- Check leaderboard daily
- Plan your progression
- Join an active guild
- Participate every month
- Save resources for final push

❌ **DON'T:**
- Ignore leaderboard until month end
- Waste energy on low-reward activities
- Neglect equipment upgrades
- Give up if not in top 10

---

## Special Events

### Double Reward Months
- Occasionally, rewards are **2x**
- Announced in News tab
- Extra competitive!

### Seasonal Championships
- Quarterly mega-competitions
- Even bigger rewards
- Special seasonal titles

---

## Leaderboard Etiquette

- **Be respectful** to other players
- **No cheating or exploits**
- **Fair competition only**
- **Congratulate winners**
- **Help newer players**

---

## View Leaderboards

Access leaderboards from:
- **Settings Tab** → Leaderboard button
- **Main Menu** → Leaderboard icon
- **Profile** → Rankings section

Good luck, and may the best adventurer win! 🏆`,
    },
  };

  const renderContent = () => {
    if (showItemGallery) {
      return (
        <ItemShowcase
          category={showItemGallery.category as any}
          subcategory={showItemGallery.subcategory}
        />
      );
    }

    const currentContent = content[selectedCategory];
    if (!currentContent) return null;

    return (
      <div className="prose prose-invert max-w-none">
        <h1
          className="text-3xl font-bold text-amber-400 mb-6"
          style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
        >
          {currentContent.title}
        </h1>
        <div
          className="text-gray-300"
          style={{
            fontFamily: "monospace",
            fontSize: "15px",
            lineHeight: "1.8",
          }}
        >
          {currentContent.body.split("\n").map((line, i) => {
            // Headers
            if (line.startsWith("# ")) {
              return (
                <h2
                  key={i}
                  className="text-2xl font-bold text-amber-400 mb-4 mt-8"
                >
                  {line.substring(2)}
                </h2>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h3
                  key={i}
                  className="text-xl font-bold text-green-400 mb-3 mt-6"
                >
                  {line.substring(3)}
                </h3>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h4
                  key={i}
                  className="text-lg font-bold text-blue-400 mb-2 mt-4"
                >
                  {line.substring(4)}
                </h4>
              );
            }
            // Bold
            if (line.includes("**")) {
              const parts = line.split("**");
              return (
                <p key={i} className="mb-2">
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
                <li key={i} className="ml-6 mb-1">
                  {line.substring(2)}
                </li>
              );
            }
            // Horizontal rule
            if (line === "---") {
              return <hr key={i} className="my-6 border-stone-700" />;
            }
            // Empty lines
            if (line.trim() === "") {
              return <div key={i} className="h-3" />;
            }
            // Regular text
            return (
              <p key={i} className="mb-2">
                {line}
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Header */}
      <div
        className="bg-stone-800 border-b-4 border-amber-600 p-4 flex items-center justify-between sticky top-0 z-50"
        style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-white hover:bg-stone-700 transition"
            style={{ borderRadius: "0" }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1
            className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
          >
            <Book size={24} className="text-amber-400" />
            <span className="hidden sm:inline">Folkhart Wiki</span>
            <span className="sm:hidden">Wiki</span>
          </h1>
        </div>
        
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-amber-700 hover:bg-amber-600 text-white font-bold transition text-sm lg:text-base"
          style={{
            border: "3px solid #92400e",
            borderRadius: "0",
            boxShadow: "0 3px 0 #b45309",
            textShadow: "1px 1px 0 #000",
            fontFamily: "monospace",
          }}
        >
          <Home size={16} />
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative
            w-64 bg-stone-800 border-r-2 border-stone-700 overflow-y-auto
            transition-transform duration-300 ease-in-out
            z-50 lg:z-auto
          `}
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <div className="p-4">
            {/* Search */}
            <div className="mb-4 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wiki..."
                className="w-full pl-10 pr-3 py-2 bg-stone-900 border-2 border-stone-700 text-white text-sm placeholder-gray-500 focus:border-amber-600 focus:outline-none"
                style={{ fontFamily: "monospace", borderRadius: "0" }}
              />
            </div>

            {/* Categories */}
            {categories.map((category) => (
              <div key={category.id} className="mb-4">
                <div
                  className={`flex items-center gap-2 mb-2 ${category.color} font-bold text-sm`}
                  style={{ fontFamily: "monospace" }}
                >
                  {category.icon}
                  <span>{category.name}</span>
                </div>
                <div className="space-y-1">
                  {category.items.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isGallery) {
                          setShowItemGallery({ category: item.galleryType });
                          setSelectedCategory(item.id);
                        } else {
                          setSelectedCategory(item.id);
                          setShowItemGallery(null);
                        }
                        setSidebarOpen(false); // Close sidebar on mobile
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition ${
                        selectedCategory === item.id
                          ? "bg-amber-700 text-white border-l-4 border-amber-400"
                          : "text-gray-400 hover:bg-stone-700 hover:text-white border-l-4 border-transparent"
                      }`}
                      style={{ fontFamily: "monospace", borderRadius: "0" }}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-900">
          {showItemGallery && (
            <button
              onClick={() => setShowItemGallery(null)}
              className="mb-4 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold transition flex items-center gap-2"
              style={{
                fontFamily: "monospace",
                borderRadius: "0",
                border: "2px solid #57534e",
              }}
            >
              ← Back to Guide
            </button>
          )}
          {renderContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-stone-800 border-t-2 border-stone-700 p-4 text-center text-sm text-gray-400">
        <p>Made with 💖 for cozy gaming</p>
        <p className="mt-1">© 2025 Folkhart</p>
      </div>
    </div>
  );
}
