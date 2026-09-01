(function(){
  const INTRO='<div class="nivo-intro-only"><div class="nivo-intro-mark">N</div><div class="nivo-intro-eyebrow">INTRODUCING</div><h3>Nivo AI</h3><p>Your personal learning companion.</p></div>';
  const STYLE='.feature-ai .demo-shell{display:flex;align-items:center;justify-content:center;min-height:390px;background:none!important;background-image:none!important}.feature-ai .demo-shell::before,.feature-ai .demo-shell::after{content:none!important;display:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo{display:flex!important;align-items:center;justify-content:center;min-height:390px!important;overflow:hidden!important;animation:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo::before,.feature-ai .chat-demo::after{content:none!important;display:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo>*{display:none!important}.nivo-intro-only{width:100%;min-height:390px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;background:transparent!important}.nivo-intro-mark{width:92px;height:92px;border-radius:28px;display:grid;place-items:center;background:var(--landing-sage,#718873);color:#fff;font:900 52px Arial;margin-bottom:24px}.nivo-intro-eyebrow{font:700 11px Arial;letter-spacing:2px;color:var(--landing-muted,#777168);margin-bottom:10px}.nivo-intro-only h3{margin:0;color:var(--landing-text,#292824);font:800 42px Arial;letter-spacing:-1px}.nivo-intro-only p{margin:12px 0 0;color:var(--landing-muted,#777168);font:400 15px Arial}.feature-ai .chat-demo .chat-messages,.feature-ai .chat-demo .bubble{display:none!important;animation:none!important}';
  const PALETTE='.landing-page{--landing-bg:#101827!important;--landing-surface:#172235!important;--landing-surface-2:#24324a!important;--landing-text:#f4f7fb!important;--landing-muted:#a9b6c8!important;--landing-border:#3b4a62!important;--landing-accent:#4f8cff!important;--landing-accent-hover:#6ba0ff!important;--landing-sage:#39d6b4!important;--landing-shadow:rgba(0,0,0,.35)!important}.landing-page::before{background:radial-gradient(circle at 72% 42%,rgba(79,140,255,.16),transparent 30%),radial-gradient(circle at 18% 85%,rgba(57,214,180,.12),transparent 27%)!important}.logo-mark,.preview-brand span,.demo-bar>span{background:#39d6b4!important}.landing-hero h1 em,.feature-copy h2 em,.landing-final h2 em{color:#4f8cff!important}.landing-start,.preview-topic button,.landing-form-submit{background:#4f8cff!important;border-color:#4f8cff!important}.preview-bar span,.kicker-dot{background:#39d6b4!important}';
  function clean(){
    document.querySelectorAll('.feature-ai .chat-demo').forEach(function(el){
      const shell=el.closest('.feature-ai');
      if(!el.querySelector('.nivo-intro-only')) el.innerHTML=INTRO;
      el.querySelectorAll('video,canvas,img,iframe,object,embed,.landing-demo-video,.demo-video-wrap,.chat-messages,.bubble').forEach(function(x){x.remove()});
      ['background','background-image','background-color','animation','background-size','background-position'].forEach(function(p){el.style.setProperty(p,p==='background-color'?'transparent':p==='animation'?'none':'none','important')});
      if(shell){
        shell.querySelectorAll('video,canvas,img,iframe,object,embed,.landing-demo-video,.demo-video-wrap').forEach(function(x){x.remove()});
        [shell,shell.querySelector('.demo-shell')].forEach(function(x){if(x){x.style.setProperty('background','none','important');x.style.setProperty('background-image','none','important')}});
      }
    });
  }
  function boot(){
    if(!document.getElementById('nivo-intro-only-style')){const s=document.createElement('style');s.id='nivo-intro-only-style';s.textContent=STYLE;document.head.appendChild(s)}
    if(!document.getElementById('nivora-palette-test')){const s=document.createElement('style');s.id='nivora-palette-test';s.textContent=PALETTE;document.head.appendChild(s)}
    clean();
    new MutationObserver(clean).observe(document.documentElement,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();