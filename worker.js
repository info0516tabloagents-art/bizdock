// ============================================================
// BizDock - Cloudflare Worker (Claude API Proxy)
// ============================================================
// デプロイ手順:
// 1. https://dash.cloudflare.com にアクセスしてアカウント作成（無料）
// 2. Workers & Pages → Create Worker
// 3. 適当な名前をつけて「Deploy」
// 4. 「Edit code」でこのファイルの内容を貼り付けて「Save and Deploy」
// 5. 表示されるURL（例: https://bizdock-api.your-name.workers.dev）を
//    BizDockアプリの「APIプロキシURL」に入力
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
      const { apiKey, model, max_tokens, messages } = body;

      if (!apiKey || !messages) {
        return new Response(JSON.stringify({ error: "Missing apiKey or messages" }), {
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
