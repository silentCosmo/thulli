import { connectToMongo } from "@/lib/mongo";
import { analyzeText } from "@/lib/analyzeText";
import {
  addMessageToLog,
  shouldSummarize,
  summarizeAndStore,
  compactMemoriesIfNeeded,
} from "@/lib/MemoryManager";
import { generateResponse } from "@/lib/ResponseGenerator";
import EmotionEngine from "@/lib/EmotionEngine";
import TrainingMemory from "@/models/TrainingMemory";

// --- CORS Configuration ---
const CORS_HEADERS = {
  // Allow all origins. For production, replace '*' with your specific frontend domain(s).
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // Cache preflight response for 24 hours
};

// --- Emotion Engine Singleton ---
const EMOTION_ENGINES = {};
function getEmotionEngine(userId) {
  if (!EMOTION_ENGINES[userId]) EMOTION_ENGINES[userId] = new EmotionEngine();
  return EMOTION_ENGINES[userId];
}

// =========================================================================
// 1. OPTIONS Handler (Crucial for Vercel/Netlify 405 fix)
// =========================================================================
// Handles the CORS pre-flight request sent by the browser before a cross-origin POST.
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// =========================================================================
// 2. GET Handler (For direct URL access/testing)
// =========================================================================
export async function GET(req) {
  return new Response(JSON.stringify({ message: "This is the Thulli API. Send a POST request with your data." }), { 
    status: 200, 
    headers: { 
      "Content-Type": "application/json",
      ...CORS_HEADERS // Include CORS headers
    } 
  });
}

// =========================================================================
// 3. POST Handler (Your main logic)
// =========================================================================
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId = "cosmo", userName = "Dear", text = "" } = body;

    await connectToMongo();

    if (!text.trim()) {
      return new Response(JSON.stringify({ reply: "I didn't get that. Please say something!" }), { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          ...CORS_HEADERS
        } 
      });
    }

    // ---------- Training commands ----------
    if (text.toLowerCase().startsWith("thulli, remember")) {
      const toRemember = text.replace(/thulli, remember/i, "").trim();
      if (toRemember) {
        await TrainingMemory.create({ userId, type: "fact", value: toRemember });
        return new Response(JSON.stringify({ reply: "Got it! I'll remember that." }), { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...CORS_HEADERS
          } 
        });
      }
    }

    if (text.toLowerCase().startsWith("thulli, if i say")) {
      const match = text.match(/thulli, if i say (.+), you say (.+)/i);
      if (match) {
        const [, input, output] = match;
        await TrainingMemory.create({ userId, type: "pair", key: input.trim(), value: output.trim() });
        return new Response(JSON.stringify({ reply: "Understood! I'll respond like that next time." }), { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...CORS_HEADERS
          } 
        });
      }
    }

    // ---------- Regular processing ----------
    const analysis = analyzeText(text);
    console.log('anal: ', analysis);

    const engine = getEmotionEngine(userId);
    if (analysis.emotions?.length) analysis.emotions.forEach(e => engine.nudge(e, 0.25));
    engine.tick();
    const emotionState = engine.getState();

    await addMessageToLog(userId, "user", text);

    if (await shouldSummarize(userId)) {
      await summarizeAndStore(userId);
      compactMemoriesIfNeeded(userId).catch(console.error);
    }

    const reply = await generateResponse({ userId, userName, analysis, emotionState, userText: text });

    return new Response(JSON.stringify({ reply, emotionState, analysis }), { 
      status: 200, 
      headers: { 
        "Content-Type": "application/json",
        ...CORS_HEADERS // Include CORS headers in success response
      } 
    });
  } catch (err) {
    console.error("Thulli API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        ...CORS_HEADERS // Include CORS headers in error response
      } 
    });
  }
}