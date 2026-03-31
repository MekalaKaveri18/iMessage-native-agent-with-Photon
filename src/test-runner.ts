/**
 * test-runner.ts
 * Runs the full agent pipeline without needing a real iMessage connection.
 * Used by GitHub Actions for CI / demo.
 *
 * Usage:
 *   TEST_DILEMMA="your dilemma here" npx tsx src/test-runner.ts
 */

import Groq from "groq-sdk";
import { loadMemory, saveMemory, UserMemory } from "./memory.js";
import { buildSystemPrompt } from "./prompt.js";
import { formatDecision } from "./formatter.js";

const SENDER = "test-runner";
const DILEMMA =
  process.env.TEST_DILEMMA ||
  "Should I quit my job to start a company, or wait one more year to save more runway?";

async function run() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 Situation Room — Test Runner");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`📨 Dilemma: "${DILEMMA}"\n`);

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY is not set.");
    console.error("Get a free key at https://console.groq.com");
    process.exit(1);
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const memory: UserMemory = loadMemory(SENDER);

  const recentContext =
    memory.decisions.length > 0
      ? `\n\nPast decisions this user has brought to you:\n` +
        memory.decisions
          .slice(-5)
          .map(
            (d, i) =>
              `${i + 1}. [${d.date}] "${d.dilemma.slice(0, 80)}..." → Recommended: ${d.recommendation}`
          )
          .join("\n")
      : "";

  const systemPrompt = buildSystemPrompt(recentContext);

  console.log("⏳ Thinking...\n");

  let fullResponse = "";

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 400,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: DILEMMA },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    fullResponse += text;
    process.stdout.write(text);
  }

  console.log("\n");

  const { formatted, recommendation } = formatDecision(fullResponse);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 What would appear in iMessage:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(formatted);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  memory.decisions.push({
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    dilemma: DILEMMA,
    recommendation,
    fullResponse,
  });
  memory.lastSeen = new Date().toISOString();
  saveMemory(SENDER, memory);

  console.log(`✅ Decision saved to data/${SENDER}.json`);
  console.log(`📊 Total decisions in memory: ${memory.decisions.length}`);
}

run().catch((err) => {
  console.error("❌ Test runner failed:", err);
  process.exit(1);
});
