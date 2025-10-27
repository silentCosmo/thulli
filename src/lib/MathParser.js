// FILE: lib/math/MathParser.js

// ------------------------
// 🧠 Basic Arithmetic
// ------------------------
function handleBasicArithmetic(expr, nums) {
  if (/^(sum of|add|addition)/.test(expr)) {
    if (nums.length < 2) return "I’ll need at least two numbers to add.";
    const total = nums.reduce((a, b) => a + b, 0);
    return `That comes to ${total}.`;
  }

  if (/difference|subtract|minus/.test(expr)) {
    if (nums.length < 2) return "I’ll need at least two numbers to find the difference.";
    const diff = nums.reduce((a, b) => a - b);
    return `That would be ${diff}.`;
  }

  if (/multiply|product|times/.test(expr)) {
    if (nums.length < 2) return "I’ll need more than one number to multiply.";
    const result = nums.reduce((a, b) => a * b);
    return `Multiplying that gives ${result}.`;
  }

  if (/divide|division|divided|by/.test(expr)) {
    if (nums.length < 2) return "I’ll need two numbers for a division.";
    const result = nums.reduce((a, b) => a / b);
    return `That works out to about ${result}.`;
  }

  return null;
}

// ------------------------
// 📊 Percentage Calculations
// ------------------------
function handlePercentageCalculations(expr) {
  // (a) "what is 20% of 400"
  let match = expr.match(/(\d+)%\s*(?:of)?\s*(\d+)/);
  if (match) {
    const [_, p, t] = match;
    const result = (Number(p) / 100) * Number(t);
    return `That’s ${result}.`;
  }

  // (b) "80 is what percent of 400"
  match = expr.match(/(\d+)\s+is\s+(what|which)\s*%?\s*(percent)?\s*(of)?\s*(\d+)/);
  if (match) {
    const part = Number(match[1]);
    const total = Number(match[5]);
    const result = (part / total) * 100;
    const formatted = result % 1 === 0 ? result : result.toFixed(2);
    return `That’s about ${formatted}%.`;
  }

  // (c) "80 is what % of 400"
  match = expr.match(/(\d+)\s+is\s+what\s*%?\s+of\s+(\d+)/);
  if (match) {
    const part = Number(match[1]);
    const total = Number(match[2]);
    const result = (part / total) * 100;
    return `That’s ${result.toFixed(2)}%.`;
  }

  // (d) "what is 20 of 400" (assume 20% of 400)
  match = expr.match(/(\d+)\s*(?:of)\s*(\d+)/);
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    const result = (a / 100) * b;
    return `That’s ${result}.`;
  }

  return null;
}

// ------------------------
// ➗ Direct Expression (10 + 20 / 5)
// ------------------------
function handleDirectExpression(expr) {
  if (!/[\+\-\*\/]/.test(expr)) return null;
  try {
    expr = expr.replace(/[^0-9+\-*/().]/g, "");
    const result = eval(expr);
    if (isNaN(result)) return "Hmm, that doesn’t seem like a valid math expression.";
    return `Let’s see… that’s ${result}.`;
  } catch {
    return "That doesn’t look like a valid calculation.";
  }
}

// ------------------------
// ➕ Fallback: Implicit Addition
// ------------------------
function handleImplicitAddition(nums, expr) {
  if (nums.length === 2 && !/[\+\-\*\/]/.test(expr)) {
    const [a, b] = nums;
    const result = a + b;
    return `That’s ${result}.`;
  }
  return null;
}

// ------------------------
// 🧩 Main Math Parser
// ------------------------
export function calculateExpression(input) {
  try {
    const expr = input.toLowerCase().trim();
    const nums = expr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];

    return (
      handleBasicArithmetic(expr, nums) ||
      handlePercentageCalculations(expr) ||
      handleDirectExpression(expr) ||
      handleImplicitAddition(nums, expr) ||
      "I’m not sure what calculation you meant there."
    );
  } catch {
    return "That doesn’t look like a valid calculation.";
  }
}
