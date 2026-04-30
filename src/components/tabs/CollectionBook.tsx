import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dungeonApi, inventoryApi } from "@/lib/api";
import { Search, ChevronLeft, ChevronDown } from "lucide-react";
import { getItemImage } from "@/utils/itemSprites";
import monsterTabIcon from "@/assets/ui/monsters.png";
import inventoryTabIcon from "@/assets/ui/inventory.png";

interface CollectionBookProps {
  onBack: () => void;
}

function RetroDropdown({ value, options, onSelect }: { value: string, options: { label: string, value: string }[], onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex-1 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-900 border-2 border-stone-600 p-2 text-xs font-bold text-amber-500 flex items-center justify-between hover:border-amber-500 transition"
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`text-amber-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-stone-900 border-2 border-stone-600 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 text-xs font-bold text-amber-500 hover:bg-amber-600 hover:text-white transition flex items-center gap-2"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CollectionBook({ onBack }: CollectionBookProps) {
  const [activeView, setActiveView] = useState<"monsters" | "loot">("monsters");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setBy] = useState<"name" | "rarity" | "level">("name");
  const [filterRarity, setFilterRarity] = useState<string>("all");

  // Fetch all dungeons to get boss list
  const { data: dungeons } = useQuery({
    queryKey: ["dungeons"],
    queryFn: async () => {
      const { data } = await dungeonApi.getAll();
      return data;
    },
  });

  // Fetch inventory to mark "discovered" items
  const { data: inventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
  });

  const rarityOrder: Record<string, number> = {
    Common: 1,
    Uncommon: 2,
    Rare: 3,
    Epic: 4,
    Legendary: 5,
  };

  const rarityColors: Record<string, string> = {
    Common: "#9ca3af",
    Uncommon: "#4ade80",
    Rare: "#60a5fa",
    Epic: "#a855f7",
    Legendary: "#f59e0b",
  };

  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    
    // Get unique items from inventory
    const uniqueItems = Array.from(new Map(inventory.map((slot: any) => [slot.item.id, slot.item])).values());
    
    return uniqueItems
      .filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
        return matchesSearch && matchesRarity;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "rarity") return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        return 0;
      });
  }, [inventory, searchQuery, sortBy, filterRarity]);

  return (
    <div className="bg-stone-900 min-h-screen text-stone-200 p-4 pb-24 font-mono">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-stone-800 border-4 border-stone-600 hover:bg-stone-700 transition"
          style={{ boxShadow: '0 4px 0 #292524' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-amber-500 tracking-widest" style={{ textShadow: '2px 2px 0 #000' }}>
          COLLECTION
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView("monsters")}
          className={`flex-1 py-3 font-bold border-4 transition flex items-center justify-center gap-2 ${
            activeView === "monsters" 
              ? "bg-amber-700 border-amber-900 text-white translate-y-1" 
              : "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
          }`}
          style={{ boxShadow: activeView === "monsters" ? 'none' : '0 4px 0 #292524' }}
        >
          <img src={monsterTabIcon} alt="Monsters" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
          BESTIARY
        </button>
        <button
          onClick={() => setActiveView("loot")}
          className={`flex-1 py-3 font-bold border-4 transition flex items-center justify-center gap-2 ${
            activeView === "loot" 
              ? "bg-amber-700 border-amber-900 text-white translate-y-1" 
              : "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
          }`}
          style={{ boxShadow: activeView === "loot" ? 'none' : '0 4px 0 #292524' }}
        >
          <img src={inventoryTabIcon} alt="Loot" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
          LOOT
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className="bg-stone-800 border-4 border-stone-700 p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border-2 border-stone-600 p-2 pl-10 text-stone-200 outline-none focus:border-amber-500"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Custom Retro Dropdown 1: Sort */}
          <RetroDropdown 
            value={sortBy === "name" ? "SORT: A-Z" : "SORT: RARITY"}
            options={[
              { label: "SORT: A-Z", value: "name" },
              { label: "SORT: RARITY", value: "rarity" }
            ]}
            onSelect={(val) => setBy(val as any)}
          />

          {/* Custom Retro Dropdown 2: Rarity */}
          <RetroDropdown 
            value={filterRarity === "all" ? "ALL RARITIES" : filterRarity.toUpperCase()}
            options={[
              { label: "ALL RARITIES", value: "all" },
              { label: "COMMON", value: "Common" },
              { label: "RARE", value: "Rare" },
              { label: "EPIC", value: "Epic" },
              { label: "LEGENDARY", value: "Legendary" }
            ]}
            onSelect={(val) => setFilterRarity(val)}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {activeView === "monsters" ? (
          dungeons?.map((dungeon: any) => (
            <div 
              key={dungeon.id}
              className="group relative aspect-square bg-stone-800 border-4 border-stone-700 p-1 flex flex-col items-center justify-center hover:border-amber-500 transition"
              style={{ boxShadow: '0 4px 0 #292524' }}
            >
              <div className="w-full h-full bg-stone-950 flex items-center justify-center p-2">
                <img 
                  src={`/assets/ui/dungeonIcons/${dungeon.dungeonIcon}.png`}
                  alt={dungeon.name}
                  className="max-w-full max-h-full pixelated group-hover:scale-110 transition-transform"
                  onError={(e: any) => {
                    e.target.src = "/assets/ui/dungeonIcons/slimeDen.png"; // Fallback
                  }}
                />
              </div>
              <div className="absolute -bottom-1 left-0 right-0 bg-stone-900 border-t-2 border-stone-700 p-1 text-[10px] text-center truncate font-bold text-stone-400">
                {dungeon.name.toUpperCase()}
              </div>
            </div>
          ))
        ) : (
          filteredItems.map((item: any) => (
            <div 
              key={item.id}
              className="group relative aspect-square bg-stone-800 border-4 border-stone-700 p-1 flex flex-col items-center justify-center hover:border-amber-500 transition"
              style={{ 
                boxShadow: '0 4px 0 #292524',
                borderColor: rarityColors[item.rarity] + '44'
              }}
            >
              <div className="w-full h-full bg-stone-950 flex items-center justify-center p-2">
                <img 
                  src={getItemImage(item.spriteId, item.type) || ""}
                  alt={item.name}
                  className="max-w-full max-h-full pixelated group-hover:scale-110 transition-transform"
                />
              </div>
              <div 
                className="absolute -bottom-1 left-0 right-0 bg-stone-900 border-t-2 border-stone-700 p-1 text-[10px] text-center truncate font-bold"
                style={{ color: rarityColors[item.rarity] }}
              >
                {item.name.toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>

      {(activeView === "loot" && filteredItems.length === 0) && (
        <div className="text-center py-12 text-stone-500 font-bold border-4 border-dashed border-stone-700 mt-4">
           NO ITEMS FOUND
        </div>
      )}
    </div>
  );
}
