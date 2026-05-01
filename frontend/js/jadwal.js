let scheduleData = [];

// Generate week navigation berdasarkan tanggal REAL (hari ini + 6 ke depan)
function generateWeekNav() {
    const container = document.getElementById('weekNav');
    if (!container) return;
    
    const today = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    let html = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = days[date.getDay()];
        const dateNum = date.getDate();
        const isActive = (i === 0);
        
        html += `
            <div class="week-day ${isActive ? 'active' : ''}" data-day="${dayName}" data-date="${dateNum}" data-full="${date.toISOString()}">
                ${dayName}<br><span class="date">${dateNum}</span>
            </div>
        `;
    }
    container.innerHTML = html;
    
    // Event klik untuk filter schedule berdasarkan hari
    document.querySelectorAll('.week-day').forEach(day => {
        day.addEventListener('click', function() {
            document.querySelectorAll('.week-day').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            const dayName = this.dataset.day;
            filterScheduleByDay(dayName);
        });
    });
}

function filterScheduleByDay(dayName) {
    const container = document.getElementById('scheduleList');
    const filtered = scheduleData.filter(a => a.day === dayName);
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada jadwal untuk hari ini</div>';
        return;
    }
    renderSchedule(filtered);
}

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
        
        // Tampilkan jadwal hari ini terlebih dahulu
        const todayData = scheduleData.filter(a => a.isToday === true);
        renderSchedule(todayData.length > 0 ? todayData : scheduleData);
        
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
                <div class="schedule-date">📅 ${anime.fullDate || anime.date + '/' + anime.month}</div>
                <div class="schedule-stats">
                    <span>⭐ ${anime.rating}</span>
                    <span>👁️ ${anime.views}</span>
                </div>
                <div class="schedule-status ${anime.status.includes('Menunggu') ? 'status-waiting' : ''}">${anime.status}</div>
            </div>
        </div>
    `).join('');
}

async function goToDetail(id) {
    const allowed = await window.checkMaintenanceAccess();
    if (allowed) window.location.href = `/anime-detail.html?id=${id}`;
}

document.querySelectorAll('.nav-item').forEach(async (item) => {
    item.addEventListener('click', async () => {
        const page = item.dataset.page;
        let url = '';
        if (page === 'home') url = '/index.html';
        if (page === 'jadwal') url = '/jadwal.html';
        if (page === 'history') url = '/history.html';
        if (page === 'profile') url = '/profile.html';
        if (url) {
            const allowed = await window.checkMaintenanceAccess();
            if (allowed) window.location.href = url;
        }
    });
});

window.goToDetail = goToDetail;

// Inisialisasi
generateWeekNav();
loadSchedule();
