import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function NotificationToast({
  type,
  title,
  message,
  onClose,
  duration = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-900/90 border-green-600',
    error: 'bg-red-900/90 border-red-600',
    info: 'bg-blue-900/90 border-blue-600',
  }[type];

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 slide-up">
      <div className={`${bgColor} border-2 rounded-lg p-4 shadow-lg min-w-[300px] max-w-[90vw]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-200">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
