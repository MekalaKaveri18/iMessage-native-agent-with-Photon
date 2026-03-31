import { IMessageSDK } from "@photon-ai/imessage-kit";
import Groq from "groq-sdk";
import { loadMemory, saveMemory, UserMemory } from "./memory.js";
import { buildSystemPrompt } from "./prompt.js";
import { formatDecision } from "./formatter.js";

const sdk = new IMessageSDK({
  watcher: {
    pollInterval: 3000,
    unreadOnly: true,
    excludeOwnMessages: true,
  },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROCESSED_IDS = new Set<string>();

async function handleMessage(sender: string, text: string): Promise<void> {
  console.log(`[Situation Room] Message from ${sender}: "${text}"`);

  const memory: UserMemory = loadMemory(sender);

  const recentContext =
    memory.decisions.length > 0
      ? `\n\nPast decisions this user has brought to you (for context, don't repeat unless asked):\n` +
        memory.decisions
          .slice(-5)
          .map(
            (d, i) =>
              `${i + 1}. [${d.date}] "${d.dilemma.slice(0, 80)}..." → Recommended: ${d.recommendation}`
          )
          .join("\n")
      : "";

  const systemPrompt = buildSystemPrompt(recentContext);

  let fullResponse = "";

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    for await (const chunk of stream) {
      fullResponse += chunk.choices[0]?.delta?.content ?? "";
    }
  } catch (err) {
    console.error("[Situation Room] Groq API error:", err);
    await sdk.send(
      sender,
      "⚡ Having trouble thinking right now. Try again in a moment."
    );
    return;
  }

  const { formatted, recommendation } = formatDecision(fullResponse);

  await sdk.send(sender, formatted);

  memory.decisions.push({
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    dilemma: text,
    recommendation,
    fullResponse,
  });
  memory.lastSeen = new Date().toISOString();
  saveMemory(sender, memory);

  console.log(`[Situation Room] Replied to ${sender}`);
}

async function main() {
  console.log("🎯 Situation Room agent is live. Watching for messages...\n");

  while (true) {
    try {
      const unread = await sdk.getUnreadMessages();

      for (const { sender, messages } of unread) {
        for (const msg of messages) {
          const msgId = `${sender}::${msg.date?.getTime()}::${msg.text?.slice(0, 20)}`;

          if (PROCESSED_IDS.has(msgId)) continue;
          PROCESSED_IDS.add(msgId);

          const text = msg.text?.trim();
          if (!text || text.length < 3) continue;

          handleMessage(sender, text).catch(console.error);
        }
      }
    } catch (err) {
      console.error("[Situation Room] Poll error:", err);
    }

    await new Promise((res) => setTimeout(res, 3000));
  }
}

main();
