import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const MAINTENANCE_FILE = path.join(__dirname, '../../frontend/data/maintenance.json');

console.log('📁 Maintenance route - file path:', MAINTENANCE_FILE);

function readMaintenanceFile() {
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

function writeMaintenanceFile(data) {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(MAINTENANCE_FILE, content, 'utf8');
    console.log('✅ Maintenance file updated:', data);
    return true;
}

// Verify access code (untuk bypass maintenance)
router.post('/verify', (req, res) => {
    const { code } = req.body;
    const maintenanceData = readMaintenanceFile();
    
    if (code === maintenanceData.access_code) {
        res.cookie('maintenance_access', code, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            path: '/'
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Kode akses salah' });
    }
});

// Get status maintenance
router.get('/status', (req, res) => {
    const data = readMaintenanceFile();
    res.json({ 
        maintenance_mode: data.maintenance_mode,
        access_code_exists: !!data.access_code
    });
});

// Toggle maintenance mode (on/off)
router.post('/toggle', (req, res) => {
    try {
        const { action, accessCode } = req.body;
        const maintenanceData = readMaintenanceFile();
        
        if (accessCode !== maintenanceData.access_code) {
            return res.status(401).json({ error: 'Kode akses salah' });
        }
        
        maintenanceData.maintenance_mode = (action === 'on');
        writeMaintenanceFile(maintenanceData);
        
        res.json({ success: true, maintenance_mode: maintenanceData.maintenance_mode });
    } catch (err) {
        console.error('Toggle error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update access code
router.post('/update-code', (req, res) => {
    try {
        const { oldCode, newCode } = req.body;
        const maintenanceData = readMaintenanceFile();
        
        if (oldCode !== maintenanceData.access_code) {
            return res.status(401).json({ error: 'Kode akses lama salah' });
        }
        
        if (!newCode || newCode.length < 4) {
            return res.status(400).json({ error: 'Kode akses baru minimal 4 karakter' });
        }
        
        maintenanceData.access_code = newCode;
        writeMaintenanceFile(maintenanceData);
        
        res.json({ success: true, message: 'Kode akses berhasil diubah' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
