/* Öffnungsanimation für neue Ziehungen, ohne bestehende Daten zu verändern. */
(function(){
  const style=document.createElement('link');style.rel='stylesheet';style.href='opening.css';document.head.appendChild(style);
  const modal=document.createElement('dialog');modal.className='opening';modal.setAttribute('aria-labelledby','openingTitle');
  modal.innerHTML='<div class="opening-shell"><div class="opening-particles" aria-hidden="true"></div><div class="opening-header"><p class="opening-overline">✦ ADVENTSKALENDER ✦</p><h2 id="openingTitle">Die Überraschung ist da</h2><p>Person und Geschenk wurden zufällig gezogen.</p></div><div class="opening-cards" id="openingCards" aria-live="polite"></div><div class="opening-actions"><button type="button" id="closeOpening">Weiter zum Kalender</button></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('#closeOpening').addEventListener('click',()=>modal.close());
  const particles=modal.querySelector('.opening-particles');
  for(let i=0;i<24;i++){const p=document.createElement('i');p.style.setProperty('--x',(4+(i*37)%92)+'%');p.style.setProperty('--y',(10+(i*59)%80)+'%');p.style.setProperty('--r',((i*53)%150-75)+'deg');p.style.setProperty('--delay',(i%7)*.11+'s');particles.appendChild(p)}
  function formatResult(){
    const box=document.getElementById('drawResult');const d=selectedDoor();const last=d.draws.at(-1);if(!last)return;
    box.replaceChildren();box.append('Gezogene Person: ');const person=document.createElement('strong');person.textContent=last.name;box.append(person,document.createElement('br'),'Geschenk: ');const gift=document.createElement('strong');gift.textContent=d.prize||'Noch nicht festgelegt';box.appendChild(gift);
  }
  const oldRender=render;render=function(){oldRender();formatResult()};formatResult();
  function makeCard(d,index){
    const person=d.draws.at(-1),card=document.createElement('article');card.className='opening-card';card.style.setProperty('--delay',Math.min(index*.11,1.1)+'s');
    card.setAttribute('aria-label','Türchen '+d.number+': '+person.name+', Geschenk: '+(d.prize||'Noch nicht festgelegt'));
    const inner=document.createElement('div');inner.className='opening-card-inner';
    const cover=document.createElement('div');cover.className='opening-face opening-cover';cover.setAttribute('aria-hidden','true');
    const star=document.createElement('span');star.className='opening-star';star.textContent='✦';const small=document.createElement('small');small.textContent='TÜRCHEN';const numeral=document.createElement('strong');numeral.textContent=String(d.number).padStart(2,'0');cover.append(star,small,numeral);
    const face=document.createElement('div');face.className='opening-face opening-reveal';
    const label=document.createElement('span');label.className='opening-card-label';label.textContent='TÜRCHEN '+String(d.number).padStart(2,'0');
    const mark=document.createElement('span');mark.className='opening-reveal-star';mark.textContent='✦';mark.setAttribute('aria-hidden','true');
    const whoLabel=document.createElement('small');whoLabel.textContent='GEZOGENE PERSON';
    const name=document.createElement('strong');name.className='opening-name';name.textContent=person.name;
    const line=document.createElement('span');line.className='opening-divider';
    const giftLabel=document.createElement('small');giftLabel.textContent='GESCHENK';
    const gift=document.createElement('span');gift.className='opening-gift';gift.textContent=d.prize||'Noch nicht festgelegt';
    face.append(label,mark,whoLabel,name,line,giftLabel,gift);inner.append(cover,face);card.appendChild(inner);return card;
  }
  function show(drawn){
    const cards=modal.querySelector('#openingCards');cards.replaceChildren();drawn.forEach((door,i)=>cards.appendChild(makeCard(door,i)));
    modal.classList.toggle('no-effects',state.effects===false);
    modal.querySelector('#openingTitle').textContent=drawn.length===1?'Die Überraschung ist da':drawn.length+' Überraschungen sind da';
    if(!modal.open)modal.showModal();
  }
  function bind(id){const button=document.getElementById(id);let previous=null;
    button.addEventListener('click',()=>{previous=state.doors.map(d=>d.draws.length)},true);
    button.addEventListener('click',()=>{if(!previous)return;const changed=state.doors.filter((d,i)=>d.draws.length>previous[i]);previous=null;if(changed.length)show(changed)});
  }
  bind('drawBtn');bind('absenceBtn');
})();
/* Dunkelmodus und besser sichtbarer Schneefall. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
    .snowfall{z-index:2}
    .snowfall i{width:calc(var(--size) + 2px);height:calc(var(--size) + 2px);background:#e4f6ff;opacity:.8;box-shadow:0 0 0 1px #65a6ba99,0 1px 3px #33768a66}
    body.dark-mode{color-scheme:dark;background:#071b26;color:#d9ebef;--ink:#d9ebef;--muted:#a6c2cc;--blue:#c5e5ed;--border:#335967;--surface:#102c39;--light:#173746}
    .dark-mode .brand,.dark-mode .eyebrow,.dark-mode .field-label,.dark-mode .settings summary{color:#9ed7e6}
    .dark-mode .brand span,.dark-mode .intro h1 span{color:#b8df55}
    .dark-mode .intro h1{color:#e1f3f6}
    .dark-mode .workspace,.dark-mode .sidebar,.dark-mode .calendar-panel,.dark-mode .settings,.dark-mode dialog:not(.opening){background:#102c39;color:#d9ebef}
    .dark-mode .switch,.dark-mode .top-button,.dark-mode .file-button,.dark-mode .secondary,.dark-mode .export-bar .button:not(.pdf-action){background:#173a48;color:#d8eef2;border-color:#416573}
    .dark-mode .switch small,.dark-mode .small,.dark-mode .upload-hint,.dark-mode .history-row small,.dark-mode footer,.dark-mode .help-text,.dark-mode .legend{color:#a6c2cc}
    .dark-mode .switch input{background:#66848d}.dark-mode .switch input:checked{background:#95c600}
    .dark-mode .top-button:hover,.dark-mode .file-button:hover,.dark-mode .secondary:hover{background:#235264}
    .dark-mode .text-input,.dark-mode .settings-body .text-input{background:#0b2330;color:#e7f5f7;border-color:#416573}
    .dark-mode .text-input::placeholder{color:#91abb5}
    .dark-mode .sidebar hr{border-color:#335967}
    .dark-mode .upload-zone{background:#143746;border-color:#5d8a99}.dark-mode .upload-zone label,.dark-mode .manage-link,.dark-mode .text-button{color:#a9dfeb}
    .dark-mode .upload-zone.dragging{background:#245366}
    .dark-mode .stat,.dark-mode .stat:nth-child(2){background:#1d4351}
    .dark-mode .stat small{color:#bbd6de}.dark-mode .stat strong{color:#a2dce9}.dark-mode .stat:nth-child(2) strong{color:#c5e77c}
    .dark-mode .chip{background:#24505e;color:#d7eef2}
    .dark-mode .stage{background:#064761}.dark-mode .stage .secondary{background:#ffffff17;color:#fff;border-color:#ffffff55}
    .dark-mode .door{background:#173b49;color:#c5e8f0;border-color:#416d7a}
    .dark-mode .door:after{border-color:#4d7d8a}
    .dark-mode .door.selected{background:#007b99;color:#fff;border-color:#54c5db}
    .dark-mode .door.done{background:#304b24;color:#d4eca3;border-color:#759a4b}
    .dark-mode .door.locked{opacity:.7}
    .dark-mode .export-bar,.dark-mode .history-row{background:#143340;border-color:#355c69;color:#dceff3}
    .dark-mode .history-empty{border-color:#416a78;color:#b3d1db}
    .dark-mode .export-bar strong{color:#d6edf3}
    .dark-mode .progress-track{background:#284f5c}
    .dark-mode dialog::backdrop{background:#001019c9}
    .dark-mode .opening-reveal{background:#153947;color:#e4f4f6}
    .dark-mode .opening-card-label,.dark-mode .opening-name{color:#c7edf5}
    .dark-mode .opening-reveal small{color:#b3d2d9}
    .dark-mode .opening-gift{color:#c6e98b}
    .dark-mode .opening-divider{background:#4e7883}
    .dark-mode .snowfall i{background:#edfaff;box-shadow:0 0 4px #b6edff88}
    @media print{body.dark-mode{background:white;color:#003e5c}}
  `;
  document.head.appendChild(css);
  const snow=document.querySelector('.snowfall');
  if(snow){for(let i=0;i<30;i++){
    const flake=document.createElement('i');
    flake.style.setProperty('--x',((i*47+9)%100)+'%');
    flake.style.setProperty('--size',(3+i%4)+'px');
    flake.style.setProperty('--duration',(16+(i%9)*2)+'s');
    flake.style.setProperty('--delay',(-i*2.1)+'s');
    flake.style.setProperty('--drift',((i%7-3)*10)+'px');
    snow.appendChild(flake);
  }}
  const label=document.createElement('label');label.className='switch dark-switch';
  label.innerHTML='<span>Dunkelmodus<small>Helles / dunkles Design</small></span><input id="darkModeToggle" type="checkbox" aria-label="Dunkelmodus">';
  document.querySelector('.top-actions').prepend(label);
  const toggle=document.getElementById('darkModeToggle');
  function applyMode(){toggle.checked=!!state.darkMode;document.body.classList.toggle('dark-mode',toggle.checked)}
  toggle.addEventListener('change',()=>{state.darkMode=toggle.checked;persist();applyMode()});
  const previousRender=render;render=function(){previousRender();applyMode()};
  applyMode();
})();
