import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'root-runner-secret-key';

router.post('/register', async (req: any, res: any) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] } as any);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userCount = await User.countDocuments();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: userCount === 0 ? 'admin' : 'user',
      character: 'boy',
      skills: 0,
      highScore: 0,
      isBanned: false
    });

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET);
    res.json({ token, user: { id: newUser._id, username: newUser.username, role: newUser.role, character: newUser.character } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: any, res: any) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username } as any);

    if (!user || user.isBanned) {
      return res.status(401).json({ error: user?.isBanned ? 'User is banned' : 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role, 
        character: user.character, 
        skills: user.skills, 
        unlockedCharacters: user.unlockedCharacters 
      } 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
export { JWT_SECRET };
