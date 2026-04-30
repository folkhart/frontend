import { useState } from 'react';

interface FramedAvatarProps {
  src: string;
  alt: string;
  frame?: string;
  size?: 'small' | 'large'; // small = 32px (chat), large = 64px (topbar)
  className?: string;
  onClick?: () => void;
  borderColor?: string;
}

export default function FramedAvatar({
  src,
  alt,
  frame = 'default',
  size = 'small',
  className = '',
  onClick,
  borderColor = 'border-amber-500',
}: FramedAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = size === 'small' ? 'w-8 h-8' : 'w-16 h-16';
  const containerSize = size === 'small' ? 'w-12 h-12' : 'w-24 h-24';

  return (
    <div
      className={`relative ${containerSize} flex items-center justify-center ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Avatar Background/Border */}
      <div
        className={`absolute inset-0 flex items-center justify-center border-2 ${borderColor} overflow-hidden bg-stone-900`}
        style={{
          borderRadius: '0',
        }}
      >
        <div className={`${sizeClasses} flex items-center justify-center`}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImageError(true)}
          />
        </div>
      </div>

      {/* Avatar Frame Overlay */}
      {!imageError && (
        <img
          src={`/assets/ui/avatar_frames/48x48/${frame}.png`}
          alt="Frame"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            imageRendering: 'pixelated',
            zIndex: 10,
          }}
          onError={(e) => {
            // Fallback to default frame if frame image doesn't exist
            if ((e.target as HTMLImageElement).src.includes(frame)) {
              (e.target as HTMLImageElement).src =
                '/assets/ui/avatar_frames/48x48/default.png';
            }
          }}
        />
      )}
    </div>
  );
}
