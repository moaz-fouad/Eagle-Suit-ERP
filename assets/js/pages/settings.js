/* =============================== SETTINGS =============================== */
function PageSettings(root,tab){
  const db=DB.data(), s=db.settings;
  if(tab===1) return setPrinting(root);
  if(tab===2) return setBackup(root);
  if(tab===3) return setUsers(root);

  root.innerHTML=panel(svg('store')+t('st_store'),
    '<div class="cols">'+
      '<div class="col">'+
        field(t('store_name'),'<input id="sName" value="'+esc(s.name)+'">',{req:1})+
        field(t('store_phone'),'<input id="sPhone" value="'+esc(s.phone)+'">')+
        field(t('store_addr'),'<input id="sAddr" value="'+esc(s.addr)+'">')+
      '</div>'+
      '<div class="col">'+
        field(t('currency'),'<input id="sCur" value="'+esc(s.currency)+'">')+
        field(t('tax'),'<input id="sTax" type="number" step="0.1" value="'+s.tax+'">')+
      '</div>'+
      '<div class="col narrow">'+
        field(t('st_logo'),'<img src="'+esc(s.logo)+'" class="logo-prev" id="logoPrev">',{tall:1})+
        '<div class="f"><label></label><div class="ctl"><input type="file" id="sLogoFile" accept="image/*" style="font-size:10.5px;height:auto"></div></div>'+
      '</div>'+
    '</div>',null,
    btn('sSave',t('save'),'save','')+btn('sReload',t('reset'),'x','ghost'));

  el('sSave').onclick=()=>{
    Object.assign(s,{name:el('sName').value,phone:el('sPhone').value,addr:el('sAddr').value,
      currency:el('sCur').value||'ج.م',tax:+el('sTax').value||0});
    DB.save(); render(); toast(t('m_saved'),'ok');
  };
  el('sReload').onclick=()=>render();
  el('sLogoFile').onchange=e=>{
    const f=e.target.files[0]; if(!f)return; const r=new FileReader();
    r.onload=()=>{ s.logo=r.result; DB.save(); el('logoPrev').src=r.result; toast(t('m_saved'),'ok'); };
    r.readAsDataURL(f);
  };
}
function setPrinting(root){
  const s=DB.data().settings;
  root.innerHTML=panel(svg('print')+t('st_print'),
    '<div class="cols">'+
      '<div class="col">'+
        field(t('paper'),sel('pPaper',[{v:'80mm',t:'80mm ('+(LANG==='ar'?'رول كاشير — الافتراضي':'receipt roll — default')+')'},{v:'A5',t:'A5'},{v:'A4',t:'A4'}],s.paper))+
        field((LANG==='ar'?'عدد النسخ':'Copies'),'<input id="pCopies" type="number" min="1" max="4" value="'+s.copies+'">')+
        '<div class="f"><label></label><div class="ctl">'+
          '<label class="chk"><input type="checkbox" id="pLogo" '+(s.showLogo?'checked':'')+'> '+(LANG==='ar'?'طباعة الشعار':'Print logo')+'</label>'+
        '</div></div>'+
      '</div>'+
      '<div class="col">'+
        field(t('footer_txt'),'<textarea id="pFoot" rows="4">'+esc(s.footer)+'</textarea>',{tall:1})+
      '</div>'+
    '</div>'+
    '<div class="mini-note">'+(LANG==='ar'
      ?'الطباعة تتم عبر طابعة الويندوز المثبتة محلياً — لا حاجة لاتصال بالإنترنت.'
      :'Printing uses the locally installed Windows printer — no internet needed.')+'</div>',null,
    btn('pSave',t('save'),'save','')+btn('pTest',(LANG==='ar'?'طباعة تجريبية':'Test print'),'print','ghost'));
  el('pSave').onclick=()=>{
    Object.assign(s,{paper:el('pPaper').value,copies:+el('pCopies').value||1,
      showLogo:el('pLogo').checked,footer:el('pFoot').value});
    DB.save(); toast(t('m_saved'),'ok');
  };
  el('pTest').onclick=()=>{
    const sale=DB.data().sales[0];
    if(sale) printInvoice(sale); else toast(t('none'),'err');
  };
}
/* status line for the nightly backup */
function autoBackupNote(){
  const last = window.FileStore ? FileStore.lastSnapshot() : null;
  const when = last ? fdate(last.date) : (LANG==='ar'?'لسه':'not yet');
  return '<div class="store-card ok" style="margin-top:11px">'+svg('calendar')+
    '<div><b>'+(LANG==='ar'?'نسخة احتياطية تلقائية كل يوم 12:00 ص':'Automatic backup every day at 12:00 AM')+'</b>'+
    '<div class="hint">'+(LANG==='ar'
      ? 'بتتحفظ في مجلد <b>backups</b> جنب الملف. لو الجهاز كان مقفول وقت منتصف الليل، '+
        'النسخة بتتعمل تلقائياً أول ما تفتح البرنامج. النسخ أقدم من 60 يوم بتتمسح لوحدها.'
      : 'Saved into the <b>backups</b> sub-folder. If the PC was off at midnight the backup '+
        'runs as soon as you open the system. Snapshots older than 60 days are removed.')+'</div>'+
    '<div class="path">'+(LANG==='ar'?'آخر نسخة: ':'Last backup: ')+'<b>'+esc(when)+'</b></div>'+
    '</div></div>';
}
function setBackup(root){
  const fi = window.FileStore ? FileStore.info() : {supported:false,connected:false};
  const KEYNOTE = LANG==='ar'
    ? 'كل تعديل (بدلة جديدة، عميل، فاتورة) بيتحفظ في الملف ده فوراً وتلقائياً.'
    : 'Every change (new suit, customer, invoice) is written to this file instantly.';

  /* ---------- where the data lives ---------- */
  const locBox = !fi.supported
    ? '<div class="store-card warn">'+svg('alert')+
        '<div><b>'+(LANG==='ar'?'المتصفح ده مش بيدعم الحفظ في ملف':'This browser cannot save to a file')+'</b>'+
        '<div class="hint">'+(LANG==='ar'
          ?'استخدم Google Chrome أو Microsoft Edge عشان تقدر تحفظ البيانات في مجلد تختاره. حالياً البيانات محفوظة داخل المتصفح فقط.'
          :'Use Google Chrome or Microsoft Edge to store data in a folder you choose. Data is currently inside the browser only.')+'</div></div></div>'
    : (fi.connected
      ? '<div class="store-card ok">'+svg('check')+
          '<div><b>'+(LANG==='ar'?'البيانات محفوظة في مجلد على جهازك':'Data is saved to a folder on this PC')+'</b>'+
          '<div class="path">📁 '+esc(fi.name)+' \\ <b>'+esc(fi.file)+'</b></div>'+
          '<div class="hint">'+KEYNOTE+'</div></div></div>'
      : '<div class="store-card warn">'+svg('alert')+
          '<div><b>'+(LANG==='ar'?'البيانات محفوظة داخل المتصفح فقط':'Data is inside the browser only')+'</b>'+
          '<div class="hint">'+(LANG==='ar'
            ?'مكان مخفي جوه كروم — مش هتقدر تشوفه أو تنسخه، ولو مسحت بيانات التصفح هيضيع. اختر مجلد دلوقتي عشان تبقى بياناتك في ملف حقيقي تشوفه وتنسخه.'
            :'A hidden folder inside Chrome — you cannot see or copy it, and clearing browsing data erases it. Choose a folder to keep your data in a real file.')+'</div></div></div>');

  root.innerHTML=
    panel(svg('db')+(LANG==='ar'?'مكان حفظ البيانات':'Where your data is stored'),
      locBox+
      '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:11px">'+
        (fi.supported
          ? btn('fsPick', fi.connected?(LANG==='ar'?'تغيير المجلد':'Change folder')
                                      :(LANG==='ar'?'اختر مجلد الحفظ':'Choose data folder'),'box','')
          : '')+
        (fi.connected? btn('fsOpen',(LANG==='ar'?'حفظ الآن':'Save now'),'save','ghost')
                     : '')+
        (fi.connected? btn('fsOff',(LANG==='ar'?'إلغاء الربط':'Disconnect'),'x','ghost') : '')+
      '</div>'+
      (fi.connected?autoBackupNote():''))+

    '<div class="split">'+
    panel(svg('save')+(LANG==='ar'?'نسخة احتياطية يدوية':'Manual backup'),
      '<div class="hint">'+(LANG==='ar'
        ?'ينزّل ملف يحتوي كل الأصناف والعملاء والفواتير. احفظه على فلاشة من وقت للتاني.'
        :'Downloads a file with all items, customers and invoices. Keep a copy on a USB drive.')+'</div>'+
      '<div style="padding-top:10px">'+btn('bkNow',(LANG==='ar'?'تنزيل نسخة (JSON)':'Download backup (JSON)'),'db','')+'</div>')+
    panel(svg('refresh')+t('st_restore'),
      '<div class="hint">'+(LANG==='ar'
        ?'اختر ملف نسخة احتياطية (.json) لاستعادة كل البيانات. ده هيستبدل البيانات الحالية.'
        :'Pick a backup file (.json) to restore everything. This replaces current data.')+'</div>'+
      '<div style="padding-top:10px"><input type="file" id="rsFile" accept="application/json,.json"></div>'+
      '<div style="padding-top:9px">'+btn('rsSeed',(LANG==='ar'?'استعادة البيانات الافتراضية':'Restore demo data'),'back','ghost')+'</div>')+
    '</div>'+

    panel(svg('inventory')+(LANG==='ar'?'حالة قاعدة البيانات':'Database contents'),
      grid([{t:(LANG==='ar'?'الجدول':'Table')},{t:(LANG==='ar'?'عدد السجلات':'Records'),cls:'num',w:'120px'}],
        [[t('products'),DB.data().products.length],[t('customers'),DB.data().customers.length],
         [t('history'),DB.data().sales.length],[t('st_users'),DB.data().users.length]]
         .map(r=>({cells:[r[0],r[1]]}))));

  /* ---------- actions ---------- */
  const pick=el('fsPick');
  if(pick) pick.onclick=async()=>{
    try{
      const name=await FileStore.choose();
      const existing=await FileStore.readFile();
      if(existing){
        confirmBox(LANG==='ar'
          ?'المجلد ده فيه ملف بيانات بالفعل. تحب تفتح البيانات الموجودة فيه؟ (لو اخترت لا، هيتم استبداله ببياناتك الحالية)'
          :'This folder already has a data file. Load it? (Choosing No overwrites it with your current data)',
          async()=>{ await DB.loadFromFile(); render();
                     toast(LANG==='ar'?'تم فتح البيانات من الملف':'Loaded data from file','ok'); });
        const noBtn=document.querySelector('.modal-ft .btn.ghost');
        if(noBtn) noBtn.onclick=async()=>{ closeModal(); await FileStore.writeFile(DB.data());
          render(); toast(LANG==='ar'?'تم ربط المجلد وحفظ بياناتك فيه':'Folder linked, data written','ok'); };
      }else{
        await FileStore.writeFile(DB.data());
        FileStore.startAutoBackup(()=>DB.data());
        render();
        toast((LANG==='ar'?'تم ربط المجلد: ':'Folder linked: ')+name,'ok');
      }
    }catch(e){
      if(e && e.name==='AbortError') return;                    // user closed the picker
      toast(LANG==='ar'?'لم يتم اختيار مجلد':'No folder selected','err');
    }
  };
  const now=el('fsOpen');
  if(now) now.onclick=async()=>{
    try{ await FileStore.writeFile(DB.data()); await FileStore.dailySnapshot(DB.data());
         FileStore.markSynced(true);
         toast(LANG==='ar'?'تم الحفظ في الملف':'Written to file','ok'); }
    catch(e){ toast(LANG==='ar'?'تعذّر الحفظ — اضغط «اختر مجلد» مرة أخرى':'Write failed — pick the folder again','err'); }
  };
  const off=el('fsOff');
  if(off) off.onclick=()=>confirmBox(LANG==='ar'
    ?'إلغاء الربط؟ البيانات هتفضل في الملف، بس النظام هيرجع يحفظ داخل المتصفح فقط.'
    :'Disconnect? The file stays, but the system goes back to browser-only storage.',
    async()=>{ await FileStore.disconnect(); render(); toast(LANG==='ar'?'تم إلغاء الربط':'Disconnected'); });

  el('bkNow').onclick=()=>{
    const blob=new Blob([JSON.stringify(DB.data(),null,1)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='eagle_suit_backup_'+today()+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500); toast(t('m_backup'),'ok');
  };
  el('rsFile').onchange=e=>{
    const f=e.target.files[0]; if(!f)return; const r=new FileReader();
    r.onload=async()=>{ try{ const o=JSON.parse(r.result);
      if(!o.products) throw 0;
      DB.importJSON(o);
      if(window.FileStore && FileStore.connected()) await FileStore.writeFile(o);
      render(); toast(t('m_restored'),'ok');
    }catch(x){ toast(LANG==='ar'?'ملف غير صالح':'Invalid file','err'); } };
    r.readAsText(f);
  };
  el('rsSeed').onclick=()=>confirmBox(LANG==='ar'?'استبدال كل البيانات الحالية بالبيانات الافتراضية؟':'Replace all data with demo data?',
    async()=>{ DB.reset();
      if(window.FileStore && FileStore.connected()) await FileStore.writeFile(DB.data());
      render(); toast(t('m_restored'),'ok'); });
}

function setUsers(root){
  const db=DB.data();
  root.innerHTML=panel(svg('user')+t('st_users'),
    grid([{t:t('seq'),cls:'num',w:'36px'},{t:t('username'),w:'120px'},{t:(LANG==='ar'?'الاسم':'Full name')},
          {t:t('role'),w:'150px'},{t:(LANG==='ar'?'نشط':'Active'),cls:'num',w:'62px'},{t:'',cls:'acts',w:'80px'}],
      db.users.map((u,n)=>({cells:[n+1,esc(u.user),esc(L(u.name)),roleTag(u.role),
        u.active?'<span class="tag ok">'+t('yes')+'</span>':'<span class="tag bad">'+t('no')+'</span>',
        '<button class="btn sm ghost" onclick="editUser('+u.id+')">'+svg('edit')+'</button> '+
        '<button class="btn sm red" onclick="delUser('+u.id+')">'+svg('trash')+'</button>']}))),
    null, btn('uAdd',t('add'),'plus','ghost'));
  el('uAdd').onclick=()=>editUser(0);
}
function editUser(id){
  const db=DB.data();
  const u=id?db.users.find(x=>x.id===id):{id:0,user:'',name:'',role:'seller',pass:'',active:true};
  modal((id?t('edit'):t('add'))+' — '+t('st_users'),
    field(t('username'),'<input id="uU" value="'+esc(u.user)+'">',{req:1})+
    field((LANG==='ar'?'الاسم':'Full name'),'<input id="uN" value="'+esc(u.name)+'">',{req:1})+
    field(t('role'),sel('uR',[{v:'manager',t:t('manager')},{v:'seller',t:t('seller')}],u.role))+
    field(t('password'),'<input id="uP" type="password" value="'+esc(u.pass)+'">')+
    '<div class="f"><label></label><div class="ctl"><label class="chk"><input type="checkbox" id="uA" '+(u.active?'checked':'')+'> '+(LANG==='ar'?'نشط':'Active')+'</label></div></div>',
    '<button class="btn" id="uSave">'+t('save')+'</button><button class="btn ghost" onclick="closeModal()">'+t('cancel')+'</button>',480);
  el('uSave').onclick=()=>{
    const o={user:el('uU').value.trim(),name:el('uN').value.trim(),role:el('uR').value,
             pass:el('uP').value,active:el('uA').checked};
    if(!o.user||!o.name){toast(t('username'),'err');return;}
    if(id) Object.assign(u,o); else db.users.push(Object.assign({id:db.users.reduce((a,b)=>Math.max(a,b.id),0)+1},o));
    DB.save(); closeModal(); render(); toast(t('m_saved'),'ok');
  };
}
function delUser(id){
  const db=DB.data(); const u=db.users.find(x=>x.id===id); if(!u) return;
  if(ME && u.user===ME.user){ toast(LANG==='ar'?'لا يمكن حذف المستخدم الحالي':'You cannot delete the signed-in user','err'); return; }
  if(u.role==='manager' && db.users.filter(x=>x.role==='manager'&&x.active).length<=1){
    toast(LANG==='ar'?'يجب بقاء مدير واحد على الأقل':'At least one manager must remain','err'); return; }
  confirmBox(t('m_conf_del'),()=>{ db.users=db.users.filter(x=>x.id!==id); DB.save(); render(); toast(t('m_deleted'),'ok'); });
}
function roleTag(r){ return r==='manager'
  ? '<span class="tag info">'+t('manager')+'</span>'
  : '<span class="tag ok">'+t('seller')+'</span>'; }
