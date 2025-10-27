import mongoose from 'mongoose';


const ConvSchema = new mongoose.Schema({
userId: { type: String, required: true, index: true },
messages: [{
from: { type: String, enum: ['user', 'assistant'] },
text: String,
timestamp: Date
}],
lastUpdated: { type: Date, default: Date.now }
});


export default mongoose.models.ConversationLog || mongoose.model('ConversationLog', ConvSchema);