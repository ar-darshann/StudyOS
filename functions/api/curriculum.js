export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const curriculum = String(body.curriculum || "").trim();
        if (!curriculum) return Response.json({ error: "No curriculum text was provided." }, { status: 400 });
        if (!context.env.AI) return Response.json({ error: "Nivora AI binding is unavailable." }, { status: 503 });
        const schema = { type: "object", properties: { subjects: { type: "array", items: { type: "object", properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, topics: { type: "array", items: { type: "string" } } }, required: ["code", "name", "description", "topics"] } } }, required: ["subjects"] };
        const prompt = `You are Nivora's curriculum organizer. Extract ONLY the academic structure explicitly present in the supplied curriculum. Identify real subjects/courses, not semesters, units, chapters, page headings, learning outcomes, or administrative text. If a subject/course code such as UCOM101 exists, preserve it in the separate code field. Put ONLY the human-readable subject/course title in name. NEVER use a code as the name. Put units, modules, chapters and explicitly named topic sections underneath their parent subject as topics. Do not invent subjects, codes or topics. If no code exists, return an empty code string. Preserve original terminology. Remove duplicates. Keep descriptions short and curriculum-based. Return JSON only.\n\nCURRICULUM:\n${curriculum.slice(0, 120000)}`;
        const result = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { messages: [{ role: "system", content: "You extract structured academic curriculum data. Follow the supplied JSON schema exactly." }, { role: "user", content: prompt }], response_format: { type: "json_schema", json_schema: schema }, temperature: 0, max_tokens: 6000 });
        const raw = result?.response ?? result?.result?.response;
        if (!raw) throw new Error("Workers AI returned an empty response.");
        let parsed;
        try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { throw new Error("Workers AI returned data that was not valid JSON."); }
        if (!parsed || !Array.isArray(parsed.subjects)) throw new Error("Workers AI returned an invalid subjects structure.");
        const subjects = parsed.subjects.filter(s => s && String(s.name || "").trim()).map(s => ({ code: String(s.code || "").trim(), name: String(s.name).trim(), description: String(s.description || "").trim(), topics: Array.from(new Set((Array.isArray(s.topics) ? s.topics : []).map(t => String(t).trim()).filter(Boolean))) }));
        if (!subjects.length) throw new Error("No academic subjects could be identified from the curriculum.");
        return Response.json({ success: true, subjects });
    } catch (error) {
        console.error("Nivora curriculum organizer error:", error);
        return Response.json({ error: "Nivora could not organize this curriculum.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
