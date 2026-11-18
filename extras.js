/* Zusätzliche Ansicht und Funktionen, aufbauend auf dem vorhandenen Kalender. */
(function(){
  const el=id=>document.getElementById(id), stage=document.querySelector('.stage-body');
  const baseRender=render;
  let chosen=new Set([state.selected]), busy=false;
  const key=x=>String(x).trim().toLocaleLowerCase('de-DE');
  const clean=x=>String(x||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const unique=a=>[...new Map(a.map(x=>[key(x),x])).values()];
  const drawnNames=()=>new Set(state.doors.flatMap(d=>d.draws.map(x=>key(x.name))));
  const freeDoors=()=>state.doors.filter(d=>!d.locked&&!d.completed&&!d.draws.length).map(d=>d.number);
  const number=n=>String(n).padStart(2,'0');
  const heading=stage.querySelector('h2');heading.textContent='Welche Türchen möchtest du auslosen?';
  el('selectedTitle').className='hidden-helper';
  const lead=stage.querySelector('p:not(.eyebrow)');lead.id='selectionHint';
  const qty=document.createElement('div');qty.className='quantity';qty.innerHTML='<button type="button" id="lessDoors" aria-label="Ein Türchen weniger">−</button><strong id="doorCount">1</strong><button type="button" id="moreDoors" aria-label="Ein Türchen mehr">+</button>';
  lead.before(qty);
  const selectedChips=document.createElement('div');selectedChips.className='selection-chips';selectedChips.id='selectionChips';lead.after(selectedChips);
  const oldButton=el('drawBtn'),newButton=oldButton.cloneNode(true);oldButton.replaceWith(newButton);
  const repl=el('absenceBtn');document.querySelector('.settings-body .button-row').appendChild(repl);
  const result=el('drawResult');result.hidden=true;
  const sidebar=document.querySelector('.sidebar'),input=el('participantsInput');
  const peopleDialog=document.createElement('dialog');peopleDialog.id='peopleDialog';peopleDialog.setAttribute('aria-labelledby','peopleDialogTitle');peopleDialog.innerHTML='<h2 id="peopleDialogTitle">Teilnehmerliste verwalten</h2><p class="small">Eine Person pro Zeile. Jeder Name wird nur einmal gezogen.</p><label class="field-label" for="participantsInput">Teilnehmerinnen und Teilnehmer</label><div id="participantEditor"></div><div class="dialog-actions"><button type="button" class="button primary" id="closePeople">Fertig</button></div>';
  document.body.appendChild(peopleDialog);peopleDialog.querySelector('#participantEditor').appendChild(input);
  const label=sidebar.querySelector('label[for="participantsInput"]');if(label)label.remove();
  const oldHint=sidebar.querySelector('.small');if(oldHint)oldHint.remove();
  const drop=document.createElement('div');drop.className='upload-zone';drop.innerHTML='<label for="peopleFile"><span class="upload-icon">↑</span><strong>Andere Liste laden</strong><small>oder hier hineinziehen</small></label><input id="peopleFile" type="file" accept=".xlsx,.xls,.csv,.txt,text/csv,text/plain" hidden>';
  sidebar.querySelector('.stats').before(drop);
  const uploadHint=document.createElement('p');uploadHint.className='upload-hint';uploadHint.textContent='Excel, CSV oder Textdatei. „Nachname“ und „Name/Vorname“ werden zu einer Person kombiniert.';drop.after(uploadHint);
  const previewHead=sidebar.querySelector('.eyebrow:last-of-type');const manage=document.createElement('button');manage.className='manage-link';manage.type='button';manage.textContent='Liste verwalten';previewHead.appendChild(manage);
  manage.addEventListener('click',()=>peopleDialog.showModal());el('closePeople').addEventListener('click',()=>peopleDialog.close());
  const header=document.querySelector('.top-actions');const effect=document.createElement('label');effect.className='switch effects-switch';effect.innerHTML='<span>Visuelle Effekte<small>Schnee & Konfetti · ohne Ton</small></span><input id="effectsToggle" type="checkbox" checked>';header.prepend(effect);
  const dayLabel=document.querySelector('label[for="autoDayToggle"]')||el('autoDayToggle').closest('label');dayLabel.querySelector('span').innerHTML='Tagesmodus<small>Nächstes freies Türchen</small>';
  const intro=document.querySelector('.intro p');if(intro)intro.remove();
  const dots=document.createElement('div');dots.className='ambient';dots.setAttribute('aria-hidden','true');dots.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';document.body.prepend(dots);
  el('effectsToggle').checked=state.effects!==false;document.body.classList.toggle('effects-off',!el('effectsToggle').checked);
  el('effectsToggle').addEventListener('change',e=>{state.effects=e.target.checked;document.body.classList.toggle('effects-off',!e.target.checked);persist()});
  const history=document.createElement('section');history.className='history';history.innerHTML='<div class="history-heading"><div><p class="eyebrow">Dokumentation</p><h2>Türchenverlauf</h2></div><button class="button secondary" id="startAgain" type="button">Neu starten</button></div><div class="export-bar"><div><strong>Daten & Auswertung</strong><small>Exportieren, sichern oder einen Stand wiederherstellen</small></div><div class="button-row"><button class="button pdf-action" id="pdfMove" type="button">PDF-Auswertung</button><button class="button secondary" id="csvExport" type="button">CSV exportieren</button><button class="button secondary" id="backupMove" type="button">Backup erstellen</button><label class="button secondary file-button">Wiederherstellen<input id="backupFileCopy" type="file" accept="application/json"></label></div></div><div id="historyList" class="history-list"></div>';
  document.querySelector('.calendar-panel').after(history);
  el('pdfMove').addEventListener('click',()=>el('pdfBtn').click());el('backupMove').addEventListener('click',()=>el('exportBtn').click());el('startAgain').addEventListener('click',()=>el('resetBtn').click());
  el('backupFileCopy').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.doors)||data.doors.length!==24||!data.doors.every(d=>Array.isArray(d.draws)))throw Error('invalid');state={...freshState(),...data};state.selected=Math.min(24,Math.max(1,Number(state.selected)||1));chosen=new Set([state.selected]);persist();render();notify('Backup wiederhergestellt.')}catch{notify('Das Backup konnte nicht gelesen werden.')}e.target.value=''});
  el('csvExport').addEventListener('click',()=>{const cell=v=>'"'+String(v??'').replace(/^[=+\-@]/,"'$&").replace(/"/g,'""')+'"';const rows=[['Türchen','Person','Geschenk','Datum','Status']];state.doors.forEach(d=>{const last=d.draws.at(-1);if(last)rows.push([d.number,last.name,d.prize,last.at,d.completed?'Abgeschlossen':'Geöffnet'])});download(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'adventskalender-verlauf.csv')});
  function updateHistory(){const list=el('historyList');list.replaceChildren();const rows=state.doors.filter(d=>d.draws.length);el('csvExport').disabled=!rows.length;if(!rows.length){const empty=document.createElement('p');empty.className='history-empty';empty.innerHTML='<span>✦</span>Hier erscheinen die geöffneten Türchen und Gewinner.';list.appendChild(empty);return}rows.forEach(d=>{const item=document.createElement('div');item.className='history-row';const last=d.draws.at(-1);const title=document.createElement('strong');title.textContent='Türchen '+number(d.number);const detail=document.createElement('span');detail.textContent=last.name+' · '+(d.prize||'Kein Geschenk');const when=document.createElement('small');when.textContent=last.at?new Date(last.at).toLocaleString('de-DE'):'';item.append(title,detail,when);list.appendChild(item)})}
  function redraw(){
    chosen=new Set([...chosen].filter(n=>n>=1&&n<=24));
    const count=chosen.size;el('doorCount').textContent=count;el('selectionHint').textContent=count+' '+(count===1?'Türchen · 1 Gewinner':'Türchen · '+count+' Gewinner')+' · unten frei anklickbar';
    el('lessDoors').disabled=count===0;el('moreDoors').disabled=!freeDoors().some(n=>!chosen.has(n));
    selectedChips.replaceChildren();[...chosen].sort((a,b)=>a-b).forEach(n=>{const b=document.createElement('button');b.type='button';b.className='pick-chip';b.textContent=number(n)+' ×';b.setAttribute('aria-label','Türchen '+n+' abwählen');b.onclick=()=>{chosen.delete(n);render()};selectedChips.appendChild(b)});
    document.querySelectorAll('[data-door]').forEach(button=>{const n=Number(button.dataset.door),d=state.doors[n-1];const clone=button.cloneNode(true);clone.classList.toggle('selected',chosen.has(n));clone.setAttribute('aria-pressed',chosen.has(n)?'true':'false');const cap=clone.querySelector('.door-caption');cap.textContent=chosen.has(n)?'Ausgewählt':d.locked?'Gesperrt':d.completed?'Abgeschlossen':d.draws.length?'Geöffnet':d.prize?'Geschenk ✓':'Geschlossen';clone.addEventListener('click',()=>{saveDoorFields();state.selected=n;if(chosen.has(n))chosen.delete(n);else chosen.add(n);persist();render()});button.replaceWith(clone)});
    stage.querySelector('.eyebrow').textContent=count===1?'Türchen '+number([...chosen][0]):count+' Türchen ausgewählt';
    result.hidden=!state.doors[state.selected-1].draws.length;
    updateHistory();
  }
  render=function(){baseRender();redraw()};
  el('moreDoors').addEventListener('click',()=>{const n=freeDoors().find(n=>!chosen.has(n));if(n){chosen.add(n);state.selected=n;persist();render()}});
  el('lessDoors').addEventListener('click',()=>{const n=[...chosen].at(-1);if(n!==undefined){chosen.delete(n);const left=[...chosen];if(left.length)state.selected=left.at(-1);persist();render()}});
  newButton.addEventListener('click',()=>{
    if(busy)return;saveDoorFields();const nums=[...chosen].sort((a,b)=>a-b);if(!nums.length){notify('Bitte zuerst ein Türchen auswählen.');return}
    const doors=nums.map(n=>state.doors[n-1]);if(doors.some(d=>d.locked||d.completed||d.draws.length)){notify('Bitte nur offene, noch nicht gezogene Türchen auswählen.');return}
    const people=unique(clean(state.participants)).filter(p=>!drawnNames().has(key(p)));
    const used=new Set(state.doors.filter(d=>d.prize).map(d=>key(d.prize)));
    const gifts=unique(clean(state.gifts)).filter(g=>!used.has(key(g)));
    if(people.length<nums.length){notify('Nicht genug ungezogene Personen für diese Auswahl.');return}
    const preset=doors.filter(d=>d.prize);if(new Set(preset.map(d=>key(d.prize))).size!==preset.length||preset.some(d=>state.doors.some(other=>other!==d&&other.prize&&key(other.prize)===key(d.prize)))){notify('Ein Geschenk ist bereits einem anderen Türchen zugeordnet.');return}
    if(gifts.length<doors.filter(d=>!d.prize).length){notify('Nicht genug unbenutzte Geschenke für diese Auswahl.');return}
    busy=true;newButton.disabled=true;try{for(const n of nums){state.selected=n;baseRender();draw(false)}chosen.clear();if(state.autoDay){const next=freeDoors()[0];if(next){chosen.add(next);state.selected=next}}persist();render();notify(nums.length===1?'Türchen wurde ausgelost.':nums.length+' Türchen wurden ausgelost.')}finally{busy=false;newButton.disabled=false}
  });
  function getRows(text){let sep=text.includes(';')?';':text.includes('\t')?'\t':',';let rows=[],row=[],val='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){val+='"';i++}else quoted=!quoted}else if(ch===sep&&!quoted){row.push(val);val=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(val);if(row.some(x=>x.trim()))rows.push(row);row=[];val=''}else val+=ch}row.push(val);if(row.some(x=>x.trim()))rows.push(row);return rows}
  function peopleFromRows(rows){if(!rows.length)return[];const header=rows[0].map(x=>String(x??'').trim().toLocaleLowerCase('de-DE'));const surname=header.findIndex(x=>x==='nachname'||x==='familienname');const given=header.findIndex(x=>['vorname','name/vorname','vorname/name'].includes(x));const full=header.findIndex(x=>['name','vollständiger name','vollstaendiger name','teilnehmer','person'].includes(x));if(surname>=0||given>=0||full>=0){return unique(rows.slice(1).map(r=>{const last=surname>=0?String(r[surname]??'').trim():'';const first=given>=0?String(r[given]??'').trim():full>=0?String(r[full]??'').trim():'';return [last,first].filter(Boolean).join(', ')}).filter(Boolean))}return unique(rows.map(r=>r.map(x=>String(x??'').trim()).filter(Boolean).join(', ')).filter(Boolean))}
  async function sheetLibrary(){if(window.XLSX)return window.XLSX;return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';s.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error());s.onerror=()=>reject(Error());document.head.appendChild(s)})}
  async function importPeople(file){if(!file)return;if(file.size>10*1024*1024){notify('Die Datei ist zu groß. Bitte höchstens 10 MB auswählen.');return}try{let rows;if(/\.xlsx?$/i.test(file.name)){const XLSX=await sheetLibrary();const wb=XLSX.read(await file.arrayBuffer());rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''})}else if(/\.txt$/i.test(file.name)){rows=(await file.text()).replace(/^\ufeff/,'').split(/\r?\n/).map(x=>[x])}else if(/\.csv$/i.test(file.name)){rows=getRows((await file.text()).replace(/^\ufeff/,''))}else{notify('Bitte eine Excel-, CSV- oder Textdatei auswählen.');return}const people=peopleFromRows(rows);if(!people.length){notify('Keine Namen in der Datei gefunden.');return}if(state.participants.trim()){const previous=state.participants;if(typeof window.raffleConfirm!=='function'){notify('Bestätigung ist noch nicht verfügbar. Bitte Seite neu laden.');return}if(!await window.raffleConfirm({title:'Teilnehmerliste ersetzen?',message:'Die aktuelle Liste wird durch '+people.length+' Personen ersetzt. Bereits gezogene Personen bleiben im Verlauf gespeichert.',action:'Liste ersetzen'}))return;if(state.participants!==previous){notify('Die Liste wurde inzwischen geändert. Bitte erneut importieren.');return}}state.participants=people.join('\n');persist();render();input.dispatchEvent(new Event('input',{bubbles:true}));notify(people.length+' Personen geladen.')}catch{notify('Die Datei konnte nicht gelesen werden. Bitte Format oder Verbindung prüfen.')}}
  el('peopleFile').addEventListener('change',e=>{importPeople(e.target.files[0]);e.target.value=''});
  ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('dragging')}));['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('dragging')}));drop.addEventListener('drop',e=>importPeople(e.dataTransfer.files[0]));
  render();
})();
