import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";

const BraveSearchParams = Type.Object({
  query: Type.String({ description: "Search query" }),
  count: Type.Optional(Type.Number({ description: "Number of results (default 5, max 20)" })),
});

type BraveSearchInput = Static<typeof BraveSearchParams>;

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[];
  };
  query?: {
    original: string;
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "brave_search",
    label: "Brave Search",
    description: "Search the web using Brave Search API. Use this to find current information, documentation, or answers to questions.",
    parameters: BraveSearchParams,

    async execute(toolCallId, params: BraveSearchInput, signal, onUpdate, ctx) {
      const apiKey = process.env.BRAVE_API_KEY;
      
      if (!apiKey) {
        return {
          content: [{ type: "text", text: "Error: BRAVE_API_KEY environment variable not set. Get an API key from https://brave.com/search/api/" }],
          details: { error: "missing_api_key" },
        };
      }

      const count = Math.min(params.count ?? 5, 20);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(params.query)}&count=${count}`;

      try {
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "X-Subscription-Token": apiKey,
          },
          signal,
        });

        if (!response.ok) {
          const text = await response.text();
          return {
            content: [{ type: "text", text: `Brave Search API error: ${response.status} ${response.statusText}\n${text}` }],
            details: { error: "api_error", status: response.status },
          };
        }

        const data: BraveSearchResponse = await response.json();
        const results = data.web?.results ?? [];

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No results found for: ${params.query}` }],
            details: { query: params.query, count: 0 },
          };
        }

        const formatted = results.map((r, i) => 
          `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.description}`
        ).join("\n\n");

        return {
          content: [{ type: "text", text: `Search results for "${params.query}":\n\n${formatted}` }],
          details: { query: params.query, count: results.length, results },
        };

      } catch (err: any) {
        if (err.name === "AbortError") {
          return {
            content: [{ type: "text", text: "Search cancelled" }],
            details: { error: "cancelled" },
          };
        }
        return {
          content: [{ type: "text", text: `Search failed: ${err.message}` }],
          details: { error: err.message },
        };
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const hasKey = !!process.env.BRAVE_API_KEY;
    if (!hasKey && ctx.hasUI) {
      ctx.ui.notify("Brave Search: BRAVE_API_KEY not set", "warning");
    }
  });
}
