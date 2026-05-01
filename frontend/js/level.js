async function updateLevelBadge() {
    const token = localStorage.getItem('token');
    const badge = document.getElementById('levelBadge');
    
    if (!token) {
        if (badge) badge.innerHTML = '⭐ Belum Login';
        return;
    }
    
    try {
        const res = await axios.get('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { level, xp, totalWatchTime } = res.data;
        const hours = Math.floor(totalWatchTime / 3600);
        
        if (badge) {
            badge.innerHTML = `⭐ Lv.${level} | ${xp % 100}/100 XP | ${hours} jam`;
        }
    } catch (err) {
        if (badge) badge.innerHTML = '⭐ Lv.--';
    }
}

document.addEventListener('DOMContentLoaded', updateLevelBadge);
setInterval(updateLevelBadge, 30000);
