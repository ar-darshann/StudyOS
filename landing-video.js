(function(){
  const INTRO='<div class="nivo-intro-only"><div class="nivo-intro-mark">N</div><div class="nivo-intro-eyebrow">INTRODUCING</div><h3>Nivo AI</h3><p>Your personal learning companion.</p></div>';
  const STYLE='.feature-ai .demo-shell{display:flex;align-items:center;justify-content:center;min-height:390px;background:none!important;background-image:none!important}.feature-ai .demo-shell::before,.feature-ai .demo-shell::after{content:none!important;display:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo{display:flex!important;align-items:center;justify-content:center;min-height:390px!important;overflow:hidden!important;animation:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo::before,.feature-ai .chat-demo::after{content:none!important;display:none!important;background:none!important;background-image:none!important}.feature-ai .chat-demo>*{display:none!important}.nivo-intro-only{width:100%;min-height:390px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;background:transparent!important}.nivo-intro-mark{width:92px;height:92px;border-radius:28px;display:grid;place-items:center;background:var(--landing-accent,#A85E43);color:#fff;font:900 52px Arial;margin-bottom:24px}.nivo-intro-eyebrow{font:700 11px Arial;letter-spacing:2px;color:var(--landing-muted,#746F63);margin-bottom:10px}.nivo-intro-only h3{margin:0;color:var(--landing-text,#292923);font:800 42px Arial;letter-spacing:-1px}.nivo-intro-only p{margin:12px 0 0;color:var(--landing-muted,#746F63);font:400 15px Arial}.feature-ai .chat-demo .chat-messages,.feature-ai .chat-demo .bubble{display:none!important;animation:none!important}';
  function loadPalette(){
    if(!document.getElementById('landing-palette3')){const l=document.createElement('link');l.id='landing-palette3';l.rel='stylesheet';l.href='landing-palette3.css?v=3';document.head.appendChild(l)}
  }
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
    loadPalette();
    if(!document.getElementById('nivo-intro-only-style')){const s=document.createElement('style');s.id='nivo-intro-only-style';s.textContent=STYLE;document.head.appendChild(s)}
    clean();
    new MutationObserver(clean).observe(document.documentElement,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();