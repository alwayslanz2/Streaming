import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-xp', auth, async (req, res) => {
  try {
    const { watchTime } = req.body;
    const user = await User.findById(req.userId);
    
    const xpGain = Math.floor(watchTime / 60);
    user.xp += xpGain;
    user.totalWatchTime += watchTime;
    
    const newLevel = Math.floor(user.xp / 100) + 1;
    let leveledUp = false;
    if (newLevel > user.level) {
      user.level = newLevel;
      leveledUp = true;
    }
    
    await user.save();
    res.json({ 
      level: user.level, 
      xp: user.xp, 
      totalWatchTime: user.totalWatchTime,
      xpGain: xpGain,
      leveledUp: leveledUp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
