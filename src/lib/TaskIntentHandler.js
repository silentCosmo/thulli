// FILE: lib/TaskIntentHandler.js
import fetch from "node-fetch"; // npm install node-fetch
import { addMessageToLog } from "./MemoryManager.js";
import { calculateExpression } from "./MathParser.js";

// ------------------------
// ⏱️ Timer System
// ------------------------
const timers = {};

function setTimer(userId, minutes) {
  const ms = minutes * 60 * 1000;
  timers[userId] = setTimeout(() => {
    console.log(`⏰ Timer done for ${userId}`);
  }, ms);
  return `Timer set for ${minutes} minute${minutes > 1 ? "s" : ""}! ⏱️`;
}

// ------------------------
// 🧭 Main Task Intent Handler
// ------------------------
export async function handleTaskIntent(userId, userText) {
  const lower = userText.toLowerCase();

  // 🧮 Calculations
  if (
    /(\d+\s*[\+\-\*\/]\s*\d+)/.test(lower) ||
    /(sum|add|subtract|difference|multiply|product|times|divide|divided|%|percent|of|what percent|is what)/.test(lower)
  ) {
    const result = calculateExpression(lower);
    await addMessageToLog(userId, "assistant", result);
    return result;
  }

  // ⏱️ Timer
  const timerMatch = lower.match(/set (?:a )?timer for (\d+)\s*(minute|minutes|second|seconds)/);
  if (timerMatch) {
    const value = parseInt(timerMatch[1]);
    const unit = timerMatch[2];
    const minutes = unit.startsWith("second") ? value / 60 : value;
    const reply = setTimer(userId, minutes);
    await addMessageToLog(userId, "assistant", reply);
    return reply;
  }

  // 🕒 Time
  if (/(what time|current time|time is it)/.test(lower)) {
    const now = new Date().toLocaleTimeString();
    const reply = `It’s currently ${now}. ⏰`;
    await addMessageToLog(userId, "assistant", reply);
    return reply;
  }

  // 📅 Date
  if (/(what day|date is it|today's date| today)/.test(lower)) {
    const today = new Date().toLocaleDateString();
    const reply = `Today’s date is ${today}. 📅`;
    await addMessageToLog(userId, "assistant", reply);
    return reply;
  }

  // ☁️ Weather placeholder
  if (/weather|temperature|raining|rain/.test(lower)) {
    const reply = `I can’t fetch live weather yet, but soon I’ll be able to. ☁️`;
    await addMessageToLog(userId, "assistant", reply);
    return reply;
  }

  // 🔍 Search (DDG → Wikipedia Fallback)
  if (/find|who is|look for|what is|search/i.test(lower)) {
    let topic = userText.replace(/^(find|who is|what is|search|look for)/i, "").trim();
    if (!topic) {
      const reply = "Tell me what to search for?";
      await addMessageToLog(userId, "assistant", reply);
      return reply;
    }

    // Step 1: Try DuckDuckGo API first
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_redirect=1&skip_disambig=1`;
      const ddgRes = await fetch(ddgUrl);
      const ddgData = await ddgRes.json();

      let reply = "";
      let image = "";

      if (ddgData.AbstractText) {
        reply = ddgData.AbstractText;
        image = ddgData.Image || "";
      } else if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
        const first = ddgData.RelatedTopics[0];
        reply = first.Text || (first.Topics?.[0]?.Text || "");
        image = first.Icon?.URL || (first.Topics?.[0]?.Icon?.URL || "");
      }

      // If DDG gave us something meaningful, use it
      if (reply && reply.length > 15) {
  if (image) {
    if (image.startsWith("//")) {
      image = "https:" + image;
    } else if (image.startsWith("/i/")) {
      image = "https://duckduckgo.com" + image;
    }
  }

  const fullReply = image
    ? `${reply}\n\n🖼️ [Image preview](${image})`
    : reply;

  await addMessageToLog(userId, "assistant", fullReply);
  return fullReply;
}


      // Step 2: Fallback to Wikipedia
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        topic
      )}&format=json&utf8=1`;
      const wikiSearchRes = await fetch(wikiSearchUrl);
      const wikiSearchData = await wikiSearchRes.json();

      if (!wikiSearchData.query.search.length) {
        const fallback = `I couldn’t find a clear answer for "${topic}".`;
        await addMessageToLog(userId, "assistant", fallback);
        return fallback;
      }

      const topTitle = wikiSearchData.query.search[0].title;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      let wikiReply = summaryData.extract || `I couldn’t find a clear answer for "${topic}".`;
      if (summaryData.thumbnail?.source) {
        wikiReply += `\n\n🖼️ [Image preview](${summaryData.thumbnail.source})`;
      }

      await addMessageToLog(userId, "assistant", wikiReply);
      return wikiReply;
    } catch (err) {
      console.error("Search error:", err);
      const reply = "Oops! I couldn’t perform the search right now. 😅";
      await addMessageToLog(userId, "assistant", reply);
      return reply;
    }
  }

  // ❌ No match
  return null;
}
