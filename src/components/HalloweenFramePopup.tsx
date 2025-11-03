import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function HalloweenFramePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this popup
    const hasSeen = localStorage.getItem('folkhart_halloween_frame_popup_seen');
    
    if (!hasSeen) {
      // Show popup after a delay (wait for daily login popup to show first)
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // 3 seconds delay to show after daily login

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Mark as seen permanently
    localStorage.setItem('folkhart_halloween_frame_popup_seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div 
        className="bg-stone-800 border-4 border-orange-600 p-6 max-w-md w-full relative"
        style={{ 
          borderRadius: '0', 
          boxShadow: '0 8px 0 rgba(0,0,0,0.5), 0 0 20px rgba(234, 88, 12, 0.5)' 
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-orange-400 hover:text-orange-300 transition"
        >
          <X size={28} strokeWidth={3} />
        </button>

        {/* Title */}
        <h2 
          className="text-3xl font-bold text-orange-400 mb-4 text-center"
          style={{ 
            fontFamily: 'monospace', 
            textShadow: '2px 2px 0 #000, 0 0 10px rgba(251, 146, 60, 0.5)' 
          }}
        >
          🎃 HALLOWEEN EVENT! 🎃
        </h2>

        {/* Frame Image Preview */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src="/assets/ui/avatar_frames/48x48/event_halloween.png"
              alt="Halloween Frame"
              className="w-32 h-32"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-6">
          <p 
            className="text-xl font-bold text-orange-300 mb-2"
            style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}
          >
            FREE HALLOWEEN FRAME!
          </p>
          <p 
            className="text-sm text-gray-300"
            style={{ fontFamily: 'monospace' }}
          >
            A special Halloween avatar frame has been added to your collection!
            <br />
            <br />
            Equip it from your Character Panel → Avatar Settings
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold transition"
          style={{
            borderRadius: '0',
            border: '2px solid #ea580c',
            boxShadow: '0 2px 0 #9a3412, inset 0 1px 0 rgba(255,255,255,0.2)',
            textShadow: '1px 1px 0 #000',
            fontFamily: 'monospace',
          }}
        >
          🎃 CLAIM FRAME 🎃
        </button>
      </div>
    </div>
  );
}
