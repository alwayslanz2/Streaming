async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const res = await axios.get('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;
        
        const hours = Math.floor(user.totalWatchTime / 3600);
        
        const container = document.getElementById('profileContainer');
        if (container) {
            container.innerHTML = `
                <div class="profile-card">
                    <div class="profile-avatar">👤</div>
                    <div class="profile-username">${user.username}</div>
                    <div class="profile-email">${user.email}</div>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-number">${user.level}</div>
                            <div class="stat-label">Level</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${user.xp}</div>
                            <div class="stat-label">Total XP</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${hours}</div>
                            <div class="stat-label">Jam Nonton</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" id="animeCount">-</div>
                            <div class="stat-label">Anime Ditonton</div>
                        </div>
                    </div>
                </div>
                <button class="logout-btn" id="logoutBtnProfile">🚪 Logout dari akun ini</button>
            `;
        }
        
        const historyRes = await axios.get('/api/history', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const uniqueAnime = new Set(historyRes.data.map(h => h.animeId));
        const animeCountElem = document.getElementById('animeCount');
        if (animeCountElem) animeCountElem.innerText = uniqueAnime.size;
        
        const logoutBtn = document.getElementById('logoutBtnProfile');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            });
        }
        
    } catch (err) {
        console.error('Gagal load profile:', err);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
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

loadProfile();
