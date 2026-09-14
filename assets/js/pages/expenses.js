/* ============================== EXPENSES ==============================
   Deliberately simple: pick a type, type the amount, press Add.
   Three fixed types: ترزي (Tailor) · غسيل (Laundry) · سلفة (Advance)
   ====================================================================== */
function expCats(){ return DB.data().expcats || EXPCATS_DEFAULT; }
function expIcon(cat){
  const c=expCats();
  return cat===c[0] ? 'scissors' : (cat===c[1] ? 'wash' : 'wallet');
}
let EXPPICK = 0;          // currently selected type in the quick-add bar

function PageExpenses(root,tab){
  const db=DB.data(), cats=expCats();
  const only = tab>=1 && tab<=3 ? cats[tab-1] : '';
  if(only) EXPPICK = tab-1;

  root.innerHTML=
    /* ---------- quick add: type · amount · note · button ---------- */
    panel(svg('plus')+t('exp_add'),
      '<div class="exp-add">'+
        '<div class="exp-pick" id="expPick">'+
          cats.map((c,i)=>'<div class="ex-opt'+(i===EXPPICK?' on':'')+'" data-i="'+i+'">'+
            svg(expIcon(c))+'<span>'+esc(L(c))+'</span></div>').join('')+
        '</div>'+
        '<input id="qAmt" type="number" min="0" step="0.01" class="ex-amt" placeholder="'+
          (LANG==='ar'?'المبلغ':'Amount')+'">'+
        '<input id="qDesc" class="ex-note" placeholder="'+
          (LANG==='ar'?'ملاحظة (اختياري)':'Note (optional)')+'">'+
        '<button class="btn" id="qAdd">'+svg('plus')+'<span>'+t('add')+'</span></button>'+
      '</div>')+

    /* ---------- three totals ---------- */
    '<div id="xKpi"></div>'+

    /* ---------- the list ---------- */
    panel(svg('wallet')+(only?L(only):t('expenses')),
      '<div id="xBox"></div>',
      /* header tools: month filter + export */
      '<select id="xMon" class="ex-mon"></select>'+
      btn('xExp',t('export'),'excel','ghost sm'));

  /* --- month options: this month, last month, all --- */
  const months=[...new Set((db.expenses||[]).map(x=>monthKey(x.date)))].sort().reverse();
  el('xMon').innerHTML='<option value="">'+(LANG==='ar'?'كل الفترات':'All time')+'</option>'+
    months.map(m=>'<option value="'+m+'">'+m+'</option>').join('');
  el('xMon').value = months.includes(monthKey(today())) ? monthKey(today()) : '';

  const draw=()=>{
    const mon=el('xMon').value;
    const list=(db.expenses||[])
      .filter(x=>(!only||x.cat===only)&&(!mon||monthKey(x.date)===mon))
      .sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||'')));

    const all=(db.expenses||[]).filter(x=>!mon||monthKey(x.date)===mon);
    const sum=k=>all.filter(x=>x.cat===k).reduce((a,x)=>a+(+x.amount||0),0);
    const tot=list.reduce((a,x)=>a+(+x.amount||0),0);

    el('xKpi').innerHTML='<div class="kpis">'+
      cats.map(c=>kpi(L(c),money(sum(c)),
        all.filter(x=>x.cat===c).length+' '+t('exp_ops'),'',expIcon(c))).join('')+
      kpi(t('exp_total'),money(all.reduce((a,x)=>a+(+x.amount||0),0)),
        all.length+' '+t('exp_ops'),'','money')+
      '</div>';

    el('xBox').innerHTML=grid(
      [{t:t('inv_date'),w:'104px'},{t:t('time'),w:'88px',cls:'num'},
       {t:t('exp_cat'),w:'128px'},{t:t('exp_desc')},
       {t:t('exp_amount'),cls:'money',w:'120px'},{t:'',cls:'acts',w:'56px'}],
      list.map(x=>({cells:[fdate(x.date),ftime(x.time),
        '<span class="ex-chip">'+svg(expIcon(x.cat))+esc(L(x.cat))+'</span>',
        esc(x.desc||'—'),money(x.amount),
        '<button class="btn sm red icon" onclick="delExp('+x.id+')" title="'+t('del')+'">'+
          svg('trash')+'</button>']})),
      {empty:LANG==='ar'?'لا توجد مصروفات — سجّل أول مصروف من فوق'
                        :'No expenses yet — add your first one above',
       foot:['','','','<b>'+t('total')+'</b>','<b>'+money(tot)+'</b>','']});
    window._xList=list;
  };

  /* --- type picker --- */
  el('expPick').querySelectorAll('.ex-opt').forEach(o=>o.onclick=()=>{
    EXPPICK=+o.dataset.i;
    el('expPick').querySelectorAll('.ex-opt').forEach(x=>x.classList.remove('on'));
    o.classList.add('on');
    el('qAmt').focus();
  });

  const add=()=>{
    const amt=+el('qAmt').value||0;
    if(amt<=0){ toast(LANG==='ar'?'اكتب المبلغ الأول':'Enter the amount first','err');
                el('qAmt').focus(); return; }
    DB.saveExpense({id:0,no:DB.nextExpNo(),date:today(),time:nowTime(),
      cat:cats[EXPPICK],amount:amt,desc:el('qDesc').value.trim(),payee:'',
      by:ME?ME.name:''});
    el('qAmt').value=''; el('qDesc').value='';
    draw(); el('qAmt').focus();
    toast(L(cats[EXPPICK])+' — '+money2(amt),'ok');
  };
  el('qAdd').onclick=add;
  ['qAmt','qDesc'].forEach(id=>el(id).addEventListener('keydown',e=>{ if(e.key==='Enter') add(); }));
  el('xMon').onchange=draw;
  el('xExp').onclick=()=>exportCSV('eagle_expenses.csv',
    [t('inv_date'),t('time'),t('exp_cat'),t('exp_desc'),t('exp_amount')],
    (window._xList||[]).map(x=>[x.date,ftime(x.time),L(x.cat),x.desc,x.amount]));

  draw();
  setTimeout(()=>{ const f=el('qAmt'); if(f) f.focus(); },150);
}

function delExp(id){
  confirmBox(t('m_conf_del'),()=>{ DB.deleteExpense(id); render(); toast(t('m_deleted'),'ok'); });
}
