/* Nivora subject page controller: isolated from the dashboard controller. */
(function () {
    const account = () => { try { return JSON.parse(localStorage.getItem("studyOS-account")); } catch { return null; } };
    const subjects = () => window.studyOSStorage ? window.studyOSStorage.getSubjects() : {};
    const save = value => window.studyOSStorage && window.studyOSStorage.saveSubjects(value);
    const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const esc = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
    const started = topic => !!(topic && (topic.started === true || Number(topic.attempts || 0) > 0 || Number(topic.practiceCount || 0) > 0 || Number(topic.score || 0) > 0));
    const score = topic => Number(topic?.score || 0);
    const format = value => value == null || Number.isNaN(Number(value)) ? "—" : `${Math.round(Number(value)*100)/100}%`;
    let id = null;

    function setupTheme() {
        const button=document.getElementById("themeToggle"),icon=document.getElementById("themeIcon"); if(!button||!icon)return;
        const light=localStorage.getItem("studyOS-theme")==="light"; document.body.classList.toggle("light",light); icon.textContent=light?"☾":"☀";
        button.onclick=()=>{const next=document.body.classList.toggle("light");localStorage.setItem("studyOS-theme",next?"light":"dark");icon.textContent=next?"☾":"☀";};
    }
    function logout(){localStorage.removeItem("studyOS-account");location.replace("index.html");}
    function setupProfile(){const a=account(),button=document.getElementById("profileButton"),menu=document.getElementById("profileMenu");if(!button)return;button.textContent=(a?.name||"?").trim().charAt(0).toUpperCase()||"?";text("profileMenuName",a?.name||"Profile");if(!menu)return;button.onclick=e=>{e.stopPropagation();menu.classList.toggle("hidden")};menu.onclick=e=>e.stopPropagation();document.addEventListener("click",()=>menu.classList.add("hidden"));document.getElementById("setupAgainButton")?.addEventListener("click",()=>location.href="setup.html");document.getElementById("logoutButton")?.addEventListener("click",logout);}

    function render(subject){
        const list=document.getElementById("subjectTopicsList");
        text("subjectName",subject.name);text("subjectDescription",subject.description||"");text("subjectIcon",subject.icon||"•");
        const startedTopics=(subject.topics||[]).filter(started),average=startedTopics.length?startedTopics.reduce((sum,t)=>sum+score(t),0)/startedTopics.length:null;
        text("subjectAverage",format(average));text("subjectTopics",(subject.topics||[]).length);text("subjectStudyTime",Number(subject.studyTime||0)>0?`${Number(subject.studyTime)}h`:"—");text("sidebarSubjectName",subject.name);text("sidebarTopicCount",`${(subject.topics||[]).length} topics`);
        if(!list)return;list.innerHTML="";
        if(!(subject.topics||[]).length){list.innerHTML='<div class="empty-topic-state"><h3>No topics yet.</h3><p>Add the topics you want to study.</p></div>';return;}
        subject.topics.forEach((topic,index)=>{if(!topic.id){topic.id=`${id}-topic-${index}-${Math.random().toString(36).slice(2,8)}`;save(subjects());}const row=document.createElement("div");row.className="subject-topic-row";row.tabIndex=0;row.setAttribute("role","button");const pct=started(topic)?Math.max(0,Math.min(100,score(topic))):0;row.innerHTML=`<div data-topic-number="${index+1}"><strong>${esc(topic.name)}</strong><div class="progress-track topic-progress"><div class="progress-value" style="width:${pct}%"></div></div></div><strong>${started(topic)?format(score(topic)):"Not started"}</strong>`;row.addEventListener("click",event=>{if(event.target.closest("a,button,input"))return;window.NivoraTopicWorkspace?.open(topic,id);});row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();window.NivoraTopicWorkspace?.open(topic,id);}});list.appendChild(row);});
    }
    function setupAddTopic(){const modal=document.getElementById("topicCreateModal"),form=document.getElementById("topicForm");if(!modal||!form)return;const close=()=>{modal.classList.add("hidden");document.body.classList.remove("modal-open");form.reset();};document.getElementById("addTopicButton")?.addEventListener("click",()=>{modal.classList.remove("hidden");document.body.classList.add("modal-open");setTimeout(()=>document.getElementById("topicNameInput")?.focus(),80);});document.getElementById("closeTopicModal")?.addEventListener("click",close);document.getElementById("cancelTopicButton")?.addEventListener("click",close);modal.querySelector("[data-close-create-topic]")?.addEventListener("click",close);form.addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("topicNameInput")?.value.trim();if(!name)return;const all=subjects();all[id].topics=all[id].topics||[];all[id].topics.push({id:`${id}-topic-${Date.now()}`,name,score:0,started:false,attempts:0});save(all);close();render(all[id]);});}

    document.addEventListener("DOMContentLoaded",()=>{
        try{
            if(!account()){location.replace("index.html");return;}
            id=new URLSearchParams(location.search).get("subject");const subject=subjects()[id];
            if(!id||!subject){text("subjectName","Subject not found");text("subjectDescription","This subject is no longer available.");document.body.classList.add("page-ready");return;}
            document.title=`${subject.name} | Nivora`;setupTheme();setupProfile();document.getElementById("sidebarLogout")?.addEventListener("click",logout);setupAddTopic();render(subject);document.body.classList.add("page-ready");
        }catch(error){console.error("Nivora subject page failed to initialize:",error);document.body.classList.add("page-ready");const main=document.querySelector(".subject-main");if(main)main.insertAdjacentHTML("afterbegin",'<div class="error-banner">Nivora could not load this subject. Please refresh once.</div>');}
    });
})();
