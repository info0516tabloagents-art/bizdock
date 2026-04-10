// ============================================================
// BizDock - Cloudflare Worker (Claude API Proxy)
// ============================================================
// APIキーはCloudflare Secretsに安全に保管されています。
// クライアント側からキーを送る必要はありません。
// ============================================================

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const body = await request.json();
      const { model, max_tokens, messages } = body;

      // APIキーはCloudflare Secretsから取得（安全）
      const apiKey = env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key not configured on server" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (!messages) {
        return new Response(JSON.stringify({ error: "Missing messages" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Call Anthropic API
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-20250514",
          max_tokens: max_tokens || 1500,
          messages: messages,
        }),
      });

      const result = await anthropicResponse.json();

      return new Response(JSON.stringify(result), {
        status: anthropicResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
