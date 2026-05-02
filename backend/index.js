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
import chatRoutes from './routes/chat.js';
import User from './models/User.js';
import { startChatCleanupJob } from './cron/cleanChat.js';

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
app.use('/data', express.static(path.join(__dirname, '../frontend/data')));
app.use('/videos', express.static(path.join(__dirname, '../frontend/videos')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI tidak ditemukan di .env!');
    process.exit(1);
}

async function ensureAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@animestream.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
        const adminUsername = process.env.ADMIN_USERNAME || 'AdminSuper';
        
        let adminUser = await User.findOne({ email: adminEmail });
        
        if (!adminUser) {
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
        } else {
            console.log('✅ Admin super user already exists');
        }
    } catch (err) {
        console.error('Admin creation error:', err);
    }
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await ensureAdminUser();
        startChatCleanupJob();
    })
    .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/jadwal.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/jadwal.html')));
app.get('/history.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/history.html')));
app.get('/profile.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/profile.html')));
app.get('/all-anime.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/all-anime.html')));
app.get('/anime-detail.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/anime-detail.html')));
app.get('/watch.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/watch.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/register.html')));
app.get('/kontak.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/kontak.html')));
app.get('/chat.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/chat.html')));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
