/* =========================================
   NIVORA LOCAL DATA LAYER
   Temporary prototype storage.
========================================= */

(function () {
    const SUBJECTS_KEY = "studyOS-subjects";
    const ACCOUNT_KEY = "studyOS-account";
    const VERSION_KEY = "studyOS-data-version";
    const CURRENT_VERSION = "4";
    const DB_NAME = "StudyOSMaterials";
    const STORE_NAME = "materials";

    /* Reset old prototype accounts, subjects and materials once. */
    if (localStorage.getItem(VERSION_KEY) !== CURRENT_VERSION) {
        localStorage.removeItem(SUBJECTS_KEY);
        localStorage.removeItem(ACCOUNT_KEY);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

        try {
            indexedDB.deleteDatabase(DB_NAME);
        } catch (error) {
            console.warn("Could not reset local material database.", error);
        }
    }

    function readSubjects() {
        try {
            return JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || {};
        } catch {
            return {};
        }
    }

    function writeSubjects(subjects) {
        localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
    }

    function openDB() {
        return new Promise(function (resolve, reject) {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("subjectId", "subjectId", { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    window.studyOSData = { subjects: readSubjects() };

    window.studyOSStorage = {
        getSubjects: readSubjects,

        saveSubjects: function (subjects) {
            window.studyOSData.subjects = subjects;
            writeSubjects(subjects);
        },

        clearSubjects: function () {
            localStorage.removeItem(SUBJECTS_KEY);
            window.studyOSData.subjects = {};
        },

        deleteSubject: async function (subjectId) {
            const subjects = readSubjects();
            delete subjects[subjectId];
            writeSubjects(subjects);
            window.studyOSData.subjects = subjects;

            try {
                const db = await openDB();
                const materials = await new Promise(function (resolve, reject) {
                    const tx = db.transaction(STORE_NAME, "readonly");
                    const request = tx.objectStore(STORE_NAME).index("subjectId").getAll(subjectId);
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                await new Promise(function (resolve, reject) {
                    const tx = db.transaction(STORE_NAME, "readwrite");
                    materials.forEach(material => tx.objectStore(STORE_NAME).delete(material.id));
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });

                db.close();
            } catch (error) {
                console.warn("Could not remove subject materials.", error);
            }
        },

        addMaterial: async function (material) {
            const db = await openDB();
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put(material);
                tx.oncomplete = () => { db.close(); resolve(material); };
                tx.onerror = () => { db.close(); reject(tx.error); };
            });
        },

        getMaterials: async function (subjectId) {
            const db = await openDB();
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, "readonly");
                const request = tx.objectStore(STORE_NAME).index("subjectId").getAll(subjectId);
                request.onsuccess = () => { db.close(); resolve(request.result || []); };
                request.onerror = () => { db.close(); reject(request.error); };
            });
        },

        deleteMaterial: async function (id) {
            const db = await openDB();
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).delete(id);
                tx.oncomplete = () => { db.close(); resolve(); };
                tx.onerror = () => { db.close(); reject(tx.error); };
            });
        }
    };
})();

/* After AI curriculum organization, keep first-setup focused on review.
   Manual subject/material/topic tools remain available from the main app. */
document.addEventListener("DOMContentLoaded", function () {
    const style = document.createElement("style");
    style.textContent = `#curriculumReview:not(.hidden) ~ .manual-card,#curriculumReview:not(.hidden) ~ .setup-card:not(.manual-card),#curriculumReview:not(.hidden) ~ .setup-topics-card{display:none!important}`;
    document.head.appendChild(style);
});
