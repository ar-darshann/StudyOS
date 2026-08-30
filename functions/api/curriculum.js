export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const curriculum = String(body.curriculum || "").trim();

        if (!curriculum) {
            return Response.json({ error: "No curriculum text was provided." }, { status: 400 });
        }

        if (!context.env.AI) {
            return Response.json({
                error: "StudyOS AI is not connected yet. Add the Workers AI binding named AI in Cloudflare."
            }, { status: 503 });
        }

        const prompt = `You are the curriculum organizer for StudyOS. Read the curriculum below and identify the actual academic subjects and the topics explicitly contained in each subject. Do not invent subjects or topics. Preserve the curriculum's terminology where possible. Return ONLY valid JSON in this exact shape: {"subjects":[{"name":"Subject name","description":"Short description","topics":["Topic 1","Topic 2"]}]}. Remove duplicate topics. If a section is a unit/module rather than a subject, place it under its parent subject. Curriculum:\n\n${curriculum.slice(0, 120000)}`;

        const result = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
                { role: "system", content: "You extract structured academic curriculum data. Output JSON only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 5000
        });

        const raw = result?.response || result?.result?.response || "";
        const jsonText = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed.subjects)) {
            throw new Error("AI returned an invalid curriculum structure.");
        }

        const subjects = parsed.subjects
            .filter(subject => subject && String(subject.name || "").trim())
            .map(subject => ({
                name: String(subject.name).trim(),
                description: String(subject.description || "").trim(),
                topics: Array.from(new Set(
                    (Array.isArray(subject.topics) ? subject.topics : [])
                        .map(topic => String(topic).trim())
                        .filter(Boolean)
                ))
            }));

        return Response.json({ subjects });
    } catch (error) {
        return Response.json({
            error: "StudyOS could not analyze this curriculum.",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
