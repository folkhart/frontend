import { useState } from 'react';
import { weaponsByClass, armorSets, accessories, gems, materials } from './ItemDatabase';

// Import UI icons
import equipmentIcon from '@/assets/ui/equipment.png';
import craftIcon from '@/assets/ui/craft/anvil.png';
import hammerIcon from '@/assets/ui/craft/hammer.png';

interface ItemShowcaseProps {
  category: 'weapons' | 'armors' | 'accessories' | 'gems' | 'materials';
  subcategory?: string;
}

export default function ItemShowcase({ category, subcategory }: ItemShowcaseProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Get item image using eager glob imports
  const getItemImage = (spriteId: string) => {
    if (!spriteId) return null;
    
    try {
      const images = import.meta.glob('../../assets/items/**/*.png', { eager: true, as: 'url' });
      
      // Handle different sprite path formats
      if (spriteId.includes('/')) {
        const fullPath = spriteId.startsWith('woodenSet/') 
          ? `accessories/${spriteId}` 
          : spriteId;
        const path = `../../assets/items/${fullPath}.png`;
        return images[path] || null;
      }
      
      // Default paths
      const folders = ['weapons', 'armors', 'accessories', 'craft/gems'];
      for (const folder of folders) {
        const path = `../../assets/items/${folder}/${spriteId}.png`;
        if (images[path]) return images[path];
      }
      
      return null;
    } catch (e) {
      console.error('Failed to load image:', spriteId, e);
      return null;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-600';
      case 'Uncommon': return 'text-green-400 border-green-600';
      case 'Rare': return 'text-blue-400 border-blue-600';
      case 'Epic': return 'text-purple-400 border-purple-600';
      case 'Legendary': return 'text-orange-400 border-orange-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const renderWeapons = () => {
    if (!subcategory) {
      // Show all classes
      return (
        <div className="space-y-6">
          {Object.entries(weaponsByClass).map(([className, weapons]) => (
            <div key={className}>
              <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                <img src={equipmentIcon} alt="" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                {className} Weapons
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {weapons.map((weapon: any) => (
                  <button
                    key={weapon.spriteId}
                    onClick={() => setSelectedItem({ ...weapon, category: 'Weapon', class: className })}
                    className={`p-3 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(weapon.rarity)} transition`}
                    style={{ borderRadius: '0', boxShadow: '0 2px 0 #1c1917' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getItemImage(weapon.spriteId) && (
                        <img
                          src={getItemImage(weapon.spriteId)!}
                          alt={weapon.name}
                          className="w-12 h-12"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      )}
                      <span className={`text-sm font-bold ${getRarityColor(weapon.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                        {weapon.name}
                      </span>
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        ATK +{weapon.atk}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Show specific class
      const weapons = weaponsByClass[subcategory as keyof typeof weaponsByClass];
      return (
        <div>
          <h3 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            <img src={equipmentIcon} alt="" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
            {subcategory} Weapons
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {weapons.map((weapon: any) => (
              <button
                key={weapon.spriteId}
                onClick={() => setSelectedItem({ ...weapon, category: 'Weapon', class: subcategory })}
                className={`p-4 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(weapon.rarity)} transition`}
                style={{ borderRadius: '0', boxShadow: '0 3px 0 #1c1917' }}
              >
                <div className="flex flex-col items-center gap-2">
                  {getItemImage(weapon.spriteId) && (
                    <img
                      src={getItemImage(weapon.spriteId)!}
                      alt={weapon.name}
                      className="w-16 h-16"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <span className={`text-base font-bold ${getRarityColor(weapon.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                    {weapon.name}
                  </span>
                  <div className="text-sm text-gray-300" style={{ fontFamily: 'monospace' }}>
                    <div>ATK +{weapon.atk}</div>
                    {weapon.spd && <div>SPD +{weapon.spd}</div>}
                    {weapon.def && <div>DEF +{weapon.def}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderArmors = () => {
    if (!subcategory) {
      // Show all slots
      return (
        <div className="space-y-6">
          {Object.entries(armorSets).map(([slotName, armors]) => (
            <div key={slotName}>
              <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                <img src={equipmentIcon} alt="" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                {slotName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {armors.map((armor: any) => (
                  <button
                    key={armor.spriteId}
                    onClick={() => setSelectedItem({ ...armor, category: 'Armor', slot: slotName })}
                    className={`p-3 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(armor.rarity)} transition`}
                    style={{ borderRadius: '0', boxShadow: '0 2px 0 #1c1917' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getItemImage(armor.spriteId) && (
                        <img
                          src={getItemImage(armor.spriteId)!}
                          alt={armor.name}
                          className="w-12 h-12"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      )}
                      <span className={`text-sm font-bold ${getRarityColor(armor.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                        {armor.name}
                      </span>
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        DEF +{armor.def}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Show specific slot
      const armors = armorSets[subcategory as keyof typeof armorSets];
      return (
        <div>
          <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            <img src={equipmentIcon} alt="" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
            {subcategory}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {armors.map((armor: any) => (
              <button
                key={armor.spriteId}
                onClick={() => setSelectedItem({ ...armor, category: 'Armor', slot: subcategory })}
                className={`p-4 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(armor.rarity)} transition`}
                style={{ borderRadius: '0', boxShadow: '0 3px 0 #1c1917' }}
              >
                <div className="flex flex-col items-center gap-2">
                  {getItemImage(armor.spriteId) && (
                    <img
                      src={getItemImage(armor.spriteId)!}
                      alt={armor.name}
                      className="w-16 h-16"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <span className={`text-base font-bold ${getRarityColor(armor.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                    {armor.name}
                  </span>
                  <div className="text-sm text-gray-300" style={{ fontFamily: 'monospace' }}>
                    <div>DEF +{armor.def}</div>
                    {armor.hp && <div>HP +{armor.hp}</div>}
                    {armor.atk && <div>ATK +{armor.atk}</div>}
                    {armor.spd && <div>SPD +{armor.spd}</div>}
                  </div>
                  {armor.classRestriction && (
                    <span className="text-xs text-yellow-400" style={{ fontFamily: 'monospace' }}>
                      {armor.classRestriction} Only
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderAccessories = () => {
    return (
      <div className="space-y-6">
        {Object.entries(accessories).map(([typeName, items]) => (
          <div key={typeName}>
            <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
              💍 {typeName}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item: any) => (
                <button
                  key={item.spriteId}
                  onClick={() => setSelectedItem({ ...item, category: 'Accessory', type: typeName })}
                  className={`p-3 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(item.rarity)} transition`}
                  style={{ borderRadius: '0', boxShadow: '0 2px 0 #1c1917' }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {getItemImage(item.spriteId) && (
                      <img
                        src={getItemImage(item.spriteId)!}
                        alt={item.name}
                        className="w-12 h-12"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    <span className={`text-sm font-bold ${getRarityColor(item.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                      {item.name}
                    </span>
                    <div className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                      {item.hp && <div>HP +{item.hp}</div>}
                      {item.atk && <div>ATK +{item.atk}</div>}
                      {item.def && <div>DEF +{item.def}</div>}
                      {item.spd && <div>SPD +{item.spd}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGems = () => {
    return (
      <div className="space-y-6">
        {Object.entries(gems).map(([gemType, gemList]) => (
          <div key={gemType}>
            <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
              💎 {gemType} Gems
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gemList.map((gem: any) => (
                <button
                  key={gem.spriteId}
                  onClick={() => setSelectedItem({ ...gem, category: 'Gem', type: gemType })}
                  className={`p-3 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(gem.rarity)} transition`}
                  style={{ borderRadius: '0', boxShadow: '0 2px 0 #1c1917' }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {getItemImage(gem.spriteId) && (
                      <img
                        src={getItemImage(gem.spriteId)!}
                        alt={gem.name}
                        className="w-12 h-12"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    <span className={`text-sm font-bold ${getRarityColor(gem.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                      {gem.name}
                    </span>
                    <div className="text-xs text-gray-300" style={{ fontFamily: 'monospace' }}>
                      {gem.hp && <div>HP +{gem.hp}</div>}
                      {gem.atk && <div>ATK +{gem.atk}</div>}
                      {gem.def && <div>DEF +{gem.def}</div>}
                      {gem.spd && <div>SPD +{gem.spd}</div>}
                      {gem.element && <div className="text-orange-400">{gem.element} ATK</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMaterials = () => {
    return (
      <div>
        <h3 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
          <img src={craftIcon} alt="" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          Crafting Materials
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {materials.map((material: any) => (
            <button
              key={material.spriteId}
              onClick={() => setSelectedItem({ ...material, category: 'Material' })}
              className={`p-4 bg-stone-800 hover:bg-stone-700 border-2 ${getRarityColor(material.rarity)} transition`}
              style={{ borderRadius: '0', boxShadow: '0 3px 0 #1c1917' }}
            >
              <div className="flex flex-col items-center gap-2">
                {getItemImage(material.spriteId) && (
                  <img
                    src={getItemImage(material.spriteId)!}
                    alt={material.name}
                    className="w-16 h-16"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <span className={`text-base font-bold ${getRarityColor(material.rarity).split(' ')[0]}`} style={{ fontFamily: 'monospace' }}>
                  {material.name}
                </span>
                <span className="text-xs text-gray-400 text-center" style={{ fontFamily: 'monospace' }}>
                  {material.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Render based on category */}
      {category === 'weapons' && renderWeapons()}
      {category === 'armors' && renderArmors()}
      {category === 'accessories' && renderAccessories()}
      {category === 'gems' && renderGems()}
      {category === 'materials' && renderMaterials()}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-stone-800 border-4 border-amber-600 p-6 max-w-md w-full" style={{ borderRadius: '0', boxShadow: '0 4px 0 #92400e, 0 8px 0 rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-4">
              {/* Item Image */}
              {getItemImage(selectedItem.spriteId) && (
                <div className="relative">
                  <img
                    src={getItemImage(selectedItem.spriteId)!}
                    alt={selectedItem.name}
                    className="w-24 h-24"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <img src={hammerIcon} alt="" className="absolute -bottom-2 -right-2 w-8 h-8" style={{ imageRendering: 'pixelated' }} />
                </div>
              )}

              {/* Item Name & Rarity */}
              <div className="text-center">
                <h3 className={`text-2xl font-bold ${getRarityColor(selectedItem.rarity).split(' ')[0]} mb-1`} style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                  {selectedItem.name}
                </h3>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
                  {selectedItem.rarity} {selectedItem.category}
                </p>
                {selectedItem.class && (
                  <p className="text-sm text-yellow-400" style={{ fontFamily: 'monospace' }}>
                    {selectedItem.class} Class
                  </p>
                )}
                {selectedItem.classRestriction && (
                  <p className="text-sm text-yellow-400" style={{ fontFamily: 'monospace' }}>
                    {selectedItem.classRestriction} Only
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="w-full bg-stone-900 p-4 border-2 border-stone-700">
                <h4 className="text-amber-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>Stats:</h4>
                <div className="space-y-1 text-sm" style={{ fontFamily: 'monospace' }}>
                  {selectedItem.hp && <div className="text-red-400">❤️ HP: +{selectedItem.hp}</div>}
                  {selectedItem.atk && <div className="text-orange-400">⚔️ ATK: +{selectedItem.atk}</div>}
                  {selectedItem.def && <div className="text-blue-400">🛡️ DEF: +{selectedItem.def}</div>}
                  {selectedItem.spd && <div className="text-green-400">⚡ SPD: +{selectedItem.spd}</div>}
                  {selectedItem.element && <div className="text-purple-400">🔥 Element: {selectedItem.element}</div>}
                </div>
              </div>

              {/* Value */}
              {selectedItem.value && (
                <div className="text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                  💰 Value: {selectedItem.value} Gold
                </div>
              )}

              {/* Description */}
              {selectedItem.description && (
                <p className="text-gray-300 text-sm text-center" style={{ fontFamily: 'monospace' }}>
                  {selectedItem.description}
                </p>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 bg-red-700 hover:bg-red-600 text-white font-bold transition"
                style={{
                  border: '3px solid #7f1d1d',
                  borderRadius: '0',
                  boxShadow: '0 3px 0 #991b1b',
                  fontFamily: 'monospace',
                  textShadow: '1px 1px 0 #000',
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
