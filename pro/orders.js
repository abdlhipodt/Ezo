import {collection,doc,onSnapshot,runTransaction,serverTimestamp,query,orderBy,limit} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {data,onData,setPage,ensure} from './stock.js';
const $=i=>document.getElementById(i);
let C=null,page='',cart={},q='',cw='all',OR={},unO=null;
const n=x=>Number(x||0).toLocaleString('en',{maximumFractionDigits:2});
const norm=t=>String(t||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const T0=new Date();T0.setHours(0,0,0,0);
const dd=d=>d?Math.round((new Date(d+'T00:00:00')-T0)/864e5):9999;
const canW=()=>C.P.role==='admin'||C.P.role==='keeper';
const mail=()=>String(C.U.email).toLowerCase();
function err(e){const m=String(e&&e.message||'');if(m.startsWith('short:')){const p=m.split(':');return 'الكمية من '+p[1]+' أكبر من المتبقي ('+n(p[2])+')'}if(m.startsWith('missing:'))return 'صنف محذوف: '+m.slice(8);if(m==='done')return 'هذه الطلبية ملغاة مسبقاً';const c=String(e&&e.code||'');if(c.includes('unavailable')||c.includes('failed-precondition')||c.includes('network'))return 'يلزم اتصال بالإنترنت لتأكيد العملية';return C.msg(e)}
onData(()=>{if(!C)return;if(page==='order')L();else if(page==='home'||page==='log')draw()});
export function stopOrders(){if(unO)unO();unO=null;OR={};closeS()}
function subO(){
  if(unO)return;
  unO=onSnapshot(query(collection(C.db,'orders'),orderBy('createdAt','desc'),limit(100)),s=>{OR={};s.forEach(d=>{OR[d.id]=d.data({serverTimestamps:'estimate'})});if(page==='home'||page==='log')draw()},e=>C.toast(C.msg(e)));
}
export function mountOrders(p,ctx){C=ctx;page=p;setPage('');closeS();ensure(ctx);if(p==='home'||p==='log')subO();draw()}
function draw(){({home:homeV,order:orderV,log:logV,more:moreV})[page]()}
const ts=o=>o.createdAt&&o.createdAt.toDate?o.createdAt.toDate():new Date();
function homeV(){
  const {WH,IT}=data(),it=Object.values(IT);
  const val=a=>a.reduce((s,i)=>s+(i.price||0)*i.rem,0);
  const nr=it.filter(i=>i.rem>0&&dd(i.exp)<=90).sort((a,b)=>dd(a.exp)-dd(b.exp)),lw=it.filter(i=>i.rem<=0||(i.qty>0&&i.rem/i.qty<=.2));
  let m=0;const out={};Object.values(OR).forEach(o=>{if(o.status!=='active'||Date.now()-ts(o)>2592e6)return;m+=o.total||0;o.lines.forEach(l=>{out[l.name]=(out[l.name]||0)+l.qty})});
  const top=Object.keys(out).sort((a,b)=>out[b]-out[a]).slice(0,3),ids=Object.keys(WH);
  const vs=ids.map(k=>val(it.filter(i=>i.wh===k))),mx=Math.max(1,...vs);
  $('pg').innerHTML='<div class="grid"><div class="stat hero"><span>قيمة المخزون</span><b>'+n(val(it))+'</b></div><div class="stat"><span class="m">عدد الأصناف</span><b>'+n(it.length)+'</b></div><div class="stat"><span class="m">مصروف آخر 30 يوم</span><b>'+n(m)+'</b></div><div class="stat"><span class="m">قريب الانتهاء</span><b style="color:var(--bad)">'+nr.length+'</b></div><div class="stat"><span class="m">ناقص أو نافد</span><b style="color:var(--wn)">'+lw.length+'</b></div></div>'+
  (ids.length>1?'<h2>المخازن</h2>'+ids.map((k,j)=>'<div class="card"><div class="r"><b>'+C.esc(WH[k].name)+'</b><span>'+n(vs[j])+'</span></div><div class="bar"><i style="width:'+Math.round(vs[j]/mx*100)+'%"></i></div></div>').join(''):'')+
  '<h2>تنبيهات الانتهاء</h2>'+(nr.length?nr.slice(0,5).map(i=>'<div class="card r"><div><b>'+C.esc(i.name)+'</b><div class="m">'+C.esc((WH[i.wh]||{}).name||'')+' · متبقي '+n(i.rem)+'</div></div><span class="tag '+(dd(i.exp)<=30?'tb':'tw')+'">'+(dd(i.exp)<0?'منتهي':'بعد '+dd(i.exp)+' يوم')+'</span></div>').join(''):'<div class="card m">لا توجد أصناف قريبة الانتهاء.</div>')+
  '<h2>نقص المخزون</h2>'+(lw.length?lw.slice(0,5).map(i=>'<div class="card r"><b>'+C.esc(i.name)+'</b><span class="tag '+(i.rem<=0?'tb':'tw')+'">'+(i.rem<=0?'نافد':'متبقي '+n(i.rem))+'</span></div>').join(''):'<div class="card m">لا يوجد نقص.</div>')+
  '<h2>الأكثر خروجاً</h2>'+(top.length?top.map(k=>'<div class="card r"><span>'+C.esc(k)+'</span><b>'+n(out[k])+'</b></div>').join(''):'<div class="card m">ستظهر بعد أول طلبية.</div>');
}
function orderV(){
  const {WH}=data(),ids=Object.keys(WH);
  $('pg').innerHTML='<div id="otot" class="otot"></div><div class="m" style="margin-bottom:8px">اكتب الكمية بجانب كل صنف مطلوب ثم اضغط تأكيد.</div><select id="ocw"><option value="all">كل المخازن</option>'+ids.map(k=>'<option value="'+k+'"'+(cw===k?' selected':'')+'>'+C.esc(WH[k].name)+'</option>').join('')+'</select><input id="oq" type="search" placeholder="ابحث عن صنف" value="'+C.esc(q)+'"><div id="lst"></div><div id="obar"></div>';
  L();
}
function L(){
  const {WH,IT}=data(),w=norm(q).split(/\s+/).filter(Boolean);
  const ks=Object.keys(IT).filter(k=>{const i=IT[k];if(cw!=='all'&&i.wh!==cw)return false;const h=norm(i.name+' '+i.code+' '+(i.boxes||''));return w.every(x=>h.includes(x))}).sort((a,b)=>IT[a].name.localeCompare(IT[b].name,'ar'));
  $('lst').innerHTML=ks.length?ks.map(k=>{const i=IT[k],v=cart[k]||'';return '<div class="card"><div class="ln" style="border:0;padding:0"><span style="flex:1"><b>'+C.esc(i.name)+'</b><div class="m">'+C.esc((WH[i.wh]||{}).name||'')+' · المتبقي: '+n(i.rem)+'</div><div class="m">السعر: '+n(i.price||0)+' <b class="gold" id="st'+k+'">'+(v>0?'= '+n(v*(i.price||0)):'')+'</b></div></span><input type="number" inputmode="numeric" min="0" placeholder="0" data-qi="'+k+'" value="'+v+'" '+(i.rem<=0||!canW()?'disabled':'')+' style="width:96px;margin:0;text-align:center;font-size:20px;font-weight:700;'+(v>i.rem?'border-color:var(--bad)':'')+'"></div></div>'}).join(''):'<div class="card m">لا توجد أصناف.</div>';
  bar();
}
function bar(){
  const {IT}=data();let t=0,c=0;
  Object.keys(cart).forEach(k=>{const i=IT[k];if(i){c++;t+=cart[k]*(i.price||0)}});
  const b=$('obar'),o=$('otot');
  if(b)b.innerHTML=c&&canW()?'<button class="cartbar" style="left:12px" data-o="cart">تأكيد الطلبية ('+c+' أصناف) · '+n(t)+'</button>':'';
  if(o){o.innerHTML='<span>🧾 '+c+' أصناف</span><span>الإجمالي <b class="gold big">'+n(t)+'</b></span>';if(o._t!==t){o._t=t;o.className='otot';void o.offsetWidth;o.className='otot bump'}}
}
function sheet(h){closeS();const d=document.createElement('div');d.className='sh';d.id='shy';d.onclick=e=>{if(e.target===d)closeS()};d.innerHTML='<div>'+h+'</div>';document.body.appendChild(d)}
function closeS(){const s=$('shy');if(s)s.remove()}
const hd=t=>'<div class="r"><span class="nm" style="font-size:20px">'+t+'</span><button class="s x" data-o="close">إغلاق</button></div>';
function cartSheet(){
  const {IT}=data();let t=0;
  const rows=Object.keys(cart).filter(k=>IT[k]).map(k=>{const i=IT[k];t+=cart[k]*(i.price||0);return '<div class="ln"><span>'+C.esc(i.name)+'<div class="m">'+n(i.price||0)+' × '+n(cart[k])+'</div></span><b class="gold">'+n(cart[k]*(i.price||0))+'</b></div>'}).join('');
  sheet(hd('تأكيد الطلبية')+rows+'<div class="r" style="margin:8px 0"><span>الإجمالي</span><b class="big">'+n(t)+'</b></div><label>اسم المستلم *</label><input id="rn"><label>رقم المستلم *</label><input id="rp" type="tel" inputmode="tel"><div id="re" class="er"></div><div class="g2"><button data-o="confirm">تأكيد وخصم</button><button class="d" data-o="clear">مسح</button></div>');
}
async function confirmOrder(btn){
  const {WH,IT}=data(),name=$('rn').value.trim(),phone=$('rp').value.trim(),er=m=>{$('re').textContent=m};
  if(!name||!phone)return er('اسم المستلم ورقمه مطلوبان');
  const lines=Object.keys(cart).filter(k=>IT[k]).map(k=>({id:k,name:IT[k].name,qty:cart[k],price:IT[k].price===''?0:(IT[k].price||0),wh:IT[k].wh,whName:(WH[IT[k].wh]||{}).name||''}));
  if(!lines.length||lines.some(l=>!(l.qty>0)))return er('كمية غير صحيحة');
  btn.disabled=true;
  try{
    await runTransaction(C.db,async tx=>{
      const rows=[];
      for(const l of lines){const ref=doc(C.db,'items',l.id),s=await tx.get(ref);if(!s.exists())throw new Error('missing:'+l.name);const it=s.data();if(l.qty>it.rem)throw new Error('short:'+it.name+':'+it.rem);rows.push({ref,it,l})}
      rows.forEach(r=>tx.update(r.ref,{rem:r.it.rem-r.l.qty,updatedAt:serverTimestamp()}));
      tx.set(doc(collection(C.db,'orders')),{recipient:name,phone:phone,lines:lines,total:lines.reduce((s,l)=>s+l.qty*l.price,0),status:'active',by:mail(),createdAt:serverTimestamp()});
    });
    cart={};closeS();C.toast('تم تسجيل الطلبية وخصمها من المخزون');if(page==='order')orderV()
  }catch(e){er(err(e));btn.disabled=false}
}
function logV(){
  const ks=Object.keys(OR).sort((a,b)=>ts(OR[b])-ts(OR[a]));
  $('pg').innerHTML=ks.length?ks.map(k=>{const o=OR[k],d=ts(o);
    return '<div class="card" style="'+(o.status!=='active'?'opacity:.6':'')+'"><div class="r"><b>'+C.esc(o.recipient)+'</b><span class="m">'+d.toLocaleDateString('en')+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})+'</span></div><div class="m">'+C.esc(o.phone)+' · '+C.esc(o.by)+'</div>'+o.lines.map(l=>'<div class="r" style="padding:3px 0"><span>'+C.esc(l.name)+' <span class="m">('+C.esc(l.whName)+')</span></span><b>× '+n(l.qty)+'</b></div>').join('')+'<div class="r" style="margin-top:6px"><b>'+n(o.total)+'</b>'+(o.status==='active'?(canW()?'<button class="d x" data-o="cancel" data-id="'+k+'">إلغاء وإرجاع للمخزون</button>':''):'<span class="tag tb">ملغاة</span>')+'</div></div>'}).join(''):'<div class="card m">لا توجد طلبيات بعد.</div>';
}
async function cancelOrder(id,btn){
  if(!confirm('إلغاء الطلبية وإرجاع الكميات للمخزون؟'))return;
  btn.disabled=true;
  try{
    await runTransaction(C.db,async tx=>{
      const oref=doc(C.db,'orders',id),os=await tx.get(oref);if(!os.exists()||os.data().status!=='active')throw new Error('done');
      const rows=[];for(const l of os.data().lines){const ref=doc(C.db,'items',l.id),s=await tx.get(ref);if(s.exists())rows.push({ref,it:s.data(),l})}
      rows.forEach(r=>tx.update(r.ref,{rem:Math.min(r.it.qty,r.it.rem+r.l.qty),updatedAt:serverTimestamp()}));
      tx.update(oref,{status:'cancelled',cancelledBy:mail(),cancelledAt:serverTimestamp()});
    });
    C.toast('تم الإلغاء وإرجاع الكميات')
  }catch(e){C.toast(err(e));btn.disabled=false}
}
function moreV(){
  const L=[['wh','🏭','المخازن','إضافة وإدارة المخازن']].concat(C.P.role==='admin'?[['users','👥','المستخدمون','الصلاحيات والحسابات']]:[],[['me','👤','حسابي','الحساب وتسجيل الخروج']]);
  $('pg').innerHTML=L.map(x=>'<div class="card it r" data-a="nav" data-p="'+x[0]+'"><div><b>'+x[1]+' '+x[2]+'</b><div class="m">'+x[3]+'</div></div><span>‹</span></div>').join('');
}
document.addEventListener('input',e=>{
  const t=e.target;if(!C)return;
  if(t.id==='oq'){q=t.value;L()}
  else if(t.dataset&&t.dataset.qi){const k=t.dataset.qi,v=parseFloat(t.value),i=data().IT[k];if(v>0)cart[k]=v;else delete cart[k];t.style.borderColor=i&&v>i.rem?'var(--bad)':'';const se=$('st'+k);if(se)se.textContent=v>0&&i?'= '+n(v*(i.price||0)):'';bar()}
});
document.addEventListener('change',e=>{if(C&&e.target.id==='ocw'){cw=e.target.value;L()}});
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-o]');if(!b||!C)return;
  const a=b.dataset.o;
  if(a==='close')closeS();else if(a==='cart')cartSheet();else if(a==='clear'){cart={};closeS();if(page==='order')orderV()}
  else if(a==='confirm'&&canW())await confirmOrder(b);else if(a==='cancel'&&canW())await cancelOrder(b.dataset.id,b);
});
