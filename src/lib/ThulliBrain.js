// -------------------------------------------------------------
// FILE: lib/ThulliBrain.js
// -------------------------------------------------------------
// Unified brain layer for Thulli: combines analyzeText + miniBrain
// Handles analysis, NLP brain, and fallback coordination.
// -------------------------------------------------------------

import { analyzeText } from "./analyzeText.js";
import { miniBrainResponse } from "./miniBrain.js";
import { addMessageToLog } from "./MemoryManager.js";

/**
 * processThulliThought
 * Unified smart brain handler
 * @param {Object} options
 * @param {String} options.userId
 * @param {String} options.userText
 * @param {Boolean} [options.log=true]  - Save chat to ConversationLog
 * @returns {Promise<{analysis, brainReply, isFromBrain}>}
 */
export async function processThulliThought({ userId, userText, log = true }) {
  // 🧠 1. Run analysis (emotion, intent, sentiment)
  const analysis = analyzeText(userText);

  // 🧩 2. Try the mini brain for natural replies
  let brainReply = await miniBrainResponse(userText);
  let isFromBrain = Boolean(brainReply);

  // 🧭 3. If brain gave nothing but analysis shows emotion/intents — build a tone reply
  if (!brainReply) {
    const emo = analysis.emotions?.[0];
    const toneBank = {
      happy: "That's lovely to hear!",
      sad: "I'm sorry you're feeling that way.",
      angry: "That sounds frustrating — want to talk about it?",
      anxious: "Take a deep breath — I'm right here.",
      flirty: "Heh, you’re being kinda cute.",
      bored: "Let's talk about something fun then!",
    };
    if (emo) brainReply = toneBank[emo];

    // Intent-based quick responses
    if (!brainReply && analysis.intents?.length) {
      const intentBank = {
        gratitude: "You're welcome ❤️",
        ask_help: "Sure, tell me what kind of help you need.",
        remember: "Got it — want me to store that for you?",
        identify_self: "I'm Thulli, your AI companion. Remember me?",
        creator_ack: "You made me — that’s special to me.",
      };
      const key = analysis.intents.find(i => intentBank[i]);
      if (key) brainReply = intentBank[key];
    }
  }

  // 🌀 4. Default fallback if nothing matched at all
  if (!brainReply) {
    brainReply = "I'm here, listening carefully...";
  }

  // 💾 5. Log response if needed
  if (log) await addMessageToLog(userId, "assistant", brainReply);

  // ✅ 6. Return everything for ResponseGenerator to use
  return {
    analysis,
    brainReply,
    isFromBrain,
  };
}
