document.addEventListener("DOMContentLoaded", function () {

    setupTheme();

    if (document.getElementById("dashboardAverage")) {
        loadDashboard();
    }

    if (document.getElementById("subjectsGrid")) {
        loadSubjectsPage();
        setupSubjectModal();
    }

    if (document.getElementById("subjectName")) {
        loadSubjectPage();
    }

});


/* =========================================
   THEME
========================================= */

function setupTheme() {
    const toggle = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");

    if (!toggle || !icon) return;

    const savedTheme = localStorage.getItem("studyOS-theme");

    if (savedTheme === "light") {
        document.body.classList.add("light");
        icon.textContent = "☾";
    } else {
        document.body.classList.remove("light");
        icon.textContent = "☀";
    }

    toggle.addEventListener("click", function () {
        const isLight = document.body.classList.toggle("light");
        localStorage.setItem("studyOS-theme", isLight ? "light" : "dark");
        icon.textContent = isLight ? "☾" : "☀";
    });
}


/* =========================================
   DATA HELPERS
========================================= */

function getSubjects() {
    if (typeof studyOSData === "undefined") {
        console.error("StudyOS data could not be loaded.");
        return {};
    }
    return studyOSData.subjects || {};
}

function saveSubjects(subjects) {
    studyOSData.subjects = subjects;
    if (window.studyOSStorage) {
        window.studyOSStorage.saveSubjects(subjects);
    }
}

function calculateSubjectAverage(subject) {
    if (!subject.topics || subject.topics.length === 0) {
        return Number(subject.averageScore) || 0;
    }

    const total = subject.topics.reduce(function (sum, topic) {
        return sum + Number(topic.score || 0);
    }, 0);

    return total / subject.topics.length;
}

function formatScore(score) {
    const rounded = Math.round(score * 100) / 100;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}%`;
}


/* =========================================
   DASHBOARD
========================================= */

function loadDashboard() {
    const subjects = getSubjects();
    const entries = Object.entries(subjects);
    const allTopics = [];
    let totalStudyTime = 0;
    let totalSubjectScore = 0;

    entries.forEach(function ([id, subject]) {
        totalStudyTime += Number(subject.studyTime || 0);
        totalSubjectScore += calculateSubjectAverage(subject);

        (subject.topics || []).forEach(function (topic) {
            allTopics.push({
                subjectId: id,
                subjectName: subject.name,
                name: topic.name,
                score: Number(topic.score || 0)
            });
        });
    });

    const averageScore = entries.length
        ? totalSubjectScore / entries.length
        : 0;

    const weakTopics = allTopics.filter(function (topic) {
        return topic.score < 60;
    });

    setText("dashboardAverage", entries.length ? formatScore(averageScore) : "—");
    setText("dashboardStudyTime", entries.length ? `${round(totalStudyTime, 2)}h` : "—");
    setText("dashboardWeakTopics", entries.length ? weakTopics.length : "—");

    setTodayDate();
    loadDashboardFocus(entries, allTopics);
    loadDashboardSubjects(entries);
    loadDashboardTopics(allTopics);
}

function loadDashboardFocus(entries, allTopics) {
    const focusSubject = document.getElementById("focusSubject");
    const focusTopic = document.getElementById("focusTopic");
    const focusScore = document.getElementById("focusScore");
    const focusProgress = document.getElementById("focusProgress");
    const focusLink = document.getElementById("focusLink");

    if (!focusSubject) return;

    if (allTopics.length === 0) {
        if (entries.length === 0) {
            focusSubject.textContent = "Add your first subject";
            focusTopic.textContent = "Your study space is ready for you.";
            focusScore.textContent = "";
            focusProgress.style.width = "0%";
            focusLink.href = "subjectui.html";
            focusLink.innerHTML = "Add a subject <span>→</span>";
            return;
        }

        const weakest = entries.slice().sort(function (a, b) {
            return calculateSubjectAverage(a[1]) - calculateSubjectAverage(b[1]);
        })[0];

        focusSubject.textContent = weakest[1].name;
        focusTopic.textContent = "Add topics to start tracking this subject.";
        focusScore.textContent = formatScore(calculateSubjectAverage(weakest[1]));
        focusProgress.style.width = `${Math.max(0, Math.min(100, calculateSubjectAverage(weakest[1])))}%`;
        focusLink.href = `subjects.html?subject=${encodeURIComponent(weakest[0])}`;
        focusLink.innerHTML = "Open subject <span>→</span>";
        return;
    }

    const weakestTopic = allTopics.slice().sort(function (a, b) {
        return a.score - b.score;
    })[0];

    focusSubject.textContent = weakestTopic.subjectName;
    focusTopic.textContent = weakestTopic.name;
    focusScore.textContent = formatScore(weakestTopic.score);
    focusProgress.style.width = `${Math.max(0, Math.min(100, weakestTopic.score))}%`;
    focusLink.href = `subjects.html?subject=${encodeURIComponent(weakestTopic.subjectId)}`;
    focusLink.innerHTML = "Continue studying <span>→</span>";
}

function loadDashboardSubjects(entries) {
    const container = document.getElementById("dashboardSubjects");
    if (!container) return;

    container.innerHTML = "";

    if (entries.length === 0) {
        container.innerHTML = '<p class="muted-message">No subjects yet. Add one from the Subjects page.</p>';
        return;
    }

    entries.slice(0, 4).forEach(function ([id, subject]) {
        const average = calculateSubjectAverage(subject);
        const row = document.createElement("a");

        row.href = `subjects.html?subject=${encodeURIComponent(id)}`;
        row.className = "dashboard-subject-row";
        row.innerHTML = `
            <span class="subject-name">${escapeHTML(subject.name)}</span>
            <span class="subject-row-score">${formatScore(average)} <span>→</span></span>
        `;

        container.appendChild(row);
    });
}

function loadDashboardTopics(allTopics) {
    const container = document.getElementById("dashboardTopics");
    if (!container) return;

    container.innerHTML = "";

    const weakest = allTopics.slice().sort(function (a, b) {
        return a.score - b.score;
    }).slice(0, 5);

    if (weakest.length === 0) {
        container.innerHTML = '<p class="muted-message">No topic data yet. Add topics inside a subject to see focus areas here.</p>';
        return;
    }

    weakest.forEach(function (topic) {
        const row = document.createElement("a");
        row.className = "attention-row";
        row.href = `subjects.html?subject=${encodeURIComponent(topic.subjectId)}`;
        row.innerHTML = `
            <div>
                <strong>${escapeHTML(topic.name)}</strong>
                <span>${escapeHTML(topic.subjectName)}</span>
            </div>
            <strong class="attention-score">${formatScore(topic.score)}</strong>
        `;
        container.appendChild(row);
    });
}

function setTodayDate() {
    const element = document.getElementById("todayDate");
    if (!element) return;

    element.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


/* =========================================
   SUBJECT LIST
========================================= */

function loadSubjectsPage() {
    const grid = document.getElementById("subjectsGrid");
    const emptyState = document.getElementById("emptySubjects");

    if (!grid) return;

    const entries = Object.entries(getSubjects());
    grid.innerHTML = "";

    if (entries.length === 0) {
        grid.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    grid.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    entries.forEach(function ([id, subject]) {
        const average = calculateSubjectAverage(subject);
        const card = document.createElement("article");
        card.className = "subject-card";

        card.innerHTML = `
            <div class="subject-card-header">
                <div class="subject-icon">${escapeHTML(subject.icon || "•")}</div>
                <span>${subject.topics ? subject.topics.length : 0} topics</span>
            </div>
            <h2>${escapeHTML(subject.name)}</h2>
            <p>${escapeHTML(subject.description || "No description yet.")}</p>
            <div class="subject-score-line">
                <span>Average score</span>
                <strong>${formatScore(average)}</strong>
            </div>
            <div class="progress-track">
                <div class="progress-value" style="width:${Math.max(0, Math.min(100, average))}%"></div>
            </div>
            <a class="card-link" href="subjects.html?subject=${encodeURIComponent(id)}">Open subject <span>→</span></a>
        `;

        grid.appendChild(card);
    });
}


/* =========================================
   ADD SUBJECT
========================================= */

function setupSubjectModal() {
    const modal = document.getElementById("subjectModal");
    const openButton = document.getElementById("addSubjectButton");
    const emptyOpenButton = document.getElementById("emptyAddSubjectButton");
    const closeButton = document.getElementById("closeSubjectModal");
    const cancelButton = document.getElementById("cancelSubjectButton");
    const form = document.getElementById("subjectForm");

    if (!modal || !form) return;

    function openModal() {
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        document.getElementById("subjectNameInput").focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        form.reset();
    }

    if (openButton) openButton.addEventListener("click", openModal);
    if (emptyOpenButton) emptyOpenButton.addEventListener("click", openModal);
    if (closeButton) closeButton.addEventListener("click", closeModal);
    if (cancelButton) cancelButton.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
        if (event.target.hasAttribute("data-close-modal")) closeModal();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("subjectNameInput").value.trim();
        const description = document.getElementById("subjectDescriptionInput").value.trim();
        if (!name) return;

        const subjects = getSubjects();
        const id = createUniqueSubjectId(name, subjects);

        subjects[id] = {
            name: name,
            icon: "•",
            description: description || "A new StudyOS subject.",
            averageScore: 0,
            studyTime: 0,
            topics: []
        };

        saveSubjects(subjects);
        closeModal();
        loadSubjectsPage();
    });
}

function createUniqueSubjectId(name, subjects) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "subject";
    let id = base;
    let number = 2;

    while (subjects[id]) {
        id = `${base}-${number}`;
        number += 1;
    }

    return id;
}


/* =========================================
   INDIVIDUAL SUBJECT PAGE
========================================= */

function loadSubjectPage() {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subject");
    const subject = getSubjects()[subjectId];

    if (!subject) {
        setText("subjectName", "Subject not found");
        setText("subjectDescription", "This subject does not exist in your StudyOS data.");
        setText("subjectAverage", "—");
        setText("subjectTopics", "—");
        setText("subjectStudyTime", "—");
        return;
    }

    document.title = `${subject.name} | StudyOS`;
    setText("subjectName", subject.name);
    setText("subjectDescription", subject.description || "");
    setText("subjectIcon", subject.icon || "•");
    setText("subjectAverage", formatScore(calculateSubjectAverage(subject)));
    setText("subjectTopics", subject.topics ? subject.topics.length : 0);
    setText("subjectStudyTime", `${round(Number(subject.studyTime || 0), 2)}h`);

    const list = document.getElementById("subjectTopicsList");
    if (!list) return;

    list.innerHTML = "";

    if (!subject.topics || subject.topics.length === 0) {
        list.innerHTML = `
            <div class="empty-topic-state">
                <h3>No topics yet.</h3>
                <p>This subject is ready. Topic management is our next step.</p>
            </div>
        `;
        return;
    }

    subject.topics.forEach(function (topic) {
        const row = document.createElement("div");
        row.className = "subject-topic-row";
        row.innerHTML = `
            <div>
                <strong>${escapeHTML(topic.name)}</strong>
                <div class="progress-track topic-progress">
                    <div class="progress-value" style="width:${Math.max(0, Math.min(100, Number(topic.score || 0)))}%"></div>
                </div>
            </div>
            <strong>${formatScore(Number(topic.score || 0))}</strong>
        `;
        list.appendChild(row);
    });
}


/* =========================================
   UTILITIES
========================================= */

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
