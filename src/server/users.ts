import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth';
import { db } from './db';

const router = express.Router();

export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

router.get('/me', authenticate, (req: any, res) => {
  const users = db.getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

router.patch('/character', authenticate, (req: any, res) => {
  const { character } = req.body;
  const users = db.getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.unlockedCharacters.includes(character)) return res.status(403).json({ error: 'Character not unlocked' });

  user.character = character;
  db.saveUsers(users);
  res.json({ success: true, character });
});

// Admin CRUD
router.get('/', authenticate, adminOnly, (req, res) => {
  const users = db.getUsers();
  res.json(users.map(({ password, ...u }: any) => u));
});

router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const users = db.getUsers();
  const filtered = users.filter((u: any) => u.id !== req.params.id);
  db.saveUsers(filtered);
  res.json({ success: true });
});

router.patch('/:id/ban', authenticate, adminOnly, (req, res) => {
  const users = db.getUsers();
  const user = users.find((u: any) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.isBanned = !user.isBanned;
  db.saveUsers(users);
  res.json({ success: true, isBanned: user.isBanned });
});

export default router;
