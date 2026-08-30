export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const subject = String(url.searchParams.get("subject") || "").trim();
        const topic = String(url.searchParams.get("topic") || "").trim();
        if (!subject || !topic) {
            return Response.json({ error: "Subject and topic are required." }, { status: 400 });
        }

        const query = `${subject} ${topic} study notes lecture textbook filetype:pdf`;
        let candidates = [];

        // 1) Use Cloudflare AI Gateway's native web search when the existing AI binding is available.
        // This keeps the user inside Nivora and lets Nivo discover current web resources.
        if (context.env.AI) {
            try {
                const searchPrompt = `Find the best publicly accessible PDF study resources for this exact college subject and topic: ${subject} — ${topic}. Search the web. Prefer direct PDF files from universities, colleges, government/education institutions, reputable academic organizations, or established educational sites. Return ONLY valid JSON in this exact shape: {"results":[{"title":"...","url":"https://...pdf","reason":"..."}]}. Return up to 10 results. URLs must be actual URLs found by web search, must point directly to PDFs when possible, and must not be invented. Do not return non-PDF webpages.`;
                const response = await context.env.AI.run("openai/gpt-4.1-mini", {
                    input: searchPrompt,
                    max_output_tokens: 2500,
                    tools: [{ type: "web_search_preview" }]
                }, {
                    gateway: { id: "default" }
                });

                const text = response?.output_text || response?.response || response?.result?.response || "";
                let parsed = null;
                if (typeof text === "string") {
                    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
                    try { parsed = JSON.parse(cleaned); } catch {}
                } else if (text && typeof text === "object") {
                    parsed = text;
                }

                if (Array.isArray(parsed?.results)) {
                    candidates = parsed.results
                        .map(item => ({ title: String(item.title || "PDF resource"), url: String(item.url || "").trim(), reason: String(item.reason || "Relevant PDF study resource.") }))
                        .filter(item => /^https?:\/\//i.test(item.url) && /\.pdf(?:$|[?#])/i.test(item.url));
                }
            } catch (error) {
                console.error("Nivora native web PDF search failed:", error);
            }
        }

        // 2) Bing fallback when a key is configured.
        if (!candidates.length && context.env.BING_SEARCH_API_KEY) {
            try {
                const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=20&responseFilter=Webpages&textDecorations=false&safeSearch=Strict`;
                const searchResponse = await fetch(searchUrl, {
                    headers: { "Ocp-Apim-Subscription-Key": context.env.BING_SEARCH_API_KEY }
                });
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    candidates = (searchData.webPages?.value || [])
                        .filter(item => /\.pdf(?:$|[?#])/i.test(String(item.url || "")))
                        .map(item => ({ title: item.name || "PDF resource", url: item.url, reason: item.snippet || "Relevant PDF study resource." }));
                }
            } catch (error) {
                console.error("Nivora Bing PDF search failed:", error);
            }
        }

        // 3) Last-resort server-side DuckDuckGo search. The user still never leaves Nivora.
        if (!candidates.length) {
            try {
                const ddg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                    headers: { "User-Agent": "Mozilla/5.0 Nivora/1.0" }
                });
                if (ddg.ok) {
                    const html = await ddg.text();
                    const matches = [...html.matchAll(/<a[^>]+class=["']result__a["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                    candidates = matches.map(match => {
                        let resolved = match[1];
                        try {
                            const u = new URL(resolved, "https://html.duckduckgo.com");
                            const redirected = u.searchParams.get("uddg");
                            if (redirected) resolved = decodeURIComponent(redirected);
                        } catch {}
                        return {
                            title: match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim(),
                            url: resolved,
                            reason: "Relevant PDF study resource."
                        };
                    }).filter(item => /\.pdf(?:$|[?#])/i.test(item.url));
                }
            } catch (error) {
                console.error("Nivora DuckDuckGo PDF search failed:", error);
            }
        }

        // De-duplicate and keep only direct PDF URLs.
        const seen = new Set();
        candidates = candidates.filter(item => {
            const key = item.url.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 10);

        if (!candidates.length) {
            return Response.json({
                success: true,
                results: [],
                message: "No direct PDF resources were found for this topic."
            });
        }

        // Rank the discovered candidates with the existing Workers AI model when possible.
        if (context.env.AI && candidates.length > 1) {
            try {
                const rankingPrompt = `Rank these PDF candidates for a college student studying ${subject} — ${topic}. Prefer exact topic relevance, university/government/academic sources, clear notes or lecture material, and direct PDF links. Return ONLY JSON: {"indexes":[0,1,...]} with up to 5 indexes. Do not invent indexes.\n\n${candidates.map((c, i) => `${i}: ${c.title}\n${c.url}\n${c.reason}`).join("\n\n")}`;
                const ranked = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
                    prompt: rankingPrompt,
                    temperature: 0,
                    max_tokens: 500
                });
                const raw = ranked?.response ?? ranked?.result?.response ?? "";
                const match = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null;
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed.indexes)) {
                        const ordered = parsed.indexes.map(Number).filter(i => Number.isInteger(i) && candidates[i]);
                        const rest = candidates.map((_, i) => i).filter(i => !ordered.includes(i));
                        candidates = [...ordered, ...rest].map(i => candidates[i]).slice(0, 5);
                    }
                }
            } catch (error) {
                console.error("Nivora PDF ranking failed:", error);
            }
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
