/* =========================================
   STUDYOS LOCAL DATA LAYER

   Temporary storage for the prototype.
   Later this can be replaced by a real database
   without changing the UI architecture.
========================================= */

(function () {

    const STORAGE_KEY = "studyOS-subjects";

    try {

        const savedSubjects =
            localStorage.getItem(STORAGE_KEY);

        if (savedSubjects) {

            const parsedSubjects =
                JSON.parse(savedSubjects);

            if (
                parsedSubjects &&
                typeof parsedSubjects === "object"
            ) {

                studyOSData.subjects = parsedSubjects;

            }

        }

    } catch (error) {

        console.error(
            "StudyOS could not load saved subjects.",
            error
        );

    }


    window.studyOSStorage = {

        saveSubjects: function (subjects) {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(subjects)
            );

        },

        getSubjects: function () {

            return studyOSData.subjects;

        },

        clearSubjects: function () {

            localStorage.removeItem(STORAGE_KEY);

        }

    };

})();
