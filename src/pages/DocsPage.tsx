import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import DocsTab from '@/components/tabs/DocsTab';

export default function DocsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <div className="bg-stone-800 border-b-2 border-stone-700 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">⚔️ Folkhart Documentation</h1>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold transition"
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: '0 2px 0 #b45309',
            textShadow: '1px 1px 0 #000',
            fontFamily: 'monospace',
          }}
        >
          <Home size={18} />
          Home
        </button>
      </div>

      {/* Docs Content */}
      <DocsTab />

      {/* Footer */}
      <div className="bg-stone-800 border-t-2 border-stone-700 p-4 text-center text-sm text-gray-400">
        <p>Made with 💖 for cozy gaming</p>
        <p className="mt-1">© 2024 Folkhart</p>
      </div>
    </div>
  );
}
