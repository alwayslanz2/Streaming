import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/auth.js';
import animeRoutes from './routes/anime.js';
import historyRoutes from './routes/history.js';
import userRoutes from './routes/user.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Static files
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use('/videos', express.static(path.join(__dirname, '../frontend/videos')));
app.use(express.static(path.join(__dirname, '../frontend')));

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI tidak ditemukan di .env!');
  process.exit(1);
}

async function ensureAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@animestream.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
        const adminUsername = process.env.ADMIN_USERNAME || 'AdminSuper';
        
        // Cek admin
        let adminUser = await User.findOne({ email: adminEmail });
        
        if (!adminUser) {
            // Buat admin baru
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            adminUser = new User({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                level: 99999,
                xp: 9999900,
                totalWatchTime: 9999900
            });
            await adminUser.save();
            console.log('✅ Admin super user CREATED!');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log('✅ Admin super user already exists');
        }
        
        // Verifikasi password
        const isValid = await bcrypt.compare(adminPassword, adminUser.password);
        if (isValid) {
            console.log('✅ Admin password valid');
        } else {
            console.log('⚠️ Admin password invalid, resetting...');
            const salt = await bcrypt.genSalt(10);
            const newHashedPassword = await bcrypt.hash(adminPassword, salt);
            adminUser.password = newHashedPassword;
            await adminUser.save();
            console.log('✅ Admin password reset successfully');
        }
        
    } catch (err) {
        console.error('❌ Error ensuring admin user:', err);
    }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await ensureAdminUser();
  })
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user', userRoutes);

// HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.get('/jadwal.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/jadwal.html'));
});
app.get('/history.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/history.html'));
});
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});
app.get('/all-anime.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/all-anime.html'));
});
app.get('/anime-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/anime-detail.html'));
});
app.get('/watch.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/watch.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
