export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const prompt = String(body.prompt || "").trim();
        if (!prompt) {
            return Response.json(
                { error: "Please describe the image you want Nivo to create." },
                { status: 400 }
            );
        }
        if (!context.env.AI) {
            return Response.json(
                { error: "Nivo image generation is not connected yet." },
                { status: 503 }
            );
        }

        const result = await context.env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
            prompt
        });

        // FLUX returns the generated image as base64. Passing the result object
        // directly to Response() creates an invalid blob, so decode the image
        // into real binary bytes before returning it to the browser.
        if (!result?.image) {
            throw new Error("Image generation returned no image data.");
        }

        const binaryString = atob(result.image);
        const imageBytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));

        return new Response(imageBytes, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "no-store"
            }
        });
    } catch (error) {
        console.error("Nivora image generation error:", error);
        return Response.json(
            { error: "Nivo could not create that image right now." },
            { status: 500 }
        );
    }
}
