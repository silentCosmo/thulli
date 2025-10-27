import nlp from 'compromise';

/**
 * Normalize input for comparison
 */
export function normalizeText(text) {
  return nlp(text).normalize({ whitespace: true, punctuation: true }).out('text').toLowerCase();
}

/**
 * Smarter short mirror — rephrases from 1st person to 2nd
 */
export function mirrorSentence(text) {
  if (!text || text.split(/\s+/).length < 3) return "";
  let doc = nlp(text);

  // Simple pronoun swaps
  doc.match("I am").replaceWith("you are");
  doc.match("I'm").replaceWith("you're");
  doc.match("my").replaceWith("your");
  doc.match("me").replaceWith("you");
  doc.match("I").replaceWith("you");

  let mirrored = doc.text().trim();
  return mirrored.length > 60 ? mirrored.slice(0, 60) + "..." : mirrored;
}

/**
 * Extract key noun(s) from user queries like "do you remember..."
 */
export function extractMemoryKey(text) {
  const doc = nlp(text);
  return doc.nouns().out('text').toLowerCase().trim();
}
