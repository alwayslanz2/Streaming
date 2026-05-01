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

// ========== DETEKSI GOOGLE DRIVE ==========
function isGoogleDriveUrl(url) {
    return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com');
}

function getGoogleDriveEmbedUrl(url) {
    let fileId = null;
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) fileId = match1[1];
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) fileId = match2[1];
    const match3 = url.match(/uc\?id=([a-zA-Z0-9_-]+)/);
    if (match3) fileId = match3[1];
    const match4 = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (match4) fileId = match4[1];
    
    if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
}

// ========== DETEKSI FILE LANGSUNG (Catbox, dll) ==========
function isDirectVideoUrl(url) {
    return url.match(/\.(mp4|mkv|webm|mov|avi)$/i) !== null;
}

// ========== SETUP PLAYER ==========
let watchStartTime = Date.now();
let hasRecorded = false;
let recordedTimer = null;
let isGoogleDrive = false;

if (isGoogleDriveUrl(videoUrl)) {
    // ========== GOOGLE DRIVE - PAKAI IFRAME ==========
    isGoogleDrive = true;
    const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
    console.log('Google Drive embed URL:', embedUrl);
    
    googleDrivePlayer.style.display = 'block';
    animePlayer.style.display = 'none';
    driveIframe.src = embedUrl;
    
    // Untuk Google Drive, simpan history setelah 30 detik (asumsi user nonton)
    recordedTimer = setTimeout(() => {
        if (!hasRecorded) {
            saveWatchProgressForGoogleDrive(180);
        }
    }, 30000);
    
} else {
    // ========== MP4/MKV LANGSUNG (Catbox, dll) - PAKAI VIDEO TAG ==========
    isGoogleDrive = false;
    googleDrivePlayer.style.display = 'none';
    animePlayer.style.display = 'block';
    
    let finalUrl = videoUrl;
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
        finalUrl = `/videos/${videoUrl}`;
    }
    
    videoSource.src = finalUrl;
    animePlayer.load();
    
    // Resume ke timestamp terakhir
    if (resumeTimestamp > 0) {
        animePlayer.addEventListener('loadedmetadata', () => {
            if (resumeTimestamp < animePlayer.duration) {
                animePlayer.currentTime = resumeTimestamp;
                console.log(`Resume ke detik: ${resumeTimestamp}`);
            }
        });
    }
    
    animePlayer.addEventListener('play', () => {
        watchStartTime = Date.now();
        console.log('Video mulai diputar');
    });
    
    animePlayer.addEventListener('timeupdate', () => {
        const currentTime = animePlayer.currentTime;
        const duration = animePlayer.duration;
        
        // Skip opening button (detik 5-88)
        if (currentTime > 5 && currentTime < 88) {
            skipBtn.style.display = 'block';
        } else {
            skipBtn.style.display = 'none';
        }
        
        // Update progress bar
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            if (progressBar) progressBar.style.width = `${percent}%`;
        }
        
        // Save ketika mencapai 95%
        if (!hasRecorded && duration > 0 && (currentTime / duration) > 0.95) {
            saveWatchProgressForMp4(true);
        }
    });
    
    skipBtn.addEventListener('click', () => {
        animePlayer.currentTime = 90;
        skipBtn.style.display = 'none';
    });
    
    animePlayer.addEventListener('ended', () => {
        console.log('Video selesai');
        saveWatchProgressForMp4(true);
        if (recordedTimer) clearTimeout(recordedTimer);
    });
    
    // Auto save setiap 15 detik untuk MP4
    recordedTimer = setInterval(() => {
        if (animePlayer && !animePlayer.paused && animePlayer.currentTime > 0 && !hasRecorded) {
            saveWatchProgressForMp4(false);
        }
    }, 15000);
}

// ========== FUNGSI SAVE HISTORY & XP UNTUK MP4 ==========
async function saveWatchProgressForMp4(isComplete = false) {
    if (hasRecorded) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token, tidak bisa simpan history');
        return;
    }
    
    const currentTime = Math.floor(animePlayer.currentTime);
    const watchSeconds = Math.floor((Date.now() - watchStartTime) / 1000);
    
    if (currentTime < 3 && !isComplete) {
        console.log('Waktu terlalu singkat, skip save');
        return;
    }
    
    console.log(`Menyimpan MP4 progress: currentTime=${currentTime} detik, watchDuration=${watchSeconds} detik`);
    
    try {
        await axios.post('/api/history/add', {
            animeId: animeId,
            animeTitle: '',
            watchTime: currentTime,
            episode: episodeNum
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log('History MP4 berhasil disimpan');
        
        if (watchSeconds >= 10 && !hasRecorded) {
            const xpRes = await axios.post('/api/user/add-xp', {
                watchTime: watchSeconds
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            console.log('XP berhasil diupdate:', xpRes.data);
            
            if (xpRes.data.leveledUp) {
                alert(`🎉 LEVEL UP! Kamu sekarang Level ${xpRes.data.level}!`);
            }
            
            if (typeof updateLevelBadge === 'function') {
                updateLevelBadge();
            }
            hasRecorded = true;
        }
        
    } catch (err) {
        console.error('Gagal simpan progress MP4:', err);
    }
}

// ========== FUNGSI SAVE HISTORY & XP UNTUK GOOGLE DRIVE ==========
async function saveWatchProgressForGoogleDrive(watchSeconds) {
    if (hasRecorded) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token, tidak bisa simpan history');
        return;
    }
    
    hasRecorded = true;
    console.log(`Menyimpan Google Drive progress: ${watchSeconds} detik`);
    
    try {
        await axios.post('/api/history/add', {
            animeId: animeId,
            animeTitle: '',
            watchTime: watchSeconds,
            episode: episodeNum
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log('History Google Drive berhasil disimpan');
        
        const xpRes = await axios.post('/api/user/add-xp', {
            watchTime: watchSeconds
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log('XP berhasil diupdate:', xpRes.data);
        
        if (xpRes.data.leveledUp) {
            alert(`🎉 LEVEL UP! Kamu sekarang Level ${xpRes.data.level}!`);
        }
        
        if (typeof updateLevelBadge === 'function') {
            updateLevelBadge();
        }
        
    } catch (err) {
        console.error('Gagal simpan progress Google Drive:', err);
        hasRecorded = false;
    }
}

// ========== SAVE SEBELUM TUTUP TAB ==========
window.addEventListener('beforeunload', () => {
    if (!isGoogleDrive && animePlayer && animePlayer.currentTime > 0) {
        const token = localStorage.getItem('token');
        if (token) {
            navigator.sendBeacon('/api/history/add', new Blob([JSON.stringify({
                animeId: animeId,
                watchTime: Math.floor(animePlayer.currentTime),
                episode: episodeNum
            })], {type: 'application/json'}));
        }
    }
});

// ========== BOTTOM NAVIGATION ==========
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'home') window.location.href = '/index.html';
        if (page === 'jadwal') window.location.href = '/jadwal.html';
        if (page === 'history') window.location.href = '/history.html';
        if (page === 'profile') window.location.href = '/profile.html';
    });
});
