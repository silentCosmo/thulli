import mongoose from "mongoose";

const BehaviorMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  trigger: { type: String, required: true },
  responses: { type: [String], default: [] }, // array of responses
  category: { type: String, default: "custom" }, // emotion, intent, custom
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Ensure combination of userId + trigger is unique to avoid duplicates
BehaviorMemorySchema.index({ userId: 1, trigger: 1 }, { unique: true });

export default mongoose.models.BehaviorMemory ||
  mongoose.model("BehaviorMemory", BehaviorMemorySchema);
