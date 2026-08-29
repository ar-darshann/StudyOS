// =========================
// STUDYOS THEME SYSTEM
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    // Safety check
    if (!themeToggle || !themeIcon) {
        console.error("Theme toggle elements were not found.");
        return;
    }


    // =========================
    // LOAD SAVED THEME
    // =========================

    const savedTheme = localStorage.getItem("studyOS-theme");

    if (savedTheme === "light") {

        document.body.classList.add("light");

        themeIcon.textContent = "🌙";

    } else {

        document.body.classList.remove("light");

        themeIcon.textContent = "☀️";

    }


    // =========================
    // THEME TOGGLE
    // =========================

    themeToggle.addEventListener("click", function () {

        document.body.classList.toggle("light");


        const isLightMode =
            document.body.classList.contains("light");


        if (isLightMode) {

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

        console.log(
            "Theme changed to:",
            isLightMode ? "light" : "dark"
        );

    });

});
