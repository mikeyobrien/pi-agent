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
 * The soul is re-read on every prompt, so edits apply immediately.
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
  const extensionDir = getExtensionDir();

  function updateStatus(ctx: { hasUI: boolean; ui: any; cwd: string }) {
    const soul = findSoul(ctx.cwd, extensionDir);
    if (ctx.hasUI) {
      if (soul) {
        const name = soul.path.split("/").pop() || "SOUL.md";
        ctx.ui.setStatus("soul", `☯ ${name}`);
      } else {
        ctx.ui.setStatus("soul", "☯ no soul");
      }
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    updateStatus(ctx);
  });

  pi.on("before_agent_start", async (event, ctx) => {
    // Re-read soul on every prompt (picks up edits immediately)
    const soul = findSoul(ctx.cwd, extensionDir);
    updateStatus(ctx);

    if (!soul) {
      return {};
    }

    return {
      systemPrompt: `${soul.content}\n\n---\n\n${event.systemPrompt}`,
    };
  });

  // Command to show current soul
  pi.registerCommand("soul", {
    description: "Show current SOUL.md location and content",
    handler: async (args, ctx) => {
      const soul = findSoul(ctx.cwd, extensionDir);

      if (!soul) {
        ctx.ui.notify("No SOUL.md found", "warning");
        return;
      }

      ctx.ui.notify(`Soul: ${soul.path}`, "info");
    },
  });
}
