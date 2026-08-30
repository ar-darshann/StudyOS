export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const subject = String(url.searchParams.get("subject") || "").trim();
        const topic = String(url.searchParams.get("topic") || "").trim();
        if (!subject || !topic) return Response.json({ error: "Subject and topic are required." }, { status: 400 });

        const key = context.env.BING_SEARCH_API_KEY;
        if (!key) return Response.json({ error: "Web PDF search is not configured." }, { status: 503 });

        const query = `${subject} ${topic} study notes lecture filetype:pdf`;
        const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10&responseFilter=Webpages&textDecorations=false&safeSearch=Strict`;
        const searchResponse = await fetch(searchUrl, { headers: { "Ocp-Apim-Subscription-Key": key } });
        if (!searchResponse.ok) throw new Error(`Web search failed (${searchResponse.status}).`);
        const searchData = await searchResponse.json();
        let candidates = (searchData.webPages?.value || []).filter(item => /\.pdf(?:$|[?#])/i.test(item.url) || /pdf/i.test(`${item.name} ${item.snippet || ""}`)).slice(0, 10);

        if (!candidates.length) return Response.json({ success: true, results: [] });

        if (context.env.AI) {
            const rankingPrompt = `Rank these public web results for a student looking for the best study PDF for the exact subject/topic below. Prefer authoritative educational sources, universities, government/academic institutions, clear lecture notes, and direct PDF resources. Do not invent facts. Return JSON with a results array containing at most 5 items, preserving only URLs from the supplied candidates.\nSubject: ${subject}\nTopic: ${topic}\nCandidates:\n${candidates.map((c, i) => `${i}: ${c.name}\nURL: ${c.url}\nSnippet: ${c.snippet || ""}`).join("\n\n")}`;
            const ranked = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { messages: [{ role: "user", content: rankingPrompt }], response_format: { type: "json_schema", json_schema: { type: "object", properties: { results: { type: "array", items: { type: "object", properties: { index: { type: "integer" }, reason: { type: "string" } }, required: ["index", "reason"] } } }, required: ["results"] } }, temperature: 0, max_tokens: 900 });
            const raw = ranked?.response ?? ranked?.result?.response;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            const selected = Array.isArray(parsed?.results) ? parsed.results.slice(0, 5) : [];
            candidates = selected.map(item => ({ candidate: candidates[item.index], reason: item.reason })).filter(x => x.candidate);
            return Response.json({ success: true, results: candidates.map(x => ({ title: x.candidate.name, url: x.candidate.url, source: new URL(x.candidate.url).hostname.replace(/^www\./, ""), reason: x.reason })) });
        }

        return Response.json({ success: true, results: candidates.slice(0, 5).map(item => ({ title: item.name, url: item.url, source: new URL(item.url).hostname.replace(/^www\./, ""), reason: item.snippet || "Relevant PDF resource." })) });
    } catch (error) {
        console.error("Nivora PDF search error:", error);
        return Response.json({ error: "Nivora could not search for PDF resources." }, { status: 500 });
    }
}
