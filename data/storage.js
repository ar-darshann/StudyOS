/* =========================================
   STUDYOS LOCAL DATA LAYER

   The sample-data.js file gives us the original
   prototype structure, but a new StudyOS user
   starts with no subjects.

   Later this layer can be replaced by a real
   database without changing the UI architecture.
========================================= */

(function () {

    const STORAGE_KEY = "studyOS-subjects";

    try {

        const savedSubjects = localStorage.getItem(STORAGE_KEY);

        if (savedSubjects !== null) {

            const parsedSubjects = JSON.parse(savedSubjects);

            if (parsedSubjects && typeof parsedSubjects === "object") {
                studyOSData.subjects = parsedSubjects;
            }

        } else {

            studyOSData.subjects = {};

        }

    } catch (error) {

        console.error("StudyOS could not load saved subjects.", error);
        studyOSData.subjects = {};

    }

    window.studyOSStorage = {

        saveSubjects: function (subjects) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
        },

        getSubjects: function () {
            return studyOSData.subjects;
        },

        clearSubjects: function () {
            localStorage.removeItem(STORAGE_KEY);
            studyOSData.subjects = {};
        }

    };

})();
