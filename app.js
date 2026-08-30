document.addEventListener("DOMContentLoaded", function () {
    setupTheme();
    updateProfileButton();
    setupProfileMenu();

    const dashboard = document.getElementById("dashboardAverage");
    const subjectsGrid = document.getElementById("subjectsGrid");
    const subjectName = document.getElementById("subjectName");

    if (dashboard) loadDashboard();
    if (subjectsGrid) { requireAccount(); loadSubjectsPage(); setupSubjectModal(); }
    if (subjectName) { requireAccount(); loadSubjectPage(); setupTopicModal(); setupMaterialUpload(); }

    setupPageTransitions();
});

function getAccount() {
    try { return JSON.parse(localStorage.getItem("studyOS-account")); } catch { return null; }
}

function requireAccount() {
    if (!getAccount()) window.location.replace("index.html");
}

function setupTheme() {
    const toggle = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");
    if (!toggle || !icon) return;
    const light = localStorage.getItem("studyOS-theme") === "light";
    document.body.classList.toggle("light", light);
    icon.textContent = light ? "☾" : "☀";
    toggle.onclick = function () {
        const isLight = document.body.classList.toggle("light");
        localStorage.setItem("studyOS-theme", isLight ? "light" : "dark");
        icon.textContent = isLight ? "☾" : "☀";
    };
}

function updateProfileButton() {
    const button = document.getElementById("profileButton");
    const account = getAccount();
    if (!button || !account) return;
    button.textContent = (account.name || "?").trim().charAt(0).toUpperCase() || "?";
    button.title = account.name || "Profile";
    const name = document.getElementById("profileMenuName");
    if (name) name.textContent = account.name || "Profile";
}

function setupProfileMenu() {
    const button = document.getElementById("profileButton");
    const menu = document.getElementById("profileMenu");
    const logout = document.getElementById("logoutButton");
    const setup = document.getElementById("setupAgainButton");
    if (!button) return;

    if (!menu) {
        button.onclick = function () {
            if (confirm("Log out of Nivora?")) logoutAndClearSession();
        };
        return;
    }

    button.addEventListener("click", function (event) {
        event.stopPropagation();
        menu.classList.toggle("hidden");
    });
    menu.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("click", () => menu.classList.add("hidden"));
    if (setup) setup.addEventListener("click", () => location.href = "setup.html");
    if (logout) logout.addEventListener("click", logoutAndClearSession);
}

function logoutAndClearSession() {
    localStorage.removeItem("studyOS-account");
    window.location.replace("index.html");
}

function getSubjects() {
    return window.studyOSStorage ? window.studyOSStorage.getSubjects() : {};
}

function saveSubjects(subjects) {
    if (window.studyOSStorage) window.studyOSStorage.saveSubjects(subjects);
}

function isTopicStarted(topic) {
    return !!(topic && (topic.started === true || Number(topic.attempts || 0) > 0 || Number(topic.practiceCount || 0) > 0 || Number(topic.score || 0) > 0));
}

function getStartedTopics(subject) {
    return (subject.topics || []).filter(isTopicStarted);
}

function calculateSubjectAverage(subject) {
    const topics = getStartedTopics(subject);
    if (!topics.length) return null;
    return topics.reduce((sum, topic) => sum + Number(topic.score || 0), 0) / topics.length;
}

function formatScore(score) {
    if (score === null || score === undefined || Number.isNaN(Number(score))) return "—";
    const value = Math.round(Number(score) * 100) / 100;
    return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHTML(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function loadDashboard() {
    requireAccount();
    const account = getAccount();
    const entries = Object.entries(getSubjects());
    const topics = [];
    let studyTime = 0;
    let scoreTotal = 0;
    let scoredSubjects = 0;

    setText("dashboardGreeting", account ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${account.name.split(" ")[0]}.` : "Welcome.");

    entries.forEach(([id, subject]) => {
        const average = calculateSubjectAverage(subject);
        if (average !== null) { scoreTotal += average; scoredSubjects++; }
        studyTime += Number(subject.studyTime || 0);
        getStartedTopics(subject).forEach(topic => topics.push({ subjectId: id, subjectName: subject.name, name: topic.name, score: Number(topic.score || 0) }));
    });

    const weakTopics = topics.filter(topic => topic.score < 60);
    setText("dashboardAverage", scoredSubjects ? formatScore(scoreTotal / scoredSubjects) : "—");
    setText("dashboardStudyTime", studyTime > 0 ? `${Math.round(studyTime * 100) / 100}h` : "—");
    setText("dashboardWeakTopics", String(weakTopics.length));

    const sorted = topics.slice().sort((a, b) => a.score - b.score);
    const focus = sorted[0];
    if (focus) {
        setText("focusSubject", focus.subjectName);
        setText("focusTopic", focus.name);
        setText("focusScore", formatScore(focus.score));
        const progress = document.getElementById("focusProgress");
        if (progress) progress.style.width = `${Math.max(0, Math.min(100, focus.score))}%`;
        const link = document.getElementById("focusLink");
        if (link) { link.href = `subjects.html?subject=${encodeURIComponent(focus.subjectId)}`; link.innerHTML = "Continue studying <span>→</span>"; }
    } else {
        setText("focusSubject", entries.length ? entries[0][1].name : "Start your learning");
        setText("focusTopic", entries.length ? "Choose a topic and start studying to build your progress." : "Your study space is ready for you.");
        setText("focusScore", "");
        const progress = document.getElementById("focusProgress");
        if (progress) progress.style.width = "0%";
        const link = document.getElementById("focusLink");
        if (link) { link.href = "subjectui.html"; link.innerHTML = entries.length ? "Choose a topic <span>→</span>" : "Add a subject <span>→</span>"; }
    }

    loadDashboardSubjects(entries);
    loadDashboardTopics(sorted);
    const date = document.getElementById("todayDate");
    if (date) date.textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function loadDashboardSubjects(entries) {
    const container = document.getElementById("dashboardSubjects");
    if (!container) return;
    container.innerHTML = entries.length ? "" : '<p class="muted-message">No subjects yet. Add your first one.</p>';
    entries.slice(0, 5).forEach(([id, subject]) => {
        const a = document.createElement("a");
        a.className = "dashboard-subject-row";
        a.href = `subjects.html?subject=${encodeURIComponent(id)}`;
        a.innerHTML = `<span class="subject-name">${escapeHTML(subject.name)}</span><span class="subject-row-score">${formatScore(calculateSubjectAverage(subject))} <span>→</span></span>`;
        container.appendChild(a);
    });
}

function loadDashboardTopics() {
    const container = document.getElementById("dashboardTopics");
    if (!container) return;
    const topics = [];
    Object.entries(getSubjects()).forEach(([id, subject]) => getStartedTopics(subject).forEach(topic => topics.push({ subjectId: id, subjectName: subject.name, name: topic.name, score: Number(topic.score || 0) })));
    const weakest = topics.filter(topic => topic.score < 60).sort((a, b) => a.score - b.score).slice(0, 5);
    container.innerHTML = weakest.length ? "" : '<p class="muted-message">No focus areas yet. Start studying and your weaker topics will appear here.</p>';
    weakest.forEach(topic => {
        const a = document.createElement("a");
        a.className = "attention-row";
        a.href = `subjects.html?subject=${encodeURIComponent(topic.subjectId)}`;
        a.innerHTML = `<div><strong>${escapeHTML(topic.name)}</strong><span>${escapeHTML(topic.subjectName)}</span></div><strong class="attention-score">${formatScore(topic.score)}</strong>`;
        container.appendChild(a);
    });
}

function loadSubjectsPage() {
    const grid = document.getElementById("subjectsGrid");
    const empty = document.getElementById("emptySubjects");
    if (!grid) return;
    const entries = Object.entries(getSubjects());
    grid.innerHTML = "";
    grid.classList.toggle("hidden", !entries.length);
    if (empty) empty.classList.toggle("hidden", !!entries.length);

    entries.forEach(([id, subject]) => {
        const card = document.createElement("article");
        const average = calculateSubjectAverage(subject);
        card.className = "subject-card";
        card.innerHTML = `<div class="subject-card-header"><div class="subject-icon">${escapeHTML(subject.icon || "•")}</div><span>${(subject.topics || []).length} topics</span></div><h2>${escapeHTML(subject.name)}</h2><p>${escapeHTML(subject.description || "")}</p><div class="subject-score-line"><span>Average score</span><strong>${formatScore(average)}</strong></div><div class="progress-track"><div class="progress-value" style="width:${average === null ? 0 : Math.max(0, Math.min(100, average))}%"></div></div><div class="subject-card-actions"><a class="card-link" href="subjects.html?subject=${encodeURIComponent(id)}">Open subject <span>→</span></a><button type="button" class="subject-delete-button" data-delete-subject="${escapeHTML(id)}">Remove</button></div>`;
        grid.appendChild(card);
    });

    grid.querySelectorAll("[data-delete-subject]").forEach(button => button.addEventListener("click", async function () {
        const id = this.dataset.deleteSubject;
        const subject = getSubjects()[id];
        if (!subject) return;
        if (!confirm(`Remove "${subject.name}"?\n\nThis will remove the subject, its topics and any study material stored for it in this browser.`)) return;
        await window.studyOSStorage.deleteSubject(id);
        loadSubjectsPage();
    }));
}

function setupSubjectModal() {
    const modal = document.getElementById("subjectModal"), form = document.getElementById("subjectForm");
    if (!modal || !form) return;
    const open = () => { modal.classList.remove("hidden"); document.body.classList.add("modal-open"); setTimeout(() => document.getElementById("subjectNameInput")?.focus(), 100); };
    const close = () => { modal.classList.add("hidden"); document.body.classList.remove("modal-open"); form.reset(); };
    document.getElementById("addSubjectButton")?.addEventListener("click", open);
    document.getElementById("emptyAddSubjectButton")?.addEventListener("click", open);
    document.getElementById("closeSubjectModal")?.addEventListener("click", close);
    document.getElementById("cancelSubjectButton")?.addEventListener("click", close);
    modal.querySelector("[data-close-modal]")?.addEventListener("click", close);
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("subjectNameInput").value.trim();
        const description = document.getElementById("subjectDescriptionInput").value.trim();
        if (!name) return;
        const subjects = getSubjects();
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "subject";
        let id = base, n = 2;
        while (subjects[id]) id = `${base}-${n++}`;
        subjects[id] = { name, description, icon: "•", averageScore: 0, studyTime: 0, topics: [] };
        saveSubjects(subjects); close(); loadSubjectsPage();
    });
}

function loadSubjectPage() {
    const id = new URLSearchParams(location.search).get("subject"), subject = getSubjects()[id];
    if (!subject) { setText("subjectName", "Subject not found"); setText("subjectDescription", "This subject is no longer available."); return; }
    document.title = `${subject.name} | Nivora`;
    setText("subjectName", subject.name); setText("subjectDescription", subject.description || ""); setText("subjectIcon", subject.icon || "•"); setText("subjectAverage", formatScore(calculateSubjectAverage(subject))); setText("subjectTopics", (subject.topics || []).length); setText("subjectStudyTime", Number(subject.studyTime || 0) > 0 ? `${Number(subject.studyTime || 0)}h` : "—");
    renderTopics(subject); loadMaterials(id);
}

function renderTopics(subject) {
    const list = document.getElementById("subjectTopicsList");
    if (!list) return;
    list.innerHTML = "";
    if (!(subject.topics || []).length) { list.innerHTML = '<div class="empty-topic-state"><h3>No topics yet.</h3><p>Add the topics you want to study.</p></div>'; return; }
    subject.topics.forEach(topic => {
        const row = document.createElement("div"), started = isTopicStarted(topic), score = Number(topic.score || 0);
        row.className = "subject-topic-row";
        row.innerHTML = `<div><strong>${escapeHTML(topic.name)}</strong><div class="progress-track topic-progress"><div class="progress-value" style="width:${started ? Math.max(0, Math.min(100, score)) : 0}%"></div></div></div><strong>${started ? formatScore(score) : "Not started"}</strong>`;
        list.appendChild(row);
    });
}

function setupTopicModal() {
    const modal = document.getElementById("topicModal"), form = document.getElementById("topicForm");
    if (!modal || !form) return;
    const close = () => { modal.classList.add("hidden"); document.body.classList.remove("modal-open"); form.reset(); };
    document.getElementById("addTopicButton")?.addEventListener("click", () => { modal.classList.remove("hidden"); document.body.classList.add("modal-open"); setTimeout(() => document.getElementById("topicNameInput")?.focus(), 100); });
    document.getElementById("closeTopicModal")?.addEventListener("click", close); document.getElementById("cancelTopicButton")?.addEventListener("click", close); modal.querySelector("[data-close-topic]")?.addEventListener("click", close);
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const id = new URLSearchParams(location.search).get("subject"), subjects = getSubjects();
        if (!subjects[id]) return;
        const name = document.getElementById("topicNameInput").value.trim();
        if (!name) return;
        subjects[id].topics.push({ name, score: 0, started: false, attempts: 0 });
        saveSubjects(subjects); close(); loadSubjectPage();
    });
}

function setupMaterialUpload() {
    const input = document.getElementById("materialInput");
    if (!input) return;
    input.addEventListener("change", async function () {
        const id = new URLSearchParams(location.search).get("subject");
        for (const file of Array.from(input.files || [])) {
            try { await window.studyOSStorage.addMaterial({ id: crypto.randomUUID(), subjectId: id, name: file.name, type: file.type || "application/octet-stream", size: file.size, addedAt: new Date().toISOString(), blob: file }); }
            catch (error) { console.error(error); alert("This file could not be saved in this browser."); }
        }
        input.value = ""; loadMaterials(id);
    });
}

async function loadMaterials(subjectId) {
    const list = document.getElementById("materialList");
    if (!list || !window.studyOSStorage) return;
    const materials = await window.studyOSStorage.getMaterials(subjectId);
    list.innerHTML = "";
    if (!materials.length) { list.innerHTML = '<p class="muted-message">No material added yet.</p>'; return; }
    materials.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    materials.forEach(material => {
        const row = document.createElement("div"), size = material.size < 1048576 ? `${Math.max(1, Math.round(material.size / 1024))} KB` : `${(material.size / 1048576).toFixed(1)} MB`;
        row.className = "material-row";
        row.innerHTML = `<div class="material-info"><strong>${escapeHTML(material.name)}</strong><span>${escapeHTML(material.type || "File")} · ${size}</span></div><div class="material-actions"><button class="text-button material-open" data-id="${material.id}">Open</button><button class="material-delete" data-id="${material.id}">Delete</button></div>`;
        row.querySelector(".material-open").onclick = () => { const url = URL.createObjectURL(material.blob); window.open(url, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(url), 60000); };
        row.querySelector(".material-delete").onclick = async () => { await window.studyOSStorage.deleteMaterial(material.id); loadMaterials(subjectId); };
        list.appendChild(row);
    });
}

function setupPageTransitions() {
    document.body.classList.add("page-ready");
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("http") || link.target === "_blank") return;
        link.addEventListener("click", function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault(); document.body.classList.add("page-exit"); setTimeout(() => location.href = href, 150);
        });
    });
}
