import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useGameStore((state) => state.setAuth);
  
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login(emailOrUsername, password);
      setAuth(data.accessToken, data.refreshToken);
      
      // Store login timestamp for version check
      localStorage.setItem('lastLoginTime', Date.now().toString());
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-stone-900 to-stone-800">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧁</div>
          <h1 className="text-3xl font-bold text-amber-500 mb-2">Folkhart</h1>
          <p className="text-gray-400 text-sm">A Cozy Fantasy Adventure</p>
        </div>

        <div className="bg-stone-800 rounded-lg p-6 border-2 border-stone-700">
          <h2 className="text-xl font-bold text-white mb-4">Login</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email or Username
              </label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed btn-press"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-amber-500 hover:text-amber-400 text-sm">
              Don't have an account? Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
