import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth';
import { User } from './models';

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

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await (User as any).findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/character', authenticate, async (req: any, res) => {
  const { character } = req.body;
  try {
    const user = await (User as any).findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.unlockedCharacters.includes(character)) return res.status(403).json({ error: 'Character not unlocked' });

    user.character = character;
    await user.save();
    res.json({ success: true, character });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin CRUD
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await (User as any).find().select('-password');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await (User as any).findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/ban', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await (User as any).findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, isBanned: user.isBanned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
