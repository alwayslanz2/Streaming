// anime-detail.js
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
const resumeEpisode = urlParams.get('resumeEp');

async function loadAnimeDetail() {
    const container = document.getElementById('detailContainer');
    if (!container) return;

    try {
        const res = await fetch(`/api/anime/${animeId}`);
        const anime = await res.json();

        if (!anime) {
            container.innerHTML = '<div class="loading">Anime tidak ditemukan</div>';
            return;
        }

        document.title = `${anime.title} - AnimeStream`;

        let resumeTimestamp = 0;
        let lastEpisode = 1;

        if (resumeEpisode) {
            lastEpisode = parseInt(resumeEpisode);
            const token = localStorage.getItem('token');

            if (token) {
                const historyRes = await axios.get('/api/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const history = historyRes.data.find(h => h.animeId === animeId && h.episode === lastEpisode);
                if (history && history.timestamp) {
                    resumeTimestamp = history.timestamp;
                }
            }
        }

        const resumeMinutes = Math.floor(resumeTimestamp / 60);
        const resumeSeconds = resumeTimestamp % 60;

        container.innerHTML = `
            <div class="detail-header">
                <img class="detail-cover-large" src="${anime.cover}" onerror="this.src='https://placehold.co/140x200/1a1a1a/888?text=No+Image'">
                <div class="detail-info-header">
                    <h1 class="detail-title">${anime.title}</h1>
                    <div class="detail-stats">
                        <span>⭐ ${anime.rating}</span>
                        <span>👁️ ${anime.views}</span>
                        <span>🏢 ${anime.studio}</span>
                    </div>
                    <div class="detail-genre">
                        ${anime.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                    ${resumeTimestamp > 0 ? `
                        <div class="resume-badge" onclick="resumeWatch('${anime.id}', ${lastEpisode}, ${resumeTimestamp})">
                            ▶️ Lanjutkan dari ${resumeMinutes}:${resumeSeconds.toString().padStart(2,'0')} (Episode ${lastEpisode})
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-synopsis-section">
                <h3>Sinopsis</h3>
                <p class="detail-synopsis">${anime.synopsis}</p>
            </div>

            <div class="episode-section">
                <h3>📺 Daftar Episode</h3>
                <div class="episode-list" id="episodeList"></div>
            </div>
        `;

        const episodeContainer = document.getElementById('episodeList');

        if (anime.episodes && anime.episodes.length > 0) {
            episodeContainer.innerHTML = anime.episodes.map(ep => {
                const isResume = (resumeEpisode && parseInt(resumeEpisode) === ep.number);

                return `
                    <div class="episode-button ${isResume ? 'last-watched' : ''}"
                        onclick="playEpisode('${anime.id}', ${ep.number}, '${ep.videoUrl}', '${ep.title.replace(/'/g, "\\'")}', ${resumeTimestamp})">
                        <div>
                            <span class="episode-num">Episode ${ep.number}</span>
                            <div class="episode-title-small">${ep.title}</div>
                        </div>
                        <span class="play-icon">${isResume ? '▶️ Lanjutkan' : '▶️'}</span>
                    </div>
                `;
            }).join('');
        } else {
            episodeContainer.innerHTML = '<div class="loading">Belum ada episode</div>';
        }

    } catch (err) {
        console.error('Gagal load detail:', err);
        container.innerHTML = '<div class="loading">Gagal memuat detail</div>';
    }
}

async function playEpisode(animeId, episodeNum, videoUrl, episodeTitle, resumeTimestamp = 0) {
    const allowed = await window.checkMaintenanceAccess();

    if (allowed) {
        window.location.href = `/watch.html?id=${animeId}&ep=${episodeNum}&video=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(episodeTitle)}&resume=${resumeTimestamp}`;
    }
}

async function resumeWatch(animeId, episodeNum, timestamp) {
    try {
        const res = await fetch(`/api/anime/${animeId}`);
        const anime = await res.json();
        const ep = anime.episodes.find(e => e.number === episodeNum);

        if (!ep) {
            alert('Episode tidak ditemukan');
            return;
        }

        window.location.href = `/watch.html?id=${animeId}&ep=${episodeNum}&video=${encodeURIComponent(ep.videoUrl)}&title=${encodeURIComponent(ep.title)}&resume=${timestamp}`;
    } catch (err) {
        console.error('Gagal resume watch:', err);
    }
}

document.querySelectorAll('.nav-item').forEach((item) => {
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

window.playEpisode = playEpisode;
window.resumeWatch = resumeWatch;

loadAnimeDetail();
