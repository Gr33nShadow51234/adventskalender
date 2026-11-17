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
