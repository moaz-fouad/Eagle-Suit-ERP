/* ============================================================================
   FILE STORE  —  saves the database as a REAL file in a folder you choose.

   Why: localStorage lives inside Chrome's hidden profile folder. You can't see
   it, copy it, or put it on a USB stick — and "Clear browsing data" wipes it.

   How: you pick a folder ONCE (e.g. C:\EagleSuit\data). From then on every
   change writes  eagle_data.json  into that folder automatically. The folder
   handle is remembered in IndexedDB so it survives restarts.

   localStorage is still written as a fast local mirror / fallback.
   ========================================================================== */
const FileStore = (function(){
  const IDB='eagle_fs_v1', STORE='handles', FILE='eagle_data.json';
  let dirHandle=null, lastWrite=null, writing=false, pending=false, timer=null;

  /* ---------------- tiny IndexedDB wrapper (to persist the handle) --------- */
  function idb(){
    return new Promise((res,rej)=>{
      const q=indexedDB.open(IDB,1);
      q.onupgradeneeded=()=>{ if(!q.result.objectStoreNames.contains(STORE)) q.result.createObjectStore(STORE); };
      q.onsuccess=()=>res(q.result);
      q.onerror=()=>rej(q.error);
    });
  }
  async function idbPut(k,v){
    const db=await idb();
    return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(v,k); tx.oncomplete=()=>{db.close();res();}; tx.onerror=()=>rej(tx.error); });
  }
  async function idbGet(k){
    const db=await idb();
    return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readonly');
      const r=tx.objectStore(STORE).get(k); r.onsuccess=()=>{db.close();res(r.result||null);}; r.onerror=()=>rej(r.error); });
  }
  async function idbDel(k){
    const db=await idb();
    return new Promise((res)=>{ const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(k); tx.oncomplete=()=>{db.close();res();}; tx.onerror=()=>res(); });
  }

  const supported = ()=> typeof window.showDirectoryPicker==='function';
  const connected = ()=> !!dirHandle;
  const info = ()=>({supported:supported(),connected:connected(),
                     name:dirHandle?dirHandle.name:'', file:FILE, last:lastWrite});

  /* ---------------- connect / disconnect ---------------- */
  async function choose(){
    if(!supported()) throw new Error('unsupported');
    const h=await window.showDirectoryPicker({mode:'readwrite',id:'eagle_suit_data'});
    const perm=await h.requestPermission({mode:'readwrite'});
    if(perm!=='granted') throw new Error('denied');
    dirHandle=h;
    /* Remembering the handle is a convenience, not a requirement — if the
       browser refuses to store it we still work for this session.          */
    try{ await idbPut('dir',h); }catch(e){ console.warn('handle not persisted',e); }
    return h.name;
  }
  async function disconnect(){ dirHandle=null; lastWrite=null; try{ await idbDel('dir'); }catch(e){} }

  /* Re-attach a previously chosen folder. Returns:
     'granted'  ready to use
     'prompt'   folder remembered but Chrome needs one click to re-allow
     'none'     no folder chosen yet / not supported                        */
  async function restore(){
    if(!supported()) return 'none';
    let h=null; try{ h=await idbGet('dir'); }catch(e){ return 'none'; }
    if(!h) return 'none';
    dirHandle=h;
    try{
      const p=await h.queryPermission({mode:'readwrite'});
      if(p==='granted') return 'granted';
      return 'prompt';
    }catch(e){ return 'prompt'; }
  }
  async function regrant(){            // must be called from a click
    if(!dirHandle) return false;
    try{ return (await dirHandle.requestPermission({mode:'readwrite'}))==='granted'; }
    catch(e){ return false; }
  }

  /* ---------------- read / write ---------------- */
  async function readFile(){
    if(!dirHandle) return null;
    try{
      const fh=await dirHandle.getFileHandle(FILE,{create:false});
      const txt=await (await fh.getFile()).text();
      if(!txt.trim()) return null;
      const o=JSON.parse(txt);
      return (o && o.products) ? o : null;
    }catch(e){ return null; }              // file simply not there yet
  }
  async function writeFile(obj){
    if(!dirHandle) return false;
    const fh=await dirHandle.getFileHandle(FILE,{create:true});
    const w=await fh.createWritable();
    await w.write(new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}));
    await w.close();
    lastWrite=new Date();
    return true;
  }
  /* Debounced auto-save: many rapid edits collapse into one disk write. */
  function scheduleWrite(getObj){
    if(!dirHandle) return;
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      if(writing){ pending=true; return; }
      writing=true;
      try{ await writeFile(getObj()); markSynced(true); }
      catch(e){ markSynced(false,e); }
      writing=false;
      if(pending){ pending=false; scheduleWrite(getObj); }
    },400);
  }
  /* ============================================================
     AUTOMATIC DAILY BACKUP  —  fires at 00:00 every night.

     The app is a page, so it can only act while it is open. Two safety
     nets cover the rest:
       1. a timer that wakes exactly at the next midnight,
       2. a catch-up on launch: if a day was missed (PC was off), the
          backup is written as soon as the system is opened again.
     Old snapshots are pruned so the folder never grows forever.
     ============================================================ */
  const KEEP_DAYS = 60;

  function stampOf(d){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  async function dailySnapshot(obj,stamp){
    if(!dirHandle) return false;
    stamp = stamp || stampOf(new Date());
    if(localStorage.getItem('es_snap')===stamp) return false;   // already done today
    try{
      const sub=await dirHandle.getDirectoryHandle('backups',{create:true});
      const fh=await sub.getFileHandle('eagle_'+stamp+'.json',{create:true});
      const w=await fh.createWritable();
      await w.write(new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}));
      await w.close();
      localStorage.setItem('es_snap',stamp);
      localStorage.setItem('es_snap_at',new Date().toISOString());
      pruneOld(sub);
      return true;
    }catch(e){ return false; }
  }
  /* delete snapshots older than KEEP_DAYS */
  async function pruneOld(sub){
    try{
      const cut=new Date(); cut.setDate(cut.getDate()-KEEP_DAYS);
      const cutStamp=stampOf(cut);
      for await (const [name,h] of sub.entries()){
        const m=/^eagle_(\d{4}-\d{2}-\d{2})\.json$/.exec(name);
        if(m && m[1] < cutStamp){ try{ await sub.removeEntry(name); }catch(e){} }
      }
    }catch(e){}
  }
  function lastSnapshot(){
    const d=localStorage.getItem('es_snap'), at=localStorage.getItem('es_snap_at');
    return d ? {date:d, at:at?new Date(at):null} : null;
  }

  let midnightTimer=null;
  /* Run the backup for any day that was missed, then arm the midnight timer. */
  async function startAutoBackup(getObj){
    if(!dirHandle) return;
    const today=stampOf(new Date());
    const done=localStorage.getItem('es_snap');
    if(done!==today){
      /* Missed one or more nights (or first run today) — catch up now. */
      const ok=await dailySnapshot(getObj(), today);
      if(ok && typeof toast==='function'){
        toast(LANG==='ar' ? 'تم عمل نسخة احتياطية تلقائية' : 'Automatic backup created','ok');
      }
    }
    armMidnight(getObj);
  }
  function armMidnight(getObj){
    clearTimeout(midnightTimer);
    const now=new Date();
    const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,30); // 00:00:30
    let ms=next-now;
    /* setTimeout tops out around 24.8 days; ours is always < 24h, but if the
       machine sleeps the timer may fire late — the stamp check keeps it safe. */
    midnightTimer=setTimeout(async()=>{
      const ok=await dailySnapshot(getObj(), stampOf(new Date()));
      if(ok && typeof toast==='function'){
        toast(LANG==='ar' ? 'نسخة احتياطية تلقائية (12 ص)' : 'Automatic backup (12 AM)','ok');
      }
      armMidnight(getObj);                       // re-arm for the following night
    }, ms);
    return ms;
  }
  /* A laptop that was asleep at midnight resumes with a stale timer, so also
     re-check whenever the tab becomes visible again. */
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible' && dirHandle && window.DB){
      const today=stampOf(new Date());
      if(localStorage.getItem('es_snap')!==today) dailySnapshot(DB.data(), today);
    }
  });

  function markSynced(ok,err){
    const n=document.getElementById('syncDot'); if(!n) return;
    n.className='sync-dot '+(ok?'ok':'bad');
    n.title=ok ? (LANG==='ar'?'محفوظ في الملف — '+lastWrite.toLocaleTimeString('en-GB')
                             :'Saved to file — '+lastWrite.toLocaleTimeString('en-GB'))
               : (LANG==='ar'?'تعذّر الحفظ في الملف':'Could not write the file');
  }
  return {supported,connected,info,choose,disconnect,restore,regrant,
          startAutoBackup,lastSnapshot,stampOf,
          readFile,writeFile,scheduleWrite,dailySnapshot,markSynced,FILE};
})();

/* `const` declarations do not become window properties, so export explicitly.
   Everything else in the app guards on `window.FileStore`.                  */
window.FileStore = FileStore;
