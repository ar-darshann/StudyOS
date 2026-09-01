(function(){
  function makeDemo(type){
    var canvas=document.createElement('canvas'); canvas.width=960; canvas.height=600;
    var ctx=canvas.getContext('2d');
    var frames=0, total=64, fps=16;
    var colors={bg:'#292724',surface:'#35312d',surface2:'#403b35',text:'#eee8de',muted:'#aaa096',border:'#514a42',accent:'#c98566',sage:'#91a891'};
    function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
    function txt(s,x,y,size,color,bold){ctx.font=(bold?'700 ':'')+size+'px Arial';ctx.fillStyle=color;ctx.fillText(s,x,y)}
    function draw(){
      ctx.fillStyle=colors.bg;ctx.fillRect(0,0,960,600);
      rr(30,30,900,540,28,colors.surface,colors.border);
      rr(54,52,30,30,9,colors.sage);txt('N',62,74,15,'#fff',true);txt('Nivora',96,75,18,colors.text,true);
      if(type==='nivo') drawNivo();
      if(type==='organizer') drawOrganizer();
      if(type==='path') drawPath();
      if(type==='workspace') drawWorkspace();
      frames++;
    }
    function drawNivo(){
      txt('Nivo AI',60,125,34,colors.text,true);txt('Your learning companion',60,154,15,colors.muted,false);
      var phase=Math.floor(frames/16);
      var msgs=[['u','Explain elasticity simply.'],['n','Sure — it measures how strongly quantity reacts when price changes.'],['u','I understand the formula, but application questions are hard.'],['n','Then let’s practice one. I’ll guide you instead of giving it away.']];
      msgs.slice(0,Math.min(4,phase+1)).forEach(function(m,j){var x=m[0]==='u'?500:70,y=200+j*78,w=m[0]==='u'?350:410;rr(x,y,w,56,18,m[0]==='u'?colors.surface2:'#302d2a',colors.border);txt(m[1],x+18,y+34,15,colors.text,false);});
      if(phase>=3){txt('GUIDED QUIZ',70,545,13,colors.sage,true);txt('Question 1 of 5  ·  waiting for your answer',200,545,13,colors.muted,false)}
    }
    function drawOrganizer(){
      txt('Curriculum Organizer',60,125,34,colors.text,true);txt('Watch a curriculum become a study structure.',60,154,15,colors.muted,false);var p=Math.min(1,frames/40);rr(70,195,820,72,18,colors.surface2,colors.border);txt('B.Com Curriculum.pdf',94,225,17,colors.text,true);rr(390,230,450,8,5,'#524b44');rr(390,230,450*p,8,5,colors.sage);
      if(frames<20){txt('Reading your curriculum…',70,320,20,colors.muted,false)}else if(frames<40){txt('Nivo is identifying subjects and topics…',70,320,20,colors.muted,false)}else{[['UCOM101','Business Communication'],['UCOM102','Financial Accounting'],['UCOM103','Business Economics']].forEach(function(a,j){var y=315+j*70;rr(70,y,820,52,15,colors.bg,colors.border);txt(a[0],92,y+32,14,colors.accent,true);txt(a[1],190,y+32,17,colors.text,true);});txt('Subjects  ✓     Topics  ✓     Structure  ✓',70,545,13,colors.sage,true);}
    }
    function drawPath(){
      txt('Personalized Learning Path',60,125,34,colors.text,true);txt('Built from what you told Nivora about yourself.',60,154,15,colors.muted,false);var phase=Math.floor(frames/16);
      if(phase<2){txt('WHAT DO YOU STRUGGLE WITH?',70,210,13,colors.muted,true);txt('When you study Accounting, where do you get stuck?',70,245,20,colors.text,true);['Understanding concepts','Applying concepts','Remembering','Problem solving'].forEach(function(o,j){var x=70+(j%2)*410,y=285+Math.floor(j/2)*60;rr(x,y,380,42,13,j===1&&phase>0?colors.surface2:colors.bg,colors.border);txt((j===1&&phase>0?'✓ ':'')+o,x+16,y+27,14,colors.text,false);});}
      else{txt('YOUR NEXT STEPS',70,210,13,colors.muted,true);[['Journal Entries','Application practice · 45 min'],['Ledger','Guided problems · 35 min'],['Trial Balance','Reinforcement · 30 min']].forEach(function(a,j){var y=245+j*75;rr(70,y,820,58,15,colors.surface2,colors.border);txt('0'+(j+1),90,y+36,14,colors.accent,true);txt(a[0],145,y+27,17,colors.text,true);txt(a[1],145,y+47,12,colors.muted,false);});}
    }
    function drawWorkspace(){
      txt('Journal Entries',60,125,34,colors.text,true);txt('Accounting  ·  Topic workspace',60,154,15,colors.muted,false);txt('MATERIALS',70,205,13,colors.accent,true);txt('CHAT WITH NIVO',250,205,13,colors.muted,true);rr(70,230,410,75,16,colors.bg,colors.border);txt('Find study PDFs',94,263,17,colors.text,true);txt('AI searches relevant material',94,286,12,colors.muted,false);rr(70,320,410,75,16,colors.bg,colors.border);txt('Upload your own PDF',94,353,17,colors.text,true);txt('Use your notes and materials',94,376,12,colors.muted,false);rr(520,230,360,165,18,colors.bg,colors.border);txt('Hey! What are you stuck on?',545,268,15,colors.text,false);rr(545,285,300,55,16,colors.surface2);txt('I can explain it or quiz you.',562,318,14,colors.text,false);txt('Ask Nivo anything…',70,475,14,colors.muted,false);rr(780,450,100,42,12,colors.sage);txt('→',817,479,20,'#fff',true);
    }
    draw();
    var stream=canvas.captureStream(fps),chunks=[],rec;
    try{rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});}catch(e){rec=new MediaRecorder(stream);}
    rec.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};
    var timer=setInterval(draw,1000/fps);
    var stopTimer=setTimeout(function(){clearInterval(timer);rec.stop();},4000);
    rec.onstop=function(){clearTimeout(stopTimer);var blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob);var v=document.createElement('video');v.className='landing-demo-video';v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;v.setAttribute('aria-hidden','true');v.setAttribute('controlsList','nodownload noplaybackrate nofullscreen');v.src=url;v.addEventListener('loadeddata',function(){v.play().catch(function(){});},{once:true});canvas.replaceWith(v);stream.getTracks().forEach(function(t){t.stop()});};
    rec.start(250); return canvas;
  }
  document.addEventListener('DOMContentLoaded',function(){[['chat-demo','nivo'],['organizer-demo','organizer'],['path-demo','path'],['workspace-demo','workspace']].forEach(function(pair){var el=document.querySelector('.'+pair[0]);if(!el)return;var shell=el.closest('.demo-shell');if(shell){shell.innerHTML='';var wrap=document.createElement('div');wrap.className='demo-video-wrap';shell.appendChild(wrap);var c=makeDemo(pair[1]);wrap.appendChild(c);}});});
})();