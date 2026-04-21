import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, PlayCircle, ShoppingCart, Settings, Terminal, Cpu } from 'lucide-react';

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

  const characters = [
    { id: 'boy', name: 'Hero', color: 'bg-green-800', cost: 0 },
    { id: 'nerd', name: 'The Dev', color: 'bg-green-800', cost: 0 },
    { id: 'bot', name: 'R.O.B.O', color: 'bg-orange-800', cost: 50 },
    { id: 'glitch', name: 'GLITCH', color: 'bg-red-900', cost: 150 },
    { id: 'nexus', name: 'NEXUS', color: 'bg-blue-600', cost: 300 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center font-sans overflow-hidden">
      
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
                    onClick={() => isUnlocked ? setCharacter(char.id as any) : unlockCharacter(char.id as any, char.cost)}
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
            
            <div className="bg-gray-900 w-full rounded-2xl p-6 mb-8 border-2 border-red-500">
               <span className="block text-red-400 font-mono font-bold uppercase tracking-wider text-sm mb-1">TOTAL SKILLS</span>
               <span className="text-5xl font-mono font-black text-green-500 flex items-center justify-center">
                  <Terminal className="w-8 h-8 mr-2" />
                  {skills}
               </span>
            </div>

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
