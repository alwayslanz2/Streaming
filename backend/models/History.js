import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animeId: { type: String, required: true },
  animeTitle: { type: String, required: true },
  episode: { type: Number, default: 1 },
  timestamp: { type: Number, default: 0 }, // detik terakhir nonton
  lastTimestamp: { type: Number, default: 0 }, // untuk resume
  cover: { type: String, default: '' },
  watchedAt: { type: Date, default: Date.now }
});

export default mongoose.model('History', HistorySchema);
