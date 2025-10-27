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

  const EMOTION_ENGINES = {};
  function getEmotionEngine(userId) {
    if (!EMOTION_ENGINES[userId]) EMOTION_ENGINES[userId] = new EmotionEngine();
    return EMOTION_ENGINES[userId];
  }

  export async function POST(req) {
    try {
      const body = await req.json();
      const { userId = "cosmo", userName = "Dear", text = "" } = body;

      await connectToMongo();

      if (!text.trim()) {
        return new Response(JSON.stringify({ reply: "I didn't get that. Please say something!" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      // ---------- Training commands ----------
      if (text.toLowerCase().startsWith("thulli, remember")) {
        const toRemember = text.replace(/thulli, remember/i, "").trim();
        if (toRemember) {
          await TrainingMemory.create({ userId, type: "fact", value: toRemember });
          return new Response(JSON.stringify({ reply: "Got it! I'll remember that." }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }

      if (text.toLowerCase().startsWith("thulli, if i say")) {
        const match = text.match(/thulli, if i say (.+), you say (.+)/i);
        if (match) {
          const [, input, output] = match;
          await TrainingMemory.create({ userId, type: "pair", key: input.trim(), value: output.trim() });
          return new Response(JSON.stringify({ reply: "Understood! I'll respond like that next time." }), { status: 200, headers: { "Content-Type": "application/json" } });
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

      return new Response(JSON.stringify({ reply, emotionState, analysis }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.error("Thulli API Error:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
