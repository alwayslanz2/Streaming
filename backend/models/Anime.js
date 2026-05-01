import mongoose from 'mongoose';

const AnimeSchema = new mongoose.Schema({
  animeId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  synopsis: { type: String, required: true },
  genre: { type: [String], required: true },
  studio: { type: String, required: true },
  uploadDate: { type: Date, required: true },
  coverImage: { type: String, required: true },
  rating: { type: Number, default: 0 },
  views: { type: String, default: "0" }
});

export default mongoose.model('Anime', AnimeSchema);