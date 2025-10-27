import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/ui/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    emailOrUsername: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      let payload: any;
      if (isLogin) {
        // For login, check if input is email or username
        const input = formData.emailOrUsername;
        const isEmail = input.includes('@');
        payload = {
          [isEmail ? 'email' : 'username']: input,
          password: formData.password
        };
      } else {
        // For register, use all fields
        payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password
        };
      }

      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/game');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-amber-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Medieval Texture Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(217, 119, 6, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217, 119, 6, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-400 opacity-50 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-slow">
          <img 
            src={logo} 
            alt="Folkhart" 
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 pixelated drop-shadow-2xl"
            style={{ imageRendering: 'pixelated' }}
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-400 retro-text mb-2 tracking-wider drop-shadow-lg">
            FOLKHART
          </h1>
          <p className="text-amber-200 text-xs sm:text-sm retro-text tracking-widest">
            ⚔️ COZY FANTASY RPG ⚔️
          </p>
        </div>

        {/* Game Window */}
        <div className="retro-window bg-stone-800 border-4 border-amber-700 shadow-2xl">
          {/* Window Title Bar */}
          <div className="bg-amber-700 px-4 py-2 border-b-4 border-amber-800 flex items-center justify-between">
            <span className="text-white font-bold retro-text text-sm tracking-wider">
              {isLogin ? '🎮 LOGIN' : '✨ REGISTER'}
            </span>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-amber-400 border border-amber-600"></div>
              <div className="w-3 h-3 bg-green-600 border border-green-800"></div>
              <div className="w-3 h-3 bg-red-700 border border-red-900"></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLogin ? (
                <div>
                  <label className="block text-amber-300 text-sm font-bold mb-2 retro-text">
                    EMAIL OR USERNAME
                  </label>
                  <input
                    type="text"
                    value={formData.emailOrUsername}
                    onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
                    className="retro-input w-full px-4 py-3 bg-stone-900 border-2 border-amber-600 text-white focus:border-amber-400 focus:outline-none"
                    required
                    placeholder="hero@mail.com or HERO_NAME"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-amber-300 text-sm font-bold mb-2 retro-text">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="retro-input w-full px-4 py-3 bg-stone-900 border-2 border-amber-600 text-white focus:border-amber-400 focus:outline-none"
                      required
                      placeholder="HERO_NAME"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 text-sm font-bold mb-2 retro-text">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="retro-input w-full px-4 py-3 bg-stone-900 border-2 border-amber-600 text-white focus:border-amber-400 focus:outline-none"
                      required
                      placeholder="hero@folkhart.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-amber-300 text-sm font-bold mb-2 retro-text">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="retro-input w-full px-4 py-3 bg-stone-900 border-2 border-amber-600 text-white focus:border-amber-400 focus:outline-none"
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-900 border-2 border-red-600 text-red-200 px-4 py-2 retro-text text-sm">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="retro-button w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 text-white font-bold border-4 border-amber-800 hover:from-amber-600 hover:to-amber-500 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '⏳ LOADING...' : isLogin ? '🎮 START GAME' : '✨ CREATE HERO'}
              </button>
            </form>

            {/* Toggle Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-amber-300 hover:text-amber-100 retro-text text-sm underline"
              >
                {isLogin ? '✨ CREATE NEW ACCOUNT' : '🎮 ALREADY HAVE ACCOUNT?'}
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-stone-800 border-2 border-amber-700 p-3">
            <div className="text-2xl mb-1">⚔️</div>
            <div className="text-amber-300 text-xs retro-text">EPIC BATTLES</div>
          </div>
          <div className="bg-stone-800 border-2 border-amber-700 p-3">
            <div className="text-2xl mb-1">🏰</div>
            <div className="text-amber-300 text-xs retro-text">DUNGEONS</div>
          </div>
          <div className="bg-stone-800 border-2 border-amber-700 p-3">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-amber-300 text-xs retro-text">GUILDS</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-amber-400 text-xs retro-text">
          © 2025 FOLKHART • PRESS START TO PLAY
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .retro-text {
          font-family: 'Press Start 2P', cursive;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
        }

        .retro-window {
          box-shadow: 
            0 0 0 4px rgba(217, 119, 6, 0.5),
            0 0 20px rgba(217, 119, 6, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .retro-input {
          font-family: 'Press Start 2P', cursive;
          font-size: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .retro-button {
          font-family: 'Press Start 2P', cursive;
          font-size: 14px;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
          box-shadow: 
            0 4px 0 rgba(0, 0, 0, 0.3),
            0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .retro-button:active {
          transform: translateY(2px);
          box-shadow: 
            0 2px 0 rgba(0, 0, 0, 0.3),
            0 4px 10px rgba(0, 0, 0, 0.4);
        }

        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
