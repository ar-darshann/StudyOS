(function(){
  const INTRO = `
    <div class="nivo-intro-only">
      <div class="nivo-intro-mark">N</div>
      <div class="nivo-intro-eyebrow">INTRODUCING</div>
      <h3>Nivo AI</h3>
      <p>Your personal learning companion.</p>
    </div>`;

  const STYLE = `
    .feature-ai .nivo-intro-container{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:390px!important;
      background:transparent!important;
      background-image:none!important;
    }
    .feature-ai .nivo-intro-only{
      width:100%;
      min-height:390px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      box-sizing:border-box;
      background:transparent!important;
    }
    .feature-ai .nivo-intro-mark{
      width:92px;
      height:92px;
      border-radius:28px;
      display:grid;
      place-items:center;
      background:linear-gradient(145deg,#2563EB,#60A5FA)!important;
      color:#fff;
      font:900 52px Arial,sans-serif;
      margin-bottom:24px;
      box-shadow:0 20px 55px rgba(37,99,235,.28);
    }
    .feature-ai .nivo-intro-eyebrow{
      font:700 11px Arial,sans-serif;
      letter-spacing:2px;
      color:#8C96A5;
      margin-bottom:10px;
    }
    .feature-ai .nivo-intro-only h3{
      margin:0;
      color:#F5F7FA;
      font:800 42px Arial,sans-serif;
      letter-spacing:-1px;
    }
    .feature-ai .nivo-intro-only p{
      margin:12px 0 0;
      color:#8C96A5;
      font:400 15px Arial,sans-serif;
    }
    .landing-page[data-theme="light"] .feature-ai .nivo-intro-only h3{color:#101827}
    .landing-page[data-theme="light"] .feature-ai .nivo-intro-eyebrow,
    .landing-page[data-theme="light"] .feature-ai .nivo-intro-only p{color:#64748B}
  `;

  const ORGANIZER = `
    <div class="organizer-card">
      <div class="organizer-card-top">
        <div class="organizer-brand"><span>N</span><strong>Nivora</strong></div>
        <div class="organizer-status"><i></i> AI organizing</div>
      </div>
      <div class="organizer-card-body">
        <div class="organizer-eyebrow">CURRICULUM ORGANIZER</div>
        <h3>Turn your syllabus into a workspace.</h3>
        <div class="organizer-document">
          <div class="organizer-file-icon">PDF</div>
          <div class="organizer-file-copy"><strong>B.Com Curriculum.pdf</strong><span>Uploaded just now</span></div>
          <div class="organizer-check">✓</div>
        </div>
        <div class="organizer-ai">
          <div class="organizer-ai-head"><span>✦ Nivo is organizing your curriculum</span><b>78%</b></div>
          <div class="organizer-progress"><span></span></div>
          <div class="organizer-ai-grid"><span>Accounting</span><span>Economics</span><span>Business Law</span><span>Marketing</span></div>
        </div>
      </div>
    </div>`;

  function render(){
    const introHost=document.querySelector('.feature-ai .nivo-intro-container');
    if(introHost && !introHost.querySelector('.nivo-intro-only')) introHost.innerHTML=INTRO;

    document.querySelectorAll('.feature-organizer .organizer-demo').forEach(function(host){
      if(!host.querySelector('.organizer-card')) host.innerHTML=ORGANIZER;
    });

    document.querySelectorAll('.feature-organizer .demo-video-wrap').forEach(function(old){old.remove()});
  }

  function boot(){
    if(!document.getElementById('nivo-landing-card-style')){
      const style=document.createElement('style');
      style.id='nivo-landing-card-style';
      style.textContent=STYLE;
      document.head.appendChild(style);
    }
    render();
    new MutationObserver(render).observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();