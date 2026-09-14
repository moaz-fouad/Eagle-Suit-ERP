/* App shell — nav is built from the logged-in user's permissions */
const MODULES=[
  {k:'invoice',   i:'invoice'  },
  {k:'inventory', i:'inventory'},
  {k:'customers', i:'customers'},
  {k:'history',   i:'history'  },
  {k:'expenses',  i:'wallet'   },
  {k:'reports',   i:'reports'  },
  {k:'settings',  i:'settings' }
];
const TABSETS={
  invoice:  ['فاتورة جديدة|New Invoice'],
  inventory:['جرد المخزون|Stock List','حركة الأصناف|Movements','غير متوفر|Out of Stock','إدارة الأصناف|Manage Items'],
  customers:['قاعدة العملاء|Customer Base','سجل المشتريات|Purchase History','أفضل العملاء|Top Customers'],
  history:  ['كل الفواتير|All Invoices'],
  expenses: ['كل المصروفات|All Expenses','ترزي|Tailor','غسيل|Laundry','سلفة|Advance'],
  reports:  ['تقارير المبيعات|Sales','تقارير المخزون|Stock','الإيرادات|Revenue','المصروفات|Expenses'],
  settings: ['بيانات المحل|Store','الطباعة|Printing','النسخ الاحتياطي|Backup','المستخدمين|Users']
};
let CUR='invoice', CURTAB=0;

function allowedModules(){ return MODULES.filter(m=>can(m.k)); }

function go(k,tab){
  if(!can(k)){ toast(LANG==='ar'?'ليس لديك صلاحية لهذه الشاشة':'You do not have access to this window','err'); return; }
  CUR=k; CURTAB=tab||0; render();
  window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
  if(!ME) return;
  const mods=allowedModules();
  el('nav').innerHTML = mods.map(m=>
    '<div class="nav-item'+(CUR===m.k?' on':'')+'" data-k="'+m.k+'">'+svg(m.i)+'<span>'+t(m.k)+'</span></div>').join('');
  el('nav').style.display = mods.length>1 ? '' : 'none';
  el('nav').querySelectorAll('.nav-item').forEach(n=>n.onclick=()=>go(n.dataset.k));

  const set=(TABSETS[CUR]||[]).filter((s,i)=>!(CUR==='inventory'&&i===3&&!isManager()));
  el('subtabs').innerHTML = set.length>1 ? set.map((s,i)=>{const p=s.split('|');
    return '<div class="subtab'+(i===CURTAB?' on':'')+'" data-i="'+i+'">'+esc(LANG==='ar'?p[0]:p[1])+'</div>';}).join('') : '';
  el('subtabs').querySelectorAll('.subtab').forEach(n=>n.onclick=()=>{CURTAB=+n.dataset.i;render();});

  el('pageTitle').textContent=t(CUR);
  const cp=(set[CURTAB]||'|').split('|');
  el('pageCrumb').textContent = set.length>1 ? '/ '+(LANG==='ar'?cp[0]:cp[1]) : '';
  el('langBtn').textContent = LANG==='ar'?'EN':'ع';
  el('outBtn').innerHTML = svg('logout');
  el('outBtn').title = LANG==='ar'?'خروج':'Logout';
  el('brandTag').textContent = LANG==='ar'?'لإدارة محلات البدل الرجالية':"FOR MEN'S SUITS";

  const initial=L(ME.name).trim().charAt(0).toUpperCase();
  el('whoBadge').innerHTML='<div class="av">'+esc(initial)+'</div>'+
    '<div><div class="nm">'+esc(L(ME.name))+'</div>'+
    '<div class="rl">'+esc(LANG==='ar'?ROLES[ME.role].ar:ROLES[ME.role].en)+'</div></div>';

  const P={invoice:PageInvoice,inventory:PageInventory,customers:PageCustomers,
           history:PageHistory,expenses:PageExpenses,reports:PageReports,settings:PageSettings};
  el('content').innerHTML='';
  if(!can(CUR)) return lockedView();
  (P[CUR]||PageInvoice)(el('content'),CURTAB);

  if(typeof syncSticky==='function') requestAnimationFrame(syncSticky);
  const sig='<span class="foot-sig">Developed By <b>Moaz Fouad</b></span>';
  el('foot').innerHTML = (LANG==='ar'
    ? '<b>Eagle Suit</b> — نظام إدارة محلات البدل الرجالية · إصدار محلي 1.1 · يعمل بدون إنترنت'
    : '<b>Eagle Suit</b> — Men\'s Suit Store ERP · Offline Local Edition v1.1') + sig;
}
function lockedView(){
  el('content').innerHTML='<div class="panel"><div class="locked">'+svg('lock')+
    '<h2>'+(LANG==='ar'?'صلاحية غير متاحة':'Access restricted')+'</h2>'+
    '<p>'+(LANG==='ar'?'هذه الشاشة متاحة للمدير فقط.':'This window is available to managers only.')+'</p>'+
    '</div></div>';
}
function tick(){
  if(!el('clock')) return;
  const d=new Date();
  const days=LANG==='ar'?['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
                        :['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let h=d.getHours(); const am=h<12; h=h%12||12;
  const hhmmss=String(h).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+
               ':'+String(d.getSeconds()).padStart(2,'0')+' '+
               (LANG==='ar'?(am?'ص':'م'):(am?'AM':'PM'));
  el('clock').innerHTML='<b>'+hhmmss+'</b><br>'+days[d.getDay()]+' '+d.toLocaleDateString('en-GB');
}
el('langBtn').onclick=()=>{ setLang(LANG==='ar'?'en':'ar');
  if(ME){ render(); } else { drawLoginTexts(); } tick(); };
el('outBtn').onclick=logout;

/* ---- reconnect the data folder chosen last time ---- */
async function bootStore(){
  const dot=el('syncDot');
  if(!window.FileStore || !FileStore.supported()){
    if(dot){ dot.className='sync-dot off';
      dot.title=LANG==='ar'?'الحفظ داخل المتصفح فقط':'Browser-only storage'; }
    return;
  }
  const st=await FileStore.restore();
  if(st==='granted'){
    await DB.loadFromFile();
    FileStore.markSynced(true);
    FileStore.startAutoBackup(()=>DB.data());     // nightly 12 AM backup
    if(ME) render();
  }else if(st==='prompt'){
    if(dot){ dot.className='sync-dot warn';
      dot.title=LANG==='ar'?'اضغط لإعادة ربط مجلد البيانات':'Click to re-link the data folder'; }
    setTimeout(()=>toast(LANG==='ar'
      ?'اضغط على النقطة البرتقالية أعلى الشاشة لإعادة ربط مجلد البيانات'
      :'Click the orange dot at the top to re-link your data folder'),1400);
  }else{
    if(dot){ dot.className='sync-dot off';
      dot.title=LANG==='ar'?'الحفظ داخل المتصفح فقط — اختر مجلد من الإعدادات'
                           :'Browser-only storage — choose a folder in Settings'; }
  }
}
el('syncDot').onclick=async()=>{
  if(!window.FileStore||!FileStore.supported()){
    toast(LANG==='ar'?'استخدم Chrome أو Edge للحفظ في ملف':'Use Chrome or Edge to save to a file','err'); return; }
  if(FileStore.connected()){
    const ok=await FileStore.regrant();
    if(ok){ await DB.loadFromFile(); FileStore.markSynced(true); render();
            toast(LANG==='ar'?'تم إعادة ربط مجلد البيانات':'Data folder re-linked','ok'); return; }
  }
  if(can('settings')) go('settings',2);
  else toast(LANG==='ar'?'كلّم المدير لضبط مكان الحفظ':'Ask the manager to set the data folder','err');
};

/* ------------------------------------------------------------------
   Keep the module bar pinned right under the header.
   The header height changes with the window width (it wraps on small
   screens), so measure it instead of hard-coding 60px.
   ------------------------------------------------------------------ */
function syncSticky(){
  const bar=document.querySelector('.topbar'), nav=el('nav');
  if(!bar||!nav) return;
  const h=Math.round(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--navtop', h+'px');
  document.documentElement.style.setProperty('--stickyh',
    (h+Math.round(nav.getBoundingClientRect().height))+'px');
  nav.classList.toggle('stuck', window.scrollY > 4);
}
window.addEventListener('scroll', syncSticky, {passive:true});
window.addEventListener('resize', syncSticky);
if(window.ResizeObserver){
  const ro=new ResizeObserver(syncSticky);
  const bar=document.querySelector('.topbar'); if(bar) ro.observe(bar);
}

setLang(LANG);
bootAuth();
syncSticky();
bootStore();
setInterval(tick,1000);
