document.addEventListener('DOMContentLoaded',()=>{
 const account=(()=>{try{return JSON.parse(localStorage.getItem('studyOS-account'))}catch{return null}})(); if(!account){location.replace('index.html');return}
 const subjects=window.studyOSStorage?.getSubjects?.()||{}; const subjectEntries=Object.entries(subjects);
 const totalSteps=8; let current=1;
 const answers={course:'',year:'',struggles:[],difficulty:[],status:'',habits:[],time:null,date:'',notes:'',confidentTopics:'',scheduleNotes:''};
 const subjectBox=document.getElementById('struggleSubjects');
 const subjectName=s=>String(s?.name||s?.title||s?.subjectName||s?.label||'').trim();
 const displaySubject=(id,s)=>subjectName(s)||String(id).replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 subjectBox.innerHTML=subjectEntries.length?subjectEntries.map(([id,s])=>`<button type="button" data-id="${escapeHTML(id)}"><span>${escapeHTML(displaySubject(id,s))}</span><small>${(s.topics||[]).length} topic${(s.topics||[]).length===1?'':'s'}</small></button>`).join(''):'<p class="muted-message">Add subjects first, then Nivora can personalize this pathway.</p>';
 subjectBox.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.classList.toggle('selected');const id=b.dataset.id;answers.struggles=answers.struggles.includes(id)?answers.struggles.filter(x=>x!==id):[...answers.struggles,id]});
 function bindMulti(id,key){const box=document.getElementById(id);if(!box)return;box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.classList.toggle('selected');const v=b.dataset.value;answers[key]=answers[key].includes(v)?answers[key].filter(x=>x!==v):[...answers[key],v]})}
 function bindSingle(id,key){const box=document.getElementById(id);if(!box)return;box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;box.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');answers[key]=b.dataset.value})}
 bindSingle('courseChoices','course');bindSingle('yearChoices','year');bindMulti('difficultyChoices','difficulty');bindSingle('statusChoices','status');bindMulti('habitChoices','habits');bindSingle('timeChoices','time');
 function showStep(n){current=n;document.querySelectorAll('.pathway-step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));document.getElementById('stepLabel').textContent=`STEP ${n} OF ${totalSteps}`;document.getElementById('stepProgress').style.width=`${(n/totalSteps)*100}%`;document.getElementById('backButton').disabled=n===1;document.getElementById('nextButton').textContent=n===totalSteps?'Build my pathway →':'Continue →';window.scrollTo({top:0,behavior:'smooth'})}
 document.getElementById('backButton').onclick=()=>{if(current>1)showStep(current-1)};
 document.getElementById('nextButton').onclick=()=>{
  if(current===1&&!answers.course)return alert('Choose your course so Nivora can set the right academic context.');
  if(current===2&&!answers.year)return alert('Choose your current year.');
  if(current===3&&!answers.struggles.length)return alert('Choose at least one subject so Nivora knows where to focus.');
  if(current===4&&!answers.difficulty.length)return alert('Choose at least one difficulty.');
  if(current===5&&!answers.status)return alert('Choose the option that best describes your current level.');
  if(current===6&&!answers.habits.length)return alert('Choose at least one study pattern.');
  if(current===7&&!answers.time)return alert('Choose a realistic daily study time.');
  if(current<totalSteps){showStep(current+1);return} buildPath();
 };
 document.getElementById('editPathButton').onclick=()=>{document.getElementById('resultCard').classList.add('hidden');document.getElementById('assessmentCard').classList.remove('hidden');showStep(1)};
 function buildPath(){
  answers.date=document.getElementById('targetDate').value;answers.notes=document.getElementById('pathwayNotes').value.trim();answers.confidentTopics=document.getElementById('confidentTopics').value.trim();answers.scheduleNotes=document.getElementById('scheduleNotes').value.trim();
  const selected=answers.struggles.map(id=>[id,subjects[id]]).filter(x=>x[1]);const minutes=Number(answers.time||60);const topics=[];
  selected.forEach(([id,s])=>(s.topics||[]).forEach(t=>{const started=!!(t.started||Number(t.attempts||0)>0||Number(t.score||0)>0);const score=Number(t.score||0);let priority=0;if(!started)priority+=answers.status==='new'?4:1;if(score>0&&score<60)priority+=5;if(score>=60&&score<75)priority+=2;if(answers.difficulty.includes('basics'))priority+=2;if(answers.difficulty.includes('problems')&&score<75)priority+=2;if(answers.difficulty.includes('application'))priority+=2;if(answers.difficulty.includes('memory'))priority+=1;if(answers.difficulty.includes('exam'))priority+=1;if(answers.status==='revision'&&started)priority+=1;topics.push({subjectId:id,subjectName:displaySubject(id,s),name:t.name,score,started,priority})}));
  topics.sort((a,b)=>b.priority-a.priority);const count=Math.max(3,Math.min(8,Math.floor(minutes/25)));const plan=topics.slice(0,count);if(!plan.length)selected.forEach(([id,s])=>plan.push({subjectId:id,subjectName:displaySubject(id,s),name:'Start with a core topic',score:0,started:false,priority:1}));
  const profile={course:answers.course,year:answers.year,difficulty:answers.difficulty,status:answers.status,habits:answers.habits,confidentTopics:answers.confidentTopics,scheduleNotes:answers.scheduleNotes,notes:answers.notes};
  document.getElementById('planList').innerHTML=plan.map((t,i)=>`<div class="plan-item"><span class="plan-number">${i+1}</span><div><strong>${escapeHTML(t.name)}</strong><small>${escapeHTML(t.subjectName)} · ${t.started?'Build mastery':'Start here'}</small></div><span class="plan-time">${i===0?'30 min':i<3?'25 min':'20 min'}</span></div>`).join('');
  document.getElementById('resultTitle').textContent=answers.date?`Your path to ${new Date(answers.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`:'Your first pathway is ready';
  document.getElementById('resultSummary').textContent=`Nivora built this around your ${answers.course}, ${answers.year}, reported difficulties, study habits and available time.`;
  localStorage.setItem('nivora-learning-path',JSON.stringify({...answers,profile,generatedAt:new Date().toISOString(),plan}));
  document.getElementById('assessmentCard').classList.add('hidden');document.getElementById('resultCard').classList.remove('hidden');document.getElementById('resultCard').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function escapeHTML(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}
 showStep(1);
});