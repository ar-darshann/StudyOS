/* Topic-level study material controls — PDF-only prototype */
(function () {
    const SUBJECT_KEY = "subject";

    function escapeHTML(value) {
        return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function getContext() {
        const subjectId = new URLSearchParams(location.search).get(SUBJECT_KEY);
        const subjects = window.studyOSStorage ? window.studyOSStorage.getSubjects() : {};
        return { subjectId, subject: subjects[subjectId] };
    }

    async function getTopicMaterials(subjectId, topicId) {
        if (!window.studyOSStorage) return [];
        const all = await window.studyOSStorage.getMaterials(subjectId);
        return all.filter(material => material.topicId === topicId);
    }

    function openPdfSearch(subjectName, topicName) {
        const query = `${subjectName} ${topicName} study notes filetype:pdf`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    }

    function makeFileInput(subjectId, topicId, topicName, controls) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf,.pdf";
        input.multiple = true;
        input.hidden = true;
        input.addEventListener("change", async function () {
            for (const file of Array.from(input.files || [])) {
                if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                    alert("For now, Nivora accepts PDF files only.");
                    continue;
                }
                try {
                    await window.studyOSStorage.addMaterial({
                        id: crypto.randomUUID(),
                        subjectId,
                        topicId,
                        topicName,
                        name: file.name,
                        type: "application/pdf",
                        size: file.size,
                        addedAt: new Date().toISOString(),
                        source: "upload",
                        blob: file
                    });
                } catch (error) {
                    console.error(error);
                    alert("This PDF could not be saved in this browser.");
                }
            }
            input.value = "";
            await renderTopicMaterials(controls, subjectId, topicId);
        });
        controls.appendChild(input);
        return input;
    }

    async function renderTopicMaterials(controls, subjectId, topicId) {
        const list = controls.querySelector(".topic-material-list");
        if (!list) return;
        const materials = await getTopicMaterials(subjectId, topicId);
        list.innerHTML = "";

        if (!materials.length) {
            list.innerHTML = '<span class="topic-material-empty">No PDFs added yet.</span>';
            return;
        }

        materials.forEach(material => {
            const row = document.createElement("div");
            row.className = "topic-material-item";
            const info = document.createElement("span");
            info.className = "topic-material-name";
            info.textContent = `📄 ${material.name}`;
            const actions = document.createElement("span");
            actions.className = "topic-material-actions";

            const open = document.createElement("button");
            open.type = "button";
            open.className = "topic-material-open";
            open.textContent = "Open";
            open.addEventListener("click", () => {
                if (material.source === "web" && material.url) {
                    window.open(material.url, "_blank", "noopener,noreferrer");
                } else if (material.blob) {
                    const url = URL.createObjectURL(material.blob);
                    window.open(url, "_blank", "noopener,noreferrer");
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                }
            });

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "topic-material-remove";
            remove.textContent = "Remove";
            remove.addEventListener("click", async () => {
                if (!confirm(`Remove "${material.name}" from this topic?`)) return;
                await window.studyOSStorage.deleteMaterial(material.id);
                renderTopicMaterials(controls, subjectId, topicId);
            });

            actions.append(open, remove);
            row.append(info, actions);
            list.appendChild(row);
        });
    }

    function enhanceTopics() {
        const list = document.getElementById("subjectTopicsList");
        const context = getContext();
        if (!list || !context.subject) return;

        const rows = Array.from(list.querySelectorAll(".subject-topic-row"));
        rows.forEach((row, index) => {
            if (row.querySelector(".topic-material-controls")) return;
            const topic = context.subject.topics[index];
            if (!topic) return;

            if (!topic.id) {
                topic.id = `${context.subjectId}-topic-${index}-${Math.random().toString(36).slice(2, 8)}`;
                const subjects = window.studyOSStorage.getSubjects();
                subjects[context.subjectId].topics[index].id = topic.id;
                window.studyOSStorage.saveSubjects(subjects);
            }

            const controls = document.createElement("div");
            controls.className = "topic-material-controls";
            controls.innerHTML = '<div class="topic-material-buttons"><button type="button" class="topic-add-pdf">+ Add PDF</button><button type="button" class="topic-fetch-pdf">Find PDF material</button></div><div class="topic-material-list"></div>';
            row.appendChild(controls);

            const input = makeFileInput(context.subjectId, topic.id, topic.name, controls);
            controls.querySelector(".topic-add-pdf").addEventListener("click", () => input.click());
            controls.querySelector(".topic-fetch-pdf").addEventListener("click", () => openPdfSearch(context.subject.name, topic.name));
            renderTopicMaterials(controls, context.subjectId, topic.id);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        enhanceTopics();
        const list = document.getElementById("subjectTopicsList");
        if (list) new MutationObserver(() => enhanceTopics()).observe(list, { childList: true });
    });
})();
