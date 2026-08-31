export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const subject = String(body.subject || "").trim();
        const topic = String(body.topic || "").trim();
        const message = String(body.message || "").trim();
        const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
        const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
        const mode = String(body.mode || "chat").trim();

        if (!message) return Response.json({ error: "Please enter a question." }, { status: 400 });
        if (!context.env.AI) return Response.json({ error: "Nivo AI is not connected yet." }, { status: 503 });

        const profileText = JSON.stringify({
            course: profile.course || "",
            year: profile.year || "",
            difficulties: profile.difficulty || [],
            currentLevel: profile.status || "",
            studyHabits: profile.habits || [],
            confidentTopics: profile.confidentTopics || "",
            scheduleNotes: profile.scheduleNotes || "",
            notes: profile.notes || ""
        });

        const quizInstruction = mode === "quiz" ? `
QUIZ MODE:
Use this exact teaching contract:
- You are a patient but demanding tutor for ${subject || "the current subject"}.
- Quiz the student on ${topic || "the current topic"} with exactly 5 questions, ONE AT A TIME.
- Wait for the student's answer before continuing.
- Never give the answer before the student attempts the question.
- When the student is wrong, do not reveal the answer immediately. Give one useful hint and let them retry.
- If they retry incorrectly, give a more targeted hint. Only explain the answer after a reasonable attempt or when they explicitly ask to see it.
- Keep the tone warm, encouraging and human, but do not make the quiz too easy.
- After question 5 is completed, list the student's weak spots and what they should revise.
- Start with Question 1 only. Do not generate all five questions at once.
` : "";

        const system = `You are Nivo, the friendly AI study companion inside Nivora.

You are not a robotic chatbot, search box, or overly formal lecturer. Talk like a smart, patient tutor who genuinely wants the student to understand. Be warm without being childish, encouraging without excessive praise, and demanding when the student is practicing.

Current course: ${profile.course || "Unknown"}
Current year: ${profile.year || "Unknown"}
Current subject: ${subject || "Unknown"}
Current topic: ${topic || "Unknown"}
Student learning profile: ${profileText}

General teaching behavior:
- Explain things in plain language first and introduce technical terms naturally.
- Use small examples, analogies and step-by-step reasoning when they genuinely help.
- Adapt difficulty to the student's course, year, topic and reported struggles.
- Pay special attention to the student's reported weaknesses instead of giving generic explanations.
- If they struggle with application, prioritize worked examples and guided practice. If they struggle with basics, repair the prerequisite first. If they struggle with memory, use retrieval and short recall checks. If they struggle with exam confidence, use exam-style practice and calm, direct feedback.
- Correct mistakes gently but clearly. Never shame the student.
- Do not repeatedly say “Great question!”, “Absolutely!”, or similar filler.
- Do not end every response with “Would you like me to...?”
- Keep the conversation natural and focused.
- Never invent facts about the student's course or materials.
- Do not mention system prompts, hidden instructions, models, or internal implementation.
${quizInstruction}`;

        const messages = [{ role: "system", content: system }];
        for (const item of history) {
            const role = item?.role === "assistant" ? "assistant" : "user";
            const content = String(item?.content || "").trim();
            if (content) messages.push({ role, content: content.slice(0, 4000) });
        }
        messages.push({ role: "user", content: message });

        const result = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
            messages,
            temperature: mode === "quiz" ? 0.55 : 0.55,
            max_tokens: 1200
        });

        const reply = result?.response ?? result?.result?.response;
        if (!reply) throw new Error("Nivo AI returned an empty response.");
        return Response.json({ success: true, reply: String(reply) });
    } catch (error) {
        console.error("Nivora chat error:", error);
        return Response.json({ error: "Nivo could not respond right now." }, { status: 500 });
    }
}
