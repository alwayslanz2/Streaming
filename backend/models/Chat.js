import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Chat', ChatSchema);
