import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);

const USERS_FILE = path.join(DB_PATH, 'users.json');
const SESSIONS_FILE = path.join(DB_PATH, 'sessions.json');
const SETTINGS_FILE = path.join(DB_PATH, 'settings.json');

const initFile = (file: string, defaultValue: any) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaultValue));
};

initFile(USERS_FILE, []);
initFile(SESSIONS_FILE, []);
initFile(SETTINGS_FILE, {
  baseSpeed: 15,
  spawnRate: 0.8,
  difficultyMultiplier: 1.1
});

export const db = {
  getUsers: () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')),
  saveUsers: (users: any[]) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)),
  getSessions: () => JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8')),
  saveSessions: (sessions: any[]) => fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2)),
  getSettings: () => JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')),
  saveSettings: (settings: any) => fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
};
