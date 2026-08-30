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
        ).textContent = "Subject Not Found";


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
