import express from 'express';
import { authenticate, adminOnly } from './users';
import { db } from './db';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.getSettings());
});

router.patch('/', authenticate, adminOnly, (req, res) => {
  const current = db.getSettings();
  const updated = { ...current, ...req.body };
  db.saveSettings(updated);
  
  if ((global as any).broadcastSettings) {
    (global as any).broadcastSettings(updated);
  }
  
  res.json(updated);
});

export default router;
