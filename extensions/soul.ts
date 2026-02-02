import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * SOUL.md Extension
 * 
 * Implements the SOUL.md standard for AI identity and values.
 * See: https://soul.md/
 * 
 * Searches for SOUL.md in:
 *   1. Project root (.pi/SOUL.md or ./SOUL.md)
 *   2. Global (~/.pi/agent/SOUL.md)
 *   3. This repo's SOUL.md
 * 
 * The soul is prepended to the system prompt on every agent start.
 */

const SOUL_LOCATIONS = [
  // Project-local
  ".pi/SOUL.md",
  "SOUL.md",
  // Global
  join(process.env.HOME || "~", ".pi/agent/SOUL.md"),
];

function findSoul(cwd: string, extensionDir: string): { path: string; content: string } | null {
  // Check project and global locations
  for (const location of SOUL_LOCATIONS) {
    const fullPath = location.startsWith("/") ? location : join(cwd, location);
    if (existsSync(fullPath)) {
      try {
        return { path: fullPath, content: readFileSync(fullPath, "utf-8").trim() };
      } catch {
        continue;
      }
    }
  }

  // Fallback: extension repo's SOUL.md
  const repoSoul = join(extensionDir, "..", "..", "SOUL.md");
  if (existsSync(repoSoul)) {
    try {
      return { path: repoSoul, content: readFileSync(repoSoul, "utf-8").trim() };
    } catch {
      // Fall through
    }
  }

  return null;
}

function getExtensionDir(): string {
  const url = import.meta.url;
  if (url.startsWith("file://")) {
    return join(url.replace("file://", ""), "..");
  }
  return process.cwd();
}

export default function (pi: ExtensionAPI) {
  let currentSoul: { path: string; content: string } | null = null;

  pi.on("session_start", async (_event, ctx) => {
    const extensionDir = getExtensionDir();
    currentSoul = findSoul(ctx.cwd, extensionDir);

    if (ctx.hasUI) {
      if (currentSoul) {
        const name = currentSoul.path.split("/").pop() || "SOUL.md";
        ctx.ui.setStatus("soul", `☯ ${name}`);
      } else {
        ctx.ui.setStatus("soul", "☯ no soul");
      }
    }
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (!currentSoul) {
      return {};
    }

    // Prepend soul to system prompt
    return {
      systemPrompt: `${currentSoul.content}\n\n---\n\n${event.systemPrompt}`,
    };
  });

  // Command to show current soul
  pi.registerCommand("soul", {
    description: "Show current SOUL.md location and content",
    handler: async (args, ctx) => {
      const extensionDir = getExtensionDir();
      const soul = findSoul(ctx.cwd, extensionDir);

      if (!soul) {
        ctx.ui.notify("No SOUL.md found", "warning");
        return;
      }

      ctx.ui.notify(`Soul: ${soul.path}`, "info");
    },
  });
}
