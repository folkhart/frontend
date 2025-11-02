import { useState, useEffect } from "react";
import { X } from "lucide-react";
import DailyLoginCalendar from "./DailyLoginCalendar";

export default function DailyLoginPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup should show on login
    const checkShouldShow = () => {
      const dontShowToday = localStorage.getItem('folkhart_daily_login_popup_hide');
      
      if (dontShowToday) {
        const hideDate = new Date(parseInt(dontShowToday));
        const now = new Date();
        
        // Check if it's a different day
        if (
          hideDate.getDate() === now.getDate() &&
          hideDate.getMonth() === now.getMonth() &&
          hideDate.getFullYear() === now.getFullYear()
        ) {
          return false; // Don't show today
        }
      }
      
      return true; // Show popup
    };

    // Show popup after a short delay on component mount
    const timer = setTimeout(() => {
      if (checkShouldShow()) {
        setIsOpen(true);
      }
    }, 1000); // 1 second delay after login

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowToday = () => {
    localStorage.setItem('folkhart_daily_login_popup_hide', Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative bg-stone-900 border-4 border-amber-600 max-w-2xl w-full animate-bounce-in" style={{ borderRadius: '0', boxShadow: '0 8px 0 #78350f, 0 0 40px rgba(251, 191, 36, 0.4)' }}>
        {/* Header */}
        <div className="bg-amber-600 px-6 py-4 border-b-4 border-amber-700 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
            🎁 DAILY LOGIN REWARDS
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-amber-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <DailyLoginCalendar />
          
          {/* Buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold border-4 border-blue-800 hover:from-blue-600 hover:to-blue-500 transform hover:scale-105 transition-all"
              style={{ 
                fontFamily: 'monospace', 
                borderRadius: '0',
                textShadow: '1px 1px 0 #000',
                boxShadow: '0 3px 0 #1e40af'
              }}
            >
              ✓ GOT IT!
            </button>

            <button
              onClick={handleDontShowToday}
              className="w-full py-2 bg-stone-700 text-amber-300 font-bold border-2 border-stone-600 hover:bg-stone-600 transition-all"
              style={{ 
                fontFamily: 'monospace', 
                borderRadius: '0',
                textShadow: '1px 1px 0 #000'
              }}
            >
              ❌ DON'T SHOW ME TODAY
            </button>
          </div>

          <p className="text-amber-600 text-xs text-center mt-3" style={{ fontFamily: 'monospace' }}>
            Popup will appear again tomorrow
          </p>
        </div>
      </div>
    </div>
  );
}
