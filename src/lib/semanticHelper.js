// FILE: lib/semanticHelper.js
import { pipeline } from "@xenova/transformers";
import cosineSimilarity from "compute-cosine-similarity";

let embedder = null;

// 🧠 Convert any text into a vector (numerical meaning)
export async function embedText(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(result.data);
}

// 💫 Compare two thought vectors
export function similarity(vecA, vecB) {
  return cosineSimilarity(vecA, vecB);
}
