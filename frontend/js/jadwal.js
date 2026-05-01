let scheduleData = [];

async function loadSchedule() {
    const container = document.getElementById('scheduleList');
    if (!container) return;
    
    try {
        const res = await fetch('/api/anime/schedule');
        scheduleData = await res.json();
        
        if (!scheduleData || scheduleData.length === 0) {
            container.innerHTML = '<div class="loading">Tidak ada jadwal</div>';
            return;
        }
        
        renderSchedule(scheduleData);
        window.scheduleData = scheduleData;
        
    } catch (err) {
        console.error('Gagal load schedule:', err);
        container.innerHTML = '<div class="loading">Gagal memuat jadwal</div>';
    }
}

function renderSchedule(data) {
    const container = document.getElementById('scheduleList');
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada jadwal</div>';
        return;
    }
    
    container.innerHTML = data.map(anime => `
        <div class="schedule-item" onclick="goToDetail('${anime.id}')">
            <img class="schedule-cover" src="${anime.cover}" onerror="this.src='https://placehold.co/60x85/1a1a1a/888?text=No+Image'">
            <div class="schedule-info">
                <div class="schedule-title">${anime.title}</div>
                <div class="schedule-episode">${anime.episode}</div>
                <div class="schedule-stats">
                    <span>⭐ ${anime.rating}</span>
                    <span>👁️ ${anime.views}</span>
                </div>
                <div class="schedule-status ${anime.status.includes('Menunggu') ? 'status-waiting' : ''}">${anime.status}</div>
            </div>
        </div>
    `).join('');
}

function initWeekNav() {
    document.querySelectorAll('.week-day').forEach(day => {
        day.addEventListener('click', async function() {
            document.querySelectorAll('.week-day').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            const dayName = this.dataset.day;
            
            if (!window.scheduleData) {
                const res = await fetch('/api/anime/schedule');
                window.scheduleData = await res.json();
            }
            
            const filtered = window.scheduleData.filter(a => a.day === dayName);
            renderSchedule(filtered);
        });
    });
}

function goToDetail(id) {
    window.location.href = `/anime-detail.html?id=${id}`;
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'home') window.location.href = '/index.html';
        if (page === 'jadwal') window.location.href = '/jadwal.html';
        if (page === 'history') window.location.href = '/history.html';
        if (page === 'profile') window.location.href = '/profile.html';
    });
});

window.goToDetail = goToDetail;

loadSchedule();
setTimeout(initWeekNav, 100);
