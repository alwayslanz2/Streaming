import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animeId: { type: String, required: true },
  animeTitle: { type: String, required: true },
  episode: { type: Number, default: 1 },
  timestamp: { type: Number, default: 0 },
  cover: { type: String, default: '' },
  watchedAt: { type: Date, default: Date.now }
});

HistorySchema.index({ userId: 1, watchedAt: -1 });

export default mongoose.model('History', HistorySchema);
