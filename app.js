const KEY = "adventskalender-v1";
const $ = id => document.getElementById(id);
const freshState = () => ({doors:Array.from({length:24},(_,i)=>({number:i+1,prize:"",notes:"",locked:false,completed:false,draws:[]})),participants:"",gifts:"",uniquePeople:true,uniqueGifts:true,autoDay:false,selected:1});
let state = loadState();
let installPrompt = null;
function loadState(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v?.doors?.length===24)return {...freshState(),...v};}catch(e){}return freshState();}
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
function selectedDoor(){return state.doors[state.selected-1];}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove("show"),2400);}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
  const completed=state.doors.filter(d=>d.completed).length;
  $("progressText").textContent=`${completed} / 24 abgeschlossen`;
  $("progressBar").style.width=(completed/24*100)+"%";
  $("progressHint").textContent=completed===24?"Alle Türchen sind abgeschlossen.":`${24-completed} Türchen noch offen.`;
  $("calendar").innerHTML=state.doors.map(d=>`<button class="door ${d.number===state.selected?"selected":""} ${d.completed?"done":""} ${d.locked?"locked":""}" data-door="${d.number}" aria-label="Türchen ${d.number}">
    <span class="door-mark">${d.completed?"✓":d.locked?"•":""}</span><span class="door-number">${String(d.number).padStart(2,"0")}</span><span class="door-caption">${d.prize?escapeHtml(d.prize):d.completed?"Abgeschlossen":d.locked?"Gesperrt":"Türchen"}</span></button>`).join("");
  document.querySelectorAll("[data-door]").forEach(b=>b.addEventListener("click",()=>selectDoor(Number(b.dataset.door))));
  const d=selectedDoor();
  $("selectedTitle").textContent=`Türchen ${d.number}`;
  $("doorStatus").textContent=d.completed?"Abgeschlossen":d.locked?"Gesperrt":"Offen";
  $("doorStatus").className="status"+(d.completed?" done":d.locked?" locked":"");
  $("prizeInput").value=d.prize;$("notesInput").value=d.notes;
  $("lockDoorBtn").textContent=d.locked?"Türchen entsperren":"Türchen sperren";
  const last=d.draws.at(-1);
  $("drawResult").innerHTML=last?`Gezogene Person: <strong>${escapeHtml(last.name)}</strong><br>Geschenk: <strong>${escapeHtml(d.prize||"Noch nicht festgelegt")}</strong><br><span>${last.type==="replacement"?"Ersatzziehung":"Erstauslosung"} · ${new Date(last.at).toLocaleString("de-DE")}</span>`:"Noch keine Ziehung für dieses Türchen.";
  $("participantsInput").value=state.participants||"";
  $("giftsInput").value=state.gifts||"";
  $("autoDayToggle").checked=!!state.autoDay;
  $("autoDayInfo").textContent=state.autoDay?"Der Tagesmodus ist aktiv.":"Der Tagesmodus ist deaktiviert.";
  $("todayLabel").textContent=new Date().toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"long"});
}
function selectDoor(n){saveDoorFields();state.selected=n;persist();render();}
function saveDoorFields(){
  const d=selectedDoor(), nextPrize=$("prizeInput").value.trim();
  // A manual edit turns the prize into a fixed gift instead of a pool allocation.
  if(nextPrize!==d.prize)d.giftFromPool=false;
  d.prize=nextPrize;d.notes=$("notesInput").value.trim();
}
function saveDoor(){saveDoorFields();persist();render();notify("Türchen gespeichert.");}
function lines(value){return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function nameKey(s){return s.trim().toLocaleLowerCase("de-DE");}
function randomIndex(length){
  if(globalThis.crypto && crypto.getRandomValues){
    const limit=Math.floor(0x100000000/length)*length, v=new Uint32Array(1);
    do{crypto.getRandomValues(v);}while(v[0]>=limit);
    return v[0]%length;
  }
  return Math.floor(Math.random()*length);
}
function draw(replacement=false){
  const d=selectedDoor();
  state.participants=$("participantsInput").value;state.gifts=$("giftsInput").value;
  saveDoorFields();persist();
  if(d.locked||d.completed){notify("Dieses Türchen ist gesperrt oder abgeschlossen.");return;}
  if(!replacement && d.draws.length){notify("Für dieses Türchen wurde bereits gezogen. Nutze bei Bedarf die Ersatzziehung.");return;}
  if(replacement && !d.draws.length){notify("Es gibt noch keine Ziehung, die ersetzt werden kann.");return;}
  const people=[...new Map(lines(state.participants).map(p=>[nameKey(p),p])).values()];
  if(!people.length){notify("Bitte zuerst Personen eintragen.");return;}
  // All historical draws count, including people replaced later.
  const excluded=new Set(state.doors.flatMap(other=>other.draws.map(x=>nameKey(x.name))));
  const personPool=people.filter(p=>!excluded.has(nameKey(p)));
  if(!personPool.length){notify("Keine ungezogene Person mehr verfügbar. Bitte weitere Personen eintragen.");return;}
  let prize=d.prize, giftFromPool=!!d.giftFromPool;
  const givenGifts=new Set(state.doors.filter(other=>other!==d&&other.prize).map(other=>nameKey(other.prize)));
  if(prize && givenGifts.has(nameKey(prize)) && !replacement){
    notify("Dieses Geschenk ist schon einem anderen Türchen zugeordnet.");return;
  }
  if(!prize){
    const giftPool=[...new Map(lines(state.gifts).map(g=>[nameKey(g),g])).values()]
      .filter(g=>!givenGifts.has(nameKey(g)));
    if(!giftPool.length){notify("Kein unbenutztes Geschenk verfügbar. Bitte weitere Geschenke eintragen.");return;}
    prize=giftPool[randomIndex(giftPool.length)];giftFromPool=true;
  }
  const name=personPool[randomIndex(personPool.length)];
  d.prize=prize;d.giftFromPool=giftFromPool;
  d.draws.push({name,type:replacement?"replacement":"initial",at:new Date().toISOString()});
  persist();render();notify(`${name} wurde mit Geschenk gezogen.`);
}
$("saveDoorBtn").addEventListener("click",saveDoor);
$("lockDoorBtn").addEventListener("click",()=>{const d=selectedDoor();d.locked=!d.locked;persist();render();notify(d.locked?"Türchen gesperrt.":"Türchen entsperrt.");});
$("drawBtn").addEventListener("click",()=>draw(false));
$("absenceBtn").addEventListener("click",()=>{if(!selectedDoor().draws.length){notify("Es gibt noch keine Ziehung, die ersetzt werden kann.");return;}draw(true);});
$("completeBtn").addEventListener("click",()=>{selectedDoor().completed=true;persist();render();notify("Türchen abgeschlossen.");});
$("reopenBtn").addEventListener("click",()=>{selectedDoor().completed=false;persist();render();notify("Türchen wieder geöffnet.");});
$("participantsInput").addEventListener("input",()=>{state.participants=$("participantsInput").value;persist();});
$("giftsInput").addEventListener("input",()=>{state.gifts=$("giftsInput").value;persist();});
$("autoDayToggle").addEventListener("change",e=>{state.autoDay=e.target.checked;const day=new Date().getDate();if(state.autoDay&&new Date().getMonth()===11&&day<=24)state.selected=day;persist();render();});
$("exportBtn").addEventListener("click",()=>{saveDoor();const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});download(blob,`adventskalender-backup-${dateStamp()}.json`);notify("Backup exportiert.");});
$("importFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.doors)||data.doors.length!==24)throw Error();state={...freshState(),...data};state.selected=Math.min(24,Math.max(1,Number(state.selected)||1));persist();render();notify("Backup wiederhergestellt.");}catch(err){notify("Die Backup-Datei ist ungültig.");}e.target.value="";});
function download(blob,name){const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function dateStamp(){return new Date().toISOString().slice(0,10);}
$("pdfBtn").addEventListener("click",()=>{saveDoor();const rows=state.doors.map(d=>`<tr><td>${d.number}</td><td>${escapeHtml(d.prize||"—")}</td><td>${escapeHtml(d.completed?"Abgeschlossen":d.locked?"Gesperrt":"Offen")}</td><td>${escapeHtml(d.draws.map(x=>x.name).join(" → ")||"—")}</td><td>${escapeHtml(d.notes||"")}</td></tr>`).join("");const w=window.open("","_blank");if(!w){notify("Bitte Pop-ups für diese Seite erlauben.");return;}w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Adventskalender-Auswertung</title><style>body{font:12px Arial,sans-serif;color:#222;padding:25px}h1{font-size:23px}p{color:#666}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}th{background:#eee}button{padding:9px 14px;margin:10px 0 20px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Als PDF speichern / Drucken</button><h1>Adventskalender – Auswertung</h1><p>Erstellt am ${new Date().toLocaleString("de-DE")}</p><table><thead><tr><th>Türchen</th><th>Geschenk / Preis</th><th>Status</th><th>Ziehungsverlauf</th><th>Notiz</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);w.document.close();});
$("resetBtn").textContent="Türchen und Verlauf zurücksetzen";
$("resetBtn").addEventListener("click",async()=>{
  if(typeof window.raffleConfirm!=="function"){notify("Bestätigung ist noch nicht verfügbar. Bitte Seite neu laden.");return;}
  if(!await window.raffleConfirm({title:"Kalender neu starten?",message:"Alle Türchen und der Ziehungsverlauf werden zurückgesetzt. Teilnehmer, Geschenke und Notizen bleiben erhalten. Alle Personen und Geschenke sind danach wieder verfügbar.",action:"Zurücksetzen"}))return;
  state.participants=$("participantsInput").value;state.gifts=$("giftsInput").value;
  saveDoorFields();
  // Restore assigned gifts from older backups if they are missing from the list.
  const known=new Set(lines(state.gifts).map(nameKey)), missing=[];
  state.doors.forEach(d=>{const gift=String(d.prize||"").trim();if(gift&&!known.has(nameKey(gift))){known.add(nameKey(gift));missing.push(gift)}});
  if(missing.length)state.gifts+=(state.gifts&&!/\n$/.test(state.gifts)?"\n":"")+missing.join("\n");
  state.doors=state.doors.map(d=>({...d,prize:"",giftFromPool:false,locked:false,completed:false,draws:[]}));
  state.selected=1;persist();render();
  // Clear the multi-selection and select the first available door again.
  document.querySelectorAll("#selectionChips .pick-chip").forEach(chip=>chip.click());
  if($("moreDoors"))$("moreDoors").click();
  notify("Türchen und Verlauf zurückgesetzt. Teilnehmer und Geschenke bleiben erhalten.");
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").hidden=true;});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
if(state.autoDay&&new Date().getMonth()===11&&new Date().getDate()<=24)state.selected=new Date().getDate();
render();

// A quiet snowfall on the page background, controlled by the existing effects switch.
(function(){
  const style=document.createElement("style");
  style.textContent=`
    .snowfall{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    .snowfall i{position:absolute;top:-10px;left:var(--x);width:var(--size);height:var(--size);border-radius:50%;background:#90bfce;opacity:.42;animation:snowfall var(--duration) linear var(--delay) infinite}
    .shell{position:relative;z-index:1}
    .effects-off .snowfall{display:none}
    @keyframes snowfall{from{transform:translate3d(0,-10px,0)}to{transform:translate3d(var(--drift),calc(100vh + 20px),0)}}
    @media (prefers-reduced-motion:reduce){.snowfall{display:none}}
    @media print{.snowfall{display:none}}
  `;
  document.head.appendChild(style);
  const snow=document.createElement("div");snow.className="snowfall";snow.setAttribute("aria-hidden","true");
  for(let i=0;i<24;i++){
    const flake=document.createElement("i");
    flake.style.setProperty("--x",((i*37+3)%100)+"%");
    flake.style.setProperty("--size",(2+i%3)+"px");
    flake.style.setProperty("--duration",(17+i%8*2)+"s");
    flake.style.setProperty("--delay",(-i*1.7)+"s");
    flake.style.setProperty("--drift",((i%5-2)*12)+"px");
    snow.appendChild(flake);
  }
  document.body.prepend(snow);
  document.addEventListener("DOMContentLoaded",()=>{const label=document.querySelector(".effects-switch small");if(label)label.textContent="Schnee & Konfetti · ohne Ton"});
})();
