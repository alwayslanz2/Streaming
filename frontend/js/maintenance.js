// File: frontend/js/maintenance.js

let maintenanceCache = null;
let lastFetch = 0;
const CACHE_TTL = 30000;

async function getMaintenanceData() {
    const now = Date.now();
    if (maintenanceCache && (now - lastFetch) < CACHE_TTL) return maintenanceCache;
    try {
        const res = await fetch('/data/maintenance.json');
        const data = await res.json();
        maintenanceCache = data;
        lastFetch = now;
        return data;
    } catch (err) {
        return { maintenance_mode: false, access_code: 'REU2024' };
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
}

async function checkMaintenanceAccess() {
    const data = await getMaintenanceData();
    
    // Jika maintenance OFF, akses bebas
    if (!data.maintenance_mode) return true;
    
    // PENGECUALIAN: Halaman Kontak tetap bisa diakses tanpa kode
    if (window.location.pathname === '/kontak.html') {
        console.log('📞 Halaman Kontak - akses bebas saat maintenance');
        return true;
    }
    
    // Cek cookie bypass
    const bypassCookie = getCookie('maintenance_access');
    if (bypassCookie === data.access_code) return true;
    
    // Minta kode akses
    const userCode = prompt('🔧 MAINTENANCE MODE\n\nWebsite sedang dalam perbaikan.\nMasukkan kode akses untuk melanjutkan:');
    
    if (userCode === data.access_code) {
        setCookie('maintenance_access', data.access_code, 24);
        return true;
    } else {
        alert('❌ Kode akses salah!');
        return false;
    }
}

window.checkMaintenanceAccess = checkMaintenanceAccess;
window.getMaintenanceData = getMaintenanceData;
