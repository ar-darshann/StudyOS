// =========================
// STUDYOS THEME SYSTEM
// =========================

const themeToggle = document.getElementById("themeToggle");

const themeIcon = document.getElementById("themeIcon");


// Check for a previously saved theme

const savedTheme = localStorage.getItem("studyOS-theme");


if (savedTheme === "light") {

    document.body.classList.add("light");

    themeIcon.textContent = "🌙";

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

});


// =========================
// STUDYOS LOADED
// =========================

console.log("StudyOS loaded successfully!");
