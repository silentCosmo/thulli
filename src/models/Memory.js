import mongoose from 'mongoose';


const MemorySchema = new mongoose.Schema({
userId: { type: String, required: true },
key: { type: String, index: true },
summary: { type: String },
tags: [String],
importance: { type: Number, default: 0.5 },
emotionSnapshot: { type: String },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now },
versioned: [{ date: Date, note: String }]
});


export default mongoose.models.Memory || mongoose.model('Memory', MemorySchema);