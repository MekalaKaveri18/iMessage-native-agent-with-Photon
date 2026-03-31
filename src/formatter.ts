export interface FormattedDecision {
  formatted: string;
  recommendation: string;
}

export function formatDecision(rawResponse: string): FormattedDecision {
  const lines = rawResponse.trim().split("\n");

  // Extract recommendation line (line after the second blank line)
  let recommendation = "See full response";
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      blankCount++;
    } else if (blankCount >= 2) {
      recommendation = line.trim().replace(/^[-–—]\s*/, "");
      break;
    }
  }

  // Prepend the header emoji
  const label = lines[0]?.trim() || "Decision";
  const bodyLines = lines.slice(1);

  const formatted = `🎯 ${label}\n${bodyLines.join("\n")}`.trim();

  return {
    formatted,
    recommendation: recommendation.slice(0, 120), // cap for storage
  };
}
