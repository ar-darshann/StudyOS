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

function clean(value) {
    return String(value || "").replace(/[•·▪◦]/g, " ").replace(/\s+/g, " ").replace(/^[-–—:|]+\s*/, "").replace(/\s+[-–—:|]+\s*$/, "").trim();
}
function normalise(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function looksLikeSubject(line) {
    const value = clean(line);
    if (!value || value.length < 3 || value.length > 90) return false;
    if (/^(semester|sem|year|academic year|course|curriculum|syllabus|unit|module|chapter|contents|table of contents|page)\b/i.test(value)) return false;
    if (/^(unit|module|chapter|lesson|topic|week)\s*[ivxlcdm\d]+\b/i.test(value)) return false;
    if (/^\d+[.)]\s*(unit|module|chapter|topic)\b/i.test(value)) return false;
    if (/^(course outcomes|learning outcomes|objectives|references|text books|textbooks|credits|hours)\b/i.test(value)) return false;
    const numbered = value.match(/^\s*(\d{1,2})[.)]\s+(.+)$/);
    if (numbered) return numbered[2].length >= 3 && !/^(unit|module|chapter|topic)\b/i.test(numbered[2]);
    return /^[A-Z][A-Za-z0-9&'(),/ -]{2,85}$/.test(value) && !/[.!?]$/.test(value);
}
function subjectNameFromLine(line) { const match = clean(line).match(/^\s*\d{1,2}[.)]\s+(.+)$/); return clean(match ? match[1] : line); }
function looksLikeTopic(line) {
    const value = clean(line);
    if (!value || value.length < 3 || value.length > 120) return false;
    if (/^(semester|sem|academic year|course|curriculum|syllabus|contents|references|text books|textbooks|credits|hours)\b/i.test(value)) return false;
    if (/^(unit|module|chapter|lesson|topic|week)\b/i.test(value)) return true;
    if (/^\d+(?:\.\d+)*[.)]?\s+/.test(value)) return true;
    if (/^[A-Z]?[\-–—]?\s*[IVXLC]+[.)\-:]\s+/.test(value)) return true;
    return false;
}
function topicNameFromLine(line) {
    return clean(line).replace(/^\s*(?:unit|module|chapter|lesson|topic|week)\s*(?:[ivxlcdm]+|\d+(?:\.\d+)*)\s*[:.)\-–—]?\s*/i, "").replace(/^\s*\d+(?:\.\d+)*[.)\-–—:]?\s*/, "").replace(/^\s*[IVXLC]+[.)\-–—:]\s*/, "").trim();
}

export function parseStructuredCurriculum(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean);
    const subjects = [];
    let current = null;
    for (const line of lines) {
        if (looksLikeSubject(line)) {
            const name = subjectNameFromLine(line), key = normalise(name);
            if (!key) continue;
            if (!subjects.some(subject => normalise(subject.name) === key)) {
                current = { name, description: "", topics: [] };
                subjects.push(current);
            } else current = subjects.find(subject => normalise(subject.name) === key);
            continue;
        }
        if (current && looksLikeTopic(line)) {
            const topic = topicNameFromLine(line);
            if (topic && !current.topics.some(existing => normalise(existing) === normalise(topic))) current.topics.push(topic);
        }
    }
    const useful = subjects.filter(subject => subject.topics.length || subjects.length <= 6);
    return useful.length >= 1 ? useful : [];
}

export async function analyzeCurriculum(file) {
    const text = await extractCurriculumText(file);
    if (!text) throw new Error("This file does not contain readable text. Try a text-based PDF or TXT/MD/CSV file.");
    const structured = parseStructuredCurriculum(text);
    if (structured.length) return structured;
    const response = await fetch("/api/curriculum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curriculum: text }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Curriculum analysis failed.");
    return result.subjects || [];
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("acceptCurriculum")?.addEventListener("click", function () {
        localStorage.setItem("studyOS-curriculum-organized", "true");
    }, { once: true });
});
