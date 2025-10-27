import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';

export function formatGold(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatTimeRemaining(endDate: string | Date): string {
  const end = new Date(endDate);
  const now = new Date();
  
  if (end <= now) {
    return 'Ready!';
  }

  const duration = intervalToDuration({ start: now, end });
  
  if (duration.hours && duration.hours > 0) {
    return `${duration.hours}h ${duration.minutes || 0}m`;
  }
  
  if (duration.minutes && duration.minutes > 0) {
    return `${duration.minutes}m ${duration.seconds || 0}s`;
  }
  
  return `${duration.seconds || 0}s`;
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: 'text-gray-400',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-orange-400',
  };
  return colors[rarity] || 'text-gray-400';
}

export function getRarityBorder(rarity: string): string {
  const borders: Record<string, string> = {
    Common: 'border-gray-500',
    Uncommon: 'border-green-500',
    Rare: 'border-blue-500',
    Epic: 'border-purple-500',
    Legendary: 'border-orange-500',
  };
  return borders[rarity] || 'border-gray-500';
}

export function getClassIcon(className: string): string {
  const icons: Record<string, string> = {
    Warrior: '⚔️',
    Mage: '🔮',
    Ranger: '🏹',
    Cleric: '✨',
    Rogue: '🗡️',
  };
  return icons[className] || '⚔️';
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    Easy: 'text-green-400',
    Normal: 'text-yellow-400',
    Hard: 'text-orange-400',
    Nightmare: 'text-red-400',
  };
  return colors[difficulty] || 'text-gray-400';
}
