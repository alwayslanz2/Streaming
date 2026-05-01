// GET: Jadwal tayang (REAL-TIME berdasarkan kalender)
router.get('/schedule', async (req, res) => {
    try {
        const animeList = readAnimeData();
        
        const scheduledAnime = animeList.filter(anime => 
            anime.scheduleDay && anime.scheduleDay !== ''
        );
        
        if (scheduledAnime.length === 0) return res.json([]);
        
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
        
        // Buat 7 hari ke depan
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
        
        const scheduleWithDates = [];
        for (const anime of scheduledAnime) {
            let targetIndex = dayMap[anime.scheduleDay.toLowerCase()];
            if (targetIndex === undefined) continue;
            
            let foundDate = null;
            for (const day of weekDays) {
                if (day.dayIndex === targetIndex) {
                    foundDate = day;
                    break;
                }
            }
            
            if (foundDate) {
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
            }
        }
        
        scheduleWithDates.sort((a, b) => {
            if (a.isToday && !b.isToday) return -1;
            if (!a.isToday && b.isToday) return 1;
            return a.date - b.date;
        });
        
        res.json(scheduleWithDates);
    } catch (err) {
        console.error('Schedule error:', err);
        res.status(500).json({ error: err.message });
    }
});
