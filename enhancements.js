/* Gestaltung für Auswertung, Karten und Schnee. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .snowfall{z-index:0}
    .opening-card{height:auto;min-height:290px;animation:celebration-arrive 2.6s cubic-bezier(.2,.7,.2,1) var(--delay) both}
    .opening-card-inner{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:1fr;height:100%;animation:mystery-flip 2.6s ease-out var(--delay) both}
    .opening-face{position:relative;grid-area:1 / 1;min-height:290px;height:100%}
    .opening-reveal{overflow:visible}
    .opening-reveal>*{animation:mystery-text 2.6s linear var(--delay) both}
    @keyframes celebration-arrive{
      0%{opacity:0;transform:translateY(-130px) scale(.35) rotate(-720deg)}
      42%{opacity:1;transform:translateY(18px) scale(1.06) rotate(12deg)}
      58%{transform:translateY(-18px) scale(.98) rotate(-4deg)}
      72%{transform:translateY(6px) scale(1.02) rotate(2deg)}
      85%,100%{opacity:1;transform:translateY(0) scale(1) rotate(0)}
    }
    @keyframes mystery-flip{0%,76%{transform:rotateY(0deg)}92%{transform:rotateY(190deg)}100%{transform:rotateY(180deg)}}
    @keyframes mystery-text{0%,76%{opacity:0}92%,100%{opacity:1}}
    .opening.no-effects .opening-card,.opening.no-effects .opening-card-inner,.opening.no-effects .opening-reveal>*{animation:none}
    .opening.no-effects .opening-card-inner{transform:rotateY(180deg)}
    .opening.no-effects .opening-reveal>*{opacity:1}
    @media(max-width:600px){.opening-card,.opening-face{height:auto;min-height:260px}}
    @media(prefers-reduced-motion:reduce){.opening .opening-card,.opening .opening-card-inner,.opening .opening-reveal>*{animation:none}.opening .opening-card-inner{transform:rotateY(180deg)}.opening .opening-reveal>*{opacity:1}}
  `;
  document.head.appendChild(style);
  const logo='data:image/png;base64,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';
  document.getElementById('pdfBtn').addEventListener('click',event=>{
    event.stopImmediatePropagation();
    saveDoorFields();persist();
    const popup=window.open('','_blank');
    if(!popup){notify('Bitte Pop-ups für diese Seite erlauben.');return}
    const created=new Date().toLocaleString('de-DE');
    const completed=state.doors.filter(d=>d.completed).length;
    const drawn=state.doors.filter(d=>d.draws.length).length;
    const rows=state.doors.map(d=>{
      const status=d.completed?'Abgeschlossen':d.locked?'Gesperrt':d.draws.length?'Geöffnet':'Offen';
      const names=(d.draws||[]).map(x=>x.name).join(' → ')||'—';
      return `<tr><td class="number">${String(d.number).padStart(2,'0')}</td><td>${escapeHtml(names)}</td><td>${escapeHtml(d.prize||'—')}</td><td>${escapeHtml(status)}</td><td>${escapeHtml(d.notes||'—')}</td></tr>`;
    }).join('');
    popup.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Adventskalender – Auswertung</title><style>
      @page{size:A4;margin:18mm 16mm 22mm}
      *{box-sizing:border-box}body{margin:0;color:#182d37;font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.4;background:#fff}
      .print-bar{padding:12px 16px;background:#edf5f7;text-align:center}.print-bar button{border:0;background:#00629b;color:#fff;border-radius:5px;padding:10px 18px;font-size:13px;font-weight:bold;cursor:pointer}
      .sheet{max-width:178mm;margin:auto;padding:14mm 0 22mm}.masthead{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1px solid #c8dee5;padding-bottom:8mm}
      .masthead p{margin:0;color:#0061a4;font-size:9pt;font-weight:bold;letter-spacing:.06em;text-transform:uppercase}.logo{width:55mm;height:auto;max-width:43%}
      h1{color:#50a62c;font-size:22pt;line-height:1.1;margin:9mm 0 3mm;font-weight:600}.subtitle{margin:0 0 7mm;color:#58717b;font-size:9pt}
      .summary{display:flex;gap:10mm;margin:0 0 6mm;padding:3mm 0;border-top:1px solid #d7e6e9;border-bottom:1px solid #d7e6e9;color:#386477;font-size:9pt}
      table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.2pt}col.num{width:9%}col.name{width:24%}col.gift{width:25%}col.status{width:16%}col.note{width:26%}
      th{text-align:left;color:#0061a4;font-size:8pt;background:#eef6f7;border-bottom:1.2pt solid #6aa5bb;padding:2.6mm 2mm}td{border-bottom:.5pt solid #d5e3e6;padding:1.2mm 2mm;vertical-align:top;overflow-wrap:anywhere;word-break:break-word}td.number{color:#50a62c;font-weight:bold}tr{break-inside:avoid;page-break-inside:avoid}thead{display:table-header-group}
      .wave{position:fixed;left:-16mm;bottom:-22mm;width:calc(100% + 32mm);height:17mm;z-index:-1}.wave svg{display:block;width:100%;height:100%}
      @media print{.print-bar{display:none}.sheet{padding:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      @media screen{body{background:#eaf0f2}.sheet{background:white;padding:14mm 16mm 25mm;max-width:210mm;min-height:297mm;margin:14px auto;box-shadow:0 4px 20px #17425322}.wave{display:none}}
    </style></head><body><div class="print-bar"><button onclick="window.print()">Als PDF speichern / Drucken</button></div><main class="sheet"><header class="masthead"><p>Adventskalender<br>Auslosung</p><img class="logo" src="${logo}" alt="Stadtwerke Neustadt an der Weinstraße"></header><h1>Auswertung</h1><p class="subtitle">Adventskalender · Erstellt am ${escapeHtml(created)}</p><div class="summary"><span><strong>${drawn}</strong> von 24 Türchen gezogen</span><span><strong>${completed}</strong> abgeschlossen</span></div><table><colgroup><col class="num"><col class="name"><col class="gift"><col class="status"><col class="note"></colgroup><thead><tr><th>Türchen</th><th>Person / Verlauf</th><th>Geschenk</th><th>Status</th><th>Notiz</th></tr></thead><tbody>${rows}</tbody></table></main><div class="wave" aria-hidden="true"><svg viewBox="0 0 1000 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 30 Q260 100 520 57 T1000 0 V80 H0Z" fill="#91c879"/><path d="M0 62 Q230 120 500 75 T1000 4 V80 H0Z" fill="#48ae21"/></svg></div></body></html>`);
    popup.document.close();
  },true);
})();
