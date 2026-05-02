import express from 'express';
import History from '../models/History.js';
import auth from '../middleware/auth.js';
import Anime from '../models/Anime.js';

const router = express.Router();

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
        const { animeId, watchTime, episode } = req.body;
        
        // Ambil info anime dari MongoDB
        const anime = await Anime.findOne({ id: animeId });
        if (!anime) {
            return res.status(404).json({ error: 'Anime tidak ditemukan' });
        }
        
        let history = await History.findOne({ 
            userId: req.userId, 
            animeId: animeId, 
            episode: episode || 1 
        });
        
        if (history) {
            // Update timestamp jika lebih besar dari sebelumnya
            if (watchTime > history.timestamp) {
                history.timestamp = watchTime;
                history.watchedAt = new Date();
                await history.save();
            }
        } else {
            history = new History({
                userId: req.userId,
                animeId: animeId,
                animeTitle: anime.title,
                episode: episode || 1,
                timestamp: watchTime || 0,
                cover: anime.cover
            });
            await history.save();
        }
        
        res.json({ success: true, history });
    } catch (err) {
        console.error('Save history error:', err);
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
