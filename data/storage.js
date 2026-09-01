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
    if (localStorage.getItem(VERSION_KEY) !== CURRENT_VERSION) {
        localStorage.removeItem(SUBJECTS_KEY); localStorage.removeItem(ACCOUNT_KEY); localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        try { indexedDB.deleteDatabase(DB_NAME); } catch (error) { console.warn("Could not reset local material database.", error); }
    }
    function readSubjects() { try { return JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || {}; } catch { return {}; } }
    function writeSubjects(subjects) { localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)); }
    function openDB() { return new Promise(function (resolve, reject) { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = function () { const db=request.result; if(!db.objectStoreNames.contains(STORE_NAME)){ const store=db.createObjectStore(STORE_NAME,{keyPath:"id"}); store.createIndex("subjectId","subjectId",{unique:false}); } }; request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); }); }
    window.studyOSData={subjects:readSubjects()};
    window.studyOSStorage={
        getSubjects:readSubjects,
        saveSubjects:function(subjects){window.studyOSData.subjects=subjects;writeSubjects(subjects);},
        clearSubjects:function(){localStorage.removeItem(SUBJECTS_KEY);window.studyOSData.subjects={};},
        deleteSubject:async function(subjectId){const subjects=readSubjects();delete subjects[subjectId];writeSubjects(subjects);window.studyOSData.subjects=subjects;try{const db=await openDB();const materials=await new Promise(function(resolve,reject){const tx=db.transaction(STORE_NAME,"readonly");const request=tx.objectStore(STORE_NAME).index("subjectId").getAll(subjectId);request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error);});await new Promise(function(resolve,reject){const tx=db.transaction(STORE_NAME,"readwrite");materials.forEach(material=>tx.objectStore(STORE_NAME).delete(material.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(error){console.warn("Could not remove subject materials.",error);}},
        addMaterial:async function(material){const db=await openDB();return new Promise(function(resolve,reject){const tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).put(material);tx.oncomplete=()=>{db.close();resolve(material);};tx.onerror=()=>{db.close();reject(tx.error);};});},
        getMaterials:async function(subjectId){const db=await openDB();return new Promise(function(resolve,reject){const tx=db.transaction(STORE_NAME,"readonly");const request=tx.objectStore(STORE_NAME).index("subjectId").getAll(subjectId);request.onsuccess=()=>{db.close();resolve(request.result||[]);};request.onerror=()=>{db.close();reject(request.error);};});},
        deleteMaterial:async function(id){const db=await openDB();return new Promise(function(resolve,reject){const tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
    };
})();

document.addEventListener("DOMContentLoaded",function(){const style=document.createElement("style");style.textContent=`#curriculumReview:not(.hidden) ~ .manual-card,#curriculumReview:not(.hidden) ~ .setup-card:not(.manual-card),#curriculumReview:not(.hidden) ~ .setup-topics-card{display:none!important}`;document.head.appendChild(style);});

/* Landing-page demos are rendered as actual silent HTML5 video elements. The video is generated
   from the same Nivora UI in-browser, then autoplayed, looped and locked against user controls. */
(function(){
    function demo(type){
        const canvas=document.createElement("canvas");canvas.width=960;canvas.height=600;const ctx=canvas.getContext("2d");let frame=0;const fps=16;
        const C={bg:"#292724",surface:"#35312d",surface2:"#403b35",text:"#eee8de",muted:"#aaa096",border:"#514a42",accent:"#c98566",sage:"#91a891"};
        const rr=(x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}};
        const tx=(s,x,y,z,c,b)=>{ctx.font=(b?"700 ":"")+z+"px Arial";ctx.fillStyle=c;ctx.fillText(s,x,y);};
        function draw(){
            ctx.fillStyle=C.bg;ctx.fillRect(0,0,960,600);rr(30,30,900,540,28,C.surface,C.border);rr(54,52,30,30,9,C.sage);tx("N",62,74,15,"#fff",true);tx("Nivora",96,75,18,C.text,true);
            if(type==="nivo"){tx("Nivo AI",60,125,34,C.text,true);tx("Your learning companion",60,154,15,C.muted);const p=Math.floor(frame/16);[["u","Explain elasticity simply."],["n","Sure — it measures how strongly quantity reacts when price changes."],["u","I understand the formula, but application questions are hard."],["n","Then let’s practice one. I’ll guide you instead of giving it away."]].slice(0,Math.min(4,p+1)).forEach((m,j)=>{const x=m[0]==="u"?500:70,y=200+j*78,w=m[0]==="u"?350:410;rr(x,y,w,56,18,m[0]==="u"?C.surface2:"#302d2a",C.border);tx(m[1],x+18,y+34,15,C.text);});if(p>=3){tx("GUIDED QUIZ",70,545,13,C.sage,true);tx("Question 1 of 5 · waiting for your answer",200,545,13,C.muted);}}
            else if(type==="organizer"){tx("Curriculum Organizer",60,125,34,C.text,true);tx("Watch a curriculum become a study structure.",60,154,15,C.muted);const p=Math.min(1,frame/40);rr(70,195,820,72,18,C.surface2,C.border);tx("B.Com Curriculum.pdf",94,225,17,C.text,true);rr(390,230,450,8,5,"#524b44");rr(390,230,450*p,8,5,C.sage);if(frame<20)tx("Reading your curriculum…",70,320,20,C.muted);else if(frame<40)tx("Nivo is identifying subjects and topics…",70,320,20,C.muted);else{[["UCOM101","Business Communication"],["UCOM102","Financial Accounting"],["UCOM103","Business Economics"]].forEach((a,j)=>{const y=315+j*70;rr(70,y,820,52,15,C.bg,C.border);tx(a[0],92,y+32,14,C.accent,true);tx(a[1],190,y+32,17,C.text,true);});tx("Subjects ✓   Topics ✓   Structure ✓",70,545,13,C.sage,true);}}
            else if(type==="path"){tx("Personalized Learning Path",60,125,34,C.text,true);tx("Built from what you told Nivora about yourself.",60,154,15,C.muted);const p=Math.floor(frame/16);if(p<2){tx("WHAT DO YOU STRUGGLE WITH?",70,210,13,C.muted,true);tx("When you study Accounting, where do you get stuck?",70,245,20,C.text,true);["Understanding concepts","Applying concepts","Remembering","Problem solving"].forEach((o,j)=>{const x=70+(j%2)*410,y=285+Math.floor(j/2)*60;rr(x,y,380,42,13,j===1&&p>0?C.surface2:C.bg,C.border);tx((j===1&&p>0?"✓ ":"")+o,x+16,y+27,14,C.text);});}else{tx("YOUR NEXT STEPS",70,210,13,C.muted,true);[["Journal Entries","Application practice · 45 min"],["Ledger","Guided problems · 35 min"],["Trial Balance","Reinforcement · 30 min"]].forEach((a,j)=>{const y=245+j*75;rr(70,y,820,58,15,C.surface2,C.border);tx("0"+(j+1),90,y+36,14,C.accent,true);tx(a[0],145,y+27,17,C.text,true);tx(a[1],145,y+47,12,C.muted);});}}
            else{tx("Journal Entries",60,125,34,C.text,true);tx("Accounting · Topic workspace",60,154,15,C.muted);tx("MATERIALS",70,205,13,C.accent,true);tx("CHAT WITH NIVO",250,205,13,C.muted,true);rr(70,230,410,75,16,C.bg,C.border);tx("Find study PDFs",94,263,17,C.text,true);tx("AI searches relevant material",94,286,12,C.muted);rr(70,320,410,75,16,C.bg,C.border);tx("Upload your own PDF",94,353,17,C.text,true);tx("Use your notes and materials",94,376,12,C.muted);rr(520,230,360,165,18,C.bg,C.border);tx("Hey! What are you stuck on?",545,268,15,C.text);rr(545,285,300,55,16,C.surface2);tx("I can explain it or quiz you.",562,318,14,C.text);tx("Ask Nivo anything…",70,475,14,C.muted);rr(780,450,100,42,12,C.sage);tx("→",817,479,20,"#fff",true);}
            frame++;
        }
        draw();const stream=canvas.captureStream(fps);let chunks=[],rec;try{rec=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp8"});}catch(e){rec=new MediaRecorder(stream);}
        rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const timer=setInterval(draw,1000/fps);const finish=setTimeout(()=>{clearInterval(timer);rec.stop();},4000);
        rec.onstop=()=>{clearTimeout(finish);const v=document.createElement("video");v.className="landing-demo-video";v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;v.controls=false;v.disablePictureInPicture=true;v.setAttribute("aria-hidden","true");v.src=URL.createObjectURL(new Blob(chunks,{type:"video/webm"}));v.onloadeddata=()=>v.play().catch(()=>{});canvas.replaceWith(v);stream.getTracks().forEach(t=>t.stop());};rec.start(250);return canvas;
    }
    document.addEventListener("DOMContentLoaded",function(){if(!document.body.classList.contains("landing-page"))return;[["chat-demo","nivo"],["organizer-demo","organizer"],["path-demo","path"],["workspace-demo","workspace"]].forEach(pair=>{const el=document.querySelector("."+pair[0]);if(!el)return;const shell=el.closest(".demo-shell");if(!shell)return;shell.innerHTML="";const wrap=document.createElement("div");wrap.className="demo-video-wrap";shell.appendChild(wrap);const holder=document.createElement("div");holder.className="landing-video-generating";wrap.appendChild(holder);const c=demo(pair[1]);wrap.appendChild(c);const observer=new MutationObserver(()=>{const v=wrap.querySelector("video");if(v){observer.disconnect();holder.remove();}});observer.observe(wrap,{childList:true,subtree:true});});});
})();
