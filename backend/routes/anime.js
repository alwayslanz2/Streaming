import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../frontend/data/all-anime.json');

function readAnimeData() {
    try {
        console.log('📖 Membaca file dari:', DATA_PATH);
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
            console.error('❌ ERROR: JSON harus berupa array [] bukan object {}');
            return [];
        }
        console.log(`✅ Berhasil membaca ${parsed.length} anime`);
        return parsed;
    } catch (err) {
        console.error('❌ Gagal baca file JSON:', err.message);
        return [];
    }
}

// GET: Semua anime
router.get('/list', async (req, res) => {
    try {
        const animeList = readAnimeData();
        res.json(animeList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Trending anime
router.get('/trending', async (req, res) => {
    try {
        const animeList = readAnimeData();
        if (animeList.length === 0) {
            return res.json([]);
        }
        // Filter anime yang isTrending === true
        let trendingAnime = animeList.filter(anime => anime.isTrending === true);
        if (trendingAnime.length === 0) {
            trendingAnime = animeList;
        }
        // Urutkan berdasarkan uploadDate terbaru
        trendingAnime.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        const trending = trendingAnime.slice(0, 4).map(anime => ({
            id: anime.id,
            title: anime.title,
            cover: anime.cover,
            rating: anime.rating,
            views: anime.views,
            episode: `Eps ${anime.latestEpisode}`
        }));
        res.json(trending);
    } catch (err) {
        console.error('Trending error:', err);
        res.json([]);
    }
});

// GET: Jadwal tayang
router.get('/schedule', async (req, res) => {
    try {
        const animeList = readAnimeData();
        
        if (animeList.length === 0) {
            return res.json([]);
        }
        
        // Mapping hari ke indeks
        const dayMap = {
            'minggu': 0, 'min': 0,
            'senin': 1, 'sen': 1,
            'selasa': 2, 'sel': 2,
            'rabu': 3, 'rab': 3,
            'kamis': 4, 'kam': 4,
            'jumat': 5, 'jum': 5,
            'sabtu': 6, 'sab': 6
        };
        
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        // HARI INI (real time)
        const today = new Date();
        const todayIndex = today.getDay();
        
        // Filter anime yang punya scheduleDay
        const scheduledAnime = animeList.filter(anime => 
            anime.scheduleDay && anime.scheduleDay !== ''
        );
        
        if (scheduledAnime.length === 0) {
            return res.json([]);
        }
        
        const result = scheduledAnime.map(anime => {
            let targetIndex = dayMap[anime.scheduleDay.toLowerCase()];
            if (targetIndex === undefined) return null;
            
            let daysDiff = targetIndex - todayIndex;
            if (daysDiff < 0) daysDiff += 7;
            
            const scheduleDate = new Date(today);
            scheduleDate.setDate(today.getDate() + daysDiff);
            
            return {
                id: anime.id,
                title: anime.title,
                episode: `Episode ${anime.latestEpisode}`,
                rating: anime.rating,
                views: anime.views,
                status: anime.scheduleStatus || "Sudah Tayang",
                day: dayNames[targetIndex],
                date: scheduleDate.getDate(),
                cover: anime.cover,
                daysDiff: daysDiff
            };
        }).filter(item => item !== null);
        
        // Urutkan berdasarkan hari terdekat
        result.sort((a, b) => a.daysDiff - b.daysDiff);
        
        res.json(result);
    } catch (err) {
        console.error('Schedule error:', err);
        res.json([]);
    }
});

// GET: Anime by ID
router.get('/:id', async (req, res) => {
    try {
        const animeList = readAnimeData();
        const anime = animeList.find(a => a.id === req.params.id);
        if (!anime) return res.status(404).json({ error: 'Anime tidak ditemukan' });
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
