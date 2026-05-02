import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  title: { type: String, required: true },
  videoUrl: { type: String, required: true }
});

const AnimeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  cover: { type: String, required: true },
  synopsis: { type: String, required: true },
  genre: { type: [String], required: true },
  studio: { type: String, required: true },
  rating: { type: Number, default: 0 },
  views: { type: String, default: "0" },
  latestEpisode: { type: Number, default: 1 },
  uploadDate: { type: String, required: true },
  scheduleDay: { type: String, default: "" },
  scheduleStatus: { type: String, default: "" },
  isTrending: { type: Boolean, default: false },
  episodes: { type: [EpisodeSchema], default: [] }
});

export default mongoose.model('Anime', AnimeSchema);
