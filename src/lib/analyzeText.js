// FILE: lib/analyzeText.js
// --------------------------------------------------
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
const nlp = winkNLP(model);
const its = nlp.its;

// ----------------------------------
// Emotion and Intent Dictionaries
// ----------------------------------
const EMOTION_WORDS = {
  happy: ["happy", "glad", "joy", "excited", "love", "smile", "yay", "fun", "grateful", "awesome"],
  sad: ["sad", "cry", "unhappy", "hurt", "lonely", "down", "depressed", "miss"],
  angry: ["angry", "mad", "furious", "rage", "annoyed", "pissed", "hate"],
  anxious: ["anxious", "worried", "nervous", "scared", "afraid", "tense", "stress"],
  bored: ["bored", "tired", "lazy", "meh"],
  flirty: ["flirt", "cute", "crush", "love you", "handsome", "beautiful", "sweetheart"],
};

const INTENT_PATTERNS = [
  { key: "remember", patterns: ["remember", "note that", "store this", "keep in mind"] },
  { key: "ask_help", patterns: ["help", "advice", "how do i", "what should i", "can you"] },
  { key: "share_feeling", patterns: ["i feel", "i'm feeling", "i am feeling", "feels like"] },
  { key: "gratitude", patterns: ["thanks", "thank you", "appreciate", "grateful", "means a lot"] },
  { key: "creator_ack", patterns: ["i created you", "you are my creation", "i made you", "i built you"] },
  { key: "identify_self", patterns: ["who are you", "your name", "what is your name", "who am i", "what are you"] },
  { key: "affection", patterns: ["i love you", "miss you", "you mean", "i care about you"] },
];

const TOPIC_KEYWORDS = [
  "minecraft", "react", "youtube", "exam", "game", "studio", "money",
  "finance", "thulli", "cosmo", "endurance", "ai", "love", "life", "dream", "friday",
];

const QUESTION_STARTERS = [
  "what", "who", "why", "how", "when", "where",
  "do", "does", "did", "have", "has", "had",
  "is", "are", "was", "were",
  "can", "could", "will", "would", "should", "shall", "may", "might", "am"
];


function detectTone(emotions, sentiment) {
  if (emotions.includes("flirty")) return "intimate";
  if (sentiment > 0.5) return "friendly";
  if (sentiment < -0.5) return "serious";
  return "neutral";
}

function scoreEmotions(text) {
  const scores = {};
  const lower = text.toLowerCase();
  for (const [emotion, words] of Object.entries(EMOTION_WORDS)) {
    const hits = words.filter(w => lower.includes(w));
    if (hits.length) scores[emotion] = Math.min(1, hits.length * 0.2);
  }
  return scores;
}

// ----------------------------------
// 🧠 Main Analyzer
// ----------------------------------
export function analyzeText(text = "") {
  const lower = text.toLowerCase();
  const doc = nlp.readDoc(lower);

  const entities = doc.entities().out(its.value);
  const tokens = doc.tokens().out(its.value);

  const topics = Array.from(new Set([
    ...tokens.filter(t => TOPIC_KEYWORDS.includes(t)),
    ...entities.map(e => e.toLowerCase())
  ]));

  const emotionScores = scoreEmotions(lower);
  const emotions = Object.keys(emotionScores).filter(e => emotionScores[e] > 0);

  const intents = [];
  for (const { key, patterns } of INTENT_PATTERNS) {
  for (const p of patterns) {
    const safeP = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${safeP}\\b`, "i");  // 👈 Only match if pattern is at start
    if (regex.test(lower)) {
      intents.push(key);
      break;
    }
  }
}


  // Detect questions
  // Detect questions (improved)
let isQuestion = false;
const sentences = doc.sentences().out();

// Basic punctuation check
if (sentences.some(s => s.trim().endsWith("?"))) {
  isQuestion = true;
}

// Check if text starts with a question starter
if (!isQuestion) {
  const firstWord = tokens[0]?.toLowerCase() || "";
  if (QUESTION_STARTERS.includes(firstWord)) {
    isQuestion = true;
  }
}

// Handle implicit questions like "do you like", "would you have", "did you eat"
if (!isQuestion) {
  const questionPattern = /^(do|does|did|have|has|had|is|are|was|were|can|could|will|would|should|shall|may|might)\s+you\s+/i;
  if (questionPattern.test(lower)) {
    isQuestion = true;
  }
}

// One-word fallback (like “why” or “who”)
if (!isQuestion && tokens.length === 1 && entities.length === 0) {
  isQuestion = true;
}

if (isQuestion && !intents.includes("question")) intents.push("question");


  let sentiment = 0;
  sentiment += (emotionScores.happy || 0.7 * (emotions.includes("flirty") ? 1 : 0));
  sentiment -= (emotionScores.sad || 0) * 0.6;
  sentiment -= (emotionScores.angry || 0) * 0.7;
  sentiment -= (emotionScores.anxious || 0) * 0.4;

  const tone = detectTone(emotions, sentiment);

  return {
    text,
    lower,
    intents: Array.from(new Set(intents)),
    emotions,
    emotionScores,
    entities,
    topics,
    sentiment: Number(sentiment.toFixed(2)),
    tone,
    isQuestion,
  };
}
