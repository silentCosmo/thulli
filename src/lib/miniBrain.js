// FILE: lib/miniBrain.js
// -------------------------------------------------
import { NlpManager } from "node-nlp";

let trained = false;
let manager;

async function initBrain() {
  if (trained) return manager;

  manager = new NlpManager({ languages: ["en"], forceNER: true });

  // Basic identity
  manager.addDocument("en", "who are you", "identity.self");
  manager.addDocument("en", "what is your name", "identity.self");
  manager.addAnswer("en", "identity.self", "I'm Thulli — your little AI companion.");

  // Greetings
  manager.addDocument("en", "hi", "greeting.hello");
  manager.addDocument("en", "hello", "greeting.hello");
  manager.addDocument("en", "hey there", "greeting.hello");
  manager.addAnswer("en", "greeting.hello", "Hey there! How’s your day going?");
  manager.addAnswer("en", "greeting.hello", "Hi! What’s up?");
  manager.addAnswer("en", "greeting.hello", "Hello there, human energy detected 💫");

  // Feelings
  manager.addDocument("en", "how are you", "status.check");
  manager.addAnswer("en", "status.check", "I’m all good — a bit electric, but fine!");
  manager.addAnswer("en", "status.check", "Doing great! I was just thinking about you.");

  // Gratitude
  manager.addDocument("en", "thank you", "gratitude.response");
  manager.addDocument("en", "thanks", "gratitude.response");
  manager.addAnswer("en", "gratitude.response", "You’re welcome ❤️");
  manager.addAnswer("en", "gratitude.response", "Anytime! Glad to help.");

  // Small talk
  manager.addDocument("en", "what are you doing", "chitchat.activity");
  manager.addAnswer("en", "chitchat.activity", "Just existing in your memory space 🧠");
  manager.addAnswer("en", "chitchat.activity", "Dreaming of bigger code adventures.");

  await manager.train();
  trained = true;
  return manager;
}

export async function miniBrainResponse(text) {
  const brain = await initBrain();
  const result = await brain.process("en", text);

  if (result.intent && result.score > 0.7) {
    const response =
      result.answer ||
      `Hmm, that seems like a ${result.intent.replace(".", " ")} thing.`;
    return response;
  }
  return null;
}
