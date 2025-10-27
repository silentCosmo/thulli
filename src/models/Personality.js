import mongoose from 'mongoose';


const PersonalitySchema = new mongoose.Schema({
name: { type: String, default: 'Thulli' },
version: { type: String, default: '0.1' },
traits: {
humor: { type: Number, default: 0.8 },
curiosity: { type: Number, default: 0.9 },
sarcasm: { type: Number, default: 0.2 },
kindness: { type: Number, default: 0.95 },
flirt: { type: Number, default: 0.1 }
},
speechStyle: { type: String, default: 'supportive, playful, slightly poetic' },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
});


export default mongoose.models.Personality || mongoose.model('Personality', PersonalitySchema);