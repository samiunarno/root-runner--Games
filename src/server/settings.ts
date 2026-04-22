import express from 'express';
import { authenticate, adminOnly } from './users';
import { Settings } from './models';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await (Settings as any).findOne();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/', authenticate, adminOnly, async (req, res) => {
  try {
    let settings = await (Settings as any).findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await (settings as any).save();
    
    if ((global as any).broadcastSettings) {
      (global as any).broadcastSettings(settings);
    }
    
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
