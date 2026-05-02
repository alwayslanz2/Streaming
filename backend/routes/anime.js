import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anime from '../models/Anime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const JSON_PATH = path.join(__dirname, '../../frontend/data/all-anime.json');

// Sync data dari JSON ke MongoDB (hanya sekali)
async function syncAnimeData() {
    try {
        const data = fs.readFileSync(JSON_PATH, 'utf8');
        const animeList = JSON.parse(data);
        
        for (const anime of animeList) {
            await Anime.findOneAndUpdate(
                { id: anime.id },
                { ...anime },
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Synced ${animeList.length} anime to MongoDB`);
    } catch (err) {
        console.error('Sync anime error:', err);
    }
}

// GET semua anime dari MongoDB
router.get('/list', async (req, res) => {
    try {
        const animeList = await Anime.find().sort({ id: 1 });
        res.json(animeList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET trending (isTrending = true)
router.get('/trending', async (req, res) => {
    try {
        let trending = await Anime.find({ isTrending: true }).sort({ uploadDate: -1 }).limit(4);
        if (trending.length === 0) {
            trending = await Anime.find().sort({ uploadDate: -1 }).limit(4);
        }
        const result = trending.map(a => ({
            id: a.id, title: a.title, cover: a.cover,
            rating: a.rating, views: a.views, episode: `Eps ${a.latestEpisode}`
        }));
        res.json(result);
    } catch (err) {
        res.json([]);
    }
});

// GET schedule
router.get('/schedule', async (req, res) => {
    try {
        const animeList = await Anime.find({ scheduleDay: { $ne: "" } });
        
        const dayMap = {
            'minggu': 0, 'min': 0, 'senin': 1, 'sen': 1,
            'selasa': 2, 'sel': 2, 'rabu': 3, 'rab': 3,
            'kamis': 4, 'kam': 4, 'jumat': 5, 'jum': 5,
            'sabtu': 6, 'sab': 6
        };
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const today = new Date();
        const todayIndex = today.getDay();
        
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            weekDays.push({
                dayIndex: date.getDay(),
                dayName: dayNames[date.getDay()],
                date: date.getDate(),
                month: date.getMonth() + 1,
                isToday: i === 0,
                fullDate: `${date.getDate()}/${date.getMonth() + 1}`
            });
        }
        
        const schedule = [];
        for (const anime of animeList) {
            const targetIndex = dayMap[anime.scheduleDay.toLowerCase()];
            if (targetIndex === undefined) continue;
            const found = weekDays.find(d => d.dayIndex === targetIndex);
            if (found) {
                schedule.push({
                    id: anime.id, title: anime.title,
                    episode: `Episode ${anime.latestEpisode}`,
                    rating: anime.rating, views: anime.views,
                    status: anime.scheduleStatus || "Sudah Tayang",
                    day: found.dayName, date: found.date,
                    month: found.month, fullDate: found.fullDate,
                    isToday: found.isToday, cover: anime.cover
                });
            }
        }
        schedule.sort((a, b) => {
            if (a.isToday && !b.isToday) return -1;
            if (!a.isToday && b.isToday) return 1;
            return a.date - b.date;
        });
        res.json(schedule);
    } catch (err) {
        res.json([]);
    }
});

// GET by ID
router.get('/:id', async (req, res) => {
    try {
        const anime = await Anime.findOne({ id: req.params.id });
        if (!anime) return res.status(404).json({ error: 'Anime tidak ditemukan' });
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync data saat pertama kali
syncAnimeData();

export default router;
