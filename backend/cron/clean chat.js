import cron from 'node-cron';
import Chat from '../models/Chat.js';

export function startChatCleanupJob() {
    // Setiap hari jam 00:00 WIB = UTC 17:00 (karena WIB = UTC+7)
    cron.schedule('0 17 * * *', async () => {
        console.log('🧹 Menghapus semua chat (00:00 WIB)...');
        try {
            const result = await Chat.deleteMany({});
            console.log(`✅ ${result.deletedCount} chat dihapus`);
        } catch (err) {
            console.error('❌ Gagal hapus chat:', err);
        }
    });
}
