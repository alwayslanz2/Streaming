import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// PATH YANG BENAR: ke frontend/data/all-anime.json
const DATA_PATH = path.join(__dirname, '../../frontend/data/all-anime.json');

console.log('📁 Anime data path:', DATA_PATH);

function readAnimeData() {
    try {
        // Cek apakah file ada
        if (!fs.existsSync(DATA_PATH)) {
            console.error('❌ File tidak ditemukan:', DATA_PATH);
            return [];
        }
        
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        console.log('📖 Raw data length:', data.length);
        
        const parsed = JSON.parse(data);
        
        if (!Array.isArray(parsed)) {
            console.error('❌ ERROR: JSON harus berupa array []');
            return [];
        }
        
        console.log(`✅ Berhasil membaca ${parsed.length} anime dari ${DATA_PATH}`);
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
        console.error('List error:', err);
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

// GET: Jadwal tayang (REAL-TIME berdasarkan kalender)
router.get('/schedule', async (req, res) => {
    try {
        const animeList = readAnimeData();
        
        console.log('📊 Total anime di database:', animeList.length);
        
        const scheduledAnime = animeList.filter(anime => 
            anime.scheduleDay && anime.scheduleDay !== ''
        );
        
        console.log('📅 Anime dengan scheduleDay:', scheduledAnime.length);
        
        if (scheduledAnime.length === 0) {
            console.log('⚠️ Tidak ada anime yang dijadwalkan');
            return res.json([]);
        }
        
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
        
        const today = new Date();
        const todayIndex = today.getDay();
        console.log(`📅 Hari ini: ${dayNames[todayIndex]} (index ${todayIndex})`);
        
        // Buat 7 hari ke depan (hari ini + 6)
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            weekDays.push({
                dayIndex: date.getDay(),
                dayName: dayNames[date.getDay()],
                date: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                isToday: i === 0,
                fullDate: `${date.getDate()}/${date.getMonth() + 1}`
            });
        }
        
        console.log('📆 7 hari ke depan:', weekDays.map(d => `${d.dayName} ${d.date}/${d.month}`).join(', '));
        
        const scheduleWithDates = [];
        for (const anime of scheduledAnime) {
            let targetIndex = dayMap[anime.scheduleDay.toLowerCase()];
            if (targetIndex === undefined) {
                console.log(`⚠️ Hari tidak dikenal: ${anime.scheduleDay} untuk anime ${anime.title}`);
                continue;
            }
            
            // Cari hari dalam minggu ini dimana targetIndex muncul
            let foundDate = null;
            for (const day of weekDays) {
                if (day.dayIndex === targetIndex) {
                    foundDate = day;
                    break;
                }
            }
            
            if (foundDate) {
                console.log(`✅ ${anime.title} (${anime.scheduleDay}) -> ${foundDate.dayName} ${foundDate.date}/${foundDate.month}`);
                scheduleWithDates.push({
                    id: anime.id,
                    title: anime.title,
                    episode: `Episode ${anime.latestEpisode}`,
                    rating: anime.rating,
                    views: anime.views,
                    status: anime.scheduleStatus || "Sudah Tayang",
                    day: foundDate.dayName,
                    date: foundDate.date,
                    month: foundDate.month,
                    fullDate: foundDate.fullDate,
                    isToday: foundDate.isToday,
                    cover: anime.cover
                });
            } else {
                console.log(`⚠️ ${anime.title} tidak ditemukan dalam 7 hari ke depan`);
            }
        }
        
        // Urutkan berdasarkan tanggal terdekat (hari ini dulu, baru besok, dst)
        scheduleWithDates.sort((a, b) => {
            if (a.isToday && !b.isToday) return -1;
            if (!a.isToday && b.isToday) return 1;
            return a.date - b.date;
        });
        
        console.log(`📊 Total jadwal yang dikirim: ${scheduleWithDates.length}`);
        res.json(scheduleWithDates);
    } catch (err) {
        console.error('Schedule error:', err);
        res.status(500).json({ error: err.message });
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
        console.error('Detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
