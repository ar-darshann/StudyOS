/* Persist Nivo's topic conversation locally so reopening a topic resumes where the student left off. */
(function(){
    const KEY="nivora-nivo-chats-v1";
    let restoring=false;
    let lastKey=null;
    const loadAll=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch{return {};}};
    const saveAll=data=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(error){console.warn("Nivora could not save Nivo chat",error);}};
    const getTopicKey=()=>{
        const subjectId=new URLSearchParams(location.search).get("subject")||"unknown";
        const title=(document.getElementById("topicWorkspaceTitle")?.textContent||"Topic").trim();
        return `${subjectId}::${title}`;
    };
    const readMessages=()=>Array.from(document.querySelectorAll("#chatMessages .chat-message")).map(node=>({role:node.classList.contains("user")?"user":"assistant",content:(node.querySelector("p")?.textContent||"").trim()})).filter(item=>item.content).slice(-30);
    const writeMessages=items=>{
        const messages=document.getElementById("chatMessages");if(!messages)return;
        messages.innerHTML="";
        items.forEach(item=>{
            const node=document.createElement("div");node.className=`chat-message ${item.role}`;
            const strong=document.createElement("strong");strong.textContent=item.role==="user"?"You":"Nivo";
            const p=document.createElement("p");p.textContent=item.content;
            node.append(strong,p);messages.appendChild(node);
        });
        messages.scrollTop=messages.scrollHeight;
    };
    const restore=()=>{
        const modal=document.getElementById("topicModal"),messages=document.getElementById("chatMessages");
        if(!modal||!messages||modal.classList.contains("hidden"))return;
        const key=getTopicKey();if(!key||key.endsWith("::Topic")||key===lastKey)return;
        lastKey=key;
        const saved=loadAll()[key];
        if(!saved)return;
        restoring=true;
        if(saved.mode){
            const button=document.querySelector(`[data-nivo-mode="${saved.mode}"]`);
            if(button)button.click();
        }
        if(Array.isArray(saved.messages)&&saved.messages.length)writeMessages(saved.messages);
        restoring=false;
    };
    const persist=()=>{
        if(restoring)return;
        const modal=document.getElementById("topicModal"),messages=document.getElementById("chatMessages");
        if(!modal||!messages||modal.classList.contains("hidden"))return;
        const key=getTopicKey();if(!key||key.endsWith("::Topic"))return;
        const all=loadAll();
        const modeText=(document.getElementById("nivoModeBadgeText")?.textContent||"").trim().toLowerCase();
        all[key]={mode:modeText==="interactive learning"?"interactive":modeText==="explanation"?"explanation":null,messages:readMessages(),updatedAt:new Date().toISOString()};
        saveAll(all);
    };
    document.addEventListener("DOMContentLoaded",()=>{
        const modal=document.getElementById("topicModal"),messages=document.getElementById("chatMessages");if(!modal||!messages)return;
        new MutationObserver(()=>{setTimeout(restore,40);setTimeout(persist,120);}).observe(modal,{attributes:true,attributeFilter:["class"]});
        new MutationObserver(()=>{clearTimeout(window.__nivoPersistTimer);window.__nivoPersistTimer=setTimeout(persist,250);}).observe(messages,{childList:true,subtree:true,characterData:true});
        document.addEventListener("click",event=>{if(event.target.closest("[data-nivo-mode]")){setTimeout(persist,60);}});
        setTimeout(restore,250);
    });
})();
