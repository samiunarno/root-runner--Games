import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'root-runner-secret-key';

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const users = db.getUsers();

  if (users.find((u: any) => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    role: users.length === 0 ? 'admin' : 'user', // First user is admin
    character: 'boy',
    unlockedCharacters: ['boy', 'nerd'],
    skills: 0,
    highScore: 0,
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  db.saveUsers(users);

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);
  res.json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role, character: newUser.character } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = db.getUsers();
  const user = users.find((u: any) => u.username === username);

  if (!user || user.isBanned) {
    return res.status(401).json({ error: user?.isBanned ? 'User is banned' : 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, character: user.character, skills: user.skills, unlockedCharacters: user.unlockedCharacters } });
});

export default router;
export { JWT_SECRET };
