export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    if (url.pathname !== "/audit" || request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const { businessName, website, industry, teamSize } = await request.json();
      if (!businessName || !website) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prompt = `Return ONLY pure JSON no markdown. Business: ${businessName}, Website: ${website}, Industry: ${industry || "Unknown"}, Team: ${teamSize || "Unknown"}. Format: {"summary":"text","scores":{"automation":25,"ai":20,"growth":45},"overallGrade":"C","gradeLabel":"Needs Work","issues":[{"icon":"📞","title":"Issue","desc":"Description","severity":"critical"}],"opportunities":[{"icon":"🤖","title":"Opportunity","service":"AI Voice Receptionist","impact":"Impact"}],"quickWins":["win1","win2"],"estimatedROI":"Save 20hrs/month"}`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await r.json();
      const text = d.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Something went wrong" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
