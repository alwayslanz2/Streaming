import express from 'express';
import History from '../models/History.js';
import auth from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ambil cover dari all-anime.json
function getAnimeCover(animeId) {
    try {
        const dataPath = path.join(__dirname, '../../frontend/data/all-anime.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const animeList = JSON.parse(data);
        const anime = animeList.find(a => a.id === animeId);
        return anime?.cover || '';
    } catch (err) {
        return '';
    }
}

router.get('/', auth, async (req, res) => {
  try {
    const history = await History.find({ userId: req.userId }).sort({ watchedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { animeId, animeTitle, watchTime, episode } = req.body;
    
    const coverUrl = getAnimeCover(animeId);
    
    let history = await History.findOne({ userId: req.userId, animeId, episode: episode || 1 });
    
    if (history) {
      // Update timestamp ke yang terbaru (ambil yang terbesar)
      const newTimestamp = Math.max(history.timestamp || 0, watchTime || 0);
      history.timestamp = newTimestamp;
      history.lastTimestamp = watchTime || history.lastTimestamp;
      history.watchedAt = new Date();
      if (coverUrl) history.cover = coverUrl;
      await history.save();
    } else {
      history = new History({
        userId: req.userId,
        animeId,
        animeTitle,
        timestamp: watchTime || 0,
        lastTimestamp: watchTime || 0,
        episode: episode || 1,
        cover: coverUrl
      });
      await history.save();
    }
    
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await History.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
