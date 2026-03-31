import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Decision {
  date: string;
  dilemma: string;
  recommendation: string;
  fullResponse: string;
}

export interface UserMemory {
  sender: string;
  firstSeen: string;
  lastSeen: string;
  decisions: Decision[];
}

function memoryPath(sender: string): string {
  // Sanitize phone number for filename
  const safe = sender.replace(/[^a-zA-Z0-9+]/g, "_");
  return path.join(DATA_DIR, `${safe}.json`);
}

export function loadMemory(sender: string): UserMemory {
  const filePath = memoryPath(sender);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as UserMemory;
    } catch {
      // corrupt file — start fresh
    }
  }
  return {
    sender,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    decisions: [],
  };
}

export function saveMemory(sender: string, memory: UserMemory): void {
  const filePath = memoryPath(sender);
  fs.writeFileSync(filePath, JSON.stringify(memory, null, 2), "utf-8");
}
