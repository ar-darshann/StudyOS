export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const prompt = String(body.prompt || "").trim();
        if (!prompt) return Response.json({ error: "Please describe the image you want Nivo to create." }, { status: 400 });
        if (!context.env.AI) return Response.json({ error: "Nivo image generation is not connected yet." }, { status: 503 });

        const result = await context.env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });
        return new Response(result, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "no-store"
            }
        });
    } catch (error) {
        console.error("Nivora image generation error:", error);
        return Response.json({ error: "Nivo could not create that image right now." }, { status: 500 });
    }
}
