(function(){
  const CARD = `
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
    document.querySelectorAll('.feature-organizer .organizer-demo').forEach(function(host){
      if(host.querySelector('.organizer-card')) return;
      host.innerHTML = CARD;
    });
    document.querySelectorAll('.feature-organizer .demo-video-wrap').forEach(function(old){ old.remove(); });
  }

  function boot(){
    render();
    new MutationObserver(render).observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();