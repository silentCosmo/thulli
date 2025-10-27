import BehaviorMemory from "../models/BehaviorMemory.js";
import { addMessageToLog } from "./MemoryManager.js";

// ------------------------------------
// 🧹 Normalize text
// ------------------------------------
function normalizeText(text) {
  return text
    .trim()
    .replace(/[‘’“”]/g, "")
    .replace(/[.,!?;]+$/g, "")
    .toLowerCase();
}

// ------------------------------------
// 🧠 Detect if user is teaching a new rule
// ------------------------------------
export async function detectAndLearnBehavior(userId, userText) {
  const teachPattern =
    /(?:when|if)\s+user\s+says\s+["']?(.+?)["']?\s*(?:reply|respond|answer|say)\s+["']?(.+?)["']?$/i;

  const match = userText.match(teachPattern);
  if (!match) return null;

  const trigger = normalizeText(match[1]);
  const response = match[2].trim();

  // 🧩 Check if a behavior with this trigger exists
  let behavior = await BehaviorMemory.findOne({ userId, trigger });

  if (behavior) {
    // Already has this response?
    if (behavior.responses.includes(response)) {
      const msg = `I already know that — when someone says "${trigger}", I can reply "${response}".`;
      await addMessageToLog(userId, "assistant", msg);
      return msg;
    }

    // Add new response to array
    behavior.responses.push(response);
    await behavior.save();

    const msg = `Got it — I can now reply "${response}" when someone says "${trigger}".`;
    await addMessageToLog(userId, "assistant", msg);
    return msg;
  }

  // No behavior exists yet — create new
  const newRule = new BehaviorMemory({
    userId,
    trigger,
    responses: [response],
    category: "custom",
  });

  await newRule.save();

  const confirmation = `Got it — when someone says "${trigger}", I'll reply "${response}".`;
  await addMessageToLog(userId, "assistant", confirmation);
  return confirmation;
}

// ------------------------------------
// 🔍 Match or List Learned Behaviors
// ------------------------------------
export async function findLearnedBehavior(userId, userText) {
  const allBehaviors = await BehaviorMemory.find({ userId });
  const normalizedInput = normalizeText(userText);

  // 🧩 Handle "list behaviors" commands
  const listCommands = [
    "list behaviors",
    "show behaviors",
    "list all behaviors",
    "show all behaviors",
    "what behaviors",
    "display behaviors",
  ];

  if (listCommands.some(cmd => normalizedInput.includes(cmd))) {
    if (allBehaviors.length === 0) {
      const reply = "You haven’t taught me any custom behaviors yet.";
      await addMessageToLog(userId, "assistant", reply);
      return reply;
    }

    // Group responses by trigger
    const formattedList = allBehaviors
  .map((b, index) => `${index + 1}. trigger: "${b.trigger}", reply: ${b.responses.join(" | ")}`)
  .join("\n");


    const reply = `Here are the behaviors I’ve learned:\n${formattedList}`;
    await addMessageToLog(userId, "assistant", reply);
    return reply;
  }

  // 🔎 Try matching a learned behavior
  const matchedBehaviors = allBehaviors.filter(b =>
    normalizedInput.includes(normalizeText(b.trigger))
  );

  if (!matchedBehaviors.length) return null;

  // Pick a random behavior response
  const chosenBehavior = matchedBehaviors[Math.floor(Math.random() * matchedBehaviors.length)];
  const chosenResponse = chosenBehavior.responses[Math.floor(Math.random() * chosenBehavior.responses.length)];

  await addMessageToLog(userId, "assistant", chosenResponse);
  return chosenResponse;
}
