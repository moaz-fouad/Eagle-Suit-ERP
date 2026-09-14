/* ============================================================
   AUTH + PERMISSIONS
   Two roles only:
     manager (مدير)  -> full access to every window
     seller  (بائع)  -> Sales Invoice ONLY
   ============================================================ */
const ROLES = {
  manager:{ ar:'Osama', en:'Osama',       allow:['invoice','inventory','customers','history','expenses','reports','settings'] },
  seller :{ ar:'بائع',  en:'Salesperson', allow:['invoice'] }
};
let ME = null;               // {user,name,role}
let PICKED = 'manager';

function can(mod){ return !!(ME && ROLES[ME.role].allow.includes(mod)); }
function isManager(){ return ME && ME.role==='manager'; }

function drawWho(){
  const w=el('whoPick'); if(!w) return;
  w.innerHTML = Object.keys(ROLES).map(k=>
    '<div class="who-btn'+(PICKED===k?' on':'')+'" data-r="'+k+'">'+
      svg(k==='manager'?'shield':'user')+
      '<b>'+(LANG==='ar'?ROLES[k].ar:ROLES[k].en)+'</b>'+
      '<small>'+(k==='manager'
        ? (LANG==='ar'?'كل الشاشات':'Full access')
        : (LANG==='ar'?'فاتورة البيع فقط':'Invoice only'))+'</small>'+
    '</div>').join('');
  w.querySelectorAll('.who-btn').forEach(b=>b.onclick=()=>{
    PICKED=b.dataset.r; drawWho();
    const u=DB.data().users.find(x=>x.role===PICKED && x.active);
    el('lgUser').value=u?u.user:''; el('lgPass').value=''; el('lgPass').focus();
  });
}
function drawLoginTexts(){
  el('lbUser').textContent = LANG==='ar'?'اسم المستخدم':'User name';
  el('lbPass').textContent = LANG==='ar'?'كلمة المرور':'Password';
  el('lgGoTxt').textContent = LANG==='ar'?'دخول':'Sign in';
  el('lgHint').innerHTML = (LANG==='ar'?'بيانات الدخول الافتراضية':'Default credentials')+
    '<br><code>admin / 1234</code> &nbsp; <code>sales / 1111</code>';
  drawWho();
}
function tryLogin(){
  const u=el('lgUser').value.trim(), p=el('lgPass').value;
  const found=DB.data().users.find(x=>x.user.toLowerCase()===u.toLowerCase() && x.active);
  const fail=(m)=>{ el('lgErr').textContent=m;
    el('loginCard').classList.remove('shake'); void el('loginCard').offsetWidth;
    el('loginCard').classList.add('shake'); };
  if(!found)          return fail(LANG==='ar'?'اسم المستخدم غير موجود':'User not found');
  if(found.pass!==p)  return fail(LANG==='ar'?'كلمة المرور غير صحيحة':'Wrong password');
  el('lgErr').textContent='';
  ME={user:found.user,name:found.name,role:found.role};
  sessionStorage.setItem('es_me',JSON.stringify(ME));
  enterApp();
}
function enterApp(){
  el('login').style.display='none';
  el('app').classList.add('on');
  CUR = can('invoice') ? 'invoice' : ROLES[ME.role].allow[0];
  CURTAB = 0;
  render(); tick();
  toast((LANG==='ar'?'أهلاً ':'Welcome ')+L(ME.name).split('/')[0].trim(),'ok');
}
function logout(){
  confirmBox(LANG==='ar'?'تسجيل الخروج من النظام؟':'Sign out of the system?',()=>{
    ME=null; sessionStorage.removeItem('es_me');
    el('app').classList.remove('on'); el('login').style.display='flex';
    el('lgPass').value=''; el('lgErr').textContent='';
    drawLoginTexts();
  });
}
function bootAuth(){
  drawLoginTexts();
  const u=DB.data().users.find(x=>x.role==='manager'&&x.active);
  el('lgUser').value=u?u.user:'';
  el('lgGo').onclick=tryLogin;
  ['lgUser','lgPass'].forEach(id=>el(id).addEventListener('keydown',e=>{ if(e.key==='Enter') tryLogin(); }));
  const saved=sessionStorage.getItem('es_me');
  if(saved){ try{ ME=JSON.parse(saved); if(ROLES[ME.role]) return enterApp(); }catch(e){} }
  setTimeout(()=>el('lgPass').focus(),400);
}
