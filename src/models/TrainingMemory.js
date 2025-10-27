import mongoose from "mongoose";

const TrainingMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ["fact", "pair"], required: true },
  key: { type: String },      // for pair input
  value: { type: String },    // stored fact or response
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.TrainingMemory || mongoose.model("TrainingMemory", TrainingMemorySchema);
