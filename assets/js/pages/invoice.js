/* ============================ SALES INVOICE ============================
   Same 3-column form geometry as the reference ERP data-entry screen:
   right column = key identifiers, middle = labels+inputs, left = list panel.
   ====================================================================== */
let INV = null;

function invBlank(){
  return {no:DB.nextInvNo(),date:today(),time:nowTime(),cname:'',phone:'',addr:'',cid:null,
    seller:(ME?ME.name:DB.data().users[0].name), pay:'cash', items:[], sub:0, disc:0, total:0,
    paid:0, remain:0};
}
function PageInvoice(root,tab){
  if(!INV) INV=invBlank();
  const db=DB.data();
  const users=db.users.filter(u=>u.active).map(u=>({v:u.name,t:L(u.name)}));
  const pays=DB.PAYS.map(p=>({v:p,t:t(p)}));

  root.innerHTML =
  panel(svg('invoice')+t('invoice')+' — '+esc(L(db.settings.name)),
    '<div class="cols">'+
      /* ---- right column: identity block (like رقم الملف / الاسم) ---- */
      '<div class="col narrow">'+
        field(t('inv_no'), inp('iNo','readonly class="ro-strong"'))+
        field(t('inv_date'), inp('iDate','type="date"'))+
        field(t('time'), inp('iTime','readonly class="ro-strong"'))+
        field(t('seller'), isManager()? sel('iSeller',users,INV.seller)
          : '<input id="iSeller" readonly value="'+esc(L(INV.seller))+'" data-raw="'+esc(INV.seller)+'">')+
        field(t('paytype'), sel('iPay',pays,INV.pay))+
      '</div>'+
      /* ---- middle column: customer ---- */
      '<div class="col">'+
        field(t('cust_name'), inp('iCust','autocomplete="off" placeholder="'+(LANG==='ar'?'اكتب للبحث أو أدخل عميل جديد':'Type to search or add new')+'"'),{req:1})+
        field(t('phone'), inp('iPhone','autocomplete="off"'))+
        field(t('address'), inp('iAddr','autocomplete="off" placeholder="'+(LANG==='ar'?'عنوان العميل (اختياري)':'Customer address (optional)')+'"'))+
      '</div>'+
      /* ---- left column: quick item picker (mirrors the list panel) ---- */
      '<div class="col">'+
        '<div class="scan-row" style="margin-bottom:6px">'+
          svg('search')+inp('iScan','placeholder="'+(LANG==='ar'?'كود الصنف ثم Enter':'Item code then Enter')+'"')+
          '<button class="btn sm ghost" id="bPick">'+(LANG==='ar'?'قائمة الأصناف':'Browse')+'</button>'+
        '</div>'+
        '<div class="mini-note">'+(LANG==='ar'
           ?'اختر الصنف ليضاف لجدول الفاتورة، وتخصم الكمية من المخزون بعد الحفظ.'
           :'Pick an item to add it to the invoice; stock is deducted on save.')+'</div>'+
        '<div id="quickBox"></div>'+
      '</div>'+
    '</div>')
  + panel(svg('inventory')+t('items'),
      '<div id="itemsGrid"></div>'+
      '<div style="margin-top:6px">'+btn('bAddRow',t('addrow'),'plus','sm')+'</div>'+
      /* totals stacked as a small table instead of a row of boxes */
      '<div class="sumwrap"><table class="sumtab">'+
        '<tr class="grand"><td>'+t('grand')+'</td><td>'+inp('tTotal','readonly')+'</td></tr>'+
        '<tr><td>'+t('inv_disc')+'</td><td>'+inp('tDisc','type="number" min="0" step="0.01" value="0"')+'</td></tr>'+
        '<tr><td>'+t('paid')+'</td><td>'+inp('tPaid','type="number" min="0" step="0.01"')+'</td></tr>'+
        '<tr class="sub"><td>'+t('change')+'</td><td>'+inp('tChange','readonly')+'</td></tr>'+
      '</table></div>',null,
      btn('bNew',t('new_inv'),'plus','ghost')+
      btn('bSave',t('save'),'save','green')+
      btn('bPrint',t('print'),'print','ghost')+
      btn('bFind',t('find_cust'),'search','ghost')+
      '<span class="spacer"></span>'+
      btn('bCancel',t('cancel'),'x','red'));

  el('iNo').value=INV.no; el('iDate').value=INV.date;
  INV.time=INV.time||nowTime(); el('iTime').value=ftime(INV.time);
  clearInterval(window._invClock);
  window._invClock=setInterval(()=>{                 // keep ticking until saved
    const f=el('iTime'); if(!f){clearInterval(window._invClock);return;}
    if(!INV.items.length && !el('iCust').value.trim()){ INV.time=nowTime(); f.value=ftime(INV.time); }
  },20000);
  el('iCust').value=INV.cname; el('iPhone').value=INV.phone; el('iAddr').value=INV.addr||'';
  el('tPaid').value=INV.paid||'';
  el('tDisc').value=INV.disc||0;

  drawItems(); recalc(); drawQuick('');

  /* customer autocomplete — dark dropdown identical to the original */
  attachAC('iCust',q=>{
    q=(q||'').trim();
    return db.customers.filter(c=>!q||c.name.includes(q)||(c.phone||'').includes(q)).slice(0,8)
      .map(c=>({label:c.name,sub:c.phone||'',item:c}));
  },c=>{ INV.cid=c.id; el('iCust').value=c.name; el('iPhone').value=c.phone||'';
         el('iAddr').value=c.addr||''; INV.addr=c.addr||''; const st=DB.custStats(c.id);
         toast((LANG==='ar'?'عميل مسجل — عدد الفواتير ':'Existing customer — invoices ')+st.count+' | '+money2(st.total)); });

  el('iScan').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); scanAdd(el('iScan').value); el('iScan').value=''; } };
  el('bPick').onclick=()=>pickItemModal();
  el('bAddRow').onclick=()=>pickItemModal();
  el('bNew').onclick=()=>{ INV=invBlank(); render(); toast(t('new_inv')); };
  el('bSave').onclick=saveInv;
  el('bPrint').onclick=()=>{ syncHead(); if(!INV.items.length){toast(t('m_noitems'),'err');return;} printInvoice(INV); };
  el('bFind').onclick=()=>findCustModal();
  el('bCancel').onclick=()=>confirmBox(LANG==='ar'?'إلغاء الفاتورة الحالية ومسح بياناتها؟':'Cancel current invoice and clear all data?',
      ()=>{INV=invBlank();render();toast(t('cancel'));});
  ['tDisc','tPaid'].forEach(id=>el(id).oninput=recalc);
  ['iDate','iSeller','iPay','iCust','iPhone','iAddr'].forEach(id=>el(id).onchange=syncHead);
}

function syncHead(){
  INV.date=el('iDate').value; INV.seller=el('iSeller').dataset.raw || el('iSeller').value; INV.pay=el('iPay').value;
  INV.cname=el('iCust').value.trim(); INV.phone=el('iPhone').value.trim();
  INV.addr=el('iAddr').value.trim();
}
function drawQuick(q){
  /* one row per suit; the sizes live behind the picker so the seller
     always chooses from the full, ordered size list */
  const gs=suitGroups(q||'').filter(g=>g.items.some(p=>p.qty>0)).slice(0,6);
  window._quickGroups=gs;
  el('quickBox').innerHTML=grid(
    [{t:t('suit')},{t:(LANG==='ar'?'مقاسات':'Sizes'),cls:'num',w:'70px'},{t:'',cls:'num',w:'44px'}],
    gs.map((g,i)=>({cells:[esc(L(g.name)),
      g.items.filter(p=>p.qty>0).length,
      '<button class="btn sm icon" onclick="quickOpen('+i+')" title="'+
        (LANG==='ar'?'اختر المقاس':'choose size')+'">'+svg('plus')+'</button>']})),
    {short:true, empty:LANG==='ar'?'لا توجد أصناف متاحة':'Nothing in stock'});
}
function quickOpen(i){
  const g=(window._quickGroups||[])[i]; if(!g) return;
  pickItemModal(g.key);
}
function scanAdd(code){
  code=(code||'').trim(); if(!code) return;
  const p=DB.data().products.find(x=>x.code.toLowerCase()===code.toLowerCase());
  if(!p){ toast(LANG==='ar'?'كود غير موجود':'Code not found','err'); return; }
  addItem(p.id);
}
function addItem(pid){
  const p=DB.data().products.find(x=>x.id===pid); if(!p) return;
  if(p.qty<=0){ toast(t('out'),'err'); return; }
  const ex=INV.items.find(i=>i.pid===pid);
  if(ex){ if(ex.qty+1>p.qty){toast(t('m_stock'),'err');return;} ex.qty++; }
  else INV.items.push({pid:p.id,code:p.code,name:p.name,color:p.color,size:p.size,
                       qty:1,price:p.sell,disc:0,total:p.sell});
  lineCalc(); drawItems(); recalc();
}
function delItem(i){ INV.items.splice(i,1); drawItems(); recalc(); }
function lineCalc(){ INV.items.forEach(i=>{ i.total=Math.max(0,(Number(i.qty)||0)*(Number(i.price)||0)-(Number(i.disc)||0)); }); }

function drawItems(){
  const cols=[{t:t('seq'),cls:'num',w:'34px'},{t:t('suit')},
    {t:t('size'),cls:'num',w:'78px'},{t:t('qty'),cls:'num',w:'64px'},
    {t:t('price'),cls:'num',w:'82px'},{t:t('disc'),cls:'num',w:'74px'},
    {t:t('line_total'),cls:'money',w:'92px'},{t:'',cls:'acts',w:'36px'}];
  const rows=INV.items.map((it,n)=>({cells:[
    n+1, esc(L(it.name)), esc(it.size),
    '<input type="number" min="1" value="'+it.qty+'" style="width:56px" onchange="setQty('+n+',this.value)">',
    '<input type="number" min="0" step="0.01" value="'+it.price+'" style="width:76px" onchange="setPrice('+n+',this.value)">',
    '<input type="number" min="0" step="0.01" value="'+it.disc+'" style="width:66px" onchange="setDisc('+n+',this.value)">',
    money(it.total),
    '<button class="btn sm red icon" onclick="delItem('+n+')">'+svg('trash')+'</button>']}));
  el('itemsGrid').innerHTML=grid(cols,rows,{empty:LANG==='ar'?'لا توجد أصناف — اضغط «إضافة صنف»':'No items — press "Add Item"'});
}
function setQty(n,v){ const it=INV.items[n]; const p=DB.data().products.find(x=>x.id===it.pid);
  v=Math.max(1,Number(v)||1); if(p&&v>p.qty){ toast(t('m_stock')+' ('+p.qty+')','err'); v=p.qty; }
  it.qty=v; lineCalc(); drawItems(); recalc(); }
function setPrice(n,v){ INV.items[n].price=Math.max(0,Number(v)||0); lineCalc(); drawItems(); recalc(); }
function setDisc(n,v){ INV.items[n].disc=Math.max(0,Number(v)||0); lineCalc(); drawItems(); recalc(); }

function recalc(){
  lineCalc();
  INV.sub=INV.items.reduce((a,b)=>a+b.total,0);
  INV.disc=Math.max(0,Number(el('tDisc').value)||0);
  INV.total=Math.max(0,INV.sub-INV.disc);
  const paidRaw=el('tPaid').value;
  INV.paid=paidRaw===''?INV.total:Math.max(0,Number(paidRaw)||0);
  INV.remain=0;                                   // no credit sales
  INV.change=Math.max(0,INV.paid-INV.total);      // cash back to the customer
  const sb=el('tSub'); if(sb) sb.value=money(INV.sub);
  el('tTotal').value=money(INV.total)+' '+cur();
  el('tChange').value=money(INV.change);
}
function saveInv(){
  syncHead(); recalc();
  if(!INV.cname){ toast(t('m_nocust'),'err'); el('iCust').focus(); return; }
  if(!INV.items.length){ toast(t('m_noitems'),'err'); return; }
  for(const it of INV.items){ const p=DB.data().products.find(x=>x.id===it.pid);
    if(p && it.qty>p.qty){ toast(t('m_stock')+' — '+p.name,'err'); return; } }
  const saved=DB.saveInvoice(JSON.parse(JSON.stringify(INV)));
  toast(t('m_inv_saved')+' — '+saved.no,'ok');
  if(saved.newCustomer) setTimeout(()=>toast(t('m_newcust')+': '+saved.cname,'ok'),2600);
  const done=saved;
  INV=invBlank(); render();
  modal(t('m_saved'),
    '<div style="padding:6px 4px;font-size:13px;line-height:2">'+
    '<b>'+esc(done.no)+'</b> — '+esc(done.cname)+'<br>'+
    t('grand')+': <b>'+money2(done.total)+'</b><br>'+
    t('paid')+': '+money2(done.paid)+
      (done.change>0?' &nbsp;|&nbsp; '+t('change')+': <b>'+money2(done.change)+'</b>':'')+'<br>'+
    (done.newCustomer?'<span class="tag ok">'+t('m_newcust')+'</span><br>':'')+
    '<span class="hint">'+(LANG==='ar'?'تم خصم الكميات من المخزون وتحديث سجل العميل وسجل المبيعات.'
      :'Stock deducted, customer record and sales history updated.')+'</span></div>',
    '<button class="btn" onclick="printInvoice(LAST_INV);">'+svg('print')+'<span>'+t('print')+'</span></button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>');
  window.LAST_INV=done;
}
/* ============================================================
   ITEM PICKER — pick the suit first, then the size.

   Every size in the catalogue is listed, always in the same order.
   A size that is not in stock is still shown but greyed out and
   cannot be clicked, so the seller sees at a glance what is missing
   instead of hunting for a row that isn't there.
   ============================================================ */
let PKOPEN = null;                       // key of the expanded suit

/* one entry per suit name + colour, holding all of its sizes */
function suitGroups(q){
  const g={};
  DB.data().products.forEach(p=>{
    if(q && !(p.name.includes(q) || String(p.code).toLowerCase().includes(q.toLowerCase()))) return;
    const k=p.name;                       // one card per suit name
    if(!g[k]) g[k]={key:k,name:p.name,color:p.color,items:[]};
    g[k].items.push(p);
  });
  return Object.values(g);
}
/* the full size list, in catalogue order, availability marked */
function sizeChipsHTML(grp){
  const order=DB.data().sizes;
  const own=grp.items.map(p=>String(p.size));
  /* keep the catalogue order, then append any size this suit uses
     that isn't in the standard list (so nothing is ever hidden) */
  const sizes=order.concat(own.filter(x=>order.indexOf(x)<0));
  return '<div class="szwrap">'+sizes.map(sz=>{
    const it=grp.items.find(p=>String(p.size)===String(sz));
    const ok=it && it.qty>0;
    const tip=ok ? (t('stock')+': '+it.qty) : t('out');
    return '<button class="szchip'+(ok?'':' off')+'" title="'+esc(tip)+'"'+
      (ok ? ' onclick="pickSize('+it.id+')"' : ' disabled')+'>'+
      '<b>'+esc(sz)+'</b><i>'+(ok?it.qty:'—')+'</i></button>';
  }).join('')+'</div>';
}
function togglePick(i){
  const g=(window._pkGroups||[])[i]; if(!g) return;
  PKOPEN = (PKOPEN===g.key) ? null : g.key;
  if(window._pkDraw) window._pkDraw();
}
function pickSize(pid){
  const p=DB.data().products.find(x=>x.id===pid); if(!p) return;
  addItem(pid);
  toast(L(p.name)+' • '+t('size')+' '+p.size,'ok');
  if(window._pkDraw) window._pkDraw();      // refresh the remaining quantities
}
function pickItemModal(openKey){
  PKOPEN = openKey || null;
  modal(LANG==='ar'?'اختيار بدلة من المخزون':'Select a suit from stock',
    '<div style="padding-bottom:9px">'+
      inp('pkQ','placeholder="'+(LANG==='ar'?'ابحث باسم البدلة أو الكود':'search by suit name or code')+'" style="width:100%"')+
    '</div>'+
    '<div class="mini-note" style="padding-bottom:7px">'+(LANG==='ar'
      ? 'اضغط على البدلة ثم اختر المقاس. المقاس غير المتوفر بيظهر باهت ومش هيتحدد.'
      : 'Tap a suit, then pick a size. Sizes that are out of stock appear dimmed and cannot be selected.')+
    '</div>'+
    '<div id="pkBox"></div>',
    '<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>',780);

  const draw=()=>{
    const q=(el('pkQ')?el('pkQ').value:'').trim();
    const gs=suitGroups(q);
    window._pkGroups=gs;
    if(!gs.length){
      el('pkBox').innerHTML='<div class="empty">'+svg('box')+t('none')+'</div>'; return;
    }
    el('pkBox').innerHTML=gs.map((g,i)=>{
      const open = PKOPEN===g.key;
      const tot  = g.items.reduce((a,p)=>a+p.qty,0);
      const nsz  = g.items.filter(p=>p.qty>0).length;
      return '<div class="suitcard'+(open?' open':'')+'">'+
        '<div class="sc-head" onclick="togglePick('+i+')">'+
          '<span class="sc-arrow">'+svg('chev')+'</span>'+
          '<span class="sc-nm">'+esc(L(g.name))+'</span>'+
          '<span class="sc-qty">'+(tot>0
              ? nsz+' '+(LANG==='ar'?'مقاس متاح':'sizes')
              : '<span class="tag bad">'+t('out')+'</span>')+'</span>'+
        '</div>'+
        (open ? '<div class="sc-body">'+sizeChipsHTML(g)+'</div>' : '')+
      '</div>';
    }).join('');
  };
  window._pkDraw=draw;
  el('pkQ').oninput=()=>{ PKOPEN=null; draw(); };
  draw();
  setTimeout(()=>{ const f=el('pkQ'); if(f) f.focus(); },120);
}

/* ---------------------- customer search modal ---------------------- */
function findCustModal(){
  const db=DB.data();
  modal(t('find_cust'),
    '<div style="padding-bottom:6px">'+inp('fcQ','placeholder="'+(LANG==='ar'?'الاسم أو رقم الهاتف':'Name or phone')+'"')+'</div>'+
    '<div id="fcBox"></div>',
    '<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>',700);
  const draw=()=>{
    const q=(el('fcQ').value||'').trim();
    const list=db.customers.filter(c=>!q||c.name.includes(q)||(c.phone||'').includes(q));
    el('fcBox').innerHTML=grid(
      [{t:t('cust_name')},{t:t('phone'),w:'110px'},{t:t('address')},{t:t('invcount'),cls:'num',w:'60px'},
       {t:t('totalbuy'),cls:'money',w:'104px'},{t:'',cls:'acts',w:'52px'}],
      list.map(c=>{const s=DB.custStats(c.id);
        return {cells:[esc(c.name),esc(c.phone),esc(c.addr),s.count,money(s.total),
          '<button class="btn sm icon" onclick="useCust('+c.id+')">'+svg('check')+'</button>']};}));
  };
  el('fcQ').oninput=draw; draw(); el('fcQ').focus();
}
function useCust(id){
  const c=DB.data().customers.find(x=>x.id===id); if(!c)return;
  INV.cid=c.id; INV.cname=c.name; INV.phone=c.phone||'';
  el('iCust').value=c.name; el('iPhone').value=c.phone||''; el('iAddr').value=c.addr||'';
  closeModal(); toast(c.name);
}
