/* Reusable UI helpers — panels, fields, grids, modal, toast, autocomplete */
const el = (id)=>document.getElementById(id);
const esc = (s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg,kind){
  const n=el('toast'); n.textContent=msg; n.className='toast show '+(kind||'');
  clearTimeout(n._t); n._t=setTimeout(()=>n.className='toast '+(kind||''),2400);
}
function modal(title,bodyHTML,footerHTML,width){
  const m=el('modal');
  m.style.width=(width||640)+'px';
  m.innerHTML='<div class="panel-hd">'+esc(title)+'<span class="x" onclick="closeModal()">&times;</span></div>'+
    '<div class="modal-bd">'+bodyHTML+'</div>'+
    (footerHTML!==null?'<div class="modal-ft">'+(footerHTML||'<button class="btn ghost" onclick="closeModal()">'+t('close')+'</button>')+'</div>':'');
  el('modalWrap').classList.add('show');
}
function closeModal(){ el('modalWrap').classList.remove('show'); }
el('modalWrap') && el('modalWrap').addEventListener('mousedown',e=>{ if(e.target.id==='modalWrap') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

function confirmBox(msg,onYes){
  modal(t('confirm'),'<div style="padding:8px 4px;font-size:12.5px">'+esc(msg)+'</div>',
    '<button class="btn red" id="cfYes">'+t('yes')+'</button>'+
    '<button class="btn ghost" onclick="closeModal()">'+t('no')+'</button>');
  el('cfYes').onclick=()=>{ closeModal(); onYes&&onYes(); };
}

/* ---------------------------- builders ---------------------------- */
function panel(title,body,tools,footer){
  return '<div class="panel">'+
    (title?'<div class="panel-hd">'+title+(tools?'<span class="hd-tools">'+tools+'</span>':'')+'</div>':'')+
    '<div class="panel-bd">'+body+'</div>'+
    (footer?'<div class="btnbar">'+footer+'</div>':'')+'</div>';
}
function field(label,ctl,opt){
  opt=opt||{};
  return '<div class="f'+(opt.tall?' tall':'')+'"><label class="'+(opt.req?'req':'')+'">'+label+'</label>'+
    '<div class="ctl">'+ctl+'</div></div>';
}
function inp(id,attrs){ return '<input id="'+id+'" '+(attrs||'')+'>'; }
function sel(id,items,val,attrs){
  return '<select id="'+id+'" '+(attrs||'')+'>'+items.map(o=>{
    const v=(typeof o==='object')?o.v:o, x=(typeof o==='object')?o.t:o;
    return '<option value="'+esc(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(x)+'</option>';
  }).join('')+'</select>';
}
function btn(id,label,icon,cls){
  return '<button class="btn '+(cls||'')+'" id="'+id+'">'+(icon?svg(icon):'')+'<span>'+label+'</span></button>';
}
function counterUp(node,target){
  const dur=700, t0=performance.now(), isInt=Number.isInteger(target);
  (function step(now){
    const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3), v=target*e;
    node.textContent = isInt?Math.round(v).toLocaleString('en-US'):money(v);
    if(k<1) requestAnimationFrame(step);
  })(t0);
}
function grid(cols,rows,opt){
  opt=opt||{};
  let h='<div class="grid-wrap'+(opt.short?' short':'')+'"><table class="grid"><thead><tr>';
  cols.forEach(c=>h+='<th class="'+(c.cls||'')+'"'+(c.w?' style="width:'+c.w+'"':'')+'>'+c.t+'</th>');
  h+='</tr></thead><tbody>';
  if(!rows.length) h+='<tr><td colspan="'+cols.length+'"><div class="empty">'+svg('box')+(opt.empty||t('none'))+'</div></td></tr>';
  else rows.forEach((r,ri)=>h+='<tr class="rowIn" style="animation-delay:'+Math.min(ri*22,420)+'ms"'+(r._attr||'')+'>'+
      r.cells.map((c,i)=>'<td class="'+(cols[i].cls||'')+'">'+c+'</td>').join('')+'</tr>');
  h+='</tbody>'+(opt.foot?'<tfoot><tr>'+opt.foot.map((c,i)=>'<td class="'+(cols[i]&&cols[i].cls||'')+'">'+c+'</td>').join('')+'</tr></tfoot>':'')+'</table></div>';
  return h;
}
function kpi(lab,val,sub,tone,icon){
  return '<div class="kpi '+(tone||'')+'"><div class="k-ico">'+svg(icon||'money')+'</div>'+
    '<div class="k-lab">'+lab+'</div><div class="k-val gold-text">'+val+'</div>'+
    '<div class="k-sub">'+(sub||'&nbsp;')+'</div></div>';
}
function barRow(lab,pct,val){
  return '<div class="bar-row"><span class="lab" title="'+esc(lab)+'">'+esc(lab)+'</span>'+
    '<span class="bar"><i style="width:'+Math.max(2,pct)+'%"></i></span>'+
    '<span class="val">'+val+'</span></div>';
}
function tagFor(st){
  return st==='avail'
    ? '<span class="tag ok">'+t('avail')+'</span>'
    : '<span class="tag bad">'+t('out')+'</span>';
}
function payName(p){ return t(p)||p; }

/* --------------------- dark autocomplete (as in the original) --------------------- */
function attachAC(inputId,getList,onPick){
  const i=el(inputId); if(!i) return;
  const wrap=i.parentElement; wrap.classList.add('ac-wrap');
  let box=wrap.querySelector('.ac');
  if(!box){ box=document.createElement('div'); box.className='ac'; wrap.appendChild(box); }
  let idx=-1, cur=[];
  function render(list){
    cur=list; idx=-1;
    box.innerHTML=list.map((o,n)=>'<div data-n="'+n+'">'+esc(o.label)+(o.sub?' <small>'+esc(o.sub)+'</small>':'')+'</div>').join('');
    box.classList.toggle('show',list.length>0);
  }
  function pick(n){ if(!cur[n])return; box.classList.remove('show'); onPick(cur[n].item); }
  i.addEventListener('input',()=>render(getList(i.value)));
  i.addEventListener('focus',()=>render(getList(i.value)));
  i.addEventListener('blur',()=>setTimeout(()=>box.classList.remove('show'),180));
  i.addEventListener('keydown',e=>{
    if(!box.classList.contains('show'))return;
    const ds=[...box.children];
    if(e.key==='ArrowDown'){idx=Math.min(idx+1,ds.length-1);}
    else if(e.key==='ArrowUp'){idx=Math.max(idx-1,0);}
    else if(e.key==='Enter'){ if(idx>=0){e.preventDefault();pick(idx);} return; }
    else return;
    e.preventDefault(); ds.forEach(x=>x.classList.remove('hi'));
    if(ds[idx]){ds[idx].classList.add('hi');ds[idx].scrollIntoView({block:'nearest'});}
  });
  box.addEventListener('mousedown',e=>{ const dv=e.target.closest('div[data-n]'); if(dv) pick(+dv.dataset.n); });
}

/* CSV export (offline, no libraries) */
function exportCSV(filename,cols,rows){
  const bom='\uFEFF';
  const csv=[cols.join(',')].concat(rows.map(r=>r.map(v=>{
    v=String(v==null?'':v).replace(/<[^>]+>/g,'').replace(/"/g,'""');
    return /[",\n]/.test(v)?'"'+v+'"':v;
  }).join(','))).join('\r\n');
  const b=new Blob([bom+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast(t('export')+' ✔','ok');
}
