export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const subject = String(url.searchParams.get("subject") || "").trim();
        const topic = String(url.searchParams.get("topic") || "").trim();
        if (!subject || !topic) return Response.json({ error: "Subject and topic are required." }, { status: 400 });

        const query = `${subject} ${topic} study notes lecture filetype:pdf`;
        let candidates = [];

        // Prefer Bing when a key is configured, but keep the prototype usable without one.
        if (context.env.BING_SEARCH_API_KEY) {
            const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=12&responseFilter=Webpages&textDecorations=false&safeSearch=Strict`;
            const searchResponse = await fetch(searchUrl, { headers: { "Ocp-Apim-Subscription-Key": context.env.BING_SEARCH_API_KEY } });
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                candidates = searchData.webPages?.value || [];
            }
        }

        // Fallback: server-side DuckDuckGo HTML search. The user never leaves Nivora.
        if (!candidates.length) {
            const ddg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0 Nivora/1.0" } });
            if (ddg.ok) {
                const html = await ddg.text();
                const matches = [...html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
                candidates = matches.map(match => {
                    const href = match[1];
                    const title = match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
                    let resolved = href;
                    try {
                        const u = new URL(href, "https://html.duckduckgo.com");
                        const redirected = u.searchParams.get("uddg");
                        if (redirected) resolved = decodeURIComponent(redirected);
                    } catch {}
                    return { name: title, url: resolved, snippet: "Web result" };
                });
            }
        }

        // PDF-only: never show a non-PDF result as a study material.
        candidates = candidates.filter(item => /\.pdf(?:$|[?#])/i.test(String(item.url || ""))).slice(0, 12);
        if (!candidates.length) return Response.json({ success: true, results: [] });

        const ai = context.env.AI;
        if (ai) {
            try {
                const rankingPrompt = `You are Nivo, ranking web resources for a student. Rank the supplied PDF candidates for this exact subject/topic. Prefer university, government, academic, educational and reputable learning sources; prefer direct PDFs; prioritize relevance, clarity and likely usefulness. Never invent a URL or select an index outside the supplied list. Return JSON only with results: an array of at most 5 objects with index and reason.\nSubject: ${subject}\nTopic: ${topic}\nCandidates:\n${candidates.map((c, i) => `${i}: ${c.name}\nURL: ${c.url}\nSnippet: ${c.snippet || ""}`).join("\n\n")}`;
                const ranked = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
                    messages: [{ role: "user", content: rankingPrompt }],
                    response_format: { type: "json_schema", json_schema: { type: "object", properties: { results: { type: "array", items: { type: "object", properties: { index: { type: "integer" }, reason: { type: "string" } }, required: ["index", "reason"] } } }, required: ["results"] } },
                    temperature: 0,
                    max_tokens: 900
                });
                const raw = ranked?.response ?? ranked?.result?.response;
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                const selected = Array.isArray(parsed?.results) ? parsed.results.slice(0, 5) : [];
                const results = selected.map(item => {
                    const candidate = candidates[Number(item.index)];
                    if (!candidate) return null;
                    return { title: candidate.name || "PDF resource", url: candidate.url, source: new URL(candidate.url).hostname.replace(/^www\./, ""), reason: item.reason || "Relevant PDF resource for this topic." };
                }).filter(Boolean);
                if (results.length) return Response.json({ success: true, results });
            } catch (rankError) {
                console.error("Nivora PDF ranking error:", rankError);
            }
        }

        return Response.json({ success: true, results: candidates.slice(0, 5).map(item => ({ title: item.name || "PDF resource", url: item.url, source: new URL(item.url).hostname.replace(/^www\./, ""), reason: "Relevant PDF resource for this topic." })) });
    } catch (error) {
        console.error("Nivora PDF search error:", error);
        return Response.json({ error: "Nivora could not search for PDF resources." }, { status: 500 });
    }
}
