/* ====================== INVENTORY  (manager only) ======================
   tab0 stock list · tab1 movements · tab2 low stock · tab3 manage items
   ====================================================================== */
function PageInventory(root,tab){
  const db=DB.data();
  if(tab===1) return invMovements(root);
  if(tab===3) return invManage(root);
  const only = tab===2 ? 'out' : '';

  root.innerHTML=
    '<div class="filterbar">'+
      '<div class="f"><label>'+t('search')+'</label>'+inp('fq','placeholder="'+(LANG==='ar'?'اسم الصنف أو الكود':'item name or code')+'" style="min-width:190px"')+'</div>'+
      '<div class="f"><label>'+t('status')+'</label>'+sel('fst',[{v:'',t:t('all')},{v:'avail',t:t('avail')},{v:'out',t:t('out')}],only)+'</div>'+
      '<span style="margin-inline-start:auto"></span>'+
      btn('bAddP',t('add'),'plus','sm')+btn('bExp',t('export'),'excel','ghost sm')+
    '</div>'+
    '<div id="invKpi"></div>'+
    panel(svg('inventory')+t('r_stock'),'<div id="invBox"></div>')+
    '<div id="invTot"></div>';

  const draw=()=>{
    const q=(el('fq').value||'').trim().toLowerCase(), st=el('fst').value;
    const list=db.products.filter(p=>
      (!q||p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q))&&
      (!st||DB.stockStatus(p)===st));
    el('invBox').innerHTML=grid(
      [{t:t('code'),w:'104px'},{t:t('suit')},
       {t:t('size'),cls:'num',w:'84px'},{t:t('sell_price'),cls:'money',w:'124px'},
       {t:t('stock'),cls:'num',w:'86px'},{t:t('status'),w:'106px'},{t:t('actions'),cls:'acts',w:'96px'}],
      list.map(p=>({cells:[esc(p.code),esc(L(p.name)),esc(p.size),
        money(p.sell),'<b>'+p.qty+'</b>',tagFor(DB.stockStatus(p)),
        '<button class="btn sm ghost icon" onclick="editProd('+p.id+')" title="'+t('edit')+'">'+svg('edit')+'</button>'+
        '<button class="btn sm icon" onclick="adjustQty('+p.id+')" title="'+t('add')+'">'+svg('plus')+'</button>']})));
    const sval=list.reduce((a,p)=>a+p.sell*p.qty,0);
    const pcs=list.reduce((a,p)=>a+p.qty,0);
    const lowN=list.filter(p=>DB.stockStatus(p)!=='avail').length;
    el('invKpi').innerHTML='<div class="kpis">'+
      kpi(LANG==='ar'?'عدد الأصناف':'Items',list.length,'','','box')+
      kpi(t('pieces'),pcs,'','','inventory')+
      kpi(t('value'),money(sval),LANG==='ar'?'بسعر البيع':'at selling price','','money')+
      kpi(t('r_low'),lowN,LANG==='ar'?'صنف نفد':'out of stock','','alert')+
      '</div>';
    el('invTot').innerHTML='';
    window._invList=list;
  };
  ['fq'].forEach(i=>el(i).oninput=draw);
  ['fst'].forEach(i=>el(i).onchange=draw);
  el('bAddP').onclick=()=>editProd(0);
  el('bExp').onclick=()=>exportCSV('eagle_inventory.csv',
    [t('code'),t('suit'),t('size'),t('sell_price'),t('stock')],
    (window._invList||[]).map(p=>[p.code,p.name,p.size,p.sell,p.qty]));
  draw();
}

/* ---------------------- manage items (full product CRUD) ---------------------- */
function invManage(root){
  const db=DB.data();
  root.innerHTML=
    '<div class="filterbar">'+
      '<div class="f"><label>'+t('search')+'</label>'+inp('pq','style="min-width:200px" placeholder="'+(LANG==='ar'?'اسم الصنف أو الكود':'item name or code')+'"')+'</div>'+
      '<span style="margin-inline-start:auto"></span>'+
      btn('pAdd',t('add'),'plus','sm')+btn('pExp',t('export'),'excel','ghost sm')+
    '</div>'+
    panel(svg('products')+(LANG==='ar'?'إدارة الأصناف':'Manage items'),'<div id="pBox"></div>');
  const draw=()=>{
    const q=(el('pq').value||'').trim().toLowerCase();
    const list=db.products.filter(p=>!q||p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q));
    el('pBox').innerHTML=grid(
      [{t:t('code'),w:'104px'},{t:t('suit')},
       {t:t('size'),cls:'num',w:'84px'},{t:t('sell_price'),cls:'money',w:'124px'},
       {t:t('stock'),cls:'num',w:'86px'},{t:t('actions'),cls:'acts',w:'96px'}],
      list.map(p=>({cells:[esc(p.code),esc(L(p.name)),esc(p.size),
        money(p.sell),p.qty,
        '<button class="btn sm ghost icon" onclick="editProd('+p.id+')">'+svg('edit')+'</button>'+
        '<button class="btn sm red icon" onclick="delProd('+p.id+')">'+svg('trash')+'</button>']})));
    window._pList=list;
  };
  el('pq').oninput=draw;
  el('pAdd').onclick=()=>editProd(0);
  el('pExp').onclick=()=>exportCSV('eagle_products.csv',
    [t('code'),t('suit'),t('size'),t('sell_price'),t('stock')],
    (window._pList||[]).map(p=>[p.code,p.name,p.size,p.sell,p.qty]));
  draw();
}
/* ============================================================
   ADD / EDIT A SUIT  —  all of its sizes in one screen.

   A "suit" is one name + one price. Each size it comes in is a
   separate stock row underneath. So the form edits the whole family
   at once: tick the sizes you carry, type the quantity for each.
   ============================================================ */
function editProd(id){
  const db=DB.data();
  const base = id ? db.products.find(x=>x.id===id) : null;

  /* every row that belongs to this suit (matched by name) */
  const family = base ? db.products.filter(x=>x.name===base.name) : [];
  const cur    = {};                       // size -> qty already in stock
  family.forEach(x=>cur[String(x.size)]=x.qty);

  const name0  = base ? base.name : '';
  const code0  = base ? base.code : '';
  const price0 = base ? base.sell : '';

  /* size buttons, in catalogue order (42…68, then M/L/XL, then واحد) */
  const grid = db.sizes.map(sz=>{
    const on  = Object.prototype.hasOwnProperty.call(cur,String(sz));
    const qty = on ? cur[String(sz)] : '';
    return '<div class="szcell'+(on?' on':'')+'" data-sz="'+esc(sz)+'">'+
             '<button type="button" class="szpick" onclick="szToggle(this)">'+esc(sz)+'</button>'+
             '<input class="szqty" type="number" min="0" step="1" value="'+esc(qty)+'" '+
               (on?'':'disabled')+' placeholder="0" oninput="szCount()">'+
           '</div>';
  }).join('');

  modal((id?t('edit'):t('add'))+' — '+t('products'),
    '<div class="cols">'+
      '<div class="col">'+
        field(t('suit'),inp('eName','value="'+esc(name0)+'" placeholder="'+
          (LANG==='ar'?'مثال: بدلة كلاسيك صوف':'e.g. Classic Wool Suit')+'"'),{req:1})+
        field(t('code'),inp('eCode','value="'+esc(code0)+'" placeholder="'+
          (LANG==='ar'?'تلقائي لو سيبته فاضي':'auto if left empty')+'"'))+
      '</div>'+
      '<div class="col">'+
        field(t('sell_price'),inp('eSell','type="number" step="0.01" value="'+esc(price0)+'"'),{req:1})+
        '<div class="hint">'+(LANG==='ar'
          ? 'السعر واحد لكل مقاسات البدلة دي.'
          : 'One price applies to every size of this suit.')+'</div>'+
      '</div>'+
    '</div>'+

    '<div class="szpanel">'+
      '<div class="szhead">'+
        '<b>'+(LANG==='ar'?'المقاسات والكميات':'Sizes & quantities')+'</b>'+
        '<span class="szinfo" id="szInfo"></span>'+
        '<span class="szacts">'+
          '<button type="button" class="btn sm ghost" onclick="szAll(1)">'+(LANG==='ar'?'تحديد الكل':'Select all')+'</button>'+
          '<button type="button" class="btn sm ghost" onclick="szAll(0)">'+(LANG==='ar'?'مسح الكل':'Clear')+'</button>'+
        '</span>'+
      '</div>'+
      '<div class="hint" style="padding:0 0 9px">'+(LANG==='ar'
        ? 'اضغط على المقاس عشان تختاره، وبعدين اكتب الكمية تحته. المقاس اللي مش متحدد مش هيتسجل.'
        : 'Tap a size to select it, then type its quantity below. Unselected sizes are not saved.')+'</div>'+
      '<div class="szgrid" id="szGrid">'+grid+'</div>'+
    '</div>',

    '<button class="btn" id="epSave">'+svg('save')+'<span>'+t('save')+'</span></button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('cancel')+'</button>', 760);

  szCount();
  setTimeout(()=>{ const f=el('eName'); if(f && !name0) f.focus(); },120);

  el('epSave').onclick=()=>{
    const name=el('eName').value.trim();
    if(!name){ toast(LANG==='ar'?'اكتب اسم البدلة':'Enter the suit name','err'); el('eName').focus(); return; }
    const price=+el('eSell').value||0;
    if(price<=0){ toast(LANG==='ar'?'اكتب سعر البيع':'Enter the selling price','err'); el('eSell').focus(); return; }

    const picked=szRead();
    if(!picked.length){ toast(LANG==='ar'?'اختر مقاس واحد على الأقل':'Pick at least one size','err'); return; }

    /* rows already stored for this suit — match the OLD name when renaming */
    const oldName = base ? base.name : name;
    const rows    = db.products.filter(x=>x.name===oldName);
    const code    = el('eCode').value.trim() || (rows[0] && rows[0].code) || nextSuitCode();

    let added=0, updated=0, removed=0;
    picked.forEach(it=>{
      const row=rows.find(x=>String(x.size)===String(it.size));
      if(row){ row.name=name; row.code=code; row.sell=price; row.qty=it.qty; updated++; }
      else{
        db.products.push({id:db.products.reduce((a,b)=>Math.max(a,b.id),0)+1,
          code:code, name:name, color:'-', size:it.size, sell:price, qty:it.qty});
        added++;
      }
    });
    /* a size that was unticked is no longer carried — drop its row */
    const keep=new Set(picked.map(x=>String(x.size)));
    rows.filter(x=>!keep.has(String(x.size))).forEach(x=>{
      db.products=db.products.filter(y=>y!==x); removed++;
    });

    DB.save(); closeModal(); render();
    const parts=[];
    if(added)   parts.push((LANG==='ar'?'أضيف ':'added ')+added);
    if(updated) parts.push((LANG==='ar'?'عُدّل ':'updated ')+updated);
    if(removed) parts.push((LANG==='ar'?'حُذف ':'removed ')+removed);
    toast(t('m_saved')+' — '+parts.join(' · '),'ok');
  };
}
/* next free code, following the FM-### / SW-### pattern already in use */
function nextSuitCode(){
  const n=DB.data().products
    .map(p=>/^FM-(\d+)$/.exec(p.code))
    .filter(Boolean).map(m=>+m[1]);
  return 'FM-'+String((n.length?Math.max.apply(null,n):0)+1).padStart(3,'0');
}
/* ---- size grid helpers ---- */
function szToggle(btn){
  const cell=btn.parentElement, q=cell.querySelector('.szqty');
  const on=!cell.classList.contains('on');
  cell.classList.toggle('on',on);
  q.disabled=!on;
  if(on){ if(!q.value||+q.value<=0) q.value=1; q.focus(); q.select(); }
  else q.value='';
  szCount();
}
function szAll(on){
  document.querySelectorAll('#szGrid .szcell').forEach(c=>{
    const q=c.querySelector('.szqty');
    c.classList.toggle('on',!!on);
    q.disabled=!on;
    if(on){ if(!q.value||+q.value<=0) q.value=1; } else q.value='';
  });
  szCount();
}
function szRead(){
  return [...document.querySelectorAll('#szGrid .szcell.on')].map(c=>({
    size:c.dataset.sz, qty:Math.max(0,parseInt(c.querySelector('.szqty').value,10)||0)
  }));
}
function szCount(){
  const n=el('szInfo'); if(!n) return;
  const p=szRead(), pcs=p.reduce((a,x)=>a+x.qty,0);
  n.textContent = p.length
    ? (LANG==='ar' ? p.length+' مقاس · '+pcs+' قطعة'
                   : p.length+' sizes · '+pcs+' pcs')
    : (LANG==='ar' ? 'لم تختر أي مقاس' : 'no size selected');
  n.classList.toggle('warn', !p.length);
}

function delProd(id){ confirmBox(t('m_conf_del'),()=>{ const db=DB.data();
  db.products=db.products.filter(x=>x.id!==id); DB.save(); render(); toast(t('m_deleted'),'ok'); }); }

function adjustQty(id){
  const p=DB.data().products.find(x=>x.id===id); if(!p)return;
  modal((LANG==='ar'?'تعديل كمية: ':'Adjust quantity: ')+L(p.name),
    field(t('stock')+' ('+(LANG==='ar'?'الحالية':'current')+')','<input readonly class="ro-strong" value="'+p.qty+'">')+
    field((LANG==='ar'?'إضافة / خصم (±)':'Add / Subtract (±)'),inp('adjV','type="number" value="0"'))+
    field(t('notes'),inp('adjN','placeholder="'+(LANG==='ar'?'سبب التعديل':'reason')+'"')),
    '<button class="btn" id="adjOk">'+svg('save')+'<span>'+t('save')+'</span></button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('cancel')+'</button>',460);
  el('adjOk').onclick=()=>{
    const v=Number(el('adjV').value)||0;
    p.qty=Math.max(0,p.qty+v);
    DB.data().moves=DB.data().moves||[];
    DB.data().moves.unshift({d:today(),ref:LANG==='ar'?'تعديل يدوي':'Manual',type:v>=0?'in':'out',
      name:p.name,qty:Math.abs(v),who:L(ME.name),note:el('adjN').value.trim()});
    DB.save(); closeModal(); render(); toast(t('m_saved'),'ok');
  };
}
function invMovements(root){
  const db=DB.data(); const mv=[];
  db.sales.forEach(s=>s.items.forEach(i=>mv.push({d:s.date,ref:s.no,type:'out',name:i.name,qty:i.qty,who:s.cname})));
  (db.moves||[]).forEach(m=>mv.push(m));
  mv.sort((a,b)=>String(b.d).localeCompare(String(a.d)));
  root.innerHTML=panel(svg('refresh')+(LANG==='ar'?'حركة الأصناف (وارد / منصرف)':'Item movements (in / out)'),
    grid([{t:t('inv_date'),w:'96px'},{t:(LANG==='ar'?'المستند':'Document'),w:'116px'},
          {t:(LANG==='ar'?'النوع':'Type'),w:'84px'},{t:t('suit')},{t:t('qty'),cls:'num',w:'66px'},{t:(LANG==='ar'?'الجهة':'Party')}],
      mv.slice(0,300).map(m=>({cells:[fdate(m.d),esc(m.ref),
        m.type==='in'?'<span class="tag ok">'+(LANG==='ar'?'وارد':'IN')+'</span>':'<span class="tag info">'+(LANG==='ar'?'منصرف':'OUT')+'</span>',
        esc(L(m.name)),(m.type==='in'?'+':'−')+m.qty,esc(L(m.who||''))]}))));
}
