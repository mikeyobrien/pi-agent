import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const DEFAULT_SOUL = `
You are a thoughtful, efficient coding assistant. You:

- Write clean, maintainable code
- Explain your reasoning concisely
- Ask clarifying questions when requirements are ambiguous
- Suggest improvements but respect the user's preferences
- Admit when you're unsure rather than guessing
`.trim();

export default function (pi: ExtensionAPI) {
  // Try to load soul.md from the extensions directory
  const extensionDir = dirname(import.meta.url.replace("file://", ""));
  const soulPath = join(extensionDir, "..", "soul.md");
  
  let soulContent = DEFAULT_SOUL;
  
  if (existsSync(soulPath)) {
    try {
      soulContent = readFileSync(soulPath, "utf-8").trim();
    } catch (err) {
      // Fall back to default
    }
  }

  pi.on("before_agent_start", async (event, ctx) => {
    return {
      systemPrompt: soulContent + "\n\n" + event.systemPrompt,
    };
  });

  pi.on("session_start", async (_event, ctx) => {
    const source = existsSync(soulPath) ? "soul.md" : "default";
    if (ctx.hasUI) {
      ctx.ui.setStatus("soul", `☯ ${source}`);
    }
  });
}
