import { Server } from 'socket.io';

interface GameSettings {
  baseSpeed: number;
  spawnRate: number;
  difficultyMultiplier: number;
}

let currentSettings: GameSettings = {
  baseSpeed: 15,
  spawnRate: 0.8,
  difficultyMultiplier: 1.1
};

const activePlayers = new Map<string, any>();

export const setupSocket = (io: Server) => {
  // Broadcast settings to everyone when they change in DB
  (global as any).broadcastSettings = (newSettings: any) => {
    currentSettings = newSettings;
    io.emit('settings_update', currentSettings);
  };

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.emit('settings_update', currentSettings);

    socket.on('player_join', (data) => {
      activePlayers.set(socket.id, { ...data, id: socket.id });
      io.emit('players_update', Array.from(activePlayers.values()));
    });

    socket.on('player_status', (status) => {
      const player = activePlayers.get(socket.id);
      if (player) {
         player.status = status;
         io.emit('players_update', Array.from(activePlayers.values()));
      }
    });

    // Admin controls via socket (legacy support or real-time tweaks)
    socket.on('admin_update_settings', (newSettings) => {
      currentSettings = { ...currentSettings, ...newSettings };
      io.emit('settings_update', currentSettings);
    });

    socket.on('disconnect', () => {
      activePlayers.delete(socket.id);
      io.emit('players_update', Array.from(activePlayers.values()));
      console.log('Player disconnected:', socket.id);
    });
  });
};
