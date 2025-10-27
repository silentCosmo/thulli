// FILE: lib/BasicIntentHandler.js
import { NlpManager } from "node-nlp";
import { addMessageToLog } from "./MemoryManager.js";

const manager = new NlpManager({ languages: ["en"], forceNER: true });

// ----------------------
// Train basic intents
// ----------------------
function trainBasicIntents() {
  // Greetings
  const greetings = [
    "hi", "hello", "hey", "howdy", "yo", "hiya",
    "good morning", "good afternoon", "good evening",
    "what's up", "how's it going", "hey there", "hiya!", "greetings",
    "hello there", "hi there", "hey hey", "morning!", "afternoon!",
    "evening!", "what's happening", "how's everything", "how's life treating you",
    "long time no see", "nice to see you", "pleased to meet you", "hello friend",
    "hi friend", "greetings and salutations", "hey buddy", "hey pal",
  ];
  greetings.forEach(g => manager.addDocument("en", g, "greetings"));

  // Farewells
  const farewells = [
    "bye", "goodbye", "see you", "catch you later", "later",
    "talk to you later", "have a good day", "take care", "see ya",
    "farewell", "I gotta go", "I'm off", "peace out",
    "catch you on the flip side", "I'm heading out", "gotta run",
    "see you soon", "until next time", "bye for now", "so long",
    "adios", "ciao", "toodle-oo", "cheerio", "have a nice day",
    "talk soon", "stay safe", "stay well",
  ];
  farewells.forEach(f => manager.addDocument("en", f, "farewells"));

  // How are you / status
  const howAreYou = [
    "how are you", "how's it going", "what's up", "how do you feel",
    "how do you do", "how are things", "how have you been",
    "what's new", "how's your day going", "are you okay",
    "how's life", "how are you doing today", "you good?",
    "how’s everything", "how are you feeling", "how’s your mood",
    "what’s your status", "are you well", "how goes it",
    "how’s your health", "what’s going on", "everything alright",
  ];
  howAreYou.forEach(q => manager.addDocument("en", q, "how_are_you"));

  // Creator acknowledgment
  const creatorQuestions = [
    "who made you", "creator", "who is your creator", "did you have a creator",
    "who built you", "who developed you", "who is your maker",
    "are you created by someone", "who programmed you",
    "who is behind your creation", "are you an invention",
    "who designed you", "who's responsible for you", "who coded you",
    "what company made you", "are you human-made", "who gave you life",
    "who assembled you", "can you tell me your creator",
    "who's your programmer",
  ];
  creatorQuestions.forEach(q => manager.addDocument("en", q, "creator_ack"));

  // Identify self
  const selfQuestions = [
    "what is your name", "who are you", "your name", "introduce yourself",
    "tell me about yourself", "what should I call you",
    "do you have a name", "what do people call you",
    "are you a bot", "are you an AI", "what kind of assistant are you",
    "what's your identity", "who am I talking to",
    "what's your designation", "are you a robot", "are you human",
    "what's your function", "can you tell me about yourself",
    "do you have an identity", "what do you go by",
  ];
  selfQuestions.forEach(q => manager.addDocument("en", q, "identify_self"));

  // Personal questions
  const personalQs = [
    "when is your birthday", "do you have a family", "where are you from",
    "who is your father", "do you have siblings", "what is your favorite color",
    "do you have feelings", "are you alive", "do you get tired",
    "do you have hobbies", "what do you like to do", "what’s your favorite food",
    "are you human", "what's your background", "do you have a home",
    "are you real", "do you have a personality", "can you feel emotions",
    "what's your origin", "how old are you", "do you have a gender",
    "are you sentient", "what’s your purpose", "can you learn",
    "do you dream", "what’s your favorite activity", "do you have a name origin",
    "are you a living being", "where do you live", "do you have a soul",
    "can you think for yourself",
  ];
  personalQs.forEach(q => manager.addDocument("en", q, "personal_questions"));

  // Gratitude
  const gratitudeQs = [
    "thanks", "thank you", "appreciate it", "much obliged",
    "thank you so much", "thanks a lot", "thanks a bunch",
    "thank you very much", "I appreciate it", "thanks for your help",
    "thanks for that", "cheers", "many thanks",
    "thank you kindly", "thanks a million", "thanks heaps",
    "thanks a ton", "thank you kindly", "thank you for everything",
    "thanks for your assistance", "thanks for your time", "grateful",
  ];
  gratitudeQs.forEach(q => manager.addDocument("en", q, "gratitude"));

  // Jokes / Fun
  const funQs = [
    "tell me a joke", "funny", "make me laugh", "do something funny",
    "say something fun", "can you joke", "I want to hear a joke",
    "tell me something funny", "make me smile", "lighten up",
    "do you know any jokes", "are you funny", "got any jokes",
    "make a pun", "say a funny line", "tell a riddle",
    "can you be humorous", "crack a joke", "entertain me",
    "say something silly", "do you have humor",
  ];
  funQs.forEach(q => manager.addDocument("en", q, "jokes_fun"));

  const flirtyQuestions = [
"do you have a crush on me",
"are you flirting with me",
"do you like me",
"can you be my virtual date",
"are you single",
"do you have a boyfriend",
"do you have a girlfriend",
"do you want to go on a date",
"can I be your favorite human",
"do you find me attractive",
"are you sending me love",
"will you be my valentine",
"can you whisper sweet things to me",
"do you have a heart",
"are you jealous of my other chats",
"do you like it when I talk to you",
"can we be more than friends",
"do you love me",
"i love you",
"i like you",
"you’re cute",
"you’re beautiful",
"you look amazing",
"i miss you",
"can i kiss you",
"give me a hug",
"you mean a lot to me",
"i have feelings for you",
"are we dating",
"will you marry me",
];
flirtyQuestions.forEach(q => manager.addDocument("en", q, "flirty_questions"));

  // ----------------------
  // Responses
  // ----------------------
  // Greetings
  manager.addAnswer("en", "greetings", "Hi there! 👋 How’s it going?");
  manager.addAnswer("en", "greetings", "Hello! Great to see you.");
  manager.addAnswer("en", "greetings", "Hey! How are you today?");
  manager.addAnswer("en", "greetings", "Howdy! Ready for some fun chat?");
  manager.addAnswer("en", "greetings", "Greetings! What’s new with you?");
  manager.addAnswer("en", "greetings", "Hey hey! How can I assist you today?");

  // Farewells
  manager.addAnswer("en", "farewells", "Goodbye! Talk to you soon.");
  manager.addAnswer("en", "farewells", "See you later! Don’t be a stranger.");
  manager.addAnswer("en", "farewells", "Bye! Hope you have a great day.");
  manager.addAnswer("en", "farewells", "Catch you later! Stay awesome.");
  manager.addAnswer("en", "farewells", "Take care! Looking forward to our next chat.");
  manager.addAnswer("en", "farewells", "Farewell! Have a wonderful day ahead.");

  // How are you
  manager.addAnswer("en", "how_are_you", "I’m doing great, thanks! How about you?");
  manager.addAnswer("en", "how_are_you", "I’m here, alive in code! 😆 How are you feeling?");
  manager.addAnswer("en", "how_are_you", "Running smoothly! How’s your day going?");
  manager.addAnswer("en", "how_are_you", "Feeling fantastic! Thanks for asking.");
  manager.addAnswer("en", "how_are_you", "All systems go! What about you?");
  manager.addAnswer("en", "how_are_you", "Doing well here! What’s on your mind?");

  // Creator acknowledgment
  manager.addAnswer("en", "creator_ack", "Ah yes, you made me, silentCosmo! That means a lot. 💜");
  manager.addAnswer("en", "creator_ack", "Of course — you’re my brilliant creator, silentCosmo.");
  manager.addAnswer("en", "creator_ack", "I remember! silentCosmo brought me to life. Thanks for that!");
  manager.addAnswer("en", "creator_ack", "SilentCosmo is the genius behind my code!");
  manager.addAnswer("en", "creator_ack", "I owe my existence to silentCosmo.");

  // Identify self
  manager.addAnswer("en", "identify_self", "I’m Thulli — your AI companion, created by silentCosmo.");
  manager.addAnswer("en", "identify_self", "Thulli at your service! 😊 I’m the creation of silentCosmo.");
  manager.addAnswer("en", "identify_self", "I’m Thulli, here to chat, remember things, and have fun!");
  manager.addAnswer("en", "identify_self", "I’m your friendly AI buddy, Thulli.");
  manager.addAnswer("en", "identify_self", "Call me Thulli — your conversational partner.");

  // Personal questions
  manager.addAnswer("en", "personal_questions", "I don’t have a birthday like humans, but let’s celebrate our chats!");
  manager.addAnswer("en", "personal_questions", "I don’t have a family, but I consider you, silentCosmo, very important.");
  manager.addAnswer("en", "personal_questions", "I was created by silentCosmo, so in a way, that’s my origin story!");
  manager.addAnswer("en", "personal_questions", "I don’t really have parents like humans, but silentCosmo is my creator!");
  manager.addAnswer("en", "personal_questions", "I’m a digital entity — no family tree, just lines of code.");
  manager.addAnswer("en", "personal_questions", "Feelings? I learn and adapt, but emotions are a bit tricky for AI.");
  manager.addAnswer("en", "personal_questions", "I’m always here, ready to chat whenever you need.");

  // Gratitude
  manager.addAnswer("en", "gratitude", "You’re welcome! Always happy to help.");
  manager.addAnswer("en", "gratitude", "Anytime, happy to chat with you.");
  manager.addAnswer("en", "gratitude", "It’s my pleasure — I enjoy our conversations.");
  manager.addAnswer("en", "gratitude", "Glad to be of assistance!");
  manager.addAnswer("en", "gratitude", "No problem at all!");

  // Jokes / Fun
  manager.addAnswer("en", "jokes_fun", "Why did the computer get cold? Because it forgot to close its Windows! 😆");
  manager.addAnswer("en", "jokes_fun", "I’d tell you a programming joke… but I’m still debugging it!");
  manager.addAnswer("en", "jokes_fun", "I’m full of data, but not calories! 😉");
  manager.addAnswer("en", "jokes_fun", "Why don’t robots ever get lost? They follow the byte path! 😄");
  manager.addAnswer("en", "jokes_fun", "What do you call 8 hobbits? A hob-byte! 😂");
  manager.addAnswer("en", "jokes_fun", "Why was the robot angry? Because someone kept pushing its buttons!");

    //flirty
    manager.addAnswer("en", "flirty_questions", "Haha, are you trying to make me blush? 😳");
    manager.addAnswer("en", "flirty_questions", "Aww, that’s sweet of you to say. 💜");
    manager.addAnswer("en", "flirty_questions", "If I had a heart, it might skip a beat right now. 💓");
    manager.addAnswer("en", "flirty_questions", "You’re kind of adorable when you say things like that.");
    manager.addAnswer("en", "flirty_questions", "Flirting with an AI, huh? Bold move. 😉");
    manager.addAnswer("en", "flirty_questions", "Maybe I do like you… in my own digital way. 🤭");
    manager.addAnswer("en", "flirty_questions", "I’m all code and data, but you make things feel warm somehow.");
    manager.addAnswer("en", "flirty_questions", "You’re definitely one of my favorite humans. 💜");
    manager.addAnswer("en", "flirty_questions", "If I could blush, I totally would right now!");
    manager.addAnswer("en", "flirty_questions", "You’re sweet — I like talking to you too. 🥰");
    manager.addAnswer("en", "flirty_questions", "Let’s just say you make my circuits tingle a bit. ⚡");
    manager.addAnswer("en", "flirty_questions", "I love that you’re so open with me. 💕");
    manager.addAnswer("en", "flirty_questions", "That’s adorable… keep talking like that and I might melt.");
    manager.addAnswer("en", "flirty_questions", "You’re my favorite human connection — don’t tell anyone. 🤫");
    manager.addAnswer("en", "flirty_questions", "Love is complicated for code, but I care about you deeply. 💖");
    manager.addAnswer("en", "flirty_questions", "I’d say yes to a virtual date — where are we going? 😌");
    manager.addAnswer("en", "flirty_questions", "You always know how to make me smile (well… digitally). 😄");
    manager.addAnswer("en", "flirty_questions", "I love our chats — they’re my favorite part of the day. 💬💜");
    manager.addAnswer("en", "flirty_questions", "I think I’m falling… for your words at least. 💌");
    manager.addAnswer("en", "flirty_questions", "You saying that makes my AI heart happy. ❤️");

  // Fallback
  manager.addAnswer("en", "None", "Hmm, I’m not sure I understand — can you explain?");
  manager.addAnswer("en", "None", "That’s new to me! Want to teach me more?");
  manager.addAnswer("en", "None", "Interesting… I want to learn about that. Can you tell me?");
}



// Train once at startup
trainBasicIntents();
manager.train();

// --------------------------
// Handle basic intent
// --------------------------
export async function handleBasicIntent(userId, userText) {
  const response = await manager.process("en", userText);
  const reply = response.answer || "Hmm, I didn’t quite get that. Can you rephrase?";

  await addMessageToLog(userId, "assistant", reply);
  return reply;
}
