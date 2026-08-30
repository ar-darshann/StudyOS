function isPdfUrl(value) {
    return /\.pdf(?:$|[?#])/i.test(String(value || ""));
}

function hostname(value) {
    try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "Web"; }
}

function collectWebItems(value, output = []) {
    if (!value || typeof value !== "object") return output;
    if (Array.isArray(value)) {
        value.forEach(item => collectWebItems(item, output));
        return output;
    }
    const url = typeof value.url === "string" ? value.url : null;
    const title = typeof value.title === "string" ? value.title : (typeof value.name === "string" ? value.name : "");
    if (url && /^https?:\/\//i.test(url)) output.push({ url, title });
    Object.values(value).forEach(item => collectWebItems(item, output));
    return output;
}

function responseText(value) {
    const parts = [];
    const walk = item => {
        if (typeof item === "string") parts.push(item);
        else if (Array.isArray(item)) item.forEach(walk);
        else if (item && typeof item === "object") Object.values(item).forEach(walk);
    };
    walk(value);
    return parts.join("\n");
}

export async function onRequestGet(context) {
    try {
        const requestUrl = new URL(context.request.url);
        const subject = String(requestUrl.searchParams.get("subject") || "").trim();
        const topic = String(requestUrl.searchParams.get("topic") || "").trim();
        if (!subject || !topic) return Response.json({ error: "Subject and topic are required." }, { status: 400 });

        const query = `${subject} ${topic} study notes lecture filetype:pdf`;
        const ai = context.env.AI;

        // Primary path: Nivo uses Cloudflare AI Gateway's native web search so the
        // user stays inside Nivora. Cloudflare documents web_search_preview for
        // OpenAI Responses models through the AI binding + AI Gateway.
        if (ai) {
            try {
                const prompt = `Find the best publicly accessible PDF study materials for the exact subject "${subject}" and topic "${topic}". Search the web. Return JSON only in this exact shape: {"results":[{"title":"...","url":"https://...pdf","reason":"..."}]}. Return at most 5 results. Every URL MUST point directly to a PDF or a URL that clearly ends in .pdf. Prefer university, government, academic institutions, reputable educational organisations and high-quality lecture notes. Do not invent URLs. Do not return generic webpages, videos, blogs, shopping pages or search pages.`;
                const response = await ai.run("openai/gpt-4.1-mini", {
                    input: prompt,
                    max_output_tokens: 2200,
                    tools: [{ type: "web_search_preview" }]
                }, {
                    gateway: { id: "default", skipCache: true }
                });

                let parsed = null;
                const text = responseText(response);
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try { parsed = JSON.parse(jsonMatch[0]); } catch {}
                }

                const direct = Array.isArray(parsed?.results) ? parsed.results : [];
                const discovered = collectWebItems(response);
                const candidates = [];
                const seen = new Set();

                [...direct.map(item => ({ url: item.url, title: item.title, reason: item.reason })), ...discovered.map(item => ({ url: item.url, title: item.title }))].forEach(item => {
                    if (!item.url || !isPdfUrl(item.url) || seen.has(item.url)) return;
                    seen.add(item.url);
                    candidates.push({
                        title: item.title || "PDF study material",
                        url: item.url,
                        source: hostname(item.url),
                        reason: item.reason || "Relevant PDF resource found for this topic."
                    });
                });

                if (candidates.length) return Response.json({ success: true, results: candidates.slice(0, 5) });
            } catch (searchError) {
                console.error("Nivora AI web PDF search failed:", searchError);
            }
        }

        // Optional Bing fallback when a key is configured.
        let candidates = [];
        if (context.env.BING_SEARCH_API_KEY) {
            try {
                const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=12&responseFilter=Webpages&textDecorations=false&safeSearch=Strict`;
                const searchResponse = await fetch(searchUrl, {
                    headers: { "Ocp-Apim-Subscription-Key": context.env.BING_SEARCH_API_KEY }
                });
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    candidates = searchData.webPages?.value || [];
                }
            } catch (error) {
                console.error("Bing PDF search failed:", error);
            }
        }

        // Last-resort server-side DuckDuckGo search. Nivora never redirects the user.
        if (!candidates.length) {
            try {
                const ddg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                    headers: { "User-Agent": "Nivora/1.0" }
                });
                if (ddg.ok) {
                    const html = await ddg.text();
                    const matches = [...html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
                    candidates = matches.map(match => {
                        let resolved = match[1];
                        try {
                            const u = new URL(resolved, "https://html.duckduckgo.com");
                            const redirected = u.searchParams.get("uddg");
                            if (redirected) resolved = decodeURIComponent(redirected);
                        } catch {}
                        return {
                            name: match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim(),
                            url: resolved
                        };
                    });
                }
            } catch (error) {
                console.error("DuckDuckGo PDF search failed:", error);
            }
        }

        const results = candidates
            .filter(item => isPdfUrl(item.url))
            .slice(0, 5)
            .map(item => ({
                title: item.name || item.title || "PDF study material",
                url: item.url,
                source: hostname(item.url),
                reason: "Relevant PDF resource found for this topic."
            }));

        return Response.json({ success: true, results });
    } catch (error) {
        console.error("Nivora PDF search error:", error);
        return Response.json({ error: "Nivora could not search for PDF resources." }, { status: 500 });
    }
}
