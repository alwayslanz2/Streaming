import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/auth.js';
import animeRoutes from './routes/anime.js';
import historyRoutes from './routes/history.js';
import userRoutes from './routes/user.js';
import User from './models/User.js';
import Chat from './models/Chat.js';
import { startChatCleanupJob } from './cron/cleanChat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ========== STATIC FILES ==========
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/data', express.static(path.join(__dirname, '../frontend/data')));
app.use('/videos', express.static(path.join(__dirname, '../frontend/videos')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ========== DATABASE CONNECTION ==========
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
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log('✅ Admin super user already exists');
        }
        
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
    startChatCleanupJob(); // Start cron job untuk auto delete chat jam 00 WIB
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// ========== SOCKET.IO (CHAT GLOBAL) ==========
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    
    // Kirim history chat (100 pesan terakhir)
    (async () => {
        try {
            const history = await Chat.find().sort({ timestamp: 1 }).limit(100);
            socket.emit('chat-history', history);
        } catch (err) {
            console.error('Error sending chat history:', err);
        }
    })();
    
    // Listen untuk pesan baru
    socket.on('send-message', async (data) => {
        const { userId, username, message } = data;
        
        if (!message || message.trim() === '') return;
        if (!userId || !username) return;
        
        try {
            const newChat = new Chat({
                userId,
                username,
                message: message.substring(0, 500),
                timestamp: new Date()
            });
            await newChat.save();
            
            // Broadcast ke semua user
            io.emit('new-message', newChat);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });
    
    // Listen untuk hapus pesan (hanya admin)
    socket.on('delete-message', async (data) => {
        const { messageId, isAdmin } = data;
        if (!isAdmin) return;
        
        try {
            await Chat.findByIdAndDelete(messageId);
            io.emit('message-deleted', messageId);
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user', userRoutes);

// ========== HTML ROUTES ==========
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
app.get('/kontak.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/kontak.html'));
});
app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/chat.html'));
});

// ========== START SERVER ==========
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
