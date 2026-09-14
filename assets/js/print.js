/* ============================ PRINTING (offline) ============================ */
function printInvoiceById(id){ const s=DB.data().sales.find(x=>x.id===id); if(s) printInvoice(s); }

function printLogo(s){ return s.logo || LOGO_PRINT_URI; }

/* ============================================================
   THERMAL RECEIPT  —  designed for an 80mm roll printer
   Layout: logo on top -> invoice items -> total to pay. Nothing else.
   ============================================================ */
function printInvoice(inv){
  const s=DB.data().settings;

  /* Items only — no unit price, no line totals. Just what the customer bought. */
  const rows=inv.items.map(i=>
    '<tr>'+
      '<td class="nm">'+esc(L(i.name))+
        '<span class="meta">'+(i.size?(t('size')+' '+i.size):'')+'</span>'+
      '</td>'+
      '<td class="q">'+i.qty+'</td>'+
    '</tr>').join('');

  const pieces=inv.items.reduce((a,i)=>a+i.qty,0);
  /* "الإجمالي" on the receipt = the amount the customer actually paid. */
  const amount = (inv.paid && inv.paid>0) ? Math.min(inv.paid, inv.total) : inv.total;

  /* Keep everything on ONE page: the more lines, the tighter the layout. */
  const n=inv.items.length;
  const dens = n<=10 ? '' : (n<=16 ? ' d2' : (n<=24 ? ' d3' : ' d4'));

  const body=
  '<div class="rcpt'+dens+'">'+
    (s.showLogo?'<img class="logo" src="'+esc(printLogo(s))+'">':'')+
    '<div class="shop">'+esc(L(s.name))+'</div>'+
    (s.phone?'<div class="sub">'+esc(s.phone)+'</div>':'')+

    '<div class="rule"></div>'+
    '<div class="meta-row"><span>'+esc(t('inv_no'))+'</span><span>'+esc(inv.no)+'</span></div>'+
    '<div class="meta-row"><span>'+esc(t('inv_date'))+'</span>'+
      '<span>'+fdate(inv.date)+' &nbsp;·&nbsp; '+ftime(inv.time||nowTime())+'</span></div>'+
    '<div class="rule"></div>'+

    '<table class="items">'+
      '<thead><tr>'+
        '<th class="nm">'+t('suit')+'</th>'+
        '<th class="q">'+(LANG==='ar'?'الكمية':'Qty')+'</th>'+
      '</tr></thead>'+
      '<tbody>'+rows+'</tbody>'+
    '</table>'+

    '<div class="rule"></div>'+
    '<div class="grand"><span>'+t('rcpt_total')+'</span><span>'+money(amount)+' '+cur()+'</span></div>'+
    '<div class="line small"><span>'+t('pieces')+'</span><span>'+pieces+'</span></div>'+

    '<div class="rule"></div>'+
    '<div class="thanks">'+esc(s.footer||'').replace(/\n/g,'<br>')+'</div>'+
    '<div class="cut">■ ■ ■</div>'+
  '</div>';

  let out=''; for(let i=0;i<(s.copies||1);i++) out+=body;
  doPrint(out, s.paper||'80mm');
}

function printReport(title,rep){
  if(!rep){ toast(t('none'),'err'); return; }
  const s=DB.data().settings;
  /* Reports use the very same slip layout as a sales invoice, so the shop can
     print them on the same 80mm roll without changing any printer setting.  */
  const head=
    (s.showLogo?'<img class="logo" src="'+esc(printLogo(s))+'">':'')+
    '<div class="shop">'+esc(L(s.name))+'</div>'+
    (s.phone?'<div class="sub">'+esc(s.phone)+'</div>':'')+
    '<div class="rule"></div>'+
    '<div class="meta-row"><span>'+esc(title)+'</span><span></span></div>'+
    '<div class="meta-row"><span>'+esc(t('inv_date'))+'</span>'+
      '<span>'+fdate(today())+' &nbsp;·&nbsp; '+ftime(nowTime())+'</span></div>'+
    '<div class="rule"></div>';

  /* keep at most 4 columns so it stays readable on a 72mm slip */
  const keep = rep.cols.length<=4
    ? rep.cols.map((c,i)=>i)
    : [0, rep.cols.length-3, rep.cols.length-2, rep.cols.length-1];
  const cell = v => esc(String(v==null?'':v).replace(/<[^>]+>/g,'').trim());

  const th='<tr>'+keep.map((i,n)=>'<th class="'+(n===0?'nm':'q')+'">'+esc(rep.cols[i])+'</th>').join('')+'</tr>';
  const tb=rep.rows.map(r=>'<tr>'+keep.map((i,n)=>
      '<td class="'+(n===0?'nm':'q')+'">'+cell(r[i])+'</td>').join('')+'</tr>').join('');
  const tf=rep.foot
    ? '<tr class="tot-row">'+keep.map((i,n)=>
        '<td class="'+(n===0?'nm':'q')+'">'+cell(rep.foot[i])+'</td>').join('')+'</tr>'
    : '';

  const body=
  '<div class="rcpt rpt">'+head+
    '<table class="items">'+
      '<thead>'+th+'</thead>'+
      '<tbody>'+tb+tf+'</tbody>'+
    '</table>'+
    '<div class="rule"></div>'+
    '<div class="line small"><span>'+(LANG==='ar'?'عدد السطور':'Rows')+'</span><span>'+rep.rows.length+'</span></div>'+
    '<div class="rule"></div>'+
    '<div class="thanks">'+esc(L(s.name))+'</div>'+
    '<div class="cut">■ ■ ■</div>'+
  '</div>';

  doPrint(body, s.paper||'80mm');
}

/* One day's sales, printed on the same slip layout as an invoice. */
function printDayReport(date){
  const list=DB.data().sales.filter(x=>x.date===date)
    .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  if(!list.length){ toast(LANG==='ar'?'لا توجد فواتير في هذا اليوم':'No invoices on this day','err'); return; }
  const pcs=list.reduce((a,x)=>a+x.items.reduce((y,i)=>y+i.qty,0),0);
  const tot=list.reduce((a,x)=>a+x.total,0);
  printReport((LANG==='ar'?'تقرير مبيعات يوم ':'Sales report ')+fdate(date), {
    cols:[t('time'),t('inv_no'),(LANG==='ar'?'قطع':'Pcs'),t('grand')],
    rows:list.map(x=>[ftime(x.time),x.no,x.items.reduce((a,i)=>a+i.qty,0),money(x.total)]),
    foot:[t('total'),list.length+' '+(LANG==='ar'?'فاتورة':'inv'),pcs,money(tot)]
  });
}

let LAST_PAPER='80mm';
function doPrint(html,paper){
  LAST_PAPER=paper;
  const dir=LANG==='ar'?'rtl':'ltr';
  const size = paper==='80mm' ? '80mm auto' : (paper==='A5'?'A5':'A4');
  const doc='<!DOCTYPE html><html dir="'+dir+'" lang="'+LANG+'"><head><meta charset="utf-8">'+
    '<title>'+esc(L(DB.data().settings.name))+'</title>'+
    '<style>'+PRINT_CSS.replace('@PAGE_SIZE@',size)+'</style></head><body>'+html+'</body></html>';

  /* Primary path: a hidden iframe. Works from file:// with no popup blocker,
     and hands the job straight to the machine's default printer dialog.   */
  try{
    const old=document.getElementById('esPrintFrame'); if(old) old.remove();
    const f=document.createElement('iframe');
    f.id='esPrintFrame';
    f.setAttribute('aria-hidden','true');
    f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    const d=f.contentWindow.document;
    d.open(); d.write(doc); d.close();
    const fire=()=>{ try{ fitOnePage(d,paper); f.contentWindow.focus(); f.contentWindow.print(); }
                     catch(e){ popupPrint(doc); }
                     setTimeout(()=>{ try{f.remove();}catch(e){} },60000); };
    if(d.readyState==='complete') setTimeout(fire,300);
    else f.onload=()=>setTimeout(fire,300);
    return;
  }catch(e){ /* fall through */ }
  popupPrint(doc);
}
/* ============================================================
   ONE PAGE, GUARANTEED.

   `@page{size:80mm auto}` lets the printer driver decide the page length,
   so a receipt that is a few mm too long spills onto a second slip.
   Instead we measure the rendered content and rewrite @page with an EXACT
   height, so the sheet is always exactly as tall as the receipt.
   For A4/A5 the sheet is fixed, so we scale the content down instead.
   ============================================================ */
function fitOnePage(doc,paper){
  try{
    const PX = 96/25.4;
    const rcpts = [...doc.querySelectorAll('.rcpt')];
    if(!rcpts.length) return;

    /* reset any previous run */
    rcpts.forEach(r=>{ r.style.transform=''; r.style.transformOrigin=''; r.style.height=''; });

    if(paper==='80mm'){
      /* roll: make the page exactly as long as the tallest receipt */
      let tallest=0;
      rcpts.forEach(r=>{ tallest=Math.max(tallest, r.getBoundingClientRect().height); });
      const mm = Math.ceil(tallest/PX) + 6;               // small safety pad
      setPageRule(doc, '80mm '+mm+'mm');
      doc.body.style.margin='0';
      doc.documentElement.style.height='auto';
      return;
    }

    /* fixed sheet: shrink only if the content is genuinely taller */
    const sheet = paper==='A5' ? 210 : 297;
    const limit = (sheet - 10) * PX;
    rcpts.forEach(r=>{
      const h=r.getBoundingClientRect().height;
      if(h>limit){
        const k=Math.max(0.55, limit/h);
        r.style.transformOrigin='top center';
        r.style.transform='scale('+k.toFixed(3)+')';
        r.style.height=(h*k)+'px';
      }
    });
  }catch(e){}
}
/* replace the @page rule in the print document */
function setPageRule(doc,size){
  try{
    let st=doc.getElementById('esPageRule');
    if(!st){ st=doc.createElement('style'); st.id='esPageRule'; doc.head.appendChild(st); }
    st.textContent='@page{size:'+size+';margin:0}';
  }catch(e){}
}
function popupPrint(doc){
  const w=window.open('','_blank','width=420,height=680');
  if(!w){ toast(LANG==='ar'?'اسمح بالنوافذ المنبثقة للطباعة':'Allow pop-ups to print','err'); return; }
  w.document.open(); w.document.write(doc); w.document.close();
  w.focus(); setTimeout(()=>{ try{ fitOnePage(w.document, LAST_PAPER); w.print(); }catch(e){} },400);
}
const PRINT_CSS=`
@page{size:@PAGE_SIZE@;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#fff}
body{font:12px/1.45 Tahoma,"Segoe UI",Arial,sans-serif;color:#000}

.rcpt{width:72mm;margin:0 auto;padding:3mm 2mm 4mm;text-align:center;font-size:11.5px;
  page-break-inside:avoid;break-inside:avoid;overflow:hidden}
/* only put a break BETWEEN copies, never after the last one */
.rcpt + .rcpt{page-break-before:always;break-before:page}
html,body{margin:0;padding:0}
/* the trailing block must never be orphaned onto a second sheet */
.thanks,.cut,.grand,.line{page-break-inside:avoid;break-inside:avoid}
.rcpt > *:last-child{margin-bottom:0}
/* Density tiers — only kick in for long invoices, and stay readable.
   1-10 items  : full size (no class)
   11-16 items : d2, a gentle trim
   17-24 items : d3
   25+   items : d4                                                      */
.rcpt.d2{font-size:11.5px}
.rcpt.d2 .logo{width:40mm;max-height:21mm}
.rcpt.d2 .shop{font-size:13.5px}
.rcpt.d2 table.items td{padding:1mm .6mm}
.rcpt.d2 .rule{margin:1.7mm 0}

.rcpt.d3{font-size:10.5px}
.rcpt.d3 .logo{width:34mm;max-height:17mm;margin-bottom:1mm}
.rcpt.d3 .shop{font-size:12.5px}
.rcpt.d3 .sub{font-size:9.5px}
.rcpt.d3 .meta-row{font-size:10px;line-height:1.6}
.rcpt.d3 table.items td{padding:.8mm .5mm}
.rcpt.d3 td.nm .meta{font-size:8.5px;line-height:1.3}
.rcpt.d3 .rule{margin:1.4mm 0}
.rcpt.d3 .grand{font-size:13px;padding:1.5mm 2.2mm}

.rcpt.d4{font-size:9.5px}
.rcpt.d4 .logo{width:28mm;max-height:14mm;margin-bottom:.7mm}
.rcpt.d4 .shop{font-size:11.5px}
.rcpt.d4 .sub{font-size:8.5px;line-height:1.35}
.rcpt.d4 .meta-row{font-size:9px;line-height:1.45}
.rcpt.d4 table.items th{font-size:8.5px;padding:.7mm .4mm}
.rcpt.d4 table.items td{padding:.6mm .4mm}
.rcpt.d4 td.nm .meta{font-size:8px;line-height:1.2}
.rcpt.d4 .rule{margin:1.1mm 0}
.rcpt.d4 .grand{font-size:12px;padding:1.2mm 1.9mm;margin:1.1mm 0}
.rcpt.d4 .thanks{font-size:8.5px;line-height:1.45}
.rcpt.d4 .cut{margin-top:1.6mm}

.logo{width:36mm;max-height:19mm}
.rcpt.d2 .shop{font-size:13px}
.rcpt.d2 table.items td{padding:.85mm .6mm}
.rcpt.d2 .rule{margin:1.5mm 0}

.rcpt.d3{font-size:10px;padding-top:2mm}
.rcpt.d3 .logo{width:30mm;max-height:15mm;margin-bottom:.8mm}
.rcpt.d3 .shop{font-size:12px}
.rcpt.d3 .sub{font-size:9px}
.rcpt.d3 .meta-row{font-size:9.5px;line-height:1.5}
.rcpt.d3 table.items td{padding:.65mm .5mm}
.rcpt.d3 td.nm .meta{font-size:8px;line-height:1.2}
.rcpt.d3 .rule{margin:1.2mm 0}
.rcpt.d3 .grand{font-size:12.5px;padding:1.3mm 2mm;margin:1.2mm 0}
.rcpt.d3 .thanks{font-size:8.5px}

.rcpt.d4{font-size:9px;padding-top:1.5mm}
.rcpt.d4 .logo{width:24mm;max-height:12mm;margin-bottom:.6mm}
.rcpt.d4 .shop{font-size:11px}
.rcpt.d4 .sub{font-size:8px;line-height:1.3}
.rcpt.d4 .meta-row{font-size:8.5px;line-height:1.4}
.rcpt.d4 table.items th{font-size:8px;padding:.6mm .4mm}
.rcpt.d4 table.items td{padding:.5mm .4mm}
.rcpt.d4 td.nm .meta{font-size:7.5px;line-height:1.15}
.rcpt.d4 .rule{margin:1mm 0}
.rcpt.d4 .grand{font-size:11.5px;padding:1.1mm 1.8mm;margin:1mm 0}
.rcpt.d4 .thanks{font-size:8px;line-height:1.4}
.rcpt.d4 .cut{margin-top:1.5mm}

.logo{width:36mm;max-height:19mm;object-fit:contain;display:block;margin:0 auto 1mm;
  filter:grayscale(1) contrast(2.1) brightness(.55)}
.shop{font-size:13px;font-weight:800;letter-spacing:.3px;line-height:1.2}
.sub{font-size:9.5px;color:#000;line-height:1.4}

.rule{border-top:1px dashed #000;margin:1.6mm 0}
.meta-row{display:flex;justify-content:space-between;gap:6px;font-size:10px;line-height:1.55;text-align:start}
.meta-row span:last-child{font-weight:700;text-align:end}

table.items{width:100%;border-collapse:collapse;font-size:10.5px;margin-top:.5mm}
table.items th{font-size:9px;font-weight:700;padding:1mm .6mm;border-bottom:1px solid #000;letter-spacing:0}
table.items td{padding:1mm .6mm;vertical-align:top;border-bottom:1px dotted #bbb}
table.items tr{page-break-inside:avoid;break-inside:avoid}
table.items{page-break-inside:avoid;break-inside:avoid}
table.items tr:last-child td{border-bottom:0}
th.nm,td.nm{text-align:start;width:80%;word-break:break-word}
th.q,td.q{text-align:center;width:20%;font-weight:700}
td.nm .meta{display:block;font-size:8px;color:#444;line-height:1.25}

.line{display:flex;justify-content:space-between;font-size:11px;line-height:1.85}
/* report slips: a touch denser, with a boxed total row */
.rcpt.rpt table.items td{font-size:10px}
.rcpt.rpt table.items th{font-size:9px}
.rcpt.rpt td.nm{width:52%}
.rcpt.rpt td.q{width:16%}
.rcpt.rpt tr.tot-row td{border-top:1.5px solid #000;border-bottom:0;
  font-weight:800;font-size:11px;padding-top:1.4mm}
.line.small{font-size:9.5px;color:#333}
.grand{display:flex;justify-content:space-between;align-items:center;gap:6px;
  margin:1.3mm 0;padding:1.5mm 2.2mm;border:1.5px solid #000;border-radius:1.5mm;
  font-size:13px;font-weight:800;letter-spacing:.3px}

.thanks{font-size:9px;line-height:1.5;margin-top:.8mm}
.cut{font-size:8px;letter-spacing:3px;margin-top:2mm;margin-bottom:0;color:#666}

/* ---- A4 / A5 fallback: same receipt, centred on the sheet ---- */
@media print{
  .rcpt{padding-top:5mm}
  html,body{height:auto}
}
`;
