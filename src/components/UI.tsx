import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, PlayCircle, ShoppingCart, Settings, Terminal, Cpu, LogOut, Shield, User, X } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const setAuth = useStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { username, password } : { username, password, email };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/90 backdrop-blur-md p-10 rounded-3xl border-4 border-green-500 w-full max-w-sm pointer-events-auto"
    >
      <h2 className="text-3xl font-mono font-black text-green-500 mb-6 uppercase text-center">
        {isLogin ? 'AUTH_SIGN_IN' : 'AUTH_SIGN_UP'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          className="bg-black border-2 border-green-900 rounded-xl px-4 py-3 text-green-400 font-mono outline-none focus:border-green-500"
          placeholder="USERNAME"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        {!isLogin && (
          <input 
            className="bg-black border-2 border-green-900 rounded-xl px-4 py-3 text-green-400 font-mono outline-none focus:border-green-500"
            placeholder="EMAIL_ADDRESS"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        )}
        <input 
          type="password"
          className="bg-black border-2 border-green-900 rounded-xl px-4 py-3 text-green-400 font-mono outline-none focus:border-green-500"
          placeholder="SECRET_PASSWORD"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 font-mono text-xs text-center">{error}</p>}
        <button className="bg-green-500 text-black font-mono font-black py-4 rounded-xl shadow-lg hover:bg-green-400 transition-all">
          {isLogin ? 'EXECUTE_LOGIN()' : 'CREATE_ACCOUNT()'}
        </button>
      </form>
      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="text-green-800 font-mono text-xs mt-6 w-full hover:text-green-500 transition-all underline"
      >
        {isLogin ? 'NEED_AN_ACCOUNT?_REGISTER' : 'ALREADY_HAVE_ONE?_LOGIN'}
      </button>
    </motion.div>
  );
}

function AdminView() {
  const token = useStore(state => state.token);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const status = useStore(state => state.status);
  const closeShop = useStore(state => state.closeShop);

  const fetchUsers = async () => {
    const res = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setUsers(data);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (res.ok) setSettings(data);
  };

  useEffect(() => {
    if (status === 'admin') {
      fetchUsers();
      fetchSettings();
    }
  }, [status]);

  const toggleBan = async (id: string) => {
    await fetch(`/api/users/${id}/ban`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchUsers();
  };

  const updateSettings = async (updates: any) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (res.ok) setSettings(data);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('EXTERMINATE_USER?')) return;
    await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchUsers();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-4 bg-black/95 backdrop-blur-xl rounded-3xl border-4 border-red-900 p-8 flex flex-col pointer-events-auto z-50 overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-mono font-black text-red-500 uppercase flex items-center gap-3">
          <Shield className="w-8 h-8" />
          OVERSEER_DASHBOARD
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl font-mono text-sm border-2 transition-all ${activeTab === 'users' ? 'bg-red-500 text-black border-red-500' : 'text-red-500 border-red-900 hover:bg-red-900/20'}`}
          >
            USER_INDEX
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-xl font-mono text-sm border-2 transition-all ${activeTab === 'settings' ? 'bg-red-500 text-black border-red-500' : 'text-red-500 border-red-900 hover:bg-red-900/20'}`}
          >
            GAME_CONFIG
          </button>
        </div>
        <button onClick={closeShop} className="bg-red-500 p-2 rounded-xl hover:bg-red-400 transition-all">
          <X className="w-8 h-8 text-black" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'users' ? (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-red-800 border-b border-red-900">
                <th className="pb-4">USERNAME</th>
                <th className="pb-4">ROLE</th>
                <th className="pb-4">SKILLS</th>
                <th className="pb-4">STATUS</th>
                <th className="pb-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-red-400">
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-red-900/30 hover:bg-red-500/5">
                  <td className="py-4">{u.username}</td>
                  <td className="py-4 uppercase text-[10px]">{u.role}</td>
                  <td className="py-4">{u.skills}</td>
                  <td className="py-4">
                    <span className={u.isBanned ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {u.isBanned ? 'BANNED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button 
                      onClick={() => toggleBan(u.id)}
                      className="p-2 border border-red-900 rounded hover:bg-red-900 transition-colors"
                    >
                      {u.isBanned ? 'UNBAN' : 'BAN'}
                    </button>
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="p-2 bg-red-900 text-black hover:bg-red-600 transition-all rounded"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="max-w-2xl mx-auto py-10 flex flex-col gap-8">
            {settings && (
              <>
                <div className="space-y-4">
                  <label className="text-red-500 font-mono text-lg block uppercase font-black">Base Game Speed ({settings.baseSpeed})</label>
                  <input 
                    type="range" min="10" max="30" step="0.5"
                    className="w-full h-4 bg-red-900/30 rounded-full appearance-none cursor-pointer"
                    value={settings.baseSpeed}
                    onChange={(e) => updateSettings({ baseSpeed: parseFloat(e.target.value) })}
                  />
                  <p className="text-red-800 text-xs font-mono">Adjusts the initial velocity of the player and obstacles.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-red-500 font-mono text-lg block uppercase font-black">Spawn Probability ({settings.spawnRate})</label>
                  <input 
                    type="range" min="0.2" max="1.5" step="0.1"
                    className="w-full h-4 bg-red-900/30 rounded-full appearance-none cursor-pointer"
                    value={settings.spawnRate}
                    onChange={(e) => updateSettings({ spawnRate: parseFloat(e.target.value) })}
                  />
                  <p className="text-red-800 text-xs font-mono">Higher values mean more frequent obstacle generation.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-red-500 font-mono text-lg block uppercase font-black">Difficulty Scaling ({settings.difficultyMultiplier})</label>
                  <input 
                    type="range" min="1.0" max="1.5" step="0.05"
                    className="w-full h-4 bg-red-900/30 rounded-full appearance-none cursor-pointer"
                    value={settings.difficultyMultiplier}
                    onChange={(e) => updateSettings({ difficultyMultiplier: parseFloat(e.target.value) })}
                  />
                  <p className="text-red-800 text-xs font-mono">Affects how fast the speed increases over distance.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Leaderboard({ submitted }: { submitted: boolean }) {
  const [entries, setEntries] = useState<{ name: string; score: number; character: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Leaderboard fetch error:", err);
        setLoading(false);
      });
  }, [submitted]); // Refetch if new score submitted

  if (loading) return <div className="text-green-500 font-mono text-sm animate-pulse mb-4">FETCHING_DATA...</div>;

  return (
    <div className="w-full bg-black/50 rounded-xl p-3 mb-4 border border-green-900 max-h-40 overflow-y-auto">
      <h3 className="text-green-500 font-mono text-[10px] uppercase mb-2 text-left opacity-50 font-bold tracking-widest">Global Standings</h3>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div key={i} className="flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-3">{i + 1}.</span>
              <span className="text-green-400 font-bold">{entry.name}</span>
            </div>
            <span className="text-yellow-500 font-black">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UI() {
  const status = useStore(state => state.status);
  const score = useStore(state => state.score);
  const skills = useStore(state => state.skills);
  const multiplier = useStore(state => state.multiplier);
  const magnetTime = useStore(state => state.powerups.magnet);
  const multiplierTime = useStore(state => state.powerups.multiplier);
  const jetpackTime = useStore(state => state.powerups.jetpack);
  
  const character = useStore(state => state.character);
  const unlockedCharacters = useStore(state => state.unlockedCharacters);
  const unlockCharacter = useStore(state => state.unlockCharacter);
  const startGame = useStore(state => state.startGame);
  const restart = useStore(state => state.restart);
  const pauseGame = useStore(state => state.pauseGame);
  const resumeGame = useStore(state => state.resumeGame);
  const openShop = useStore(state => state.openShop);
  const closeShop = useStore(state => state.closeShop);
  const setCharacter = useStore(state => state.setCharacter);
  const logout = useStore(state => state.logout);
  const openAdmin = useStore(state => state.openAdmin);
  const user = useStore(state => state.user);
  const token = useStore(state => state.token);
  const setAuth = useStore(state => state.setAuth);
  const setGameSettings = useStore(state => state.setGameSettings);
  
  const [playerName, setPlayerName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Socket Connection and Global Listeners
  useEffect(() => {
    const s = io();
    s.on('settings_update', (newSettings) => {
      setGameSettings(newSettings);
    });
    return () => { s.disconnect(); };
  }, []);

  // Auto-login if token exists
  useEffect(() => {
    if (token && !user) {
      fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) setAuth(data, token);
        else logout();
      })
      .catch(() => logout());
    }
  }, []);

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score: skills, character })
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Score submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characters = [
    { id: 'boy', name: 'Hero', color: 'bg-green-800', cost: 0 },
    { id: 'nerd', name: 'The Dev', color: 'bg-green-800', cost: 0 },
    { id: 'bot', name: 'R.O.B.O', color: 'bg-orange-800', cost: 50 },
    { id: 'glitch', name: 'GLITCH', color: 'bg-red-900', cost: 150 },
    { id: 'nexus', name: 'NEXUS', color: 'bg-blue-600', cost: 300 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* Auth Gate */}
      <AnimatePresence>
        {status === 'auth' && <AuthView />}
      </AnimatePresence>

      {/* Admin Dashboard */}
      <AnimatePresence>
        {status === 'admin' && <AdminView />}
      </AnimatePresence>

      {/* Profile Bar - Menu Only */}
      <AnimatePresence>
        {status === 'menu' && user && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 flex flex-col items-start pointer-events-auto gap-2"
          >
            <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border-2 border-green-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black font-black">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-green-500 font-mono text-xs font-black">{user.username}</p>
                <p className="text-green-900 font-mono text-[10px] uppercase">{user.role}</p>
              </div>
              <button 
                onClick={logout}
                className="ml-4 p-2 bg-red-900/20 hover:bg-red-900 text-red-500 hover:text-black rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            {user.role === 'admin' && (
              <button 
                onClick={openAdmin}
                className="bg-red-900 hover:bg-red-600 text-black font-mono font-black py-2 px-4 rounded-xl flex items-center gap-2 transition-all text-xs"
              >
                <Shield className="w-4 h-4" />
                OVERSEER_CONSOLE
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD - Playing status */}
      <AnimatePresence>
        {status === 'playing' && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto"
          >
            <div className="flex gap-3">
              <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border-2 border-green-500 flex items-center space-x-2">
                <Trophy className="text-yellow-400 w-5 h-5" />
                <span className="text-xl font-mono font-black text-green-400 tracking-tight">{Math.floor(score)}</span>
              </div>
              <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border-2 border-green-500 flex items-center space-x-2">
                <Terminal className="text-green-400 w-5 h-5" />
                <span className="text-xl font-mono font-black text-green-400 tracking-tight">{skills} SKILLS</span>
              </div>
              {multiplier > 1 && (
                <div className="bg-yellow-500 px-4 py-3 rounded-xl shadow-lg border-b-4 border-yellow-700 flex items-center space-x-2 animate-bounce">
                  <span className="text-xl font-mono font-black text-black">2X</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              <button onClick={pauseGame} className="bg-green-500 hover:bg-green-400 p-3 rounded-xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all">
                <Pause className="w-8 h-8 text-black" />
              </button>
              
              {/* Powerup Timers */}
              <div className="flex flex-col gap-1 w-32">
                {magnetTime > 0 && (
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-red-500">
                    <motion.div 
                      className="h-full bg-red-500" 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(magnetTime / 10) * 100}%` }}
                    />
                  </div>
                )}
                {multiplierTime > 0 && (
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-yellow-500">
                    <motion.div 
                      className="h-full bg-yellow-500" 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(multiplierTime / 10) * 100}%` }}
                    />
                  </div>
                )}
                {jetpackTime > 0 && (
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-green-500">
                    <motion.div 
                      className="h-full bg-green-500" 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(jetpackTime / 10) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === 'paused' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-black/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-4 border-b-8 border-green-500 flex flex-col items-center text-center pointer-events-auto max-w-sm w-full mx-4"
          >
            <h2 className="text-4xl font-mono font-black text-green-500 mb-8 uppercase tracking-tight">System Halted</h2>
            
            <button 
              onClick={resumeGame}
              className="w-full bg-green-500 hover:bg-green-400 text-black text-2xl font-bold py-4 px-8 rounded-2xl shadow-lg border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all flex justify-center items-center space-x-2 font-mono"
            >
              <span>CONTINUE_JOB()</span>
              <PlayCircle className="fill-current w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Menu */}
      <AnimatePresence>
        {status === 'menu' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-black/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-4 border-b-8 border-green-500 flex flex-col items-center text-center pointer-events-auto max-w-sm w-full mx-4"
          >
            <div className="bg-green-500 p-4 rounded-3xl mb-6 shadow-inner">
               <h1 className="text-5xl font-mono font-black text-black italic leading-tight">ROOT_RUNNER<br/>V1.0</h1>
            </div>
            
            <p className="text-green-300 font-mono mb-8 brightness-125">Collect SKILLS. Avoid TRAINS.<br/>Compile your future.</p>

            <div className="flex gap-4 w-full mb-4 font-mono">
              <button 
                onClick={openShop}
                className="flex-1 bg-green-800 hover:bg-green-700 text-green-400 font-bold py-3 px-4 rounded-xl shadow-lg border-b-4 border-green-950 active:border-b-0 active:translate-y-1 transition-all flex justify-center items-center space-x-2"
              >
                <Cpu className="w-5 h-5" />
                <span>AVATAR</span>
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-green-400 font-bold py-3 px-4 rounded-xl shadow-lg border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all flex justify-center items-center font-mono">
                <Settings className="w-6 h-6" />
              </button>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-green-500 hover:bg-green-400 text-black text-3xl font-mono font-black py-5 px-8 rounded-2xl shadow-xl border-b-[10px] border-green-800 active:border-b-0 active:translate-y-[10px] transition-all flex justify-center items-center space-x-2 uppercase tracking-wide"
            >
              <span>EXECUTE()</span>
              <Play className="fill-current w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Menu */}
      <AnimatePresence>
        {status === 'shop' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-black/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-b-8 border-green-500 flex flex-col items-center text-center pointer-events-auto max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between w-full mb-6 px-2">
               <h2 className="text-3xl font-mono font-black text-green-500 uppercase tracking-tight">Characters</h2>
               <div className="bg-green-900/50 px-3 py-1 rounded-full border border-green-500 flex items-center space-x-2">
                  <Terminal className="text-green-400 w-4 h-4" />
                  <span className="text-green-400 font-mono font-bold">{skills}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 w-full mb-8 max-h-[300px] overflow-y-auto pr-1">
              {characters.map((char) => {
                const isUnlocked = unlockedCharacters.includes(char.id);
                const isSelected = character === char.id;
                
                return (
                  <button 
                    key={char.id}
                    onClick={async () => {
                      if (isUnlocked) {
                        const res = await fetch('/api/users/character', {
                          method: 'PATCH',
                          headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ character: char.id })
                        });
                        if (res.ok) setCharacter(char.id as any);
                      } else {
                        unlockCharacter(char.id as any, char.cost);
                      }
                    }}
                    className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center ${
                      isSelected 
                        ? 'border-green-400 bg-green-500/20' 
                        : isUnlocked 
                          ? 'border-gray-700 hover:border-green-600' 
                          : 'border-yellow-900 bg-black/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full mb-1 border relative overflow-hidden ${char.color} ${!isUnlocked && 'grayscale opacity-50'}`}>
                       {char.id === 'nerd' && <div className="absolute inset-x-1 top-3 h-0.5 bg-black"></div>}
                       {char.id === 'bot' && <div className="absolute inset-0 bg-orange-500 opacity-30"></div>}
                       {char.id === 'nexus' && <div className="absolute inset-0 bg-blue-300 opacity-50 animate-pulse"></div>}
                    </div>
                    <span className="text-[10px] font-bold text-green-500 uppercase truncate w-full text-center">
                      {char.name}
                    </span>
                    {!isUnlocked && (
                      <div className="flex items-center space-x-1 text-[9px] text-yellow-500 mt-1">
                         <Terminal className="w-2 h-2" />
                         <span>{char.cost}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={closeShop}
              className="w-full bg-gray-800 hover:bg-gray-700 text-green-500 text-xl font-bold py-4 px-8 rounded-2xl shadow-lg border-b-8 border-black active:border-b-0 active:translate-y-2 transition-all flex justify-center items-center font-mono"
            >
              <span>EXIT_SHOP()</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {status === 'gameover' && (
          <motion.div 
             initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-black/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-4 border-b-8 border-red-500 flex flex-col items-center text-center pointer-events-auto max-w-sm w-full mx-4"
          >
            <h2 className="text-4xl font-mono font-black text-red-500 mb-2 uppercase tracking-tight">GAME OVER</h2>
            
            <div className="bg-gray-900 w-full rounded-2xl p-6 mb-4 border-2 border-red-500">
               <span className="block text-red-400 font-mono font-bold uppercase tracking-wider text-sm mb-1">TOTAL SKILLS</span>
               <span className="text-5xl font-mono font-black text-green-500 flex items-center justify-center">
                  <Terminal className="w-8 h-8 mr-2" />
                  {skills}
               </span>
            </div>

            {/* Score Submission */}
            {!isSubmitted ? (
               <div className="w-full flex flex-col gap-2 mb-4 pointer-events-auto">
                 <input 
                   type="text" 
                   placeholder="ENTER_NAME..." 
                   className="bg-black/50 border-2 border-green-500 rounded-xl px-4 py-2 text-green-400 font-mono outline-none focus:bg-black/80 transition-all text-center"
                   value={playerName}
                   onChange={(e) => setPlayerName(e.target.value)}
                   maxLength={15}
                 />
                 <button 
                   onClick={handleSubmitScore}
                   disabled={!playerName.trim() || isSubmitting}
                   className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-mono font-bold py-2 rounded-xl transition-all shadow-lg active:translate-y-1"
                 >
                   {isSubmitting ? 'UPLOADING...' : 'SAVE_SCORE'}
                 </button>
               </div>
            ) : (
               <div className="text-green-500 font-mono text-sm mb-4 animate-pulse uppercase">Score Saved Successfully</div>
            )}

            {/* Leaderboard */}
            <Leaderboard submitted={isSubmitted} />

            <button 
              onClick={restart}
              className="w-full bg-red-500 hover:bg-red-400 text-black text-xl font-mono font-bold py-4 px-8 rounded-2xl shadow-lg border-b-8 border-red-800 active:border-b-0 active:translate-y-2 transition-all flex justify-center items-center space-x-2"
            >
              <RotateCcw className="w-6 h-6" />
              <span>PLAY AGAIN</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
