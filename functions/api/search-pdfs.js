const isPdfUrl = (value) => {
    try {
        const url = new URL(String(value || "").trim());
        const path = `${url.pathname}${url.search}`.toLowerCase();
        return path.includes(".pdf") || /[?&](file|format|type)=pdf(?:&|$)/i.test(url.search);
    } catch {
        return false;
    }
};

const cleanText = (value) => String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

function extractModelText(response) {
    if (!response) return "";
    if (typeof response.output_text === "string") return response.output_text;
    if (typeof response.response === "string") return response.response;
    if (typeof response.result?.response === "string") return response.result.response;

    const output = Array.isArray(response.output) ? response.output : [];
    return output
        .filter(item => item?.type === "message")
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .filter(item => item?.type === "output_text" && typeof item.text === "string")
        .map(item => item.text)
        .join("\n");
}

function extractCitations(response) {
    const output = Array.isArray(response?.output) ? response.output : [];
    return output
        .filter(item => item?.type === "message")
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .flatMap(item => Array.isArray(item.annotations) ? item.annotations : [])
        .filter(annotation => annotation?.type === "url_citation" && annotation.url)
        .map(annotation => ({
            title: annotation.title || "PDF study resource",
            url: annotation.url,
            reason: "Found by Nivo's web search."
        }));
}

function extractJsonObject(text) {
    if (typeof text !== "string") return null;
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    try { return JSON.parse(cleaned); } catch {}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
}

async function discoverPdfLinks(pageUrl) {
    if (!/^https?:\/\//i.test(pageUrl) || isPdfUrl(pageUrl)) return [];
    try {
        const response = await fetch(pageUrl, {
            headers: { "User-Agent": "Mozilla/5.0 Nivora/1.0" },
            redirect: "follow"
        });
        if (!response.ok) return [];
        const type = response.headers.get("content-type") || "";
        if (type.includes("application/pdf")) return [{ title: pageUrl.split("/").pop() || "PDF resource", url: pageUrl, reason: "Direct PDF resource found by Nivo." }];
        if (!type.includes("text/html")) return [];
        const html = await response.text();
        const found = [];
        const hrefPattern = /(?:href|src)=["']([^"']+)["']/gi;
        for (const match of html.matchAll(hrefPattern)) {
            if (found.length >= 6) break;
            try {
                const resolved = new URL(match[1], pageUrl).href;
                if (isPdfUrl(resolved)) found.push({ title: resolved.split("/").pop()?.split("?")[0] || "PDF resource", url: resolved, reason: "Direct PDF linked from a web result." });
            } catch {}
        }
        return found;
    } catch {
        return [];
    }
}

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const subject = String(url.searchParams.get("subject") || "").trim();
        const topic = String(url.searchParams.get("topic") || "").trim();
        if (!subject || !topic) return Response.json({ error: "Subject and topic are required." }, { status: 400 });

        const query = `${subject} ${topic} study notes lecture textbook filetype:pdf`;
        let candidates = [];

        // Primary: Cloudflare AI Gateway + OpenAI web search.
        // Cloudflare's Responses API returns web-search citations inside output[].message.content[].annotations,
        // so we read both the textual JSON response and those citations instead of assuming output_text exists.
        if (context.env.AI) {
            try {
                const prompt = `Find high-quality publicly accessible PDF study resources for the exact college subject and topic below. Search the web for direct PDFs, especially university, college, government, academic and reputable educational sources. Subject: ${subject}. Topic: ${topic}. Return up to 10 resources. In your answer, output ONLY JSON in this exact shape: {"results":[{"title":"...","url":"https://...pdf","reason":"Why this is useful"}]}. Never invent URLs. Prefer direct PDF URLs. If a search result is a webpage that contains a PDF, use the actual PDF URL if available.`;
                const response = await context.env.AI.run("openai/gpt-4.1-mini", {
                    input: prompt,
                    max_output_tokens: 3000,
                    tools: [{ type: "web_search_preview" }]
                }, { gateway: { id: "default" } });

                const text = extractModelText(response);
                const parsed = extractJsonObject(text);
                if (Array.isArray(parsed?.results)) {
                    candidates.push(...parsed.results.map(item => ({
                        title: String(item.title || "PDF resource"),
                        url: String(item.url || "").trim(),
                        reason: String(item.reason || "Relevant PDF study resource.")
                    })));
                }

                // Also use the URLs actually cited by the web-search tool. This is the important fix.
                candidates.push(...extractCitations(response));
            } catch (error) {
                console.error("Nivora AI PDF search failed:", error);
            }
        }

        // Resolve search citations that point to HTML pages rather than direct PDFs.
        const pageCandidates = candidates.filter(item => item.url && !isPdfUrl(item.url)).slice(0, 8);
        if (pageCandidates.length) {
            const resolved = await Promise.all(pageCandidates.map(item => discoverPdfLinks(item.url)));
            resolved.flat().forEach(item => candidates.push(item));
        }

        // Bing fallback when configured.
        if (!candidates.some(item => isPdfUrl(item.url)) && context.env.BING_SEARCH_API_KEY) {
            try {
                const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=20&responseFilter=Webpages&textDecorations=false&safeSearch=Strict`;
                const searchResponse = await fetch(searchUrl, { headers: { "Ocp-Apim-Subscription-Key": context.env.BING_SEARCH_API_KEY } });
                if (searchResponse.ok) {
                    const data = await searchResponse.json();
                    candidates.push(...(data.webPages?.value || []).map(item => ({ title: item.name || "PDF resource", url: item.url, reason: item.snippet || "Relevant PDF study resource." })));
                }
            } catch (error) { console.error("Nivora Bing PDF search failed:", error); }
        }

        // Last fallback: server-side DuckDuckGo search.
        if (!candidates.some(item => isPdfUrl(item.url))) {
            try {
                const ddg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0 Nivora/1.0" } });
                if (ddg.ok) {
                    const html = await ddg.text();
                    const matches = [...html.matchAll(/<a[^>]+class=["']result__a["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                    candidates.push(...matches.map(match => {
                        let resolved = match[1];
                        try { const u = new URL(resolved, "https://html.duckduckgo.com"); const redirected = u.searchParams.get("uddg"); if (redirected) resolved = decodeURIComponent(redirected); } catch {}
                        return { title: cleanText(match[2]) || "PDF resource", url: resolved, reason: "Relevant PDF study resource." };
                    }));
                }
            } catch (error) { console.error("Nivora DuckDuckGo PDF search failed:", error); }
        }

        // Keep only actual/direct PDF URLs and remove duplicates.
        const seen = new Set();
        candidates = candidates
            .filter(item => isPdfUrl(item.url))
            .filter(item => {
                try { item.url = new URL(item.url).href; } catch { return false; }
                const key = item.url.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 12);

        if (!candidates.length) {
            return Response.json({ success: true, results: [], message: "No direct PDF resources were found for this topic." });
        }

        // Rank candidates with Workers AI when available.
        if (context.env.AI && candidates.length > 1) {
            try {
                const rankingPrompt = `Rank these PDF resources for a college student studying ${subject} — ${topic}. Prefer exact topic relevance, university/government/academic sources, useful notes/lectures/textbooks, and credible sources. Return ONLY JSON: {"indexes":[0,1,2,3,4]}. Use valid indexes and no more than 5.\n\n${candidates.map((c, i) => `${i}: ${c.title}\n${c.url}\n${c.reason}`).join("\n\n")}`;
                const ranked = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { prompt: rankingPrompt, temperature: 0, max_tokens: 500 });
                const parsed = extractJsonObject(ranked?.response ?? ranked?.result?.response ?? "");
                if (Array.isArray(parsed?.indexes)) {
                    const ordered = parsed.indexes.map(Number).filter(i => Number.isInteger(i) && candidates[i]);
                    const rest = candidates.map((_, i) => i).filter(i => !ordered.includes(i));
                    candidates = [...ordered, ...rest].map(i => candidates[i]).slice(0, 5);
                }
            } catch (error) { console.error("Nivora PDF ranking failed:", error); }
        }

        return Response.json({
            success: true,
            results: candidates.slice(0, 5).map(item => ({
                title: item.title || "PDF resource",
                url: item.url,
                source: (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return "Web"; } })(),
                reason: item.reason || "Relevant PDF study resource."
            }))
        });
    } catch (error) {
        console.error("Nivora PDF search error:", error);
        return Response.json({ error: "Nivora could not search for PDF resources." }, { status: 500 });
    }
}
