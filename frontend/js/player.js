const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
const episodeNum = urlParams.get('ep');
let videoUrl = urlParams.get('video');
const episodeTitle = decodeURIComponent(urlParams.get('title') || `Episode ${episodeNum}`);
const resumeTimestamp = parseInt(urlParams.get('resume')) || 0;

if (!videoUrl) {
    console.error('Video path tidak ada');
    alert('Video tidak tersedia');
    window.location.href = '/index.html';
}

const googleDrivePlayer = document.getElementById('googleDrivePlayer');
const animePlayer = document.getElementById('animePlayer');
const videoSource = document.getElementById('videoSource');
const driveIframe = document.getElementById('driveIframe');
const skipBtn = document.getElementById('skipBtn');
const episodeTitleElem = document.getElementById('episodeTitle');
const progressBar = document.getElementById('progressBar');

episodeTitleElem.innerText = episodeTitle;

function isGoogleDriveUrl(url) {
    return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com');
}

function getGoogleDriveEmbedUrl(url) {
    let fileId = null;
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) fileId = match1[1];
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) fileId = match2[1];
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    return url;
}

let watchStartTime = Date.now();
let hasRecorded = false;
let recordedTimer = null;
let isGoogleDrive = false;

if (isGoogleDriveUrl(videoUrl)) {
    isGoogleDrive = true;
    const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
    googleDrivePlayer.style.display = 'block';
    animePlayer.style.display = 'none';
    driveIframe.src = embedUrl;
    recordedTimer = setTimeout(() => { if (!hasRecorded) saveWatchProgressForGoogleDrive(180); }, 30000);
} else {
    isGoogleDrive = false;
    googleDrivePlayer.style.display = 'none';
    animePlayer.style.display = 'block';
    let finalUrl = videoUrl;
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) finalUrl = `/videos/${videoUrl}`;
    videoSource.src = finalUrl;
    animePlayer.load();
    if (resumeTimestamp > 0) {
        animePlayer.addEventListener('loadedmetadata', () => { if (resumeTimestamp < animePlayer.duration) animePlayer.currentTime = resumeTimestamp; });
    }
    animePlayer.addEventListener('play', () => { watchStartTime = Date.now(); });
    animePlayer.addEventListener('timeupdate', () => {
        const currentTime = animePlayer.currentTime;
        const duration = animePlayer.duration;
        if (currentTime > 5 && currentTime < 88) skipBtn.style.display = 'block';
        else skipBtn.style.display = 'none';
        if (duration > 0) progressBar.style.width = `${(currentTime / duration) * 100}%`;
        if (!hasRecorded && duration > 0 && (currentTime / duration) > 0.95) saveWatchProgressForMp4(true);
    });
    skipBtn.addEventListener('click', () => { animePlayer.currentTime = 90; skipBtn.style.display = 'none'; });
    animePlayer.addEventListener('ended', () => { saveWatchProgressForMp4(true); if (recordedTimer) clearTimeout(recordedTimer); });
    recordedTimer = setInterval(() => { if (animePlayer && !animePlayer.paused && animePlayer.currentTime > 0 && !hasRecorded) saveWatchProgressForMp4(false); }, 15000);
}

async function saveWatchProgressForMp4(isComplete = false) {
    if (hasRecorded) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const currentTime = Math.floor(animePlayer.currentTime);
    const watchSeconds = Math.floor((Date.now() - watchStartTime) / 1000);
    if (currentTime < 3 && !isComplete) return;
    try {
        await axios.post('/api/history/add', { animeId, animeTitle: '', watchTime: currentTime, episode: episodeNum }, { headers: { Authorization: `Bearer ${token}` } });
        if (watchSeconds >= 10 && !hasRecorded) {
            const xpRes = await axios.post('/api/user/add-xp', { watchTime: watchSeconds }, { headers: { Authorization: `Bearer ${token}` } });
            if (xpRes.data.leveledUp && typeof updateLevelBadge === 'function') { alert(`🎉 LEVEL UP! Kamu sekarang Level ${xpRes.data.level}!`); updateLevelBadge(); }
            hasRecorded = true;
        }
    } catch (err) { console.error('Gagal simpan progress:', err); }
}

async function saveWatchProgressForGoogleDrive(watchSeconds) {
    if (hasRecorded) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    hasRecorded = true;
    try {
        await axios.post('/api/history/add', { animeId, animeTitle: '', watchTime: watchSeconds, episode: episodeNum }, { headers: { Authorization: `Bearer ${token}` } });
        const xpRes = await axios.post('/api/user/add-xp', { watchTime: watchSeconds }, { headers: { Authorization: `Bearer ${token}` } });
        if (xpRes.data.leveledUp && typeof updateLevelBadge === 'function') { alert(`🎉 LEVEL UP! Kamu sekarang Level ${xpRes.data.level}!`); updateLevelBadge(); }
    } catch (err) { console.error('Gagal simpan progress Google Drive:', err); hasRecorded = false; }
}

window.addEventListener('beforeunload', () => {
    if (!isGoogleDrive && animePlayer && animePlayer.currentTime > 0) {
        const token = localStorage.getItem('token');
        if (token) navigator.sendBeacon('/api/history/add', new Blob([JSON.stringify({ animeId, watchTime: Math.floor(animePlayer.currentTime), episode: episodeNum })], { type: 'application/json' }));
    }
});

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
