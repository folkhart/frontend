import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Sword, Shield, Flame, Droplet, Zap, X, Skull } from 'lucide-react';

interface BossFightProps {
  dungeonName: string;
  bossName: string;
  bossLevel: number;
  bossHealth: number; // Actual boss HP from dungeon
  bossAttack: number; // Actual boss attack from dungeon
  bossDefense: number; // Actual boss defense from dungeon
  dungeonIcon?: string; // Dungeon icon for boss sprite
  playerClass: string; // warrior, rogue, cleric, ranger, mage
  playerHP: number;
  playerMaxHP: number;
  playerAttack: number;
  playerDefense: number;
  playerSpeed: number;
  playerCP: number;
  // Special stats
  fireAttack?: number;
  iceAttack?: number;
  lightningAttack?: number;
  poisonAttack?: number;
  critChance?: number;
  critDamage?: number;
  lifeSteal?: number;
  dodgeChance?: number;
  onComplete: (success: boolean, finalHP: number, rewards?: any) => void;
  onClose: () => void;
}

interface StatusEffect {
  type: 'burn' | 'poison' | 'slow';
  duration: number;
  damage?: number;
}

// REMOVED: Boss stats now come from dungeon data, not calculated

// Calculate damage with all modifiers
const calculateDamage = (
  attack: number,
  defense: number,
  critChance: number = 0,
  critDamage: number = 0,
  elementalBonus: number = 0
): { damage: number; isCrit: boolean } => {
  // Base damage formula
  const baseDamage = Math.max(1, attack - defense / 2);
  
  // Random variance (90% - 110%)
  const variance = 0.9 + Math.random() * 0.2;
  let finalDamage = baseDamage * variance;
  
  // Check for critical hit
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    finalDamage *= (1 + critDamage / 100);
  }
  
  // Add elemental bonus
  finalDamage += elementalBonus;
  
  return {
    damage: Math.floor(finalDamage),
    isCrit
  };
};

export default function BossFight({
  dungeonName,
  bossName,
  bossLevel,
  bossHealth,
  bossAttack,
  bossDefense,
  dungeonIcon,
  playerClass,
  playerHP: initialPlayerHP,
  playerMaxHP,
  playerAttack,
  playerDefense,
  playerSpeed: _playerSpeed,
  playerCP: _playerCP,
  fireAttack = 0,
  iceAttack = 0,
  lightningAttack = 0,
  poisonAttack = 0,
  critChance = 0,
  critDamage = 0,
  lifeSteal = 0,
  dodgeChance = 0,
  onComplete,
  onClose,
}: BossFightProps) {
  // Use actual boss stats from dungeon
  const bossStats = {
    maxHP: bossHealth,
    attack: bossAttack,
    defense: bossDefense,
  };
  
  // Debug logging
  console.log('Boss Fight Props:', {
    bossLevel,
    bossHealth,
    bossAttack,
    bossDefense,
    playerAttack,
    playerDefense,
    initialPlayerHP,
    playerMaxHP
  });
  
  // Combat state
  const [playerHP, setPlayerHP] = useState(initialPlayerHP);
  const [bossHP, setBossHP] = useState(bossHealth);
  const [bossMaxHP] = useState(bossHealth);
  const [turn, setTurn] = useState<'player' | 'boss'>('player');
  const [isDefending, setIsDefending] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState<'player' | 'boss' | null>(null);
  
  // Status effects
  const [bossEffects, setBossEffects] = useState<StatusEffect[]>([]);
  const [bossAttackModifier, setBossAttackModifier] = useState(1); // For slow effect
  
  // Animation state
  const [bossShake, setBossShake] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<string>('⚔️ YOUR TURN');
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const [victoryRewards, setVictoryRewards] = useState<any>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // PixiJS refs
  const pixiContainer = useRef<HTMLDivElement>(null);
  const pixiApp = useRef<PIXI.Application | null>(null);
  const bossSprite = useRef<PIXI.Container | null>(null);
  const playerSprite = useRef<PIXI.Container | null>(null);
  const playerSpriteTexture = useRef<PIXI.Sprite | null>(null);
  const particleContainer = useRef<PIXI.Container | null>(null);
  const damageTextContainer = useRef<PIXI.Container | null>(null);
  
  // Add log message
  const addLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-5), message]);
  };
  
  // Character animation helper
  const playCharacterAnimation = (animation: 'attack' | 'defence') => {
    if (!playerSpriteTexture.current) return;
    
    const characterClass = playerClass?.toLowerCase() || 'warrior';
    const animationPath = `/assets/ui/bossfight/${characterClass}/${characterClass}_${animation}.png`;
    const idlePath = `/assets/ui/bossfight/${characterClass}/${characterClass}.png`;
    
    // Switch to animation sprite
    PIXI.Assets.load(animationPath).then((texture) => {
      if (playerSpriteTexture.current) {
        playerSpriteTexture.current.texture = texture;
      }
      
      // Switch back to idle after 400ms
      setTimeout(() => {
        PIXI.Assets.load(idlePath).then((idleTexture) => {
          if (playerSpriteTexture.current) {
            playerSpriteTexture.current.texture = idleTexture;
          }
        });
      }, 400);
    }).catch(console.error);
  };
  
  // Add floating damage text using PixiJS
  const addFloatingText = (text: string, x: number, y: number, color: string, isCrit: boolean = false) => {
    if (!damageTextContainer.current || !pixiApp.current) return;
    
    const damageText = new PIXI.Text(text, {
      fontFamily: 'monospace',
      fontSize: isCrit ? 32 : 24,
      fontWeight: 'bold',
      fill: color,
      stroke: '#000000',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });
    
    damageText.x = x;
    damageText.y = y;
    damageText.anchor.set(0.5);
    
    damageTextContainer.current.addChild(damageText);
    
    // Animate upward with scale
    let frame = 0;
    const animate = () => {
      frame++;
      damageText.y -= 2;
      damageText.alpha = 1 - (frame / 60);
      damageText.scale.set(1 + (frame * 0.01));
      
      if (frame < 60) {
        requestAnimationFrame(animate);
      } else {
        damageTextContainer.current?.removeChild(damageText);
      }
    };
    animate();
  };
  
  // Process status effects
  useEffect(() => {
    if (bossEffects.length === 0) return;
    
    const activeBurn = bossEffects.find(e => e.type === 'burn');
    const activePoison = bossEffects.find(e => e.type === 'poison');
    const activeSlow = bossEffects.find(e => e.type === 'slow');
    
    let dotDamage = 0;
    if (activeBurn) dotDamage += activeBurn.damage || 0;
    if (activePoison) dotDamage += activePoison.damage || 0;
    
    if (dotDamage > 0) {
      setBossHP(prev => {
        const newHP = Math.max(0, prev - dotDamage);
        addFloatingText(`-${dotDamage}`, 50, 30, '#ff6b6b', false);
        addLog(`🔥 Status effects dealt ${dotDamage} damage!`);
        return newHP;
      });
    }
    
    // Update attack modifier from slow
    setBossAttackModifier(activeSlow ? 0.7 : 1);
    
    // Decay effects
    setBossEffects(prev => prev.map(e => ({
      ...e,
      duration: e.duration - 1
    })).filter(e => e.duration > 0));
  }, [turn]);
  
  // Initialize PixiJS
  useEffect(() => {
    if (!pixiContainer.current) return;
    
    // Make responsive: use container width or fallback to window width
    const containerWidth = pixiContainer.current.clientWidth || window.innerWidth;
    const containerHeight = Math.min(250, window.innerHeight * 0.3); // Max 250px or 30% of screen height
    
    const app = new PIXI.Application({
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: false, // Pixel perfect
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // Make canvas responsive to container size
    (app.view as HTMLCanvasElement).style.width = '100%';
    (app.view as HTMLCanvasElement).style.height = '250px';
    (app.view as HTMLCanvasElement).style.maxHeight = '30vh';
    
    pixiContainer.current.appendChild(app.view as HTMLCanvasElement);
    pixiApp.current = app;
    
    // Create boss sprite container (right side)
    const boss = new PIXI.Container();
    boss.x = containerWidth * 0.75;
    boss.y = containerHeight * 0.5;
    bossSprite.current = boss;
    
    // Load dungeon icon as boss sprite
    if (dungeonIcon) {
      PIXI.Assets.load(dungeonIcon).then((texture) => {
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        // Make boss BIG and visible
        const bossSize = Math.min(containerWidth * 0.3, 120);
        sprite.width = bossSize;
        sprite.height = bossSize;
        boss.addChild(sprite);
      }).catch(() => {
        // Fallback RED monster if image fails
        const fallbackGraphics = new PIXI.Graphics();
        fallbackGraphics.beginFill(0xFF0000);
        fallbackGraphics.drawCircle(0, 0, 60);
        fallbackGraphics.endFill();
        // Add eyes
        fallbackGraphics.beginFill(0xFFFFFF);
        fallbackGraphics.drawCircle(-20, -10, 8);
        fallbackGraphics.drawCircle(20, -10, 8);
        fallbackGraphics.endFill();
        boss.addChild(fallbackGraphics);
      });
    } else {
      // Fallback RED monster
      const fallbackGraphics = new PIXI.Graphics();
      fallbackGraphics.beginFill(0xFF0000);
      fallbackGraphics.drawCircle(0, 0, 60);
      fallbackGraphics.endFill();
      // Add eyes
      fallbackGraphics.beginFill(0xFFFFFF);
      fallbackGraphics.drawCircle(-20, -10, 8);
      fallbackGraphics.drawCircle(20, -10, 8);
      fallbackGraphics.endFill();
      boss.addChild(fallbackGraphics);
    }
    
    app.stage.addChild(boss);
    
    // Create player sprite container (left side)
    const player = new PIXI.Container();
    player.x = containerWidth * 0.25;
    player.y = containerHeight * 0.5;
    playerSprite.current = player;
    
    // Load actual character sprite based on class
    const characterClass = playerClass?.toLowerCase() || 'warrior';
    const characterSpritePath = `/assets/ui/bossfight/${characterClass}/${characterClass}.png`;
    
    PIXI.Assets.load(characterSpritePath).then((texture) => {
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      // Scale character sprite to appropriate size
      const characterSize = Math.min(containerWidth * 0.25, 100);
      sprite.width = characterSize;
      sprite.height = characterSize;
      player.addChild(sprite);
      playerSpriteTexture.current = sprite; // Store reference for animation swapping
    }).catch((error) => {
      console.error('Failed to load character sprite:', error);
      // Fallback: Simple colored circle if sprite fails to load
      const fallback = new PIXI.Graphics();
      fallback.beginFill(0x44FF44);
      fallback.drawCircle(0, 0, 40);
      fallback.endFill();
      player.addChild(fallback);
    });
    
    app.stage.addChild(player);
    
    // Create containers for effects and damage text
    const particles = new PIXI.Container();
    particleContainer.current = particles;
    app.stage.addChild(particles);
    
    const damageTexts = new PIXI.Container();
    damageTextContainer.current = damageTexts;
    app.stage.addChild(damageTexts);
    
    // Cleanup
    return () => {
      app.destroy(true, { children: true, texture: true });
    };
  }, [dungeonIcon, playerClass]);
  
  // Boss shake animation
  useEffect(() => {
    if (!bossShake || !bossSprite.current || !pixiContainer.current) return;
    
    const sprite = bossSprite.current;
    const containerWidth = pixiContainer.current.clientWidth || 300;
    const originalX = containerWidth * 0.75;
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      sprite.x = originalX + (Math.random() - 0.5) * 15;
      shakeCount++;
      if (shakeCount > 5) {
        sprite.x = originalX;
        setBossShake(false);
        clearInterval(shakeInterval);
      }
    }, 50);
    
    return () => clearInterval(shakeInterval);
  }, [bossShake]);
  
  // Check for battle end and generate rewards
  useEffect(() => {
    if (battleEnded) return;
    
    if (playerHP <= 0) {
      setBattleEnded(true);
      setWinner('boss');
      setCurrentAction('💀 DEFEAT');
      addLog('💀 You have been defeated!');
      setTimeout(() => onComplete(false, 0), 3000);
    } else if (bossHP <= 0) {
      setBattleEnded(true);
      setWinner('player');
      setCurrentAction('🎉 VICTORY!');
      addLog('🎉 Victory! Boss defeated!');
      
      // Generate rewards (3x XP, 3x Gold, items, gems)
      const baseXP = bossLevel * 150;
      const baseGold = bossLevel * 100;
      const rewards = {
        xp: Math.floor(baseXP * 3),
        gold: Math.floor(baseGold * 3),
        items: [
          { name: 'Enhancement Stone', quantity: Math.floor(Math.random() * 3) + 1 },
          { name: 'Refining Stone', quantity: Math.floor(Math.random() * 2) + 1 },
        ],
        gems: [
          { name: bossLevel >= 10 ? 'Iron Gem' : 'Wooden Gem', quantity: 1 },
        ]
      };
      
      // Random chance for extra item
      if (Math.random() < 0.3) {
        rewards.items.push({ name: 'Socket Drill', quantity: 1 });
      }
      
      console.log('Boss Fight Victory Rewards:', rewards); // Debug log
      setVictoryRewards(rewards);
      setTimeout(() => setShowVictoryScreen(true), 1000);
    }
  }, [playerHP, bossHP, battleEnded, onComplete, bossLevel]);
  
  // Player actions
  const handleNormalAttack = () => {
    if (turn !== 'player' || battleEnded || actionInProgress) return;
    
    setActionInProgress(true);
    playCharacterAnimation('attack');
    setCurrentAction('⚔️ ATTACK!');
    setBossShake(true);
    const result = calculateDamage(playerAttack, bossStats.defense, critChance, critDamage, 0);
    
    setBossHP(prev => {
      const newHP = Math.max(0, prev - result.damage);
      // Boss position for damage text
      const containerWidth = pixiContainer.current?.clientWidth || 300;
      addFloatingText(`-${result.damage}`, containerWidth * 0.75, 80, result.isCrit ? '#FFD700' : '#FF6B6B', result.isCrit);
      addLog(`⚔️ You dealt ${result.damage} damage!${result.isCrit ? ' CRITICAL HIT!' : ''}`);
      
      // Lifesteal
      if (lifeSteal > 0) {
        const heal = Math.floor(result.damage * lifeSteal / 100);
        setPlayerHP(hp => Math.min(playerMaxHP, hp + heal));
        addLog(`💖 Lifesteal healed ${heal} HP!`);
      }
      
      return newHP;
    });
    
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
    }, 800);
  };
  
  const handleFireAttack = () => {
    if (turn !== 'player' || battleEnded || fireAttack === 0) return;
    
    setCurrentAction('🔥 FIRE!');
    setBossShake(true);
    const bonusDamage = Math.floor(fireAttack * 1.5);
    const result = calculateDamage(playerAttack, bossStats.defense, critChance, critDamage, bonusDamage);
    
    // Spawn fire particles
    if (particleContainer.current && pixiApp.current) {
      for (let i = 0; i < 20; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(0xFF4500);
        particle.drawCircle(0, 0, 3);
        particle.endFill();
        particle.x = 150 + (Math.random() - 0.5) * 100;
        particle.y = 150 + (Math.random() - 0.5) * 100;
        particleContainer.current.addChild(particle);
        
        setTimeout(() => particle.destroy(), 500);
      }
    }
    
    setBossHP(prev => {
      const newHP = Math.max(0, prev - result.damage);
      addFloatingText(`-${result.damage}`, 150, 100, '#FF4500', result.isCrit);
      addLog(`🔥 Fire attack dealt ${result.damage} damage!`);
      
      // Apply burn DOT
      const burnDamage = Math.floor(bossMaxHP * 0.03);
      setBossEffects(prev => [...prev.filter(e => e.type !== 'burn'), {
        type: 'burn',
        duration: 3,
        damage: burnDamage
      }]);
      addLog(`🔥 Boss is burning! (${burnDamage} per turn for 3 turns)`);
      
      return newHP;
    });
    
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
    }, 800);
  };
  
  const handleIceAttack = () => {
    if (turn !== 'player' || battleEnded || iceAttack === 0) return;
    
    setCurrentAction('❄️ ICE!');
    setBossShake(true);
    const bonusDamage = Math.floor(iceAttack * 1.3);
    const result = calculateDamage(playerAttack, bossStats.defense, critChance, critDamage, bonusDamage);
    
    setBossHP(prev => {
      const newHP = Math.max(0, prev - result.damage);
      addFloatingText(`-${result.damage}`, 150, 100, '#00CED1', result.isCrit);
      addLog(`❄️ Ice attack dealt ${result.damage} damage!`);
      
      // Apply slow
      setBossEffects(prev => [...prev.filter(e => e.type !== 'slow'), {
        type: 'slow',
        duration: 2
      }]);
      addLog(`❄️ Boss is slowed! Attack reduced by 30%!`);
      
      return newHP;
    });
    
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
    }, 800);
  };
  
  const handleLightningAttack = () => {
    if (turn !== 'player' || battleEnded || lightningAttack === 0) return;
    
    setCurrentAction('⚡ LIGHTNING!');
    setBossShake(true);
    const bonusDamage = Math.floor(lightningAttack * 2);
    const result = calculateDamage(playerAttack, bossStats.defense, critChance, critDamage, bonusDamage);
    
    setBossHP(prev => {
      const newHP = Math.max(0, prev - result.damage);
      addFloatingText(`-${result.damage}`, 150, 100, '#FFD700', true);
      addLog(`⚡ Lightning strike dealt ${result.damage} damage!`);
      
      return newHP;
    });
    
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
    }, 800);
  };
  
  const handlePoisonAttack = () => {
    if (turn !== 'player' || battleEnded || poisonAttack === 0) return;
    
    setCurrentAction('☠️ POISON!');
    setBossShake(true);
    const bonusDamage = Math.floor(poisonAttack);
    const result = calculateDamage(playerAttack, bossStats.defense, critChance, critDamage, bonusDamage);
    
    setBossHP(prev => {
      const newHP = Math.max(0, prev - result.damage);
      addFloatingText(`-${result.damage}`, 150, 100, '#9370DB', result.isCrit);
      addLog(`☠️ Poison attack dealt ${result.damage} damage!`);
      
      // Apply poison DOT
      const poisonDmg = Math.floor(bossMaxHP * 0.02);
      setBossEffects(prev => [...prev.filter(e => e.type !== 'poison'), {
        type: 'poison',
        duration: 5,
        damage: poisonDmg
      }]);
      addLog(`☠️ Boss is poisoned! (${poisonDmg} per turn for 5 turns)`);
      
      return newHP;
    });
    
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
      setActionInProgress(false);
    }, 800);
  };
  
  const handleDefend = () => {
    if (turn !== 'player' || battleEnded || actionInProgress) return;
    
    setActionInProgress(true);
    playCharacterAnimation('defence');
    setCurrentAction('🛡️ DEFEND!');
    setIsDefending(true);
    addLog(`🛡️ You brace for impact! Damage reduced by 50%!`);
    setTimeout(() => {
      setTurn('boss');
      setCurrentAction('');
      setActionInProgress(false);
    }, 500);
  };
  
  // Boss turn
  useEffect(() => {
    if (turn !== 'boss' || battleEnded) return;
    
    setCurrentAction('🔥 BOSS ATTACKS!');
    
    const timeout = setTimeout(() => {
      // Boss attack
      const bossAttackValue = Math.floor(bossStats.attack * bossAttackModifier);
      let damage = Math.max(5, bossAttackValue - playerDefense / 2);
      damage = Math.floor(damage * (0.9 + Math.random() * 0.2));
      
      // Check player dodge
      const dodged = Math.random() * 100 < dodgeChance;
      
      if (dodged) {
        addLog(`🌀 You dodged the attack!`);
        const containerWidth = pixiContainer.current?.clientWidth || 300;
        addFloatingText('MISS!', containerWidth * 0.25, 120, '#FFD700', false);
      } else {
        // Apply defend reduction
        if (isDefending) {
          damage = Math.floor(damage * 0.5);
        }
        
        setPlayerHP(prev => {
          const newHP = Math.max(0, prev - damage);
          const containerWidth = pixiContainer.current?.clientWidth || 300;
          addFloatingText(`-${damage}`, containerWidth * 0.25, 120, '#FF6B6B', false);
          addLog(`💥 ${bossName} dealt ${damage} damage!`);
          
          return newHP;
        });
      }
      
      setIsDefending(false);
      setTimeout(() => {
        setTurn('player');
        setCurrentAction('⚔️ YOUR TURN');
        setActionInProgress(false); // Reset action lock for player's turn
      }, 500);
    }, 1200);
    
    return () => clearTimeout(timeout);
  }, [turn, battleEnded, bossStats.attack, playerDefense, isDefending, dodgeChance, bossAttackModifier]);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-amber-600 border-4 border-amber-500 mb-3 py-2 px-4" style={{ borderRadius: '0', boxShadow: '0 4px 0 #92400e' }}>
          <h1 className="text-xl sm:text-2xl font-bold text-amber-200 text-center" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            {dungeonName}
          </h1>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs sm:text-sm text-amber-300" style={{ fontFamily: 'monospace' }}>Boss Lv.{bossLevel}</span>
            <span className="text-xs sm:text-sm text-green-400" style={{ fontFamily: 'monospace' }}>HP: {bossHealth} | ATK: {bossAttack} | DEF: {bossDefense}</span>
          </div>
        </div>

        {/* Battle Arena */}
        <div className="bg-stone-900 border-4 border-red-700 p-2 sm:p-3 mb-2" style={{ borderRadius: '0', boxShadow: '0 4px 0 #7f1d1d, inset 0 2px 0 rgba(255,255,255,0.1)' }}>
          <div className="grid grid-cols-1 gap-3">
            {/* Boss Side with PixiJS */}
            <div>
              <div className="bg-stone-800 border-4 border-red-600 p-2 relative" style={{ borderRadius: '0', boxShadow: '0 3px 0 #991b1b' }}>
                {/* Player HP Bar at Top */}
                <div className="mb-2 bg-stone-900 border-2 border-blue-700 p-2" style={{ borderRadius: '0' }}>
                  <div className="flex justify-between text-xs mb-1" style={{ fontFamily: 'monospace' }}>
                    <span className="text-blue-400">❤️ YOUR HP</span>
                    <span className="text-blue-300">{playerHP}/{playerMaxHP}</span>
                  </div>
                  <div className="h-4 bg-stone-950 border border-red-900 relative overflow-hidden" style={{ borderRadius: '0' }}>
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                      style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}
                    />
                  </div>
                </div>
                
                <h3 className="text-base font-bold text-red-400 text-center mb-2" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>
                  {bossName}
                </h3>
                
                {/* Boss HP Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ fontFamily: 'monospace' }}>
                    <span className="text-purple-400">💀 BOSS HP</span>
                    <span className="text-purple-300">{bossHP}/{bossMaxHP}</span>
                  </div>
                  <div className="h-6 bg-stone-950 border-2 border-purple-900 relative overflow-hidden" style={{ borderRadius: '0' }}>
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
                      style={{ width: `${(bossHP / bossMaxHP) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>
                        {Math.floor((bossHP / bossMaxHP) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* PixiJS Boss Display */}
                <div className="relative">
                  <div ref={pixiContainer} className="w-full bg-stone-950 border-2 border-red-800 relative overflow-hidden" style={{ borderRadius: '0', height: '250px' }}>
                    {/* Turn Indicator Overlay */}
                    {!battleEnded && currentAction && (
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                        <div className={`px-4 py-2 border-4 font-bold ${turn === 'player' ? 'bg-blue-700 border-blue-500' : 'bg-red-700 border-red-500'} text-white animate-pulse`} style={{ borderRadius: '0', fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                          {currentAction}
                        </div>
                      </div>
                    )}
                    
                    {/* Battle End Overlay */}
                    {battleEnded && currentAction && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                        <div className={`text-4xl font-bold ${winner === 'player' ? 'text-green-400' : 'text-red-400'} animate-bounce`} style={{ fontFamily: 'monospace', textShadow: '3px 3px 0 #000' }}>
                          {currentAction}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Effects */}
                  {bossEffects.length > 0 && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {bossEffects.map((effect, idx) => (
                        <div key={idx} className="bg-black/80 border border-amber-600 px-2 py-1" style={{ borderRadius: '0' }}>
                          <span className="text-xs font-bold" style={{ fontFamily: 'monospace' }}>
                            {effect.type === 'burn' && '🔥'}
                            {effect.type === 'poison' && '☠️'}
                            {effect.type === 'slow' && '❄️'}
                            {effect.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Log */}
        <div className="bg-stone-900 border-2 border-amber-700 p-2 mb-2 h-14 overflow-y-auto" style={{ borderRadius: '0', boxShadow: '0 2px 0 #78350f' }}>
          <div className="space-y-1">
            {combatLog.map((log, i) => (
              <div key={i} className="text-xs sm:text-sm text-amber-200" style={{ fontFamily: 'monospace' }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {!battleEnded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
            <button
              onClick={handleNormalAttack}
              disabled={turn !== 'player' || actionInProgress}
              className="py-2 sm:py-3 md:py-4 bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #991b1b', textShadow: '1px 1px 0 #000' }}
            >
              <Sword className="inline mr-1" size={16} />
              <span className="hidden xs:inline">ATTACK</span>
              <span className="xs:hidden">ATK</span>
            </button>
            
            <button
              onClick={handleDefend}
              disabled={turn !== 'player' || actionInProgress}
              className="py-2 sm:py-3 md:py-4 bg-blue-700 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #1e40af', textShadow: '1px 1px 0 #000' }}
            >
              <Shield className="inline mr-1" size={16} />
              <span className="hidden xs:inline">DEFEND</span>
              <span className="xs:hidden">DEF</span>
            </button>

            {fireAttack > 0 && (
              <button
                onClick={handleFireAttack}
                disabled={turn !== 'player' || actionInProgress}
                className="py-2 sm:py-3 md:py-4 bg-orange-700 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #c2410c', textShadow: '1px 1px 0 #000' }}
              >
                <Flame className="inline mr-1" size={16} />
                🔥
              </button>
            )}

            {iceAttack > 0 && (
              <button
                onClick={handleIceAttack}
                disabled={turn !== 'player' || actionInProgress}
                className="py-2 sm:py-3 md:py-4 bg-cyan-700 hover:bg-cyan-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #0e7490', textShadow: '1px 1px 0 #000' }}
              >
                <Droplet className="inline mr-1" size={16} />
                ❄️
              </button>
            )}

            {lightningAttack > 0 && (
              <button
                onClick={handleLightningAttack}
                disabled={turn !== 'player' || actionInProgress}
                className="py-2 sm:py-3 md:py-4 bg-yellow-700 hover:bg-yellow-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #a16207', textShadow: '1px 1px 0 #000' }}
              >
                <Zap className="inline mr-1" size={16} />
                ⚡
              </button>
            )}

            {poisonAttack > 0 && (
              <button
                onClick={handlePoisonAttack}
                disabled={turn !== 'player' || actionInProgress}
                className="py-2 sm:py-3 md:py-4 bg-purple-700 hover:bg-purple-600 text-white text-xs sm:text-sm font-bold border-2 sm:border-4 border-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 3px 0 #6b21a8', textShadow: '1px 1px 0 #000' }}
              >
                <Skull className="inline mr-1" size={16} />
                ☠️
              </button>
            )}
          </div>
        ) : null}

        {/* Victory Screen */}
        {showVictoryScreen && victoryRewards && winner === 'player' && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="bg-stone-900 border-4 border-amber-600 p-6 max-w-md w-full mx-4" style={{ borderRadius: '0', boxShadow: '0 6px 0 #92400e' }}>
              <h2 className="text-3xl font-bold text-center text-amber-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                🎉 VICTORY! 🎉
              </h2>
              
              <div className="bg-stone-800 border-2 border-stone-600 p-4 mb-4" style={{ borderRadius: '0' }}>
                <h3 className="text-lg font-bold text-amber-300 mb-3" style={{ fontFamily: 'monospace' }}>REWARDS:</h3>
                
                {/* XP & Gold */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm" style={{ fontFamily: 'monospace' }}>
                    <span className="text-purple-400">⭐ Experience:</span>
                    <span className="text-purple-300 font-bold">+{victoryRewards.xp} XP</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ fontFamily: 'monospace' }}>
                    <span className="text-yellow-400">💰 Gold:</span>
                    <span className="text-yellow-300 font-bold">+{victoryRewards.gold}g</span>
                  </div>
                </div>
                
                {/* Items */}
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>ITEMS:</h4>
                  {victoryRewards.items.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-300 mb-1" style={{ fontFamily: 'monospace' }}>
                      • {item.name} x{item.quantity}
                    </div>
                  ))}
                </div>
                
                {/* Gems */}
                {victoryRewards.gems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-pink-300 mb-2" style={{ fontFamily: 'monospace' }}>GEMS:</h4>
                    {victoryRewards.gems.map((gem: any, idx: number) => (
                      <div key={idx} className="text-xs text-pink-200 mb-1" style={{ fontFamily: 'monospace' }}>
                        💎 {gem.name} x{gem.quantity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  onComplete(true, playerHP, victoryRewards);
                  onClose();
                }}
                className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold border-4 border-green-500 transition"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 4px 0 #15803d', textShadow: '1px 1px 0 #000' }}
              >
                CLAIM REWARDS
              </button>
            </div>
          </div>
        )}
        
        {/* Defeat Screen */}
        {battleEnded && winner === 'boss' && !showVictoryScreen && (
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="py-3 px-8 bg-red-700 hover:bg-red-600 text-white font-bold border-4 border-red-500 transition"
              style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 4px 0 #991b1b', textShadow: '1px 1px 0 #000' }}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 transition"
          style={{ borderRadius: '0' }}
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }
        .animate-float-up {
          animation: floatUp 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
