export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const subject = String(body.subject || "").trim();
        const topic = String(body.topic || "").trim();
        const message = String(body.message || "").trim();

        if (!message) return Response.json({ error: "Please enter a question." }, { status: 400 });
        if (!context.env.AI) return Response.json({ error: "Nivo AI is not connected yet." }, { status: 503 });

        const result = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
            messages: [
                { role: "system", content: `You are Nivo, the study assistant inside Nivora. Help a student understand concepts clearly and accurately. Current subject: ${subject || "Unknown"}. Current topic: ${topic || "Unknown"}. Do not claim to know the student's course material unless it is provided in the conversation. Explain step-by-step when useful, keep answers focused, and say when something is uncertain.` },
                { role: "user", content: message }
            ],
            temperature: 0.35,
            max_tokens: 900
        });

        const reply = result?.response ?? result?.result?.response;
        if (!reply) throw new Error("Nivo AI returned an empty response.");
        return Response.json({ success: true, reply: String(reply) });
    } catch (error) {
        console.error("Nivora chat error:", error);
        return Response.json({ error: "Nivo could not respond right now." }, { status: 500 });
    }
}
