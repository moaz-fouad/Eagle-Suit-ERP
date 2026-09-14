/* ============================= SALES HISTORY ============================= */
function PageHistory(root,tab){
  const db=DB.data();
  root.innerHTML=
    '<div class="filterbar">'+
      '<div class="f"><label>'+t('search')+'</label>'+inp('hq','style="min-width:170px" placeholder="'+(LANG==='ar'?'رقم فاتورة / عميل':'invoice / customer')+'"')+'</div>'+
      '<div class="f"><label>'+t('from')+'</label>'+inp('hf','type="date"')+'</div>'+
      '<div class="f"><label>'+t('to')+'</label>'+inp('ht','type="date"')+'</div>'+
      '<div class="f"><label>'+t('paytype')+'</label>'+sel('hp',[{v:'',t:t('all')}].concat(DB.PAYS.map(p=>({v:p,t:t(p)}))),'')+'</div>'+
      btn('hGo',t('apply'),'search','sm')+btn('hRe',t('reset'),'x','ghost sm')+
      '<span style="margin-inline-start:auto"></span>'+btn('hExp',t('export'),'excel','sm')+
    '</div><div id="hBox"></div><div id="hTot"></div>';

  const draw=()=>{
    const q=(el('hq').value||'').trim(), f=el('hf').value, tt=el('ht').value, p=el('hp').value;
    let list=db.sales.filter(s=>(!q||s.no.includes(q)||s.cname.includes(q)||(s.phone||'').includes(q))&&
      (!f||s.date>=f)&&(!tt||s.date<=tt)&&(!p||s.pay===p));
    if(tab===2) list=list.filter(s=>s.returned);
    el('hBox').innerHTML=grid(
      [{t:t('inv_no'),w:'96px'},{t:t('inv_date'),w:'86px'},{t:t('time'),w:'84px',cls:'num'},{t:t('cust_name')},{t:t('phone'),w:'104px'},
       {t:t('seller'),w:'140px'},{t:t('paytype'),w:'86px'},{t:(LANG==='ar'?'قطع':'Pcs'),cls:'num',w:'46px'},
       {t:t('grand'),cls:'money',w:'96px'},{t:t('paid'),cls:'money',w:'90px'},
       {t:t('actions'),cls:'acts',w:'112px'}],
      list.map(s=>({cells:[esc(s.no),fdate(s.date),ftime(s.time),esc(s.cname),esc(s.phone),esc(L(s.seller)),
        '<span class="tag info">'+payName(s.pay)+'</span>',
        s.items.reduce((a,i)=>a+i.qty,0),money(s.total),money(s.paid),
        '<button class="btn sm ghost" onclick="viewInv('+s.id+')">'+svg('search')+'</button> '+
        '<button class="btn sm" onclick="printInvoiceById('+s.id+')">'+svg('print')+'</button> '+
        '<button class="btn sm red" onclick="delInv('+s.id+')">'+svg('trash')+'</button>']})),
      {empty:t('none')});
    const tot=list.reduce((a,b)=>a+b.total,0), paid=list.reduce((a,b)=>a+b.paid,0);
    el('hTot').innerHTML='<div class="totbox">'+
      '<div class="tot"><label>'+t('invoices')+'</label><input readonly value="'+list.length+'"></div>'+
      '<div class="tot"><label>'+t('paid')+'</label><input readonly value="'+money(paid)+'"></div>'+
      '<div class="tot big"><label>'+t('total')+'</label><input readonly value="'+money(tot)+'"></div></div>';
    window._hList=list;
  };
  el('hq').oninput=draw; ['hf','ht','hp'].forEach(i=>el(i).onchange=draw); el('hGo').onclick=draw;
  el('hRe').onclick=()=>{['hq','hf','ht'].forEach(i=>el(i).value='');el('hp').value='';draw();};
  el('hExp').onclick=()=>exportCSV('eagle_sales.csv',
    [t('inv_no'),t('inv_date'),t('time'),t('cust_name'),t('phone'),t('seller'),t('paytype'),t('grand'),t('paid')],
    (window._hList||[]).map(s=>[s.no,s.date,ftime(s.time),s.cname,s.phone,L(s.seller),t(s.pay),s.total,s.paid]));
  draw();
}
function viewInv(id){
  const s=DB.data().sales.find(x=>x.id===id); if(!s)return;
  modal(t('invoice')+' — '+s.no,
    '<div class="cols" style="margin-bottom:6px">'+
      '<div class="col">'+field(t('cust_name'),'<input readonly value="'+esc(s.cname)+'">')+
        field(t('phone'),'<input readonly value="'+esc(s.phone||'')+'">')+'</div>'+
      '<div class="col">'+field(t('datetime'),'<input readonly value="'+fdatetime(s.date,s.time)+'">')+
        field(t('seller'),'<input readonly value="'+esc(L(s.seller))+'">')+'</div>'+
      '<div class="col narrow">'+field(t('paytype'),'<input readonly value="'+payName(s.pay)+'">')+
        field(t('grand'),'<input readonly class="ro-strong" value="'+money(s.total)+'">')+'</div>'+
    '</div>'+
    grid([{t:t('seq'),cls:'num',w:'34px'},{t:t('suit')},{t:t('size'),cls:'num',w:'70px'},
          {t:t('qty'),cls:'num',w:'50px'},{t:t('price'),cls:'money',w:'82px'},{t:t('line_total'),cls:'money',w:'88px'}],
      s.items.map((i,n)=>({cells:[n+1,esc(L(i.name)),esc(i.size),i.qty,money(i.price),money(i.total)]})),
      {foot:['','','','','','<b>'+t('grand')+'</b>','<b>'+money(s.total)+'</b>']})+
    (s.notes?'<div class="mini-note">'+t('notes')+': '+esc(s.notes)+'</div>':''),
    '<button class="btn" onclick="printInvoiceById('+s.id+')">'+t('print')+'</button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>',800);
}
function delInv(id){
  confirmBox((LANG==='ar'?'حذف الفاتورة وإرجاع الكميات للمخزون؟':'Delete invoice and return items to stock?'),
    ()=>{ DB.deleteInvoice(id,true); render(); toast(t('m_deleted'),'ok'); });
}
