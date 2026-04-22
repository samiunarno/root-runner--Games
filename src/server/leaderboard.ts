import express from 'express';
import { LeaderboardEntry } from './models';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const entries = await (LeaderboardEntry as any).find()
      .sort({ score: -1 } as any)
      .limit(50);
    res.json(entries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, score, character } = req.body;
  try {
    const newEntry = await LeaderboardEntry.create({ name, score, character });
    res.json(newEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
