let allAnimeData = [];
let currentSort = 'az';
let searchQuery = '';

async function loadAllAnime() {
    const container = document.getElementById('animeGrid');
    if (!container) return;
    try {
        const res = await fetch('/api/anime/list');
        allAnimeData = await res.json();
        const savedGenre = localStorage.getItem('selectedGenre');
        if (savedGenre) {
            localStorage.removeItem('selectedGenre');
            const filtered = allAnimeData.filter(anime => anime.genre.some(g => g.toLowerCase() === savedGenre.toLowerCase()));
            renderAnime(filtered);
        } else {
            renderAnime();
        }
    } catch (err) {
        console.error('Gagal load all anime:', err);
        container.innerHTML = '<div class="loading">Gagal memuat data</div>';
    }
}

function renderAnime(data = null) {
    let filtered = data ? [...data] : [...allAnimeData];
    if (searchQuery) filtered = filtered.filter(anime => anime.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (currentSort === 'az') filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (currentSort === 'latest') filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    const container = document.getElementById('animeGrid');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada anime ditemukan</div>';
        return;
    }
    container.innerHTML = filtered.map(anime => `
        <div class="anime-grid-item" onclick="goToDetail('${anime.id}')">
            <img class="anime-grid-cover" src="${anime.cover}" onerror="this.src='https://placehold.co/150x225/1a1a1a/888?text=No+Image'">
            <div class="anime-grid-info">
                <div class="anime-grid-title">${anime.title}</div>
                <div class="anime-grid-meta"><span>⭐ ${anime.rating}</span><span>Eps ${anime.latestEpisode}</span></div>
            </div>
        </div>
    `).join('');
}

document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        renderAnime();
    });
});

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderAnime();
    });
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
        if (page === 'kontak') url = '/kontak.html';
        if (url) {
            const allowed = await window.checkMaintenanceAccess();
            if (allowed) window.location.href = url;
        }
    });
});

window.goToDetail = goToDetail;
loadAllAnime();
