(() => {
  'use strict';
  const c = window.SITE_CONFIG;
  if (!c) { document.body.insertAdjacentHTML('afterbegin','<p role="alert">页面配置未加载，请刷新重试。</p>'); return; }
  const $ = id => document.getElementById(id);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let muted = true, voicePending = false, dialogueDismissed = false;
  let toastTimer, typingTimer, enterTimer, typingRun = 0;
  let entering = false, countdownTimer;
  const voice = c.intro.voice ? new Audio() : null;
  if (voice) { voice.id = 'intro-voice'; voice.hidden = true; voice.preload = 'auto'; voice.volume = c.intro.volume; voice.src = c.intro.voice; document.body.append(voice); voice.load(); }
  const setText = (id, value) => { $(id).textContent = value; };
  function showToast(message) {
    setText('toast',message); $('toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').classList.remove('show'),2600);
  }
  function image(id,src,alt='') { $(id).src=src; $(id).alt=alt; }
  document.documentElement.style.setProperty('--accent',c.theme.accent);
  document.documentElement.style.setProperty('--paper',c.theme.background);
  document.querySelector('meta[name="theme-color"]').content=c.theme.background;
  for (const id of ['profile-name','about-name']) setText(id,c.profile.name);
  for (const id of ['entry-tagline','tagline']) {
    setText(id,c.profile.tagline.text);
    $(id).hidden=!c.profile.tagline.enable;
  }
  setText('role',c.profile.role);
  function loadMainImages(priority='high'){
    $('character').fetchPriority=priority;
    if(!$('character').getAttribute('src'))image('character',c.images.character,c.images.character_alt);
    $('contacts').querySelectorAll('img[data-src]').forEach(img=>{img.fetchPriority=priority;img.src=img.dataset.src;delete img.dataset.src;});
    $('character').decode?.().catch(()=>{});
  }
  $('about-details').addEventListener('toggle',()=>{
    if($('about-details').open&&!$('about-portrait').getAttribute('src'))image('about-portrait',c.images.portrait,c.images.portrait_alt);
  });
  $('about-portrait').addEventListener('error',()=>{$('about-portrait').hidden=true;});
  for (const paragraph of c.profile.about) {const p=document.createElement('p');p.textContent=paragraph;$('about-paragraphs').append(p);}
  setText('footer-text',c.footer.text);setText('credits',c.footer.credits_label);$('credits').href=c.footer.credits_url;
  async function copy(value,label) {
    let copied=false;
    try {await navigator.clipboard.writeText(value);copied=true;} catch {
      const previous=document.activeElement;
      const field=document.createElement('textarea');field.value=value;field.setAttribute('readonly','');
      field.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.append(field);field.select();
      try {copied=document.execCommand('copy');} catch {}
      field.remove();previous?.focus({preventScroll:true});
    }
    if(copied) showToast(`${label}已复制`);
    else {setText('copy-title',label);$('copy-value').value=value;$('copy-dialog').showModal();$('copy-value').focus();$('copy-value').select();}
  }
  for (const contact of c.contacts) {
    const expandable = contact.action === 'expand';
    const el=document.createElement(expandable?'summary':contact.action==='link'?'a':'button');
    el.className='contact';el.dataset.contact=contact.id;
    const img=document.createElement('img');img.dataset.src=contact.avatar;img.decoding='async';img.alt='';img.width=44;img.height=44;img.addEventListener('error',()=>{img.hidden=true;});
    const label=document.createElement('span');label.textContent=contact.label;el.append(img,label);
    if(expandable) {
      const details=document.createElement('details');details.className='contact-details';
      const arrow=document.createElement('span');arrow.className='contact-expand-icon';arrow.textContent='+';arrow.setAttribute('aria-hidden','true');el.append(arrow);
      const panel=document.createElement('div');panel.className='contact-value-panel';
      const value=document.createElement('span');value.className='contact-value';value.textContent=contact.value;
      const copyButton=document.createElement('button');copyButton.type='button';copyButton.className='contact-copy';copyButton.textContent='复制';
      const valueLabel=contact.id==='qq'?`${contact.label}号`:`${contact.label} ID`;
      copyButton.setAttribute('aria-label',`复制${valueLabel}`);
      copyButton.addEventListener('click',()=>copy(contact.value,valueLabel));
      panel.append(value,copyButton);details.append(el,panel);$('contacts').append(details);
    } else {
      if(contact.action==='link') {el.href=contact.value;el.target='_blank';el.rel='noopener noreferrer';el.setAttribute('aria-label',`打开${contact.label}主页`);}
      else {el.type='button';el.setAttribute('aria-label',`复制${contact.label}号`);el.addEventListener('click',()=>copy(contact.value,`${contact.label}号`));}
      $('contacts').append(el);
    }
  }
  $('about-link').addEventListener('click',()=>{$('about-details').open=true;});
  const music=$('music-widget');
  music.hidden=!c.music.enabled;
  const musicURL=()=>`https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(c.music.song_id)}&auto=${entering&&!muted?1:0}&height=66`;
  function resetMusic(){
    if(!c.music.enabled||!entering||document.body.classList.contains('entry-open'))return;
    // Use the same eager initialization on phones and desktops.
    $('music-player').src=musicURL();
  }
  let musicPrefetched=false;
  function prefetchMusic(){
    if(!c.music.enabled||musicPrefetched)return;
    musicPrefetched=true;
    for(const href of ['https://music.163.com','https://s3.music.126.net','https://s5.music.126.net']){
      const link=document.createElement('link');link.rel='preconnect';link.href=href;document.head.append(link);
    }
    const link=document.createElement('link');link.rel='prefetch';link.as='document';link.href=musicURL();document.head.append(link);
  }
  function syncMusic(){
    if(c.music.enabled&&$('music-player').getAttribute('src')!==musicURL())resetMusic();
  }
  if(c.music.enabled) {
    setText('song-title',c.music.title);setText('song-artist',c.music.artist);
    $('music-cover').dataset.src=c.music.cover;
    $('song-link').href=c.music.url;
    $('music-player').title=`${c.music.artist} · ${c.music.title}`;
  }
  $('music-retry').addEventListener('click',()=>{
    // Replace the failed browsing context, without a second sound-toggle navigation.
    const previous=$('music-player');
    const replacement=previous.cloneNode(false);
    replacement.removeAttribute('src');
    previous.replaceWith(replacement);
    resetMusic();
  });
  $('music-direct').href=`https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(c.music.song_id)}&auto=0&height=66`;
  function stopVoice(){if(voice){voice.pause();voice.currentTime=0;}}
  function updateSound(){
    $('entry-sound-toggle').setAttribute('aria-pressed',String(!muted));
    $('entry-sound-toggle').setAttribute('aria-label',muted?'声音关闭，点击开启':'声音开启，点击关闭');
    setText('entry-sound-state',muted?'OFF':'ON');
    syncMusic();
    $('sound-toggle').hidden=!voice&&!c.music.enabled;
    $('sound-toggle').classList.toggle('muted',muted);
    $('sound-toggle').setAttribute('aria-pressed',String(muted));
    $('sound-toggle').setAttribute('aria-label',muted?'开启声音':'关闭声音');
  }
  updateSound();
  $('sound-toggle').addEventListener('click',()=>{muted=!muted;updateSound();if(muted){voicePending=false;stopVoice();}else playVoice();});
  $('entry-sound-toggle').addEventListener('click',()=>{muted=!muted;updateSound();});
  document.addEventListener('click',e=>{
    if(!e.isTrusted||!entering||e.target.closest('#entry-sound-toggle,#sound-toggle,#replay,#reenter,#dialogue-close,#music-retry,#music-direct,#song-link'))return;
    const shouldPlay=muted||voicePending;
    muted=false;updateSound();
    if(shouldPlay)playVoice();
  });
  function playVoice(){
    if(!voice||muted||dialogueDismissed)return;
    stopVoice();
    voicePending=false;
    voice.play().then(()=>{voicePending=false;setText('replay','重播语音');}).catch(()=>{voicePending=!muted&&!dialogueDismissed;setText('replay','播放语音');});
  }
  voice?.addEventListener('error',()=>{if(entering&&!muted)showToast('语音暂时无法加载');});
  function typeDialogue(){
    clearTimeout(typingTimer);const run=++typingRun;
    setText('speaker',c.intro.speaker);setText('spoken-line',c.intro.japanese);setText('translation',c.intro.chinese);
    const chars=Array.from(c.intro.japanese);setText('japanese','');
    if(motion.matches||c.intro.typing_ms===0){setText('japanese',c.intro.japanese);$('japanese').classList.remove('typing');return;}
    let index=0;$('japanese').classList.add('typing');
    const next=()=>{if(run!==typingRun)return;setText('japanese',chars.slice(0,++index).join(''));if(index<chars.length)typingTimer=setTimeout(next,c.intro.typing_ms);else $('japanese').classList.remove('typing');};typingTimer=setTimeout(next,450);
  }
  function enter(silent=false){
    if(entering)return;entering=true;clearInterval(countdownTimer);
    loadMainImages();
    muted=silent;updateSound();
    $('site').inert=false;document.body.classList.remove('entry-open');
    syncMusic();
    document.body.classList.add('is-entered');
    $('entry').classList.add('leaving');
    $('dialogue').hidden=!c.intro.enabled;
    $('profile').classList.toggle('no-dialogue',!c.intro.enabled);
    if(c.intro.enabled){playVoice();typeDialogue();}
    clearTimeout(enterTimer);enterTimer=setTimeout(()=>{$('entry').hidden=true;},motion.matches?0:700);
    $('profile-name').tabIndex=-1;$('profile-name').focus({preventScroll:true});
  }
  $('dialogue-close').addEventListener('click',()=>{
    dialogueDismissed=true;voicePending=false;stopVoice();
    clearTimeout(typingTimer);++typingRun;
    $('dialogue').hidden=true;
    $('profile-name').focus({preventScroll:true});
  });
  $('replay').hidden=!voice;
  $('replay').addEventListener('click',()=>{muted=false;updateSound();typeDialogue();playVoice();});
  function openEntry(){
    dialogueDismissed=false;
    entering=false;muted=true;voicePending=false;updateSound();
    $('music-player').removeAttribute('src');
    clearTimeout(enterTimer);stopVoice();
    clearTimeout(typingTimer);++typingRun;document.body.classList.remove('is-entered');
    document.body.classList.add('entry-open');$('site').inert=true;
    $('entry').hidden=false;$('entry').classList.remove('leaving');
    $('entry-sound-toggle').focus();
    clearInterval(countdownTimer);
    const duration=c.intro.duration_seconds*1000;
    const started=performance.now();
    $('load-fill').style.width='0%';
    $('entry-progress').setAttribute('aria-valuenow','0');
    setText('countdown','0%');
    if(duration===0){enter(muted);return;}
    countdownTimer=setInterval(()=>{
      const elapsed=performance.now()-started;
      // Give slow images time to decode; never leave the visitor trapped on failure.
      const ready=mainReady||elapsed>=duration+10000;
      const progress=Math.min(ready?100:99,Math.floor(elapsed/duration*100));
      $('load-fill').style.width=`${progress}%`;
      $('entry-progress').setAttribute('aria-valuenow',String(progress));
      setText('countdown',elapsed>=duration&&!ready?'正在准备主页图片…':`${progress}%`);
      if(progress===100)enter(muted);
    },50);
  }
  $('reenter').hidden=!c.intro.enabled;
  $('reenter').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'instant'});openEntry();});
  $('entry').addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();enter(muted);}
    if(e.key==='Tab'){
      const buttons=[$('entry-sound-toggle')];
      const first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  const character=$('character');let failed=false;
  character.addEventListener('error',()=>{if(!failed){failed=true;character.src=c.images.loader;}else character.hidden=true;});
  // Start the visible main images immediately, without waiting for entry artwork.
  loadMainImages('high');
  let mainReady=false;
  const priorityImages=[$('character'),...$('contacts').querySelectorAll('img')];
  const mainImagesReady=Promise.allSettled(priorityImages.map(img=>img.decode()));
  mainImagesReady.then(()=>{mainReady=true;});
  let restWarmed=false;
  const warmRest=()=>{
    if(restWarmed)return;
    restWarmed=true;
    if(c.music.enabled)image('music-cover',c.music.cover,'歌曲封面');
    const portrait=new Image();portrait.fetchPriority='low';portrait.src=c.images.portrait;
    prefetchMusic();
  };
  // Secondary images and audio still warm during the countdown, at lower priority.
  Promise.race([mainImagesReady,new Promise(resolve=>setTimeout(resolve,2500))]).then(warmRest);
  if(c.intro.enabled)openEntry();else enter(muted);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();});
  if(window.matchMedia('(pointer:fine)').matches&&!motion.matches){
    $('profile').addEventListener('pointermove',e=>{const r=$('profile').getBoundingClientRect();$('stage-art').style.setProperty('--px',`${(e.clientX-r.left-r.width/2)/r.width*9}px`);$('stage-art').style.setProperty('--py',`${(e.clientY-r.top-r.height/2)/r.height*6}px`);});
    $('profile').addEventListener('pointerleave',()=>{$('stage-art').style.setProperty('--px','0px');$('stage-art').style.setProperty('--py','0px');});
  }
})();
