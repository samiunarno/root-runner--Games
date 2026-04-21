import { create } from 'zustand';

interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameover' | 'shop';
  score: number;
  skills: number;
  speed: number;
  multiplier: number;
  powerups: {
    magnet: number;
    multiplier: number;
    jetpack: number;
  };
  cameraMode: 'follow' | 'isometric';
  character: 'boy' | 'girl' | 'teen' | 'nerd' | 'bot' | 'glitch' | 'nexus';
  unlockedCharacters: string[];
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  openShop: () => void;
  closeShop: () => void;
  addScore: (points: number) => void;
  addSkills: (count: number) => void;
  addSkill: () => void;
  activatePowerup: (type: 'magnet' | 'multiplier' | 'jetpack', duration: number) => void;
  updatePowerups: (delta: number) => void;
  increaseSpeed: () => void;
  restart: () => void;
  setCharacter: (char: 'boy' | 'girl' | 'teen' | 'nerd' | 'bot' | 'glitch' | 'nexus') => void;
  unlockCharacter: (char: 'boy' | 'girl' | 'teen' | 'nerd' | 'bot' | 'glitch' | 'nexus', cost: number) => void;
}

export const useStore = create<GameState>((set) => ({
  status: 'menu',
  score: 0,
  skills: 0,
  speed: 15,
  multiplier: 1,
  powerups: {
    magnet: 0,
    multiplier: 0,
    jetpack: 0,
  },
  cameraMode: 'follow',
  character: 'nerd',
  unlockedCharacters: ['boy', 'nerd'],
  startGame: () => set({ 
    status: 'playing', 
    score: 0, 
    skills: 0, 
    speed: 15, 
    multiplier: 1,
    powerups: { magnet: 0, multiplier: 0, jetpack: 0 }
  }),
  pauseGame: () => set({ status: 'paused' }),
  resumeGame: () => set({ status: 'playing' }),
  endGame: () => set({ status: 'gameover' }),
  openShop: () => set({ status: 'shop' }),
  closeShop: () => set({ status: 'menu' }),
  addScore: (points) => set((state) => ({ score: state.score + points * state.multiplier })),
  addSkills: (count) => set((state) => ({ skills: state.skills + count })),
  addSkill: () => set((state) => ({ skills: state.skills + 1 })),
  activatePowerup: (type, duration) => set((state) => ({
    powerups: { ...state.powerups, [type]: Math.max(state.powerups[type], duration) },
  })),
  updatePowerups: (delta) => set((state) => {
    const nextMagnet = Math.max(0, state.powerups.magnet - delta);
    const nextMultiplier = Math.max(0, state.powerups.multiplier - delta);
    const nextJetpack = Math.max(0, state.powerups.jetpack - delta);
    return {
      powerups: { magnet: nextMagnet, multiplier: nextMultiplier, jetpack: nextJetpack },
      multiplier: nextMultiplier > 0 ? 2 : 1
    };
  }),
  increaseSpeed: () => set((state) => ({ speed: Math.min(state.speed + 0.1, 40) })),
  restart: () => set({ 
    status: 'playing', 
    score: 0, 
    skills: 0, 
    speed: 15, 
    multiplier: 1,
    powerups: { magnet: 0, multiplier: 0, jetpack: 0 }
  }),
  setCharacter: (char) => set({ character: char }),
  unlockCharacter: (char, cost) => set((state) => {
    if (state.skills >= cost && !state.unlockedCharacters.includes(char)) {
      return {
        skills: state.skills - cost,
        unlockedCharacters: [...state.unlockedCharacters, char],
        character: char
      };
    }
    return state;
  }),
}));
