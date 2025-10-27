// FILE: lib/MemoryManager.js
// ---------------------------------------------
import Memory from '../models/Memory';
import ConversationLog from '../models/ConversationLog';
import { analyzeText } from './analyzeText';

export const MAX_CONVERSATION_WINDOW = 30; // keep last N messages in ConversationLog

export async function addMessageToLog(userId, from, text) {
  const now = new Date();
  let log = await ConversationLog.findOne({ userId });
  if (!log) log = new ConversationLog({ userId, messages: [] });
  log.messages.push({ from, text, timestamp: now });
  if (log.messages.length > MAX_CONVERSATION_WINDOW) log.messages = log.messages.slice(-MAX_CONVERSATION_WINDOW);
  log.lastUpdated = now;
  await log.save();
  return log;
}

export async function shouldSummarize(userId) {
  const log = await ConversationLog.findOne({ userId });
  if (!log) return false;
  const userMsgs = log.messages.filter(m => m.from === 'user').length;
  return userMsgs >= 6;
}

export async function summarizeAndStore(userId) {
  const log = await ConversationLog.findOne({ userId });
  if (!log || log.messages.length === 0) return null;

  const combined = log.messages.map(m => m.text).join(' ');
  const analysis = analyzeText(combined);
  const dominantEmotion = analysis.emotions.length ? analysis.emotions[0] : 'neutral';
  const tags = analysis.topics.slice(0, 5);
  const summaryText = `${dominantEmotion} about ${tags.length ? tags.join(', ') : 'general topics'}`;
  let importance = 0.4;
  if (analysis.intents && analysis.intents.includes('remember')) importance = 1.0;
  if (analysis.sentiment > 0.6 || analysis.sentiment < -0.6) importance = Math.min(1, importance + 0.2);

  const mem = new Memory({ userId, key: `${dominantEmotion}:${Date.now()}`, summary: summaryText, tags, importance, emotionSnapshot: dominantEmotion });
  await mem.save();

  log.messages = []; // keep short-term logs only
  await log.save();
  return mem;
}

// -----------------------------
// Full implementation of compactMemoriesIfNeeded
export async function compactMemoriesIfNeeded(userId, thresholdCount = 500) {
  // Count current memories
  const totalCount = await Memory.countDocuments({ userId });
  if (totalCount <= thresholdCount) return;

  // Find oldest low-importance memories to compact
  const oldMemories = await Memory.find({ userId, importance: { $lt: 0.3 } }).sort({ createdAt: 1 }).limit(50);
  if (oldMemories.length < 2) return;

  // Merge summaries by first tag
  const grouped = {};
  oldMemories.forEach(mem => {
    const tag = (mem.tags && mem.tags[0]) || 'misc';
    grouped[tag] = grouped[tag] || [];
    grouped[tag].push(mem);
  });

  for (const tag in grouped) {
    const items = grouped[tag];
    if (items.length < 2) continue;

    const mergedSummary = items.map(i => i.summary).slice(0, 20).join(' | ');
    const merged = new Memory({
      userId,
      key: `compacted:${tag}:${Date.now()}`,
      summary: mergedSummary,
      tags: [tag],
      importance: 0.25,
      emotionSnapshot: 'mixed'
    });
    await merged.save();

    const idsToDelete = items.map(i => i._id);
    await Memory.deleteMany({ _id: { $in: idsToDelete } });
  }
}
