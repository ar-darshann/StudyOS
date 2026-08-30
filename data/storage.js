/* =========================================
   STUDYOS LOCAL DATA LAYER
   Temporary prototype storage. Replace with a
   real authenticated database later.
========================================= */

(function () {
    const SUBJECTS_KEY = "studyOS-subjects";
    const VERSION_KEY = "studyOS-data-version";
    const CURRENT_VERSION = "3";
    const DB_NAME = "StudyOSMaterials";
    const STORE_NAME = "materials";

    /* Remove the old demo dataset exactly once. */
    if (localStorage.getItem(VERSION_KEY) !== CURRENT_VERSION) {
        localStorage.removeItem(SUBJECTS_KEY);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
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
