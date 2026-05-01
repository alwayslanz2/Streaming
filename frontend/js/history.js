let selectedMode = 'single';
let selectedItems = new Set();

async function loadHistory() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('historyList');
    if (!container) return;
    if (!token) {
        container.innerHTML = '<div class="loading">Login dulu untuk lihat riwayat</div>';
        return;
    }
    try {
        const res = await axios.get('/api/history', { headers: { Authorization: `Bearer ${token}` } });
        const historyData = res.data;
        if (historyData.length === 0) {
            container.innerHTML = '<div class="loading">Belum ada riwayat nonton</div>';
            return;
        }
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let todayItems = [], yesterdayItems = [], olderItems = [];
        historyData.forEach(h => {
            const date = new Date(h.watchedAt).toDateString();
            if (date === today) todayItems.push(h);
            else if (date === yesterday) yesterdayItems.push(h);
            else olderItems.push(h);
        });
        let html = '';
        if (todayItems.length > 0) html += '<div class="history-section-title">Hari ini</div>' + todayItems.map(h => renderHistoryItem(h)).join('');
        if (yesterdayItems.length > 0) html += '<div class="history-section-title">Kemarin</div>' + yesterdayItems.map(h => renderHistoryItem(h)).join('');
        if (olderItems.length > 0) html += '<div class="history-section-title">Sebelumnya</div>' + olderItems.map(h => renderHistoryItem(h)).join('');
        container.innerHTML = html;
    } catch (err) {
        console.error('Gagal load history:', err);
        container.innerHTML = '<div class="loading">Gagal memuat riwayat</div>';
    }
}

function renderHistoryItem(h) {
    const isSelected = selectedItems.has(h._id);
    const watchMinutes = Math.floor(h.timestamp / 60);
    const watchSeconds = h.timestamp % 60;
    const totalMinutes = 23;
    const progressPercent = Math.min(100, (watchMinutes / totalMinutes) * 100);
    const coverUrl = h.cover || 'https://placehold.co/60x85/1a1a1a/888?text=No+Cover';
    if (selectedMode === 'multi') {
        return `<div class="history-item-selectable ${isSelected ? 'selected' : ''}" data-id="${h._id}" onclick="event.stopPropagation(); toggleSelect('${h._id}')">
            <img class="history-cover" src="${coverUrl}" onerror="this.src='https://placehold.co/60x85/1a1a1a/888?text=No+Cover'">
            <div class="history-info">
                <div class="history-title">${h.animeTitle}</div>
                <div class="history-episode">Episode ${h.episode || 1}</div>
                <div class="history-time">${watchMinutes.toString().padStart(2,'0')}:${watchSeconds.toString().padStart(2,'0')}</div>
                <div class="history-progress">${watchMinutes} / ${totalMinutes} menit</div>
                <div class="progress-container"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
            </div>
            <div class="checkbox-indicator"></div>
        </div>`;
    } else {
        return `<div class="history-item-selectable" onclick="goToAnimeDetail('${h.animeId}', ${h.episode || 1})">
            <img class="history-cover" src="${coverUrl}" onerror="this.src='https://placehold.co/60x85/1a1a1a/888?text=No+Cover'">
            <div class="history-info">
                <div class="history-title">${h.animeTitle}</div>
                <div class="history-episode">Episode ${h.episode || 1}</div>
                <div class="history-time">${watchMinutes.toString().padStart(2,'0')}:${watchSeconds.toString().padStart(2,'0')}</div>
                <div class="history-progress">${watchMinutes} / ${totalMinutes} menit</div>
                <div class="progress-container"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
            </div>
        </div>`;
    }
}

function toggleSelect(id) {
    if (selectedItems.has(id)) selectedItems.delete(id);
    else selectedItems.add(id);
    const item = document.querySelector(`.history-item-selectable[data-id="${id}"]`);
    if (item) selectedItems.has(id) ? item.classList.add('selected') : item.classList.remove('selected');
    const deleteBar = document.getElementById('deleteBar');
    if (deleteBar) deleteBar.style.display = selectedItems.size > 0 ? 'block' : 'none';
}

async function deleteSelected() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const ids = Array.from(selectedItems);
    for (const id of ids) await axios.delete(`/api/history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    selectedItems.clear();
    const deleteBar = document.getElementById('deleteBar');
    if (deleteBar) deleteBar.style.display = 'none';
    loadHistory();
}

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
        selectedItems.clear();
        const deleteBar = document.getElementById('deleteBar');
        if (deleteBar) deleteBar.style.display = 'none';
        loadHistory();
    });
});
document.getElementById('deleteSelectedBtn')?.addEventListener('click', deleteSelected);

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

async function goToAnimeDetail(animeId, episode) {
    const allowed = await window.checkMaintenanceAccess();
    if (allowed) window.location.href = `/anime-detail.html?id=${animeId}&resumeEp=${episode}`;
}

window.goToAnimeDetail = goToAnimeDetail;
window.toggleSelect = toggleSelect;
loadHistory();
