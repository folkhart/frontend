import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingTextProps {
  id: number;
  text: string;
  color: string;
  onComplete: (id: number) => void;
}

export default function FloatingText({ id, text, color, onComplete }: FloatingTextProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -100, scale: 1.2 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed pointer-events-none z-[100] font-bold text-2xl retro-text"
      style={{ 
        color, 
        textShadow: '2px 2px 0 #000',
        left: '50%',
        top: '60%',
        transform: 'translateX(-50%)'
      }}
    >
      {text}
    </motion.div>
  );
}

export function useFloatingText() {
  const [effects, setEffects] = useState<{ id: number; text: string; color: string }[]>([]);

  const addEffect = (text: string, color: string) => {
    setEffects((prev) => [...prev, { id: Date.now(), text, color }]);
  };

  const removeEffect = (id: number) => {
    setEffects((prev) => prev.filter((eff) => eff.id !== id));
  };

  return { effects, addEffect, removeEffect };
}
