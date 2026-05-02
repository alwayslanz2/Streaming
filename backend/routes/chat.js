import express from 'express';
import Chat from '../models/Chat.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET semua chat (100 terakhir)
router.get('/messages', async (req, res) => {
    try {
        const messages = await Chat.find().sort({ timestamp: -1 }).limit(100);
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST kirim pesan
router.post('/messages', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const user = await User.findById(req.userId);
        
        if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
        }
        
        const newChat = new Chat({
            userId: req.userId,
            username: user.username,
            message: message.substring(0, 500),
            timestamp: new Date()
        });
        await newChat.save();
        
        res.json({ success: true, message: newChat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE hapus pesan (hanya admin)
router.delete('/messages/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.level < 99999) {
            return res.status(403).json({ error: 'Hanya admin yang bisa menghapus' });
        }
        await Chat.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
