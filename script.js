document.addEventListener("DOMContentLoaded", function () {


    /* =========================
       THEME SYSTEM
    ========================== */

    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");


    if (themeToggle && themeIcon) {

        const savedTheme =
            localStorage.getItem("studyOS-theme");


        if (savedTheme === "light") {

            document.body.classList.add("light");

            themeIcon.textContent = "🌙";

        } else {

            document.body.classList.remove("light");

            themeIcon.textContent = "☀️";

        }


        themeToggle.addEventListener(
            "click",
            function () {

                document.body.classList.toggle("light");


                const isLight =
                    document.body.classList.contains("light");


                if (isLight) {

                    themeIcon.textContent = "🌙";

                    localStorage.setItem(
                        "studyOS-theme",
                        "light"
                    );

                } else {

                    themeIcon.textContent = "☀️";

                    localStorage.setItem(
                        "studyOS-theme",
                        "dark"
                    );

                }

            }
        );

    }


    /* =========================
       DASHBOARD
    ========================== */

    const dashboardFocus =
        document.getElementById("dashboardFocus");


    if (dashboardFocus) {

        loadDashboard();

    }


    /* =========================
       SUBJECT PAGE
    ========================== */

    const subjectName =
        document.getElementById("subjectName");


    if (subjectName) {

        loadSubjectPage();

    }


    /* =========================
       SUBJECTS PAGE
    ========================== */

    const subjectsGrid =
        document.getElementById("subjectsGrid");


    if (subjectsGrid) {

        loadSubjectsPage();

    }

});



/* =========================================
   LOAD DASHBOARD
========================================= */

function loadDashboard() {

    if (
        typeof studyOSData === "undefined"
    ) {

        console.error(
            "StudyOS data could not be loaded."
        );

        return;

    }


    const subjects =
        studyOSData.subjects;


    const subjectEntries =
        Object.entries(subjects);


    if (subjectEntries.length === 0) {

        return;

    }


    /* =========================
       FIND WEAKEST SUBJECT
    ========================== */

    const weakestSubject =
        subjectEntries.reduce(
            function (weakest, current) {

                if (
                    current[1].averageScore <
                    weakest[1].averageScore
                ) {

                    return current;

                }

                return weakest;

            }
        );


    const focusId =
        weakestSubject[0];

    const focusSubject =
        weakestSubject[1];


    /* =========================
       FIND WEAKEST TOPIC
    ========================== */

    let weakestTopic = null;


    subjectEntries.forEach(
        function ([id, subject]) {

            subject.topics.forEach(
                function (topic) {

                    if (
                        !weakestTopic ||
                        topic.score <
                        weakestTopic.score
                    ) {

                        weakestTopic = {

                            subjectId: id,

                            subjectName:
                                subject.name,

                            topicName:
                                topic.name,

                            score:
                                topic.score

                        };

                    }

                }
            );

        }
    );


    /* =========================
       TODAY'S FOCUS
    ========================== */

    const focusSubjectElement =
        document.getElementById(
            "focusSubject"
        );


    const focusTopicElement =
        document.getElementById(
            "focusTopic"
        );


    const focusScoreElement =
        document.getElementById(
            "focusScore"
        );


    const focusProgressElement =
        document.getElementById(
            "focusProgress"
        );


    const focusLinkElement =
        document.getElementById(
            "focusLink"
        );


    if (focusSubjectElement) {

        focusSubjectElement.textContent =
            focusSubject.name;

    }


    if (
        focusTopicElement &&
        weakestTopic
    ) {

        focusTopicElement.textContent =
            weakestTopic.topicName;

    }


    if (
        focusScoreElement &&
        weakestTopic
    ) {

        focusScoreElement.textContent =
            `${weakestTopic.score}%`;

    }


    if (
        focusProgressElement &&
        weakestTopic
    ) {

        focusProgressElement.style.width =
            `${weakestTopic.score}%`;

    }


    if (focusLinkElement) {

        focusLinkElement.href =
            `subject.html?subject=${focusId}`;

    }


    /* =========================
       DASHBOARD EXAMS
    ========================== */

    loadDashboardExams(
        subjectEntries
    );


    /* =========================
       NEEDS ATTENTION
    ========================== */

    loadDashboardTopics(
        subjectEntries
    );

}



/* =========================================
   DASHBOARD EXAMS
========================================= */

function loadDashboardExams(
    subjectEntries
) {

    const examsContainer =
        document.getElementById(
            "dashboardExams"
        );


    if (!examsContainer) {

        return;

    }


    examsContainer.innerHTML = "";


    subjectEntries.forEach(
        function ([id, subject], index) {

            if (index >= 3) {

                return;

            }


            const exam =
                document.createElement("div");


            exam.className =
                "exam";


            const examDate =
                12 + (index * 3);


            const daysLeft =
                14 + (index * 3);


            exam.innerHTML = `

                <div class="exam-info">

                    <span class="exam-dot"></span>

                    <div>

                        <strong>
                            ${subject.name}
                        </strong>

                        <small>
                            ${daysLeft} days left
                        </small>

                    </div>

                </div>

                <strong>
                    ${examDate} Sep
                </strong>

            `;


            examsContainer.appendChild(exam);

        }
    );

}



/* =========================================
   DASHBOARD TOPICS
========================================= */

function loadDashboardTopics(
    subjectEntries
) {

    const topicsContainer =
        document.getElementById(
            "dashboardTopics"
        );


    if (!topicsContainer) {

        return;

    }


    const allTopics = [];


    subjectEntries.forEach(
        function ([id, subject]) {

            subject.topics.forEach(
                function (topic) {

                    allTopics.push({

                        subjectId: id,

                        subjectName:
                            subject.name,

                        name:
                            topic.name,

                        score:
                            topic.score

                    });

                }
            );

        }
    );


    /* =========================
       SORT LOWEST FIRST
    ========================== */

    allTopics.sort(
        function (a, b) {

            return a.score - b.score;

        }
    );


    /* SHOW FOUR WEAKEST */

    const weakestTopics =
        allTopics.slice(0, 4);


    topicsContainer.innerHTML = "";


    weakestTopics.forEach(
        function (topic) {

            const row =
                document.createElement("div");


            row.className =
                "topic";


            const status =
                getTopicStatus(
                    topic.score
                );


            row.innerHTML = `

                <div class="topic-info">

                    <div class="topic-title">

                        <strong>
                            ${topic.name}
                        </strong>

                        <span class="subject-tag">
                            ${topic.subjectName}
                        </span>

                    </div>

                    <div class="mini-progress">

                        <div
                            class="mini-progress-fill ${status.fillClass}"
                            style="width: ${topic.score}%"
                        ></div>

                    </div>

                </div>


                <strong class="score ${status.textClass}">
                    ${topic.score}%
                </strong>


                <a
                    href="subject.html?subject=${topic.subjectId}"
                    class="practice-button"
                >
                    Practice
                </a>

            `;


            topicsContainer.appendChild(row);

        }
    );

}



/* =========================================
   LOAD SUBJECTS PAGE
========================================= */

function loadSubjectsPage() {

    if (
        typeof studyOSData === "undefined"
    ) {

        console.error(
            "StudyOS data could not be loaded."
        );

        return;

    }


    const subjectsGrid =
        document.getElementById("subjectsGrid");


    const subjects =
        studyOSData.subjects;


    subjectsGrid.innerHTML = "";


    Object.entries(subjects).forEach(
        function ([id, subject]) {


            const card =
                document.createElement("div");


            card.className =
                "subject-card";


            const status =
                getSubjectStatus(
                    subject.averageScore
                );


            card.innerHTML = `

                <div class="subject-card-top">

                    <div class="subject-icon">
                        ${subject.icon}
                    </div>

                    <span class="subject-status ${status.className}">
                        ${status.text}
                    </span>

                </div>


                <h2>
                    ${subject.name}
                </h2>


                <p class="subject-description">
                    ${subject.description}
                </p>


                <div class="subject-performance">

                    <div class="performance-header">

                        <span>
                            Average Score
                        </span>

                        <strong>
                            ${subject.averageScore}%
                        </strong>

                    </div>


                    <div class="subject-progress">

                        <div
                            class="subject-progress-fill"
                            style="width: ${subject.averageScore}%"
                        ></div>

                    </div>

                </div>


                <div class="subject-footer">

                    <span>
                        ${subject.topics.length} Topics
                    </span>


                    <a
                        href="subject.html?subject=${id}"
                        class="open-subject"
                    >
                        Open Subject →
                    </a>

                </div>

            `;


            subjectsGrid.appendChild(card);

        }
    );

}



/* =========================================
   LOAD INDIVIDUAL SUBJECT
========================================= */

function loadSubjectPage() {

    if (
        typeof studyOSData === "undefined"
    ) {

        console.error(
            "StudyOS data could not be loaded."
        );

        return;

    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const subjectId =
        params.get("subject");


    const subject =
        studyOSData.subjects[subjectId];


    /* =========================
       INVALID SUBJECT
    ========================== */

    if (!subject) {

        document.getElementById(
            "subjectName"
        ).textContent =
            "Subject Not Found";


        document.getElementById(
            "subjectDescription"
        ).textContent =
            "We couldn't find the subject you're looking for.";


        return;

    }


    /* =========================
       BASIC INFORMATION
    ========================== */

    document.title =
        `${subject.name} | StudyOS`;


    document.getElementById(
        "subjectName"
    ).textContent =
        subject.name;


    document.getElementById(
        "subjectDescription"
    ).textContent =
        subject.description;


    document.getElementById(
        "subjectIcon"
    ).textContent =
        subject.icon;


    /* =========================
       STATS
    ========================== */

    document.getElementById(
        "subjectAverage"
    ).textContent =
        `${subject.averageScore}%`;


    document.getElementById(
        "subjectTopics"
    ).textContent =
        subject.topics.length;


    document.getElementById(
        "subjectStudyTime"
    ).textContent =
        `${subject.studyTime}h`;


    /* =========================
       TOPICS
    ========================== */

    const topicsList =
        document.getElementById(
            "subjectTopicsList"
        );


    topicsList.innerHTML = "";


    subject.topics.forEach(
        function (topic) {

            const row =
                document.createElement("div");


            row.className =
                "subject-topic-row";


            const status =
                getTopicStatus(
                    topic.score
                );


            row.innerHTML = `

                <div class="subject-topic-main">

                    <div class="subject-topic-title">

                        <strong>
                            ${topic.name}
                        </strong>

                        <span class="topic-status ${status.className}">
                            ${status.text}
                        </span>

                    </div>


                    <div class="subject-topic-progress">

                        <div
                            class="subject-topic-fill ${status.fillClass}"
                            style="width: ${topic.score}%"
                        ></div>

                    </div>

                </div>


                <strong class="topic-score ${status.textClass}">
                    ${topic.score}%
                </strong>


                <a
                    href="#"
                    class="topic-open"
                    data-topic="${topic.name}"
                >
                    Practice →
                </a>

            `;


            topicsList.appendChild(row);

        }
    );

}



/* =========================================
   SUBJECT STATUS
========================================= */

function getSubjectStatus(score) {

    if (score >= 80) {

        return {

            text: "Strong",

            className: "excellent"

        };

    }


    if (score >= 65) {

        return {

            text: "On Track",

            className: "good"

        };

    }


    return {

        text: "Needs Work",

        className: "needs-work"

    };

}



/* =========================================
   TOPIC STATUS
========================================= */

function getTopicStatus(score) {

    if (score >= 80) {

        return {

            text: "Strong",

            className: "excellent-topic",

            fillClass: "excellent-fill",

            textClass: "excellent-text"

        };

    }


    if (score >= 70) {

        return {

            text: "Good",

            className: "strong",

            fillClass: "strong-fill",

            textClass: "strong-text"

        };

    }


    if (score >= 60) {

        return {

            text: "Needs Practice",

            className: "weak",

            fillClass: "weak-fill",

            textClass: "weak-text"

        };

    }


    return {

        text: "Needs Attention",

        className: "danger-topic",

        fillClass: "danger-fill",

        textClass: "danger-text"

    };

}
