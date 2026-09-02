/* Nivora topic workspace: materials plus contextual Nivo learning. */
(function () {
    const state = { subjectId: null, topic: null, mode: null };
    const esc = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
    const context = () => { const subjectId=new URLSearchParams(location.search).get("subject"); const subjects=window.studyOSStorage?window.studyOSStorage.getSubjects():{}; return {subjectId,subject:subjects[subjectId]}; };
    const profile = () => { try { const path=JSON.parse(localStorage.getItem("nivora-learning-path")||"null"); return path?.profile||path||{}; } catch { return {}; } };
    const chatKey = () => state.subjectId && state.topic?.id ? `nivora-nivo-chat:${state.subjectId}:${state.topic.id}` : null;
    function loadSavedChat(){
        const messages=document.getElementById("chatMessages"); if(!messages)return;
        const key=chatKey(); let saved=[];
        try{ saved=key?JSON.parse(localStorage.getItem(key)||"[]"):[]; }catch{ saved=[]; }
        if(!Array.isArray(saved)||!saved.length){ resetChat(); return; }
        messages.innerHTML="";
        saved.forEach(item=>{ if(item?.role&&item?.content) appendMessage(item.role,item.content,false); });
        messages.scrollTop=messages.scrollHeight;
    }
    function saveChat(){
        const key=chatKey(),messages=document.getElementById("chatMessages"); if(!key||!messages)return;
        const history=Array.from(messages.querySelectorAll(".chat-message")).map(node=>({role:node.classList.contains("user")?"user":"assistant",content:(node.querySelector("p")?.textContent||"").trim()})).filter(x=>x.content).slice(-40);
        try{localStorage.setItem(key,JSON.stringify(history));}catch(error){console.warn("Could not save Nivo chat",error);}
    }
    async function materials(){
        if(!window.studyOSStorage||!state.subjectId||!state.topic?.id)return [];
        const all=await window.studyOSStorage.getMaterials(state.subjectId);
        return all.filter(m=>m.topicId===state.topic.id);
    }
    function ensureTopicId(subject,index,subjectId){
        const topic=subject.topics[index];
        if(!topic.id){
            topic.id=`${subjectId}-topic-${index}-${Math.random().toString(36).slice(2,8)}`;
            const subjects=window.studyOSStorage.getSubjects();
            subjects[subjectId].topics[index].id=topic.id;
            window.studyOSStorage.saveSubjects(subjects);
        }
        return topic.id;
    }
    function resetChat(){
        const messages=document.getElementById("chatMessages");
        if(messages)messages.innerHTML='<div class="chat-message assistant"><strong>Nivo</strong><p>Choose a learning style above, then tell me what you want to learn.</p></div>';
    }
    function setMode(mode){
        state.mode=mode;
        const labels={explanation:"Explanation",interactive:"Interactive Learning"};
        const descriptions={
            explanation:"I’ll teach this topic clearly and step-by-step, using examples, analogies and worked reasoning where useful.",
            interactive:"I’ll explain the topic while involving you through examples, mini-challenges, feedback and guided practice. This is not just Q&A."
        };
        document.querySelectorAll("[data-nivo-mode]").forEach(button=>button.classList.toggle("selected",button.dataset.nivoMode===mode));
        const modes=document.getElementById("nivoLearningModes"),badge=document.getElementById("nivoModeBadge"),badgeText=document.getElementById("nivoModeBadgeText"),description=document.getElementById("nivoModeDescription"),input=document.getElementById("topicChatInput");
        if(modes)modes.classList.add("hidden");
        if(badge){badge.classList.remove("hidden");if(badgeText)badgeText.textContent=labels[mode]||mode;}
        if(description)description.textContent=descriptions[mode]||"Nivo is ready to help you learn this topic.";
        if(input)input.placeholder=mode==="interactive"?"Tell Nivo what part you want to learn...":"Ask Nivo to explain...";
        loadSavedChat();
    }
    function changeMode(){
        state.mode=null;
        document.getElementById("nivoLearningModes")?.classList.remove("hidden");
        document.getElementById("nivoModeBadge")?.classList.add("hidden");
        const description=document.getElementById("nivoModeDescription");
        if(description)description.textContent="Choose how you want Nivo to teach this topic.";
        resetChat();
    }
    function openWorkspace(topic,subjectId){
        state.subjectId=subjectId;state.topic=topic;state.mode=null;
        const title=document.getElementById("topicWorkspaceTitle"),meta=document.getElementById("topicWorkspaceMeta"),modal=document.getElementById("topicModal");
        if(title)title.textContent=topic.name;
        const started=topic.started===true||Number(topic.attempts||0)>0||Number(topic.practiceCount||0)>0||Number(topic.score||0)>0;
        if(meta)meta.textContent=started?`${Number(topic.score||0)}% progress`:"Not started · 0% complete";
        if(modal)modal.classList.remove("hidden");
        document.body.classList.add("modal-open");
        document.getElementById("nivoLearningModes")?.classList.remove("hidden");
        document.getElementById("nivoModeBadge")?.classList.add("hidden");
        const description=document.getElementById("nivoModeDescription");
        if(description)description.textContent="Choose how you want Nivo to teach this topic.";
        const results=document.getElementById("pdfSearchResults");
        if(results){results.classList.add("hidden");results.innerHTML="";}
        resetChat();
        renderMaterials();
    }
    function closeWorkspace(){saveChat();document.getElementById("topicModal")?.classList.add("hidden");document.body.classList.remove("modal-open");state.topic=null;state.mode=null;}
    async function renderMaterials(){
        const list=document.getElementById("topicMaterialList"),count=document.getElementById("materialCount");
        if(!list)return;
        try{
            const items=await materials();
            if(count)count.textContent=items.length;
            list.innerHTML=items.length?"":'<div class="topic-empty-materials"><div>▧</div><strong>No PDFs yet</strong><span>Upload your notes or find a resource.</span></div>';
            items.sort((a,b)=>new Date(b.addedAt)-new Date(a.addedAt)).forEach(material=>{
                const row=document.createElement("div");row.className="topic-material-item large-item";
                row.innerHTML=`<div class="material-file-icon">PDF</div><div class="material-file-info"><strong>${esc(material.name)}</strong><span>${material.source==="web"?"Web resource":"Your upload"}</span></div><div class="topic-material-actions"><button type="button" class="topic-material-open">Open</button><button type="button" class="topic-material-remove">Remove</button></div>`;
                row.querySelector(".topic-material-open").onclick=()=>{if(material.url)window.open(material.url,"_blank","noopener,noreferrer");else if(material.blob){const url=URL.createObjectURL(material.blob);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000);}};
                row.querySelector(".topic-material-remove").onclick=async()=>{if(!confirm(`Remove "${material.name}" from this topic?`))return;await window.studyOSStorage.deleteMaterial(material.id);renderMaterials();};
                list.appendChild(row);
            });
        }catch(error){console.error("Could not load topic materials",error);list.innerHTML='<div class="topic-empty-materials"><strong>Materials could not be loaded.</strong><span>You can still upload a PDF or try again.</span></div>';}
    }
    async function uploadPdfs(){
        const input=document.getElementById("topicPdfInput");if(!input||!state.topic)return;
        for(const file of Array.from(input.files||[])){
            if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){alert("For now, Nivora accepts PDF files only.");continue;}
            try{await window.studyOSStorage.addMaterial({id:crypto.randomUUID(),subjectId:state.subjectId,topicId:state.topic.id,topicName:state.topic.name,name:file.name,type:"application/pdf",size:file.size,addedAt:new Date().toISOString(),source:"upload",blob:file});}
            catch(error){console.error(error);alert("This PDF could not be saved in this browser.");}
        }
        input.value="";renderMaterials();
    }
    function showPdfError(message,canRetry=true){
        const results=document.getElementById("pdfSearchResults");if(!results)return;
        results.classList.remove("hidden");
        results.innerHTML=`<div class="pdf-search-error"><div class="pdf-error-icon">!</div><strong>${esc(message)}</strong><span>Nivo couldn't return a usable PDF list for this topic.</span>${canRetry?'<button type="button" class="secondary-button pdf-retry">Try again</button>':''}</div>`;
        results.querySelector(".pdf-retry")?.addEventListener("click",findPdfs);
    }
    async function findPdfs(){
        const results=document.getElementById("pdfSearchResults");if(!results||!state.topic)return;
        results.classList.remove("hidden");results.innerHTML='<div class="pdf-search-loading"><div class="nivo-spinner">N</div><strong>Nivo is finding the best PDFs…</strong><span>First identifying the useful academic concept, then searching for direct PDFs.</span></div>';
        try{
            const ctx=context();if(!ctx.subject)throw new Error("Subject context is missing.");
            const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);let response;
            try{response=await fetch(`/api/search-pdfs?subject=${encodeURIComponent(ctx.subject.name)}&topic=${encodeURIComponent(state.topic.name)}`,{signal:controller.signal,headers:{Accept:"application/json"}});}finally{clearTimeout(timeout);}
            let data={};try{data=await response.json();}catch{throw new Error("The search service returned an invalid response.");}
            if(!response.ok)throw new Error(data.error||`Search failed (${response.status}).`);
            if(!Array.isArray(data.results)||!data.results.length){showPdfError(data.message||"No direct PDF resources were found for this topic.",true);return;}
            results.innerHTML='<div class="pdf-search-heading"><div><strong>Top PDF resources</strong><span>Ranked for the core concept, source quality and usefulness.</span></div><button type="button" class="text-button pdf-refresh">Refresh</button></div>';
            results.querySelector(".pdf-refresh")?.addEventListener("click",findPdfs);
            data.results.slice(0,5).forEach((item,index)=>{
                const card=document.createElement("article");card.className="pdf-result-card";
                card.innerHTML=`<div class="pdf-rank">${index+1}</div><div class="pdf-result-info"><strong>${esc(item.title||"PDF resource")}</strong><span>${esc(item.source||"Web")}</span><p>${esc(item.reason||"Relevant study resource for this topic.")}</p></div><button type="button" class="pdf-add-result">Add</button>`;
                card.querySelector(".pdf-add-result").onclick=async()=>{const button=card.querySelector(".pdf-add-result");button.disabled=true;button.textContent="Adding…";try{await window.studyOSStorage.addMaterial({id:crypto.randomUUID(),subjectId:state.subjectId,topicId:state.topic.id,topicName:state.topic.name,name:item.title||"Web PDF",type:"application/pdf",size:0,addedAt:new Date().toISOString(),source:"web",url:item.url});button.textContent="Added";renderMaterials();}catch(error){button.disabled=false;button.textContent="Add";alert("This PDF could not be added.");}};
                results.appendChild(card);
            });
        }catch(error){console.error("Nivora PDF search request failed",error);showPdfError(error.name==="AbortError"?"The PDF search took too long to respond.":(error.message||"PDF search failed."),true);}
    }
    function getHistory(){
        const messages=document.getElementById("chatMessages");if(!messages)return [];
        return Array.from(messages.querySelectorAll(".chat-message")).map(node=>({role:node.classList.contains("user")?"user":"assistant",content:(node.querySelector("p")?.textContent||"").trim()})).filter(x=>x.content).slice(-12);
    }
    function appendMessage(role,content,persist=true){
        const messages=document.getElementById("chatMessages");if(!messages)return null;
        const node=document.createElement("div");node.className=`chat-message ${role}`;node.innerHTML=`<strong>${role==="user"?"You":"Nivo"}</strong><p>${esc(content)}</p>`;messages.appendChild(node);messages.scrollTop=messages.scrollHeight;if(persist)saveChat();return node;
    }
    async function sendChat(event){
        event.preventDefault();
        const input=document.getElementById("topicChatInput"),messages=document.getElementById("chatMessages"),text=input?.value.trim();
        if(!text||!state.topic||!messages)return;
        if(!state.mode){appendMessage("assistant","Choose Explanation or Interactive Learning first, so I can teach this topic in the way you want.");return;}
        const history=getHistory();
        appendMessage("user",text);input.value="";
        const loading=document.createElement("div");loading.className="chat-message assistant typing";loading.innerHTML='<strong>Nivo</strong><p>Thinking…</p>';messages.appendChild(loading);messages.scrollTop=messages.scrollHeight;
        try{
            const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:context().subject?.name||"",topic:state.topic.name,message:text,history,mode:state.mode,profile:profile()})});
            let data={};try{data=await response.json();}catch{throw new Error("Nivo returned an invalid response.");}
            if(!response.ok)throw new Error(data.error||"Nivo could not respond.");
            loading.classList.remove("typing");loading.innerHTML=`<strong>Nivo</strong><p>${esc(data.reply||"I couldn't generate a response.")}</p>`;saveChat();
        }catch(error){loading.classList.remove("typing");loading.innerHTML=`<strong>Nivo</strong><p>${esc(error.message||"Nivo could not respond right now.")}</p>`;saveChat();}
        messages.scrollTop=messages.scrollHeight;
    }
    function enhanceTopics(){
        const list=document.getElementById("subjectTopicsList"),ctx=context();if(!list||!ctx.subject)return;
        Array.from(list.querySelectorAll(".subject-topic-row")).forEach((row,index)=>{
            const topic=ctx.subject.topics[index];if(!topic||row.dataset.workspaceReady)return;
            ensureTopicId(ctx.subject,index,ctx.subjectId);row.dataset.workspaceReady="true";row.setAttribute("role","button");row.setAttribute("tabindex","0");
            row.addEventListener("click",event=>{if(event.target.closest("a,button,input"))return;openWorkspace(topic,ctx.subjectId);});
            row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openWorkspace(topic,ctx.subjectId);}});
        });
    }
    window.NivoraTopicWorkspace={open:openWorkspace,close:closeWorkspace};
    document.addEventListener("DOMContentLoaded",()=>{
        enhanceTopics();
        const list=document.getElementById("subjectTopicsList");if(list)new MutationObserver(enhanceTopics).observe(list,{childList:true});
        document.querySelectorAll("[data-nivo-mode]").forEach(button=>button.addEventListener("click",()=>setMode(button.dataset.nivoMode)));
        document.getElementById("changeNivoMode")?.addEventListener("click",changeMode);
        document.getElementById("closeTopicWorkspace")?.addEventListener("click",closeWorkspace);
        document.querySelector("[data-close-topic]")?.addEventListener("click",closeWorkspace);
        document.getElementById("uploadTopicPdf")?.addEventListener("click",()=>document.getElementById("topicPdfInput")?.click());
        document.getElementById("topicPdfInput")?.addEventListener("change",uploadPdfs);
        document.getElementById("findTopicPdfs")?.addEventListener("click",findPdfs);
        document.getElementById("topicChatForm")?.addEventListener("submit",sendChat);
        document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!document.getElementById("topicModal")?.classList.contains("hidden"))closeWorkspace();});
    });
})();
