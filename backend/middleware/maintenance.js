import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAINTENANCE_FILE = path.join(__dirname, '../../frontend/data/maintenance.json');

console.log('📁 Maintenance middleware - file path:', MAINTENANCE_FILE);

function getMaintenanceData() {
    try {
        if (fs.existsSync(MAINTENANCE_FILE)) {
            const data = fs.readFileSync(MAINTENANCE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Gagal baca maintenance.json:', err.message);
    }
    return { maintenance_mode: false, access_code: 'REU2024' };
}

export default function maintenanceMiddleware(req, res, next) {
    // Skip untuk API, assets, dan file penting
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/videos/') ||
        req.path === '/data/maintenance.json' ||
        req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        return next();
    }
    
    const maintenanceData = getMaintenanceData();
    
    // Cek cookie bypass
    const accessCookie = req.cookies?.maintenance_access;
    if (accessCookie && accessCookie === maintenanceData.access_code) {
        console.log('✅ Bypass maintenance via cookie for:', req.path);
        return next();
    }
    
    // Jika maintenance mode AKTIF, tampilkan halaman maintenance
    if (maintenanceData.maintenance_mode === true) {
        console.log('🔴 Maintenance mode ACTIVE - blocking:', req.path);
        return res.status(503).send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Maintenance - AnimeStream</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
                        color: #e0e0e0;
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .maintenance-container {
                        text-align: center;
                        padding: 40px;
                        max-width: 500px;
                    }
                    .maintenance-icon {
                        font-size: 80px;
                        margin-bottom: 20px;
                        animation: spin 2s ease infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        50% { transform: rotate(10deg); }
                        100% { transform: rotate(0deg); }
                    }
                    h1 { font-size: 32px; margin-bottom: 16px; background: linear-gradient(135deg, #fff, #e94560); -webkit-background-clip: text; background-clip: text; color: transparent; }
                    p { color: #888; margin-bottom: 24px; line-height: 1.6; }
                    .access-form { background: #111; padding: 24px; border-radius: 16px; border: 1px solid #1a1a1a; }
                    .access-form input { width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #222; border-radius: 8px; color: white; font-size: 14px; margin-bottom: 12px; text-align: center; }
                    .access-form input:focus { outline: none; border-color: #e94560; }
                    .access-form button { width: 100%; padding: 12px; background: linear-gradient(135deg, #e94560, #ff6b6b); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px; }
                    .access-form button:active { transform: scale(0.98); }
                    .error-msg { color: #e94560; margin-top: 12px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="maintenance-container">
                    <div class="maintenance-icon">🔧</div>
                    <h1>Sedang dalam Perbaikan</h1>
                    <p>Website sedang dalam masa maintenance.<br>Admin sedang menambahkan anime baru.</p>
                    <div class="access-form">
                        <input type="password" id="accessCode" placeholder="Masukkan kode akses">
                        <button onclick="submitAccess()">Akses sebagai Admin</button>
                        <div id="errorMsg" class="error-msg"></div>
                    </div>
                </div>
                <script>
                    async function submitAccess() {
                        const code = document.getElementById('accessCode').value;
                        if (!code) {
                            document.getElementById('errorMsg').innerText = 'Masukkan kode akses';
                            return;
                        }
                        try {
                            const res = await fetch('/api/maintenance/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ code: code })
                            });
                            const data = await res.json();
                            if (res.ok) {
                                window.location.reload();
                            } else {
                                document.getElementById('errorMsg').innerText = data.error || 'Kode akses salah';
                            }
                        } catch (err) {
                            document.getElementById('errorMsg').innerText = 'Terjadi kesalahan';
                        }
                    }
                </script>
            </body>
            </html>
        `);
    }
    
    next();
}
