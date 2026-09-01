(function(){
  function makeDemo(type){
    var canvas=document.createElement('canvas'); canvas.width=960; canvas.height=600;
    var ctx=canvas.getContext('2d');
    var frames=0, fps=20, duration=10;
    var colors={bg:'#292724',surface:'#35312d',surface2:'#403b35',text:'#eee8de',muted:'#aaa096',border:'#514a42',accent:'#c98566',sage:'#91a891'};
    function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
    function text(s,x,y,size,color,bold){ctx.font=(bold?'700 ':'400 ')+size+'px Arial';ctx.fillStyle=color;ctx.fillText(s,x,y)}
    function wrap(s,x,y,maxW,size,color,bold,lineH){ctx.font=(bold?'700 ':'400 ')+size+'px Arial';ctx.fillStyle=color;var words=s.split(' '),line='',lines=[];words.forEach(function(w){var test=line?line+' '+w:w;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=w}else line=test});if(line)lines.push(line);lines.forEach(function(l,i){ctx.fillText(l,x,y+i*lineH)});return lines.length}
    function dot(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
    function draw(){
      ctx.fillStyle=colors.bg;ctx.fillRect(0,0,960,600);rr(30,30,900,540,28,colors.surface,colors.border);
      rr(54,52,30,30,9,colors.sage);text('N',62,74,15,'#fff',true);text('Nivora',96,75,18,colors.text,true);
      if(type==='nivo')drawNivo();else if(type==='organizer')drawOrganizer();else if(type==='path')drawPath();else drawWorkspace();
      frames=(frames+1)%(fps*duration);
    }
    function drawNivo(){
      text('Nivo AI',60,125,34,colors.text,true);text('A learning companion that adapts to you',60,153,15,colors.muted,false);
      var t=frames/fps, chatX=60, chatY=185, chatW=840;
      var events=[
        {at:0.7,type:'u',msg:'Explain elasticity simply.'},
        {at:2.0,type:'think'},
        {at:2.9,type:'n',msg:'Think of elasticity as how strongly demand reacts when price changes.'},
        {at:4.8,type:'u',msg:'I understand the formula, but application questions are hard.'},
        {at:6.1,type:'think'},
        {at:7.0,type:'n',msg:'Then we will practice application. I will give you a hint before I give away an answer.'},
        {at:8.7,type:'quiz',msg:'Question 1 of 5  ·  What happens to demand when price rises?'}
      ];
      var visible=[];events.forEach(function(e){if(e.at<=t)visible.push(e)});
      var y=chatY;
      visible.forEach(function(e){if(e.type==='think'){drawThinking(chatX+18,y+18);y+=54;return}if(e.type==='quiz'){rr(chatX, y, chatW, 76, 18, colors.bg, colors.border);text('GUIDED QUIZ',chatX+20,y+25,11,colors.sage,true);wrap(e.msg,chatX+20,y+52,chatW-40,15,colors.text,true,20);y+=90;return}var x=e.type==='u'?430:chatX,w=e.type==='u'?470:560;var h=64;var alpha=Math.min(1,Math.max(0,(t-e.at)/0.45));ctx.globalAlpha=alpha;rr(x,y,w,h,18,e.type==='u'?colors.surface2:'#302d2a',colors.border);wrap(e.msg,x+18,y+25,w-36,14,colors.text,false,20);ctx.globalAlpha=1;y+=82});
      if(t<0.7){var p=t/0.7;dot(480,320,10,colors.sage);ctx.globalAlpha=1-p;text('Meet Nivo',405,365,18,colors.text,true);ctx.globalAlpha=1}
      text('Always learning with you',60,552,12,colors.muted,false);
    }
    function drawThinking(x,y){rr(x,y,88,38,19,colors.surface2,colors.border);dot(x+22,y+19,4,colors.sage);dot(x+44,y+19,4,colors.sage);dot(x+66,y+19,4,colors.sage);}
    function drawOrganizer(){text('Curriculum Organizer',60,125,34,colors.text,true);text('Watch a curriculum become a study structure.',60,154,15,colors.muted,false);var p=Math.min(1,(frames/fps)/5);rr(70,195,820,72,18,colors.surface2,colors.border);text('B.Com Curriculum.pdf',94,225,17,colors.text,true);rr(390,230,450,8,5,'#524b44');rr(390,230,450*p,8,5,colors.sage);if(p<.45)text('Reading your curriculum…',70,320,20,colors.muted,false);else if(p<.8)text('Nivo is identifying subjects and topics…',70,320,20,colors.muted,false);else[['UCOM101','Business Communication'],['UCOM102','Financial Accounting'],['UCOM103','Business Economics']].forEach(function(a,j){var y=315+j*70;rr(70,y,820,52,15,colors.bg,colors.border);text(a[0],92,y+32,14,colors.accent,true);text(a[1],190,y+32,17,colors.text,true);});}
    function drawPath(){text('Personalized Learning Path',60,125,34,colors.text,true);text('Built from what you told Nivora about yourself.',60,154,15,colors.muted,false);var t=frames/fps;if(t<4){text('WHAT DO YOU STRUGGLE WITH?',70,210,13,colors.muted,true);wrap('When you study Accounting, where do you usually get stuck?',70,245,760,20,colors.text,true,26);['Understanding concepts','Applying concepts','Remembering','Problem solving'].forEach(function(o,j){var x=70+(j%2)*410,y=300+Math.floor(j/2)*60;rr(x,y,380,42,13,j===1&&t>2?colors.surface2:colors.bg,colors.border);text((j===1&&t>2?'✓ ':'')+o,x+16,y+27,14,colors.text,false)})}else{ text('YOUR NEXT STEPS',70,210,13,colors.muted,true);[['Journal Entries','Application practice · 45 min'],['Ledger','Guided problems · 35 min'],['Trial Balance','Reinforcement · 30 min']].forEach(function(a,j){var y=245+j*75;rr(70,y,820,58,15,colors.surface2,colors.border);text('0'+(j+1),90,y+36,14,colors.accent,true);text(a[0],145,y+27,17,colors.text,true);text(a[1],145,y+47,12,colors.muted,false)})}}
    function drawWorkspace(){text('Journal Entries',60,125,34,colors.text,true);text('Accounting · Topic workspace',60,154,15,colors.muted,false);text('MATERIALS',70,205,13,colors.accent,true);text('CHAT WITH NIVO',250,205,13,colors.muted,true);rr(70,230,410,75,16,colors.bg,colors.border);text('Find study PDFs',94,263,17,colors.text,true);text('AI searches relevant material',94,286,12,colors.muted,false);rr(70,320,410,75,16,colors.bg,colors.border);text('Upload your own PDF',94,353,17,colors.text,true);text('Use your notes and PDFs',94,376,12,colors.muted,false);rr(520,230,360,165,18,colors.bg,colors.border);text('Hey! What are you stuck on?',545,268,15,colors.text,false);rr(545,285,300,55,16,colors.surface2);text('I can explain it or quiz you.',562,318,14,colors.text,false);text('Ask Nivo anything…',70,475,14,colors.muted,false);rr(780,450,100,42,12,colors.sage);text('→',817,479,20,'#fff',true)}
    draw();var stream=canvas.captureStream(fps),chunks=[],rec;try{rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});}catch(e){rec=new MediaRecorder(stream)}rec.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};var timer=setInterval(draw,1000/fps);rec.onstop=function(){var blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob),v=document.createElement('video');v.className='landing-demo-video';v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;v.controls=false;v.disablePictureInPicture=true;v.setAttribute('aria-hidden','true');v.setAttribute('controlsList','nodownload nofullscreen noremoteplayback');v.src=url;v.addEventListener('contextmenu',function(e){e.preventDefault()});v.addEventListener('loadeddata',function(){v.play().catch(function(){})},{once:true});canvas.replaceWith(v);stream.getTracks().forEach(function(t){t.stop()})};rec.start(250);return canvas;
  }
  document.addEventListener('DOMContentLoaded',function(){[['chat-demo','nivo'],['organizer-demo','organizer'],['path-demo','path'],['workspace-demo','workspace']].forEach(function(pair){var el=document.querySelector('.'+pair[0]);if(!el)return;var shell=el.closest('.demo-shell');if(shell){shell.innerHTML='';var wrap=document.createElement('div');wrap.className='demo-video-wrap';shell.appendChild(wrap);var c=makeDemo(pair[1]);wrap.appendChild(c)}})})
})();