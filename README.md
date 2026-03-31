# 🎯 Situation Room

**Text it your dilemma. Get a decision.**

An iMessage agent built on [Photon's iMessage Kit](https://github.com/photon-hq/imessage-kit) that gives you crisp, confident answers to the calls you're stuck on — career moves, negotiation moments, send-or-don't-send messages, timing decisions — in under 60 seconds. No app. No UI. Just iMessage.

---

## What it actually does

You text it something like:

> *"Got a competing offer 30% higher. Current company wants 3 more days to respond. Should I push back or just accept?"*

And you get back something like:

```
🎯 Negotiation

✅ FOR: The offer is real leverage — 3 days means they want you.
⚠️ RISK: Pushing further could flip the offer or feel greedy if you want to stay long-term.

Counter with a 48hr extension ask only if you'd actually leave. If not, take the 30%.

→ Would you genuinely consider the new company if your current one can't move?
```

That's it. One thing in, one crisp answer out.

---

## Why this idea

Every other productivity agent tries to be a calendar or a summary. Situation Room does the one thing that's actually hard: **cuts through the fog when you're overthinking a call**.

The constraint of iMessage is the feature — you can't write an essay back, so you have to be decisive. That's the whole point.

It also **remembers your past decisions** (stored locally, never in the cloud), so over time it can notice patterns: *"you've brought 3 career-related calls this month"*.

---

## Setup

### Prerequisites
- macOS (iMessage Kit requires macOS)
- Node.js 18+ or Bun
- An Anthropic API key ([get one here](https://console.anthropic.com))
- Full Disk Access granted to your terminal (required by iMessage Kit to read messages)

### Grant Full Disk Access
```
System Settings → Privacy & Security → Full Disk Access → Enable for Terminal (or your shell)
```

### Install & run

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/situation-room
cd situation-room

# Install dependencies
npm install

# Configure
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start
npm run dev
```

The agent starts watching your iMessages. Text yourself (or any number you configure) a dilemma and watch it respond.

---

## How it works

```
Your iMessage
     │
     ▼
iMessage Kit (reads via SQLite + AppleScript)
     │
     ▼
Context builder (loads your past decisions from local JSON)
     │
     ▼
Claude (claude-opus-4) with Situation Room system prompt
     │
     ▼
Formatter (structures the response: label → forces → decision → question)
     │
     ▼
iMessage Kit (sends reply via AppleScript)
     │
     ▼
Memory updater (saves decision to local data/[sender].json)
```

**Zero cloud storage.** All memory lives in `data/` on your machine. Nothing is sent anywhere except the text of your dilemma to the Anthropic API.

---

## Architecture

```
situation-room/
├── src/
│   ├── agent.ts      # Main poll loop + message handler
│   ├── memory.ts     # Per-user decision history (local JSON)
│   ├── prompt.ts     # System prompt builder
│   └── formatter.ts  # Structures Claude's response for iMessage
├── data/             # Created at runtime, gitignored
│   └── [sender].json # One file per user, stores decision history
└── .env.example
```

---

## Example conversations

**Career move:**
> *"PM at a Series B vs IC at a big tech. I'd make more as IC but PM role sounds more exciting. I have 48hrs."*

```
🎯 Career Move

✅ FOR: Excitement compounds faster than salary at your stage — you'll grow faster at the PM role.
⚠️ RISK: Series B = risk, equity dilution, possible pivot. Big tech IC = predictable floor.

Take the PM role if you care more about what you're building in 3 years than what you're earning in 1.

→ If the Series B fails in 18 months and you're job hunting again, would you regret not having the big tech line on your CV?
```

**Should-I-send-this message:**
> *"Should I text my ex about a mutual friend's wedding invite situation? It's genuinely logistical but I know how it looks."*

```
🎯 People Problem

✅ FOR: If it's genuinely logistical and you're both adults, a clean message is fine.
⚠️ RISK: "I know how it looks" means you already know — it's not just logistics.

Don't text. Handle the logistics through the mutual friend instead.

→ Would you be comfortable if your ex read your message to the mutual friend first?
```

---

## Running via GitHub Actions (no Mac required)

If you're on Windows or Linux, you can still run and demo the agent using GitHub's free macOS runners.

### Setup

**1. Push this repo to GitHub**
```bash
git init
git add .
git commit -m "initial commit"
gh repo create situation-room --public --push
```

**2. Add your Anthropic API key as a secret**
```
GitHub repo → Settings → Secrets and variables → Actions → New repository secret
Name: ANTHROPIC_API_KEY
Value: sk-ant-...
```

**3. Run the workflow**

Go to **Actions → Situation Room – macOS Demo → Run workflow**

You can type in any dilemma in the input box, or leave it blank to use the default. The workflow:
- Spins up a real macOS runner
- Installs dependencies (no platform error — it's actually macOS)
- Runs the full Claude pipeline
- Prints the formatted iMessage response in the logs
- Uploads the decision JSON as a downloadable artifact

**4. See the output**

In the workflow run, click the `run-agent-smoke-test` step to see the response. Download the `situation-room-output` artifact to see the saved memory JSON.

### Running the test runner locally on Mac
```bash
TEST_DILEMMA="Should I take the offer?" npx tsx src/test-runner.ts
```

---

## Extending it

Situation Room is intentionally minimal. Some things you could add:

- **Weekly pattern report**: Every Sunday, text yourself a summary of the calls you brought that week
- **Allowed senders list**: Add a whitelist in `.env` so only specific numbers can use the agent
- **Decision categories**: Tag decisions and surface patterns ("you always second-guess timing calls")
- **Bun runtime**: Swap to Bun for zero-dependency, faster cold starts

---

## Submission

Built for the [Photon iMessage Kit Hackathon](https://github.com/photon-hq/imessage-kit).

**One sentence:** Text it your dilemma, get a decision.

**Would I actually use this tomorrow?** Yes. I built it because I needed it.

---

## License

MIT
