/* =============================== REPORTS =============================== */
const REPORTS=[
  {k:'daily',   n:'r_daily',   i:'money'},
  {k:'monthly', n:'r_monthly', i:'calendar'},
  {k:'best',    n:'r_best',    i:'tag'},
  {k:'stock',   n:'r_stock',   i:'inventory'},
  {k:'low',     n:'r_low',     i:'alert'},
  {k:'cust',    n:'r_cust',    i:'customers'},
  {k:'profit',  n:'r_revenue', i:'reports'},
  {k:'expense', n:'r_expenses',i:'wallet'}
];
let REPK='daily';
function PageReports(root,tab){
  if(tab===1) REPK=(REPK==='stock'||REPK==='low')?REPK:'stock';
  else if(tab===2) REPK='profit';
  else if(tab===3) REPK='expense';
  else if(!['daily','monthly','best','cust'].includes(REPK)) REPK='daily';

  root.innerHTML=
    '<div class="filterbar">'+
      REPORTS.map(r=>'<button class="btn sm '+(REPK===r.k?'':'ghost')+'" onclick="REPK=\''+r.k+'\';drawRep()">'+svg(r.i)+'<span>'+t(r.n)+'</span></button>').join('')+
      '<span style="margin-inline-start:auto"></span>'+
      '<div class="f"><label>'+t('from')+'</label><input id="rf" type="date"></div>'+
      '<div class="f"><label>'+t('to')+'</label><input id="rt" type="date"></div>'+
      btn('rGo',t('apply'),'search','sm')+btn('rExp',t('export'),'excel','sm')+btn('rPrint',t('print'),'print','sm')+
    '</div><div id="repBox"></div>';
  el('rGo').onclick=drawRep; ['rf','rt'].forEach(i=>el(i).onchange=drawRep);
  el('rExp').onclick=()=>{const d=window._rep||{};exportCSV('eagle_'+REPK+'.csv',d.cols||[],d.rows||[]);};
  el('rPrint').onclick=()=>printReport(t(REPORTS.find(r=>r.k===REPK).n),window._rep);
  drawRep();
}
function expRange(){
  const f=el('rf')?el('rf').value:'', tt=el('rt')?el('rt').value:'';
  return (DB.data().expenses||[]).filter(x=>(!f||x.date>=f)&&(!tt||x.date<=tt));
}
function repRange(){
  const f=el('rf')?el('rf').value:'', tt=el('rt')?el('rt').value:'';
  return DB.data().sales.filter(s=>(!f||s.date>=f)&&(!tt||s.date<=tt));
}


/* report cells are plain text, except the action buttons we build ourselves */
function cellHTML(v){
  const str=String(v==null?'':v);
  return /^\s*<button[\s\S]*<\/button>\s*$/.test(str) ? str : esc(str);
}
function drawRep(){
  const db=DB.data(), S=repRange(); let cols=[],rows=[],html='',foot=null;

  if(REPK==='daily'){
    const g={}; S.forEach(s=>{g[s.date]=g[s.date]||{n:0,t:0,q:0};
      g[s.date].n++; g[s.date].t+=s.total; g[s.date].q+=s.items.reduce((a,i)=>a+i.qty,0);});
    const ks=Object.keys(g).sort().reverse();
    cols=[t('inv_date'),t('invoices'),t('pieces'),t('revenue'),''];
    rows=ks.map(k=>[fdate(k),g[k].n,g[k].q,money(g[k].t),
      '<button class="btn sm" onclick="dayInvoices(\''+k+'\')">'+svg('search')+
      '<span>'+(LANG==='ar'?'فواتير اليوم':'View invoices')+'</span></button>']);
    foot=[t('total'),ks.reduce((a,k)=>a+g[k].n,0),ks.reduce((a,k)=>a+g[k].q,0),
          money(ks.reduce((a,k)=>a+g[k].t,0)),''];
  }
  else if(REPK==='monthly'){
    const g={}; S.forEach(s=>{const k=monthKey(s.date); g[k]=g[k]||{n:0,t:0,q:0};
      g[k].n++; g[k].t+=s.total; g[k].q+=s.items.reduce((a,i)=>a+i.qty,0);});
    const ks=Object.keys(g).sort().reverse();
    cols=[(LANG==='ar'?'الشهر':'Month'),t('invoices'),t('pieces'),t('revenue')];
    rows=ks.map(k=>[k,g[k].n,g[k].q,money(g[k].t)]);
    foot=[t('total'),ks.reduce((a,k)=>a+g[k].n,0),ks.reduce((a,k)=>a+g[k].q,0),
          money(ks.reduce((a,k)=>a+g[k].t,0))];
    const mx=Math.max(1,...ks.map(k=>g[k].t));
    html=panel(svg('calendar')+t('r_monthly'),
      ks.slice(0,12).reverse().map(k=>barRow(k,g[k].t/mx*100,money(g[k].t))).join(''));
  }
  else if(REPK==='best'){
    const g={}; S.forEach(s=>s.items.forEach(i=>{const k=i.name+'|'+i.size;
      g[k]=g[k]||{name:i.name,size:i.size,q:0,t:0};
      g[k].q+=i.qty; g[k].t+=i.total;}));
    const arr=Object.values(g).sort((a,b)=>b.q-a.q);
    cols=[t('suit'),t('size'),t('pieces'),t('revenue')];
    rows=arr.map(x=>[L(x.name),x.size,x.q,money(x.t)]);
    const mx=Math.max(1,...arr.map(a=>a.q));
    html=panel(svg('tag')+t('r_best'),
      arr.slice(0,10).map(a=>barRow(L(a.name),a.q/mx*100,a.q+' '+(LANG==='ar'?'قطعة':'pcs'))).join(''));
    foot=[t('total'),'',arr.reduce((a,x)=>a+x.q,0),money(arr.reduce((a,x)=>a+x.t,0))];
  }
  else if(REPK==='stock'){
    cols=[t('code'),t('suit'),t('size'),t('stock'),t('sell_price'),t('value')];
    rows=db.products.map(p=>[p.code,L(p.name),p.size,p.qty,money(p.sell),money(p.sell*p.qty)]);
    foot=[t('total'),'','',db.products.reduce((a,p)=>a+p.qty,0),'',
          money(db.products.reduce((a,p)=>a+p.sell*p.qty,0))];
  }
  else if(REPK==='low'){
    const LOWL=db.products.filter(p=>DB.stockStatus(p)==='out');
    cols=[t('code'),t('suit'),t('size'),t('stock'),t('status')];
    rows=LOWL.map(p=>[p.code,L(p.name),p.size,p.qty,t('out')]);
  }
  else if(REPK==='cust'){
    const g={}; S.forEach(s=>{g[s.cid]=g[s.cid]||{name:s.cname,phone:s.phone,n:0,t:0,q:0};
      g[s.cid].n++; g[s.cid].t+=s.total; g[s.cid].q+=s.items.reduce((a,i)=>a+i.qty,0);});
    const arr=Object.values(g).sort((a,b)=>b.t-a.t);
    cols=[t('cust_name'),t('phone'),t('invoices'),t('pieces'),t('totalbuy')];
    rows=arr.map(x=>[x.name,x.phone,x.n,x.q,money(x.t)]);
    foot=[t('total'),'',arr.reduce((a,x)=>a+x.n,0),arr.reduce((a,x)=>a+x.q,0),
          money(arr.reduce((a,x)=>a+x.t,0))];
  }
  else if(REPK==='profit'){
    const rev=S.reduce((a,s)=>a+s.total,0);
    const pcs=S.reduce((a,s)=>a+s.items.reduce((x,i)=>x+i.qty,0),0);
    const disc=S.reduce((a,s)=>a+(s.disc||0),0);
    const avg=S.length?rev/S.length:0;
    const exp=expRange().reduce((a,x)=>a+(+x.amount||0),0);
    html='<div class="kpis">'+
      kpi(t('revenue'),money(rev),S.length+' '+t('invoices'),'','money')+
      kpi(t('exp_total'),money(exp),'','','wallet')+
      kpi(t('net_income'),money(rev-exp),
          (LANG==='ar'?'الإيرادات − المصروفات':'revenue − expenses'),'','reports')+
      kpi(LANG==='ar'?'متوسط الفاتورة':'Average invoice',money(avg),'','','tag')+'</div>';
    cols=[t('inv_no'),t('inv_date'),t('time'),t('cust_name'),t('pieces'),t('revenue')];
    rows=S.map(s=>[s.no,fdate(s.date),ftime(s.time),s.cname,
                   s.items.reduce((a,i)=>a+i.qty,0),money(s.total)]);
    foot=[t('total'),'','','',pcs,money(rev)];
  }

  else if(REPK==='expense'){
    const X=expRange().sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||'')));
    const cats=DB.data().expcats||EXPCATS_DEFAULT;
    const sum=k=>X.filter(x=>x.cat===k).reduce((a,x)=>a+(+x.amount||0),0);
    const tot=X.reduce((a,x)=>a+(+x.amount||0),0);
    const rev=repRange().reduce((a,s)=>a+s.total,0);
    html='<div class="kpis">'+
      kpi(L(cats[0]),money(sum(cats[0])),'','','scissors')+
      kpi(L(cats[1]),money(sum(cats[1])),'','','wash')+
      kpi(L(cats[2]),money(sum(cats[2])),'','','wallet')+
      kpi(t('exp_total'),money(tot),X.length+' '+t('exp_ops'),'','money')+'</div>';
    const mx=Math.max(1,...cats.map(sum));
    html+=panel(svg('wallet')+t('r_expenses'),
      cats.map(c=>barRow(L(c),sum(c)/mx*100,money(sum(c)))).join('')+
      '<div class="hint" style="margin-top:9px">'+t('revenue')+': <b>'+money(rev)+'</b> &nbsp;·&nbsp; '+
      t('exp_total')+': <b>'+money(tot)+'</b> &nbsp;·&nbsp; '+
      t('net_income')+': <b>'+money(rev-tot)+'</b></div>');
    cols=[t('exp_no'),t('inv_date'),t('time'),t('exp_cat'),t('exp_desc'),t('exp_payee'),t('exp_amount')];
    rows=X.map(x=>[x.no,fdate(x.date),ftime(x.time),L(x.cat),x.desc||'-',L(x.payee||'-'),money(x.amount)]);
    foot=[t('total'),'','','','','',money(tot)];
  }

  const gcols=cols.map((c,i)=>({t:c,cls:i>=cols.length-3?'money':''}));
  el('repBox').innerHTML=html+panel(svg(REPORTS.find(r=>r.k===REPK).i)+t(REPORTS.find(r=>r.k===REPK).n),
    grid(gcols,rows.map(r=>({cells:r.map(cellHTML)})),
      {empty:t('none'),foot:foot?foot.map(f=>'<b>'+esc(f)+'</b>'):null}));
  window._rep={cols:cols,rows:rows,foot:foot,title:t(REPORTS.find(r=>r.k===REPK).n)};
}

/* ============================================================
   Invoices of one specific day — opened from the daily report
   ============================================================ */
function dayInvoices(date){
  const list=DB.data().sales.filter(s=>s.date===date)
    .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  const tot=list.reduce((a,s)=>a+s.total,0);
  const pcs=list.reduce((a,s)=>a+s.items.reduce((x,i)=>x+i.qty,0),0);

  modal((LANG==='ar'?'فواتير يوم ':'Invoices of ')+fdate(date),
    '<div class="kpis">'+
      kpi(t('invoices'),list.length,'','','invoice')+
      kpi(t('pieces'),pcs,'','','inventory')+
      kpi(t('revenue'),money(tot),'','','money')+
    '</div>'+
    grid([{t:t('time'),w:'86px',cls:'num'},{t:t('inv_no'),w:'104px'},{t:t('cust_name')},
          {t:t('paytype'),w:'104px'},{t:(LANG==='ar'?'قطع':'Pcs'),cls:'num',w:'54px'},
          {t:t('grand'),cls:'money',w:'104px'},{t:'',cls:'acts',w:'46px'}],
      list.map(s=>({cells:[ftime(s.time),esc(s.no),esc(s.cname),
        '<span class="tag info">'+payName(s.pay)+'</span>',
        s.items.reduce((a,i)=>a+i.qty,0),money(s.total),
        '<button class="btn sm icon" onclick="printInvoiceById('+s.id+')" title="'+t('print')+'">'+
          svg('print')+'</button>']})),
      {empty:LANG==='ar'?'لا توجد فواتير في هذا اليوم':'No invoices on this day',
       foot:['','','','<b>'+t('total')+'</b>','<b>'+pcs+'</b>','<b>'+money(tot)+'</b>','']}),
    '<button class="btn" onclick="printDayReport(\''+date+'\')">'+svg('print')+
      '<span>'+(LANG==='ar'?'طباعة تقرير اليوم':'Print day report')+'</span></button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>', 900);
}
