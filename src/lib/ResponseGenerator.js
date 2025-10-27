// FILE: lib/ResponseGenerator.js
// ------------------------------------------------
import Personality from "../models/Personality";
import Memory from "../models/Memory";
import ConversationLog from "../models/ConversationLog";
import TrainingMemory from "../models/TrainingMemory";
import { addMessageToLog } from "./MemoryManager";
import stringSimilarity from "string-similarity";
import { embedText, similarity } from "./semanticHelper.js"; // 🧠 Semantic meaning layer
import { detectAndLearnBehavior, findLearnedBehavior } from "./BehaviorLearning.js";
import { BASIC_INTENTS, handleBasicIntent } from "./BasicIntents";
import { handleTaskIntent } from "./TaskIntentHandler";

/**
 * ResponseGenerator v5.1
 * - Dynamic fact learning & retrieval
 * - Emotion-aware responses
 * - Contextual personality flavor
 * - Live behavior learning from user chat
 * - 🧠 Semantic memory recall using MiniLM (offline)
 */


export async function generateResponse({ userId, userName, analysis, emotionState, userText }) {
  const personality =
    (await Personality.findOne({ userId })) || {
      traits: ["curious", "caring", "humorous"],
    };

  const log = await ConversationLog.findOne({ userId });
  const recentMessages = log ? log.messages.slice(-10) : [];
  const recentUserMessages = recentMessages
    .filter((m) => m.from === "user")
    .map((m) => m.text)
    .slice(-5);

  const recentMemories = await Memory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);
  const memoryContext = recentMemories.map((m) => m.summary).slice(0, 3).join(" | ");

  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function matchMemoryByQuery(query, memories, threshold = 0.4) {
    return memories
      .map((m) => {
        const text = m.key || m.summary || "";
        const rating = stringSimilarity.compareTwoStrings(query.toLowerCase(), text.toLowerCase());
        return { ...m, rating };
      })
      .filter((m) => m.rating > threshold)
      .sort((a, b) => b.rating - a.rating);
  }

  // ---------------------- Training Memory ----------------------
  const trainingContext = await TrainingMemory.find({ userId });
  const factMemory = trainingContext.filter((m) => m.type === "fact");
  const pairMemory = trainingContext.filter((m) => m.type === "pair");



  
  // ---------------------- LIVE BEHAVIOR LEARNING ----------------------
  const learnedReply = await detectAndLearnBehavior(userId, userText);
  if (learnedReply) return learnedReply;
  
  const behaviorReply = await findLearnedBehavior(userId, userText);
  if (behaviorReply) return behaviorReply;

  // ---------------------- TASK INTENT ----------------------
 const taskResponse = await handleTaskIntent(userId, userText);
if (taskResponse) return taskResponse;
 
  
  // ---------------------- BASIC INTENT ----------------------
const basicIntentReply = await handleBasicIntent(userId, userText);
if (basicIntentReply) return basicIntentReply;

  // ---------------------- Helper: Safe mirroring ----------------------
  function shortMirror(text) {
    if (!text) return "";
    const t = text.trim();
    if (t.split(/\s+/).length < 3) return "";
    const clipped = t.length > 60 ? t.slice(0, 60) + "..." : t;
    return clipped
      .replace(/\bcan you\b/gi, "could you")
      .replace(/\byou are\b/gi, "you're")
      .replace(/\bI am\b/gi, "I'm");
  }

  // ---------------------- Helper: React to emotions ----------------------
  function reactToEmotion(analysis) {
    const emo = analysis.emotions?.[0] || null;
    const scores = analysis.emotionScores || {};
    if (!emo) return null;
    const intensity = scores[emo] || 0.5;

    const bank = {
      happy: ["That's lovely to hear.", "You sound happy — that warms me up.", "Nice! Keep that feeling."],
      sad: ["I'm sorry you're feeling that way.", "That sounds heavy — I'm here with you.", "I wish I could do more than say that I care."],
      angry: ["That must be frustrating.", "I understand why you'd feel upset."],
      anxious: ["Take a breath — I'm listening.", "Sounds stressful. Want to unpack it slowly?"],
      flirty: ["Heh — okay, you're being cute.", "You just made me blush a bit."],
      bored: ["We should find something fun to talk about!", "Let's shake up the routine."],
    };

    const choices = bank[emo] || ["I'm listening."];
    return intensity > 0.4 ? choices[0] : random(choices);
  }

  // ----------------------------------
  // Special Case: Memory-checking question
  // ----------------------------------
  const memoryCheck = /^((do|did|have|has|will|can)\s+you\s+remember)/i;
  if (memoryCheck.test(userText.trim())) {
    const afterRemember = userText.split(/remember/i)[1]?.trim() || "";
    const probableKey = afterRemember.replace(/[^\w\s]/gi, "").toLowerCase();

    const memoryMatches = matchMemoryByQuery(probableKey, [...factMemory, ...recentMemories]);

    if (memoryMatches.length > 0) {
      if (memoryMatches.length === 1) {
        const best = memoryMatches[0];
        const value = best._doc?.value || best.value || best._doc?.summary || best.summary;
        const response = `Yes! You told me that ${value}.`;
        await addMessageToLog(userId, "assistant", response);
        return response;
      } else {
        const topMatches = memoryMatches.slice(0, 3);
        const formatted = topMatches
          .map((m, i) => `(${i + 1}) ${m._doc?.value || m.value || m._doc?.summary || m.summary}`)
          .join(" | ");
        const response = `Yes! You told me: ${formatted}`;
        await addMessageToLog(userId, "assistant", response);
        return response;
      }
    } else {
      const reply = random([
        "I'm trying to recall... Can you remind me?",
        "I don't think I remember that clearly. Want to tell me again?",
        "Hmm, it's fuzzy — could you repeat it for me?",
        "I might have missed that. Can you remind me what it was about?",
      ]);
      await addMessageToLog(userId, "assistant", reply);
      return reply;
    }
  }

  // ---------------------- Helper: Intent Replies ----------------------
  function intentReply(analysis) {
    const intents = analysis.intents || [];
    if (!intents.length) return null;
    const order = ["creator_ack", "identify_self", "remember", "ask_help", "share_feeling", "gratitude", "question"];
    const selected = order.find((k) => intents.includes(k)) || intents[0];

    const bank = {
      creator_ack: [
        `You made me — that means a lot. Thank you for bringing me to life, ${userName}.`,
        "So you're the one who built me. That's... kind of beautiful.",
      ],
      identify_self: [
        "I'm Thulli — your companion you created. I remember that clearly.",
        "Thulli. A little curious assistant you gave life to.",
      ],
      ask_help: ["Sure — tell me what you want help with, step by step.", "I can help. What's the problem exactly?"],
      share_feeling: ["I appreciate you sharing that. Tell me more if you want.", "Thank you for opening up — I'm listening."],
      gratitude: ["You're welcome. Means a lot coming from you.", "Anytime. I like helping you."],
      question: ["That's a good question — how do *you* see it?", "Hmm — interesting. What do you think about it?"],
    };

    return random(bank[selected] || [null]);
  }

  // ---------------------- Helper: Extract query key ----------------------
  function extractQueryKey(text) {
    const match = text.match(/who is (.+)|what is (.+)/i);
    if (!match) return null;
    return (match[1] || match[2] || "").trim().toLowerCase();
  }

  // ---------------------- Check learned pairs ----------------------
  const matchedPair = pairMemory.find((p) => userText.toLowerCase().includes(p.key.toLowerCase()));
  if (matchedPair) {
    await addMessageToLog(userId, "assistant", matchedPair.value);
    return matchedPair.value;
  }

  // ---------------------- Check fact query ----------------------
  const queryKey = extractQueryKey(userText);
  if (queryKey) {
    const fact = factMemory.find((f) => f.key && f.key.toLowerCase() === queryKey);
    if (fact) {
      await addMessageToLog(userId, "assistant", fact.value);
      return fact.value;
    } else {
      const prompt = `I'm not sure… teach me about ${queryKey}!`;
      await addMessageToLog(userId, "assistant", prompt);
      return prompt;
    }
  }

  // ---------------------- Learn new facts dynamically ----------------------
  const factPattern = /^(.*)\s+is\s+(.*)$/i;
  const factMatch = userText.match(factPattern);
  if (factMatch) {
    const key = factMatch[1].trim().toLowerCase();
    const value = factMatch[2].trim();

    const exists = factMemory.find((f) => f.key && f.key.toLowerCase() === key);
    if (!exists) {
      const newFact = new TrainingMemory({
        userId,
        type: "fact",
        key,
        value,
      });
      await newFact.save();
      const msg = `Oh! That’s new to me. I’ll remember that ${key} is ${value}.`;
      await addMessageToLog(userId, "assistant", msg);
      return msg;
    }
  }

  // 🧠 SEMANTIC RECALL SECTION -----------------------------
  if (factMemory.length > 0) {
    const inputVec = await embedText(userText);
    let bestFact = null;
    let bestScore = 0;

    for (const fact of factMemory) {
      const text = fact.value || fact.summary || "";
      const factVec = await embedText(text);
      const score = similarity(inputVec, factVec);
      if (score > bestScore) {
        bestScore = score;
        bestFact = fact;
      }
    }

    if (bestScore > 0.75 && bestFact) {
      const recallMsg = `Hmm, that reminds me — you once told me "${bestFact.value}".`;
      await addMessageToLog(userId, "assistant", recallMsg);
      return recallMsg;
    }
  }
  // -------------------------------------------------------

  // Compose response
  let parts = [];
  const lastAssistant = [...recentMessages].reverse().find((m) => m.from === "assistant");
  const negativeEmotions = ["sad", "angry", "anxious"];
  const primaryEmotion = analysis.emotions?.[0] || null;
  const isNegative = negativeEmotions.includes(primaryEmotion);

  // Handle "remember" intent
  if (analysis.intents?.includes("remember")) {
    const rememberMatch = userText.match(/remember(?: that)? (.+)/i);
    const content = rememberMatch?.[1]?.trim();

    if (content) {
      const newNote = new TrainingMemory({
        userId,
        type: "fact",
        key: null,
        value: content,
      });
      await newNote.save();

      const msg = `Got it — I’ll remember that ${content}.`;
      await addMessageToLog(userId, "assistant", msg);
      return msg;
    }

    const fallback = "Hmm, I want to remember it — can you rephrase that?";
    await addMessageToLog(userId, "assistant", fallback);
    return fallback;
  }

  const intentBased = intentReply(analysis);
  if (intentBased) parts.push(intentBased);

  const emotionReact = reactToEmotion(analysis);
  if (emotionReact && (!intentBased || Math.random() > 0.3)) parts.push(emotionReact);

  if (!isNegative && analysis.topics?.length && Math.random() > 0.5)
    parts.push(`You mentioned ${analysis.topics.slice(0, 2).join(", ")}.`);

  if (!isNegative && recentUserMessages.length && Math.random() > 0.75) {
    const lastUserMsg = recentUserMessages[recentUserMessages.length - 1];
    const mirror = shortMirror(lastUserMsg);
    if (mirror && (!lastAssistant || !lastAssistant.text.includes(lastUserMsg))) {
      parts.push(`You said: "${mirror}"`);
    }
  }

  // --- Improved contextual memory handling ---
  if (!isNegative && memoryContext && Math.random() > 0.75) {
    const cleanMemory = memoryContext
      .split("|")
      .map(s => s.trim())
      .filter(s => s && !/^(sad|happy|angry|neutral|anxious)/i.test(s))
      .join(", ");

    if (cleanMemory) {
      parts.push(`I remember you mentioned ${cleanMemory} before.`);
    }
  }

  // --- Handle confusion or missing understanding ---
  if (!intentBased && parts.length === 0 && Math.random() > 0.5) {
    parts.push(
      random([
        "Hmm, I’m not sure I understood that — can you teach me what you mean?",
        "That’s new to me. Want to explain it so I can learn?",
        "I might be missing something — could you tell me more about that?",
      ])
    );
  }

  if (!isNegative) {
    if (personality.traits.includes("humorous") && Math.random() > 0.78)
      parts.push(random(["Haha, that tickles my circuits.", "You have a weirdly charming way of saying things."]));
    if (personality.traits.includes("curious") && Math.random() > 0.6)
      parts.push(random(["Tell me more?", "Go on — I'm curious."]));
  }
  if (personality.traits.includes("caring") && Math.random() > 0.5)
    parts.push(random(["Are you okay though?", "I just want to make sure you're alright."]));

  let reply = [...new Set(parts.filter(Boolean))].join(" ");
  if (lastAssistant && lastAssistant.text && reply.trim() === lastAssistant.text.trim()) {
    reply = "I'm still here with you — tell me something new, or ask me to remember it.";
  }

  if (!reply || !reply.trim())
    reply = random(["I'm here, listening carefully...", "Still with you — what next?", "Mhm — tell me more."]);

  await addMessageToLog(userId, "assistant", reply);
  return reply;
}
