/* ============================== CUSTOMERS ============================== */
function PageCustomers(root,tab){
  const db=DB.data();
  if(tab===1) return custHistoryTab(root);
  if(tab===2) return custBalances(root);

  root.innerHTML=
    panel(t('customers'),
      '<div class="cols">'+
        '<div class="col">'+
          field(t('cust_name'),inp('cName',''),{req:1})+
          field(t('phone'),inp('cPhone',''))+
        '</div>'+
        '<div class="col">'+
          field(t('address'),inp('cAddr',''))+
          field(t('notes'),inp('cNotes',''))+
        '</div>'+
        '<div class="col narrow">'+
          '<input type="hidden" id="cId" value="0">'+
          '<div style="display:flex;gap:5px;flex-wrap:wrap;padding-top:2px">'+
            btn('cSave',t('save'),'save','')+btn('cNew',t('new'),'plus','ghost')+'</div>'+
        '</div>'+
      '</div>')+
    '<div class="filterbar">'+
      '<div class="f"><label>'+t('search')+'</label>'+inp('cq','placeholder="'+(LANG==='ar'?'الاسم أو الهاتف':'name or phone')+'" style="min-width:200px"')+'</div>'+
      '<span style="margin-inline-start:auto"></span>'+btn('cExp',t('export'),'excel','sm')+
    '</div><div id="cBox"></div>';

  const draw=()=>{
    const q=(el('cq').value||'').trim();
    const list=db.customers.filter(c=>!q||c.name.includes(q)||(c.phone||'').includes(q));
    el('cBox').innerHTML=grid(
      [{t:t('seq'),cls:'num',w:'36px'},{t:t('cust_name')},{t:t('phone'),w:'112px'},{t:t('address')},
       {t:t('notes')},{t:t('invcount'),cls:'num',w:'58px'},{t:t('totalbuy'),cls:'money',w:'106px'},
       {t:t('lastbuy'),w:'92px'},{t:t('actions'),cls:'acts',w:'112px'}],
      list.map((c,n)=>{const s=DB.custStats(c.id);
        return {cells:[n+1,esc(c.name),esc(c.phone),esc(c.addr),esc(c.notes),s.count,money(s.total),
          s.last?fdate(s.last):'-',
          '<button class="btn sm ghost" onclick="custLoad('+c.id+')">'+svg('edit')+'</button> '+
          '<button class="btn sm" onclick="custHist('+c.id+')">'+svg('history')+'</button> '+
          '<button class="btn sm red" onclick="custDel('+c.id+')">'+svg('trash')+'</button>']};}),
      {empty:t('none')});
    window._cList=list;
  };
  el('cq').oninput=draw;
  el('cSave').onclick=()=>{
    const id=+el('cId').value, name=el('cName').value.trim();
    if(!name){toast(t('m_nocust'),'err');return;}
    if(id){ const c=db.customers.find(x=>x.id===id);
      Object.assign(c,{name:name,phone:el('cPhone').value.trim(),addr:el('cAddr').value.trim(),notes:el('cNotes').value.trim()});
    } else db.customers.push({id:db.customers.reduce((a,b)=>Math.max(a,b.id),0)+1,name:name,
      phone:el('cPhone').value.trim(),addr:el('cAddr').value.trim(),notes:el('cNotes').value.trim()});
    DB.save(); render(); toast(t('m_saved'),'ok');
  };
  el('cNew').onclick=()=>{['cName','cPhone','cAddr','cNotes'].forEach(i=>el(i).value='');el('cId').value=0;el('cName').focus();};
  el('cExp').onclick=()=>exportCSV('eagle_customers.csv',
    [t('cust_name'),t('phone'),t('address'),t('notes'),t('invcount'),t('totalbuy'),t('lastbuy')],
    (window._cList||[]).map(c=>{const s=DB.custStats(c.id);return [c.name,c.phone,c.addr,c.notes,s.count,s.total,s.last];}));
  draw();
}
function custLoad(id){
  const c=DB.data().customers.find(x=>x.id===id); if(!c)return;
  el('cId').value=c.id; el('cName').value=c.name; el('cPhone').value=c.phone||'';
  el('cAddr').value=c.addr||''; el('cNotes').value=c.notes||''; el('cName').focus();
  window.scrollTo({top:0,behavior:'smooth'});
}
function custDel(id){
  confirmBox(t('m_conf_del'),()=>{ const db=DB.data();
    db.customers=db.customers.filter(x=>x.id!==id); DB.save(); render(); toast(t('m_deleted'),'ok'); });
}
function custHist(id){
  const c=DB.data().customers.find(x=>x.id===id); if(!c)return;
  const s=DB.custStats(id);
  modal(t('purchist')+' — '+c.name,
    '<div class="kpis">'+kpi(t('invcount'),s.count,'','','invoice')+
      kpi(t('totalbuy'),money(s.total),'','','money')+
      kpi(t('lastbuy'),s.last?fdate(s.last):'-','','','calendar')+'</div>'+
    grid([{t:t('inv_no'),w:'96px'},{t:t('inv_date'),w:'86px'},{t:t('time'),w:'82px',cls:'num'},{t:(LANG==='ar'?'الأصناف':'Items')},
          {t:t('grand'),cls:'money',w:'96px'},{t:'',cls:'acts',w:'40px'}],
      s.sales.map(x=>({cells:[esc(x.no),fdate(x.date),ftime(x.time),
        esc(x.items.map(i=>L(i.name)+'×'+i.qty).join('، ')),
        money(x.total),
        '<button class="btn sm ghost" onclick="printInvoiceById('+x.id+')">'+svg('print')+'</button>']}))),
    null,820);
}
function custHistoryTab(root){
  const db=DB.data();
  root.innerHTML=panel(t('purchist'),
    grid([{t:t('cust_name')},{t:t('phone'),w:'110px'},{t:t('invcount'),cls:'num',w:'60px'},
          {t:t('pieces'),cls:'num',w:'60px'},{t:t('totalbuy'),cls:'money',w:'110px'},
          {t:t('lastbuy'),w:'92px'},{t:'',cls:'acts',w:'44px'}],
      db.customers.map(c=>{const s=DB.custStats(c.id);
        const pcs=s.sales.reduce((a,x)=>a+x.items.reduce((y,i)=>y+i.qty,0),0);
        return {cells:[esc(c.name),esc(c.phone),s.count,pcs,money(s.total),s.last?fdate(s.last):'-',
          '<button class="btn sm" onclick="custHist('+c.id+')">'+svg('search')+'</button>']};})
        .sort((a,b)=>0)));
}
function custBalances(root){
  const db=DB.data();
  const rows=db.customers.map(c=>({c:c,s:DB.custStats(c.id)}))
    .filter(x=>x.s.count>0).sort((a,b)=>b.s.total-a.s.total);
  root.innerHTML=panel(svg('tag')+(LANG==='ar'?'أفضل العملاء شراءً':'Top customers'),
    grid([{t:t('seq'),cls:'num',w:'40px'},{t:t('cust_name')},{t:t('phone'),w:'112px'},
          {t:t('invcount'),cls:'num',w:'64px'},{t:t('pieces'),cls:'num',w:'62px'},
          {t:t('totalbuy'),cls:'money',w:'116px'},{t:'',cls:'acts',w:'44px'}],
      rows.map((x,n)=>{const pcs=x.s.sales.reduce((a,v)=>a+v.items.reduce((y,i)=>y+i.qty,0),0);
        return {cells:[n+1,esc(x.c.name),esc(x.c.phone),x.s.count,pcs,money(x.s.total),
          '<button class="btn sm icon" onclick="custHist('+x.c.id+')">'+svg('search')+'</button>']};}),
      {empty:t('none'),
       foot:['','','','<b>'+rows.reduce((a,x)=>a+x.s.count,0)+'</b>','',
             '<b>'+money(rows.reduce((a,x)=>a+x.s.total,0))+'</b>','']}));
}
