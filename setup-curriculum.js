import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

export async function extractCurriculumText(file) {
    const name = file.name.toLowerCase();

    if (name.endsWith(".pdf")) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = "";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str || "").join(" ") + "\n";
        }

        return text.trim();
    }

    return (await file.text()).trim();
}

export async function analyzeCurriculum(file) {
    const text = await extractCurriculumText(file);

    if (!text) {
        throw new Error("This file does not contain readable text. Try a text-based PDF or TXT/MD/CSV file.");
    }

    const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculum: text })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || "Curriculum analysis failed.");
    }

    return result.subjects || [];
}
