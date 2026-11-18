/* Suche, Geschenkübersicht, sichere Rücknahme und Backup vor Neustart. */
(function(){
  const byId=id=>document.getElementById(id);
  const key=s=>String(s||'').trim().toLocaleLowerCase('de-DE');
  const linesOf=s=>String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const unique=arr=>[...new Map(arr.map(x=>[key(x),x])).values()];
  const css=document.createElement('style');
  css.textContent=`
    .raffle-tools-search{margin-top:22px;border-top:1px solid #dce9ed;padding-top:14px}
    .raffle-tools-search label{display:block;color:#006b90;font-weight:800;font-size:11px;margin-bottom:7px}
    .raffle-tools-search input{width:100%;border:1px solid #c7dee7;background:#f7fbfc;color:#003e5c;border-radius:8px;padding:10px;font-size:12px}
    .raffle-tools-results{list-style:none;padding:0;margin:8px 0 0;font-size:11px}
    .raffle-tools-results li{border-bottom:1px solid #e2eef1;padding:7px 0;overflow-wrap:anywhere}
    .raffle-tools-results strong,.raffle-tools-results small{display:block}.raffle-tools-results small{color:#668697;margin-top:2px}
    .gift-remaining{margin-top:18px;border:1px solid #cce2e9;border-radius:10px;padding:12px 14px;background:#f7fbfc}
    .gift-remaining summary{cursor:pointer;color:#006b90;font-weight:800;font-size:12px}
    .gift-remaining ul{margin:12px 0 0;padding-left:18px;columns:2;column-gap:25px;color:#315d70;font-size:12px}
    .gift-remaining li{padding:3px 0;break-inside:avoid;overflow-wrap:anywhere}
    .gift-remaining .gift-empty{font-size:12px;color:#668697;margin:10px 0 0}
    .history-row{grid-template-columns:110px minmax(0,1fr) auto auto}
    .undo-draw{background:transparent;border:1px solid #a9ccd7;border-radius:7px;color:#006b90;padding:7px 10px;font-size:10px;font-weight:800}
    .undo-draw:hover{background:#eaf5f8}.undo-draw:focus-visible{outline:3px solid #00a9c3;outline-offset:2px}
    .backup-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.backup-status{font-size:11px;color:#557d8d;line-height:1.5}
    .dark-mode .raffle-tools-search{border-color:#335967}.dark-mode .raffle-tools-search label,.dark-mode .gift-remaining summary{color:#a9dfeb}
    .dark-mode .raffle-tools-search input{background:#0b2330;border-color:#416573;color:#e7f5f7}.dark-mode .raffle-tools-results li{border-color:#335967}
    .dark-mode .raffle-tools-results small,.dark-mode .gift-remaining .gift-empty,.dark-mode .backup-status{color:#a6c2cc}
    .dark-mode .gift-remaining{background:#143340;border-color:#355c69}.dark-mode .gift-remaining ul{color:#d9ebef}
    .dark-mode .undo-draw{border-color:#527a87;color:#d8eef2}.dark-mode .undo-draw:hover{background:#245366}
    @media(max-width:760px){.history-row{grid-template-columns:1fr;gap:6px}.undo-draw{justify-self:start}.gift-remaining ul{columns:1}}
  `;
  document.head.appendChild(css);

  const search=document.createElement('section');search.className='raffle-tools-search';
  search.innerHTML='<label for="participantSearch">Teilnehmer suchen</label><input id="participantSearch" type="search" placeholder="Name eingeben" autocomplete="off"><ul id="participantSearchResults" class="raffle-tools-results" aria-live="polite"></ul>';
  byId('peoplePreview').after(search);
  const searchInput=byId('participantSearch'),searchResults=byId('participantSearchResults');
  function updateSearch(){
    searchResults.replaceChildren();const q=key(searchInput.value);if(!q)return;
    const names=unique([...linesOf(state.participants),...state.doors.flatMap(d=>d.draws.map(x=>x.name))]);
    const matches=names.filter(n=>key(n).includes(q));
    if(!matches.length){const li=document.createElement('li');li.textContent='Keine Person gefunden.';searchResults.appendChild(li);return}
    matches.slice(0,30).forEach(name=>{
      const places=[];
      state.doors.forEach(d=>d.draws.forEach((draw,i)=>{if(key(draw.name)===key(name))places.push('Türchen '+String(d.number).padStart(2,'0')+(i<d.draws.length-1?' (ersetzt)':''))}));
      const li=document.createElement('li'),title=document.createElement('strong'),status=document.createElement('small');
      title.textContent=name;status.textContent=places.length?'Gezogen: '+places.join(', '):'Noch nicht gezogen';li.append(title,status);searchResults.appendChild(li);
    });
    if(matches.length>30){const li=document.createElement('li');li.textContent='Weitere Treffer – bitte Suche verfeinern.';searchResults.appendChild(li)}
  }
  searchInput.addEventListener('input',updateSearch);byId('participantsInput').addEventListener('input',updateSearch);

  const gifts=document.createElement('details');gifts.className='gift-remaining';
  gifts.innerHTML='<summary>Verbleibende Geschenke <span id="remainingGiftCount">0</span></summary><div id="remainingGiftList"></div>';
  byId('calendar').after(gifts);
  function updateGifts(){
    const used=new Set(state.doors.filter(d=>d.prize).map(d=>key(d.prize)));
    const remaining=unique(linesOf(state.gifts)).filter(g=>!used.has(key(g)));
    byId('remainingGiftCount').textContent='('+remaining.length+')';const list=byId('remainingGiftList');list.replaceChildren();
    if(!remaining.length){const p=document.createElement('p');p.className='gift-empty';p.textContent=linesOf(state.gifts).length?'Alle Geschenke sind bereits zugeordnet.':'Noch keine Geschenke eingetragen.';list.appendChild(p);return}
    const ul=document.createElement('ul');remaining.forEach(name=>{const li=document.createElement('li');li.textContent=name;ul.appendChild(li)});list.appendChild(ul);
  }
  byId('giftsInput').addEventListener('input',updateGifts);

  async function undoDoor(number){
    const door=state.doors.find(d=>d.number===number);if(!door||!door.draws.length)return;
    const original=JSON.stringify(door.draws);
    const extra=door.draws.length>1?' Auch alle Ersatzziehungen dieses Türchens werden entfernt.':'';
    if(!await window.raffleConfirm({title:'Ziehung rückgängig machen?',message:'Türchen '+number+' wird wieder geöffnet. Person und Geschenk sind danach wieder verfügbar, sofern sie keinem anderen Türchen zugeordnet sind.'+extra,action:'Ziehung zurücknehmen'}))return;
    if(state.doors.find(d=>d.number===number)!==door||JSON.stringify(door.draws)!==original){notify('Das Türchen wurde inzwischen geändert. Bitte erneut versuchen.');return;}
    state.participants=byId('participantsInput').value;state.gifts=byId('giftsInput').value;saveDoorFields();
    const gift=String(door.prize||'').trim();
    if(gift&&!linesOf(state.gifts).some(x=>key(x)===key(gift)))state.gifts+=(state.gifts&&!/\n$/.test(state.gifts)?'\n':'')+gift;
    door.prize='';door.giftFromPool=false;door.draws=[];door.locked=false;door.completed=false;
    persist();render();notify('Ziehung für Türchen '+number+' rückgängig gemacht.');
  }
  function addUndoButtons(){
    const rows=byId('historyList').querySelectorAll('.history-row');
    const drawn=state.doors.filter(d=>d.draws.length);
    rows.forEach((row,index)=>{
      const door=drawn[index];if(!door)return;
      const btn=document.createElement('button');btn.type='button';btn.className='undo-draw';btn.textContent='Rückgängig';btn.setAttribute('aria-label','Ziehung für Türchen '+door.number+' rückgängig machen');btn.addEventListener('click',()=>undoDoor(door.number));row.appendChild(btn);
    });
  }

  const backupDialog=document.createElement('dialog');backupDialog.id='resetBackupDialog';backupDialog.setAttribute('aria-labelledby','resetBackupTitle');
  backupDialog.innerHTML='<h2 id="resetBackupTitle">Vor dem Neustart sichern?</h2><p>Türchen und Verlauf werden zurückgesetzt. Teilnehmer, Geschenke und Notizen bleiben erhalten.</p><p class="small">Erstelle bei Bedarf zuerst ein Backup. Prüfe den Download, bevor du den Neustart bestätigst.</p><p id="resetBackupStatus" class="backup-status" aria-live="polite"></p><div class="backup-actions"><button id="cancelResetBackup" class="button secondary" type="button">Abbrechen</button><button id="saveBeforeReset" class="button secondary" type="button">Backup erstellen</button><button id="proceedReset" class="button primary" type="button">Zurücksetzen</button></div>';
  document.body.appendChild(backupDialog);
  let bypass=false;
  byId('resetBtn').addEventListener('click',e=>{if(bypass)return;e.stopImmediatePropagation();byId('resetBackupStatus').textContent='';if(!backupDialog.open)backupDialog.showModal()},true);
  byId('cancelResetBackup').addEventListener('click',()=>backupDialog.close());
  byId('saveBeforeReset').addEventListener('click',()=>{byId('exportBtn').click();byId('resetBackupStatus').textContent='Download angefordert. Bitte prüfe, ob die Sicherung gespeichert wurde. Du kannst danach den Neustart bestätigen.'});
  byId('proceedReset').addEventListener('click',()=>{backupDialog.close();try{bypass=true;byId('resetBtn').click()}finally{bypass=false}});

  const confirmStyle=document.createElement('style');
  confirmStyle.textContent=`
    dialog.calendar-confirm,dialog#resetBackupDialog{max-width:480px;width:calc(100% - 32px);border:1px solid #d5e8ed;border-radius:18px;padding:28px;color:#003e5c;background:#fff;box-shadow:0 24px 70px #00334855}
    dialog.calendar-confirm::backdrop,dialog#resetBackupDialog::backdrop{background:#002c43a8}
    .calendar-confirm .confirm-mark,#resetBackupDialog .confirm-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#eaf5dc;color:#668e04;font-size:21px;margin-bottom:16px}
    .calendar-confirm h2,#resetBackupDialog h2{font-size:21px;line-height:1.2;color:#005477;margin:0 0 10px}
    .calendar-confirm p,#resetBackupDialog p{font-size:13px;line-height:1.55;color:#557889;margin:0 0 12px}
    .calendar-confirm .confirm-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:22px}
    .calendar-confirm .button,#resetBackupDialog .button{min-height:40px}
    body.dark-mode dialog.calendar-confirm,body.dark-mode dialog#resetBackupDialog{background:#102c39;border-color:#416573;color:#d9ebef}
    .dark-mode .calendar-confirm h2,.dark-mode #resetBackupDialog h2{color:#d9f0f4}
    .dark-mode .calendar-confirm p,.dark-mode #resetBackupDialog p{color:#b1ccd4}
    .dark-mode .calendar-confirm .confirm-mark,.dark-mode #resetBackupDialog .confirm-mark{background:#294830;color:#c8e884}
    @media(max-width:480px){.calendar-confirm .confirm-actions,#resetBackupDialog .backup-actions{flex-direction:column}.calendar-confirm .button,#resetBackupDialog .button{width:100%}}
  `;
  document.head.appendChild(confirmStyle);
  const confirmDialog=document.createElement('dialog');confirmDialog.className='calendar-confirm';
  confirmDialog.setAttribute('aria-labelledby','calendarConfirmTitle');confirmDialog.setAttribute('aria-describedby','calendarConfirmMessage');
  confirmDialog.innerHTML='<span class="confirm-mark" aria-hidden="true">✦</span><h2 id="calendarConfirmTitle"></h2><p id="calendarConfirmMessage"></p><div class="confirm-actions"><button id="calendarConfirmCancel" class="button secondary" type="button">Abbrechen</button><button id="calendarConfirmAccept" class="button primary" type="button"></button></div>';
  document.body.appendChild(confirmDialog);
  let resolveConfirmation=null;
  function settleConfirmation(answer){const resolve=resolveConfirmation;resolveConfirmation=null;if(confirmDialog.open)confirmDialog.close();if(resolve)resolve(answer)}
  byId('calendarConfirmCancel').addEventListener('click',()=>settleConfirmation(false));
  byId('calendarConfirmAccept').addEventListener('click',()=>settleConfirmation(true));
  confirmDialog.addEventListener('cancel',e=>{e.preventDefault();settleConfirmation(false)});
  confirmDialog.addEventListener('close',()=>{if(resolveConfirmation)settleConfirmation(false)});
  window.raffleConfirm=({title,message,action})=>new Promise(resolve=>{
    if(confirmDialog.open||resolveConfirmation){resolve(false);return}
    byId('calendarConfirmTitle').textContent=title;byId('calendarConfirmMessage').textContent=message;byId('calendarConfirmAccept').textContent=action;
    resolveConfirmation=resolve;
    try{confirmDialog.showModal();byId('calendarConfirmCancel').focus()}catch(e){resolveConfirmation=null;resolve(false);notify('Bestätigung konnte nicht geöffnet werden.')}
  });
  const mark=document.createElement('span');mark.className='confirm-mark';mark.textContent='✦';mark.setAttribute('aria-hidden','true');backupDialog.prepend(mark);

  const oldRender=render;render=function(){oldRender();updateSearch();updateGifts();addUndoButtons()};
  updateSearch();updateGifts();addUndoButtons();
})();
