const genreList = [
    "Movie", "Action", "Adventure", "Comedy", "Demons", "Drama",
    "Ecchi", "Fantasy", "Game", "Harem", "Historical", "Horror", "Josei",
    "Magic", "Martial Arts", "Mecha", "Military", "Music", "Mystery",
    "Psychological", "Parody", "Police", "Romance", "Samurai", "School",
    "Sci-Fi", "Seinen", "Shoujo", "Shoujo Ai", "Shounen", "Slice of Life",
    "Sports", "Space", "Super Power", "Supernatural", "Thriller", "Vampire"
];

function loadGenres() {
    const container = document.getElementById('genreList');
    if (!container) return;
    container.innerHTML = genreList.map(genre => `<div class="genre-chip" data-genre="${genre}">${genre}</div>`).join('');
    document.querySelectorAll('.genre-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const genre = chip.dataset.genre;
            localStorage.setItem('selectedGenre', genre);
            window.location.href = '/all-anime.html';
        });
    });
}

async function loadTrending() {
    const container = document.getElementById('trendingList');
    if (!container) return;
    try {
        const res = await fetch('/api/anime/trending');
        const trendingData = await res.json();
        if (!trendingData || trendingData.length === 0) {
            container.innerHTML = '<div class="loading">Belum ada anime trending</div>';
            return;
        }
        container.innerHTML = trendingData.map(anime => `
            <div class="anime-item" onclick="goToDetail('${anime.id}')">
                <img class="anime-cover-small" src="${anime.cover}" onerror="this.src='https://placehold.co/70x95/1a1a1a/888?text=No+Image'">
                <div class="anime-info-compact">
                    <div class="anime-title-compact">${anime.title}</div>
                    <div class="anime-meta">
                        <span class="anime-episode">${anime.episode}</span>
                        <span class="anime-rating">⭐ ${anime.rating}</span>
                        <span class="anime-views">👁️ ${anime.views}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Gagal load trending:', err);
        container.innerHTML = '<div class="loading">Gagal memuat data trending</div>';
    }
}

async function goToDetail(id) {
    const allowed = await window.checkMaintenanceAccess();
    if (allowed) {
        window.location.href = `/anime-detail.html?id=${id}`;
    }
}

document.querySelectorAll('.nav-item').forEach(async (item) => {
    item.addEventListener('click', async () => {
        const page = item.dataset.page;
        let url = '';
        if (page === 'home') url = '/index.html';
        if (page === 'jadwal') url = '/jadwal.html';
        if (page === 'history') url = '/history.html';
        if (page === 'profile') url = '/profile.html';
        if (page === 'kontak') url = '/kontak.html';
        if (url) {
            const allowed = await window.checkMaintenanceAccess();
            if (allowed) window.location.href = url;
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    loadTrending();
    if (typeof updateLevelBadge === 'function') updateLevelBadge();
});

window.goToDetail = goToDetail;
