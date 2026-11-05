import {collection,doc,onSnapshot,runTransaction,serverTimestamp,query,orderBy,limit,getDocs,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {data,onData,setPage,curPage,ensure,flags,isPerm,mkMove,loadXL,exTag} from './stock.js';
const $=i=>document.getElementById(i);
let C=null,page='',cart={},q='',cw='all',sel=false,lv='orders',mq='',OR={},MV=[],MVE='',BK,V=null,unO=null,unM=null;
const n=x=>Number(x||0).toLocaleString('en',{maximumFractionDigits:2});
const norm=t=>String(t||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const T0=new Date();T0.setHours(0,0,0,0);
const dd=d=>d?Math.round((new Date(d+'T00:00:00')-T0)/864e5):9999;
const canW=()=>C.P.role==='admin'||C.P.role==='keeper';
const mail=()=>String(C.U.email).toLowerCase();
const pad=x=>x?String(x).padStart(4,'0'):'—';
const ts=o=>o.createdAt&&o.createdAt.toDate?o.createdAt.toDate():new Date();
const fd=d=>d.toLocaleDateString('en')+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
function err(e){const m=String(e&&e.message||'');if(m.startsWith('short:')){const p=m.split(':');return 'الكمية من '+p[1]+' أكبر من المتبقي ('+n(p[2])+')'}if(m.startsWith('missing:'))return 'صنف محذوف: '+m.slice(8);if(m==='done')return 'هذه الطلبية ملغاة مسبقاً';const c=String(e&&e.code||'');if(c.includes('unavailable')||c.includes('failed-precondition')||c.includes('network'))return 'يلزم اتصال بالإنترنت لتأكيد العملية';return C.msg(e)}
const act=()=>!curPage();
onData(()=>{if(!C||!act())return;if(page==='order')L();else if(page==='home'||page==='log')draw()});
export function stopOrders(){if(unO)unO();if(unM)unM();unO=unM=null;OR={};MV=[];MVE='';BK=undefined;cart={};q='';cw='all';sel=false;lv='orders';mq='';closeS()}
function subO(){
  if(unO)return;
  unO=onSnapshot(query(collection(C.db,'orders'),orderBy('createdAt','desc'),limit(100)),s=>{OR={};s.forEach(d=>{OR[d.id]=d.data({serverTimestamps:'estimate'})});if(act()&&(page==='home'||page==='log'))draw()},e=>C.toast(C.msg(e)));
}
function subM(){
  if(unM)return;
  unM=onSnapshot(query(collection(C.db,'moves'),orderBy('createdAt','desc'),limit(200)),s=>{MV=[];s.forEach(d=>{MV.push(d.data({serverTimestamps:'estimate'}))});MVE='';if(act()&&page==='log'&&lv==='moves')draw()},e=>{MVE=isPerm(e)?'rules':'err';if(act()&&page==='log'&&lv==='moves')draw()});
}
function loadBK(){
  BK=null;
  getDoc(doc(C.db,'meta','backup')).then(s=>{BK=s.exists()&&s.data().lastAt&&s.data().lastAt.toDate?s.data().lastAt.toDate():null;if(act()&&page==='home')draw()}).catch(()=>{BK=false});
}
export function mountOrders(p,ctx){
  C=ctx;page=p;setPage('');closeS();ensure(ctx);
  if(p==='home'||p==='log')subO();
  if(p==='log'&&lv==='moves')subM();
  if(p==='home'&&C.P.role==='admin'&&BK===undefined)loadBK();
  draw();
}
function draw(){({home:homeV,order:orderV,log:logV,more:moreV})[page]()}

/* ---------- الرئيسية ---------- */
const bkCard=()=>{
  if(C.P.role!=='admin'||BK===undefined||BK===false)return '';
  const d=BK?Math.floor((Date.now()-BK)/864e5):null;if(d!==null&&d<7)return '';
  return '<div class="card r"><div><b>النسخ الاحتياطي</b><div class="m">'+(d===null?'لم تؤخذ نسخة بعد':'آخر نسخة قبل '+d+' يوم')+'</div></div><button class="x" data-o="bk">نسخ الآن</button></div>';
};
function homeV(){
  const {WH,IT}=data(),it=Object.values(IT);
  const val=a=>a.reduce((s,i)=>s+(i.price||0)*i.rem,0);
  const nr=it.filter(i=>i.rem>0&&dd(i.exp)<=90).sort((a,b)=>dd(a.exp)-dd(b.exp)),lw=it.filter(i=>i.rem<=0||(i.qty>0&&i.rem/i.qty<=.2));
  let m=0;const out={};Object.values(OR).forEach(o=>{if(o.status!=='active'||Date.now()-ts(o)>2592e6)return;m+=o.total||0;o.lines.forEach(l=>{out[l.name]=(out[l.name]||0)+l.qty})});
  const top=Object.keys(out).sort((a,b)=>out[b]-out[a]).slice(0,3),ids=Object.keys(WH);
  const vs=ids.map(k=>val(it.filter(i=>i.wh===k))),mx=Math.max(1,...vs);
  $('pg').innerHTML='<div class="grid"><div class="stat key"><span>قيمة المخزون</span><b>'+n(val(it))+'</b></div><div class="stat"><span class="m">عدد الأصناف</span><b>'+n(it.length)+'</b></div><div class="stat"><span class="m">مصروف آخر 30 يوم</span><b>'+n(m)+'</b></div><div class="stat"><span class="m">قريب الانتهاء</span><b style="color:var(--bad)">'+nr.length+'</b></div><div class="stat"><span class="m">ناقص أو نافد</span><b style="color:var(--wn)">'+lw.length+'</b></div></div>'+bkCard()+
  (ids.length>1?'<h2>المخازن</h2>'+ids.map((k,j)=>'<div class="card"><div class="r"><b>'+C.esc(WH[k].name)+'</b><span>'+n(vs[j])+'</span></div><div class="bar"><i style="width:'+Math.round(vs[j]/mx*100)+'%"></i></div></div>').join(''):'')+
  '<h2>تنبيهات الانتهاء</h2>'+(nr.length?nr.slice(0,5).map(i=>'<div class="card r"><div><b>'+C.esc(i.name)+'</b><div class="m">'+C.esc((WH[i.wh]||{}).name||'')+' · متبقي '+n(i.rem)+'</div></div><span class="tag '+(dd(i.exp)<=30?'tb':'tw')+'">'+(dd(i.exp)<0?'منتهي':'بعد '+dd(i.exp)+' يوم')+'</span></div>').join(''):'<div class="card m">لا توجد أصناف قريبة الانتهاء.</div>')+
  '<h2>نقص المخزون</h2>'+(lw.length?lw.slice(0,5).map(i=>'<div class="card r"><b>'+C.esc(i.name)+'</b><span class="tag '+(i.rem<=0?'tb':'tw')+'">'+(i.rem<=0?'نافد':'متبقي '+n(i.rem))+'</span></div>').join(''):'<div class="card m">لا يوجد نقص.</div>')+
  '<h2>الأكثر خروجاً</h2>'+(top.length?top.map(k=>'<div class="card r"><span>'+C.esc(k)+'</span><b>'+n(out[k])+'</b></div>').join(''):'<div class="card m">ستظهر بعد أول طلبية.</div>');
}

/* ---------- صفحة الطلبية: كل الأصناف ---------- */
function orderV(){
  const {WH}=data(),ids=Object.keys(WH);
  $('pg').innerHTML='<div id="otot" class="otot"></div><div class="m" style="margin-bottom:10px">كل الأصناف أمامك مجمّعة حسب الكرتون. اضغط + أو اكتب الكمية، ويظهر السعر والإجمالي تلقائياً.</div><div class="r" style="gap:8px;margin-bottom:10px"><select id="ocw" style="flex:1;margin:0"><option value="all">كل المخازن</option>'+ids.map(k=>'<option value="'+k+'"'+(cw===k?' selected':'')+'>'+C.esc(WH[k].name)+'</option>').join('')+'</select><button class="s x" id="osel" data-o="sel" style="flex:none"></button></div><input id="oq" type="search" placeholder="ابحث بالاسم أو الكود أو رقم الكرتون" value="'+C.esc(q)+'"><div id="lst"></div><div id="obar"></div>';
  L();
}
function row(k,i,WH){
  const v=cart[k]||'',out=i.rem<=0,dis=out||!canW();
  const meta=[(WH[i.wh]||{}).name,i.company,i.code].filter(Boolean).map(x=>C.esc(x)).join(' · ');
  return '<div class="card ord'+(v>0?' pick':'')+'" id="r'+k+'"><div class="r"><b>'+C.esc(i.name)+'</b>'+(out?'<span class="tag tb">نافد</span>':exTag(i))+'</div><div class="m">'+meta+'</div><div class="m">المتبقي: <b>'+n(i.rem)+'</b> · السعر: <b>'+n(i.price||0)+'</b></div><div class="r" style="margin-top:10px"><div class="stp"><button class="s" data-o="dec" data-id="'+k+'"'+(dis?' disabled':'')+' aria-label="إنقاص">−</button><input type="number" inputmode="numeric" min="0" placeholder="0" data-qi="'+k+'" value="'+v+'"'+(dis?' disabled':'')+'><button data-o="inc" data-id="'+k+'"'+(dis?' disabled':'')+' aria-label="زيادة">+</button></div><b class="gold big" id="st'+k+'">'+(v>0?n(v*(i.price||0)):'')+'</b></div></div>';
}
function L(){
  const {WH,IT}=data(),w=norm(q).split(/\s+/).filter(Boolean);
  const ks=Object.keys(IT).filter(k=>{const i=IT[k];if(cw!=='all'&&i.wh!==cw)return false;if(sel&&!(cart[k]>0))return false;const h=norm(i.name+' '+i.code+' '+i.company+' '+(i.boxes||''));return w.every(x=>h.includes(x))});
  const G={};ks.forEach(k=>{const b=String(IT[k].boxes||'').trim();(G[b]=G[b]||[]).push(k)});
  const gk=Object.keys(G).sort((a,b)=>(a===''?1:0)-(b===''?1:0)||a.localeCompare(b,'ar',{numeric:true}));
  $('lst').innerHTML=gk.length?gk.map(b=>'<div class="grp"><span>'+(b?'كرتون <b>'+C.esc(b)+'</b>':'بدون رقم كرتون')+'</span><span>'+G[b].length+' صنف</span></div>'+G[b].sort((a,c)=>IT[a].name.localeCompare(IT[c].name,'ar')).map(k=>row(k,IT[k],WH)).join('')).join(''):'<div class="card m">'+(sel?'لم تحدد أي صنف بعد.':'لا توجد أصناف.')+'</div>';
  bar();
}
function setQ(k,v,fromInput){
  const i=data().IT[k];if(!i)return;v=Math.max(0,v||0);
  if(v>0)cart[k]=v;else delete cart[k];
  const e=document.querySelector('[data-qi="'+k+'"]');
  if(e){if(!fromInput)e.value=v>0?v:'';e.style.borderColor=v>i.rem?'var(--bad)':''}
  const se=$('st'+k);if(se)se.textContent=v>0?n(v*(i.price||0)):'';
  const r=$('r'+k);if(r)r.classList.toggle('pick',v>0);
  bar();
}
function bar(){
  const {IT}=data();let t=0,c=0;
  Object.keys(cart).forEach(k=>{const i=IT[k];if(i){c++;t+=cart[k]*(i.price||0)}});
  const b=$('obar'),o=$('otot'),so=$('osel');
  if(so)so.textContent=sel?'عرض الكل':'المحدد فقط'+(c?' ('+c+')':'');
  if(b)b.innerHTML=c&&canW()?'<button class="cartbar" style="left:12px" data-o="cart">تأكيد الطلبية ('+c+' أصناف) · '+n(t)+'</button>':'';
  if(o){o.innerHTML='<span>'+c+' أصناف</span><span>الإجمالي <b class="gold big">'+n(t)+'</b></span>';if(o._t!==t){o._t=t;o.className='otot';void o.offsetWidth;o.className='otot bump'}}
}
function sheet(h){closeS();const d=document.createElement('div');d.className='sh';d.id='shy';d.onclick=e=>{if(e.target===d)closeS()};d.innerHTML='<div>'+h+'</div>';document.body.appendChild(d)}
function closeS(){const s=$('shy');if(s)s.remove()}
const hd=t=>'<div class="r noprint"><span class="nm" style="font-size:20px">'+t+'</span><button class="s x" data-o="close">إغلاق</button></div>';
function cartSheet(){
  const {IT}=data();let t=0;
  const rows=Object.keys(cart).filter(k=>IT[k]).map(k=>{const i=IT[k];t+=cart[k]*(i.price||0);return '<div class="ln"><span>'+C.esc(i.name)+'<div class="m">'+n(i.price||0)+' × '+n(cart[k])+'</div></span><b class="gold">'+n(cart[k]*(i.price||0))+'</b></div>'}).join('');
  sheet(hd('تأكيد الطلبية')+rows+'<div class="r" style="margin:8px 0"><span>الإجمالي</span><b class="big">'+n(t)+'</b></div><label>اسم المستلم *</label><input id="rn"><label>رقم المستلم *</label><input id="rp" type="tel" inputmode="tel"><div id="re" class="er"></div><div class="g2"><button data-o="confirm">تأكيد وخصم</button><button class="d" data-o="clear">مسح</button></div>');
}
async function confirmOrder(btn){
  const {WH,IT}=data(),name=$('rn').value.trim(),phone=$('rp').value.trim(),er=m=>{$('re').textContent=m};
  if(!name||!phone)return er('اسم المستلم ورقمه مطلوبان');
  const lines=Object.keys(cart).filter(k=>IT[k]).map(k=>({id:k,name:IT[k].name,box:IT[k].boxes||'',qty:cart[k],price:IT[k].price===''?0:(IT[k].price||0),wh:IT[k].wh,whName:(WH[IT[k].wh]||{}).name||''}));
  if(!lines.length||lines.some(l=>!(l.qty>0)))return er('كمية غير صحيحة');
  btn.disabled=true;
  const oref=doc(collection(C.db,'orders')),total=lines.reduce((s,l)=>s+l.qty*l.price,0);let no=null;
  const run=async x=>{
    no=null;
    await runTransaction(C.db,async tx=>{
      const rows=[];
      for(const l of lines){const ref=doc(C.db,'items',l.id),s=await tx.get(ref);if(!s.exists())throw new Error('missing:'+l.name);const it=s.data();if(l.qty>it.rem)throw new Error('short:'+it.name+':'+it.rem);rows.push({ref,it,l})}
      let cref=null;
      if(x){cref=doc(C.db,'meta','counters');const cs=await tx.get(cref);no=((cs.exists()?cs.data().voucher:0)||0)+1}
      rows.forEach(r=>{
        tx.update(r.ref,{rem:r.it.rem-r.l.qty,updatedAt:serverTimestamp()});
        if(x)tx.set(doc(collection(C.db,'moves')),mkMove({id:r.l.id,name:r.it.name,wh:r.it.wh},'issue',-r.l.qty,r.it.rem,r.it.rem-r.l.qty,{order:no,recipient:name}));
      });
      if(x)tx.set(cref,{voucher:no},{merge:true});
      tx.set(oref,{recipient:name,phone:phone,lines:lines,total:total,status:'active',no:x?no:null,by:mail(),createdAt:serverTimestamp()});
    });
  };
  try{
    if(flags.noMoves)await run(false);
    else{try{await run(true)}catch(e){if(isPerm(e)){await run(false);flags.noMoves=true}else throw e}}
    const o={recipient:name,phone:phone,lines:lines,total:total,status:'active',no:no,by:mail()};
    cart={};closeS();C.toast('تم تسجيل الطلبية وخصمها من المخزون');if(page==='order')orderV();vSheet(o)
  }catch(e){er(err(e));btn.disabled=false}
}

/* ---------- السند ---------- */
function vHtml(o){
  const d=ts(o),rows=o.lines.map((l,ix)=>'<tr><td>'+(ix+1)+'</td><td>'+C.esc(l.name)+'</td><td>'+C.esc(l.box||'')+'</td><td>'+n(l.qty)+'</td><td>'+n(l.price)+'</td><td>'+n(l.qty*l.price)+'</td></tr>').join('');
  return '<div id="vch" class="vch"><div class="vh"><div class="lg">EZO</div><div class="vt1"><b>EZO MEDIKAL</b><div class="m">سند بيع / صرف</div></div><div class="vno"><span class="m">رقم السند</span><b>'+pad(o.no)+'</b></div></div><div class="vm"><div><span class="m">التاريخ</span> '+fd(d)+'</div><div><span class="m">المستلم</span> <b>'+C.esc(o.recipient)+'</b></div><div><span class="m">رقم المستلم</span> '+C.esc(o.phone)+'</div></div><div style="overflow-x:auto"><table class="vt"><tr><th>#</th><th>الصنف</th><th>الكرتون</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>'+rows+'</table></div><div class="vtot"><span>الإجمالي</span><b>'+n(o.total)+'</b></div><div class="vsig"><div>المستلم<i></i></div><div>أمين المخزن<i></i></div></div><div class="vft">تصميم وتطوير عبدالله إبراهيم سفيان</div></div>';
}
function vSheet(o){V=o;sheet(hd('سند الطلبية')+vHtml(o)+'<div class="g2 noprint" style="margin-top:14px"><button data-o="vprint">طباعة / PDF</button><button class="s" data-o="vshare">مشاركة</button></div>')}
function vShare(){
  if(!V)return;
  const t='EZO MEDIKAL\nسند رقم '+pad(V.no)+'\nالتاريخ: '+fd(ts(V))+'\nالمستلم: '+V.recipient+' ('+V.phone+')\n'+V.lines.map(l=>'- '+l.name+(l.box?' [كرتون '+l.box+']':'')+' × '+n(l.qty)+' = '+n(l.qty*l.price)).join('\n')+'\nالإجمالي: '+n(V.total);
  if(navigator.share)navigator.share({title:'سند '+pad(V.no),text:t}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>C.toast('تم نسخ السند'));
}

/* ---------- السجل: الطلبيات والحركات ---------- */
const MT={create:['إضافة صنف','to'],receive:['استلام','to'],return:['إرجاع','to'],adjust:['تعديل','tc'],issue:['صرف','tw'],delete:['حذف','tb']};
function logV(){
  const lg=$('lgb');
  if(lg&&lg.dataset.lv===lv){fillLog();return}
  $('pg').innerHTML='<div class="seg"><button class="'+(lv==='orders'?'on':'')+'" data-o="lv" data-v="orders">الطلبيات</button><button class="'+(lv==='moves'?'on':'')+'" data-o="lv" data-v="moves">حركات المخزون</button></div>'+(lv==='moves'?'<input id="mq" type="search" placeholder="ابحث باسم الصنف أو المستلم" value="'+C.esc(mq)+'">':'')+'<div id="lgb" data-lv="'+lv+'"></div>';
  fillLog();
}
function fillLog(){$('lgb').innerHTML=lv==='orders'?ordersHtml():movesHtml()}
function ordersHtml(){
  const ks=Object.keys(OR).sort((a,b)=>ts(OR[b])-ts(OR[a]));
  return ks.length?ks.map(k=>{const o=OR[k],d=ts(o);
    return '<div class="card" style="'+(o.status!=='active'?'opacity:.65':'')+'"><div class="r"><b>'+C.esc(o.recipient)+'</b><span class="m">'+fd(d)+'</span></div><div class="m">'+(o.no?'سند '+pad(o.no)+' · ':'')+C.esc(o.phone)+' · '+C.esc(o.by)+'</div>'+o.lines.map(l=>'<div class="r" style="padding:3px 0"><span>'+C.esc(l.name)+(l.box?' <span class="tag tc">'+C.esc(l.box)+'</span>':'')+' <span class="m">('+C.esc(l.whName)+')</span></span><b>× '+n(l.qty)+'</b></div>').join('')+'<div class="r" style="margin-top:8px"><b class="big">'+n(o.total)+'</b>'+(o.status!=='active'?'<span class="tag tb">ملغاة</span>':'')+'</div><div class="g2" style="margin-top:8px"><button class="s x" data-o="voucher" data-id="'+k+'">السند</button>'+(o.status==='active'&&canW()?'<button class="d x" data-o="cancel" data-id="'+k+'">إلغاء وإرجاع</button>':'<span></span>')+'</div></div>'}).join(''):'<div class="card m">لا توجد طلبيات بعد.</div>';
}
function movesHtml(){
  if(MVE==='rules')return '<div class="card"><b>سجل الحركات غير مفعّل بعد</b><div class="m" style="margin-top:4px">انسخ محتوى ملف firestore.rules الجديد إلى Firebase Console ثم اضغط Publish.</div></div>';
  if(MVE==='err')return '<div class="card er">تعذّر تحميل الحركات</div>';
  const w=norm(mq).split(/\s+/).filter(Boolean),a=MV.filter(m=>{const h=norm((m.name||'')+' '+(m.whName||'')+' '+(m.recipient||''));return w.every(x=>h.includes(x))});
  return (flags.noMoves?'<div class="card tw"><b>تنبيه:</b> الحركات الجديدة لا تُسجَّل حتى تُحدَّث قواعد Firestore.</div>':'')+(a.length?a.map(m=>{const t=MT[m.type]||[m.type,'tc'],dl=m.delta||0;
    return '<div class="card"><div class="r"><b>'+C.esc(m.name)+'</b><span class="tag '+t[1]+'">'+t[0]+'</span></div><div class="r" style="margin-top:6px"><span class="m">'+C.esc(m.whName||'')+(m.order?' · سند '+pad(m.order):'')+(m.recipient?' · '+C.esc(m.recipient):'')+(m.note?' · '+C.esc(m.note):'')+'</span><b class="'+(dl<0?'neg':'pos')+'">'+(dl>0?'+':'')+n(dl)+'</b></div><div class="m">قبل: '+n(m.before)+' · بعد: '+n(m.after)+'</div><div class="m">'+fd(ts(m))+' · '+C.esc(m.by||'')+'</div></div>'}).join(''):'<div class="card m">لا توجد حركات بعد.</div>');
}
async function cancelOrder(id,btn){
  if(!confirm('إلغاء الطلبية وإرجاع الكميات للمخزون؟'))return;
  btn.disabled=true;
  const run=async x=>{
    await runTransaction(C.db,async tx=>{
      const oref=doc(C.db,'orders',id),os=await tx.get(oref);if(!os.exists()||os.data().status!=='active')throw new Error('done');
      const o=os.data(),rows=[];for(const l of o.lines){const ref=doc(C.db,'items',l.id),s=await tx.get(ref);if(s.exists())rows.push({ref,it:s.data(),l})}
      rows.forEach(r=>{
        const after=Math.min(r.it.qty,r.it.rem+r.l.qty);
        tx.update(r.ref,{rem:after,updatedAt:serverTimestamp()});
        if(x)tx.set(doc(collection(C.db,'moves')),mkMove({id:r.l.id,name:r.it.name,wh:r.it.wh},'return',after-r.it.rem,r.it.rem,after,{order:o.no||null,recipient:o.recipient,note:'إلغاء طلبية'}));
      });
      tx.update(oref,{status:'cancelled',cancelledBy:mail(),cancelledAt:serverTimestamp()});
    });
  };
  try{
    if(flags.noMoves)await run(false);
    else{try{await run(true)}catch(e){if(isPerm(e)){await run(false);flags.noMoves=true}else throw e}}
    C.toast('تم الإلغاء وإرجاع الكميات')
  }catch(e){C.toast(err(e));btn.disabled=false}
}

/* ---------- النسخ الاحتياطي ---------- */
const ser=v=>{if(v==null||typeof v!=='object')return v;if(typeof v.toDate==='function')return v.toDate().toISOString();if(Array.isArray(v))return v.map(ser);const o={};Object.keys(v).forEach(k=>{o[k]=ser(v[k])});return o};
function dl(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
function bkSheet(){
  const last=BK?fd(BK):'لم تؤخذ نسخة بعد';
  sheet(hd('النسخ الاحتياطي')+'<div class="m" style="margin:8px 0 14px">ينزّل نسخة كاملة (الأصناف والمخازن والطلبيات والحركات). احفظ الملف في جوالك أو Google Drive. ننصح بنسخة كل أسبوع.</div><div class="card"><span class="m">آخر نسخة</span><div><b>'+last+'</b></div></div><div id="bke" class="er"></div><div class="g2"><button data-o="bkx">ملف Excel</button><button class="s" data-o="bkj">ملف JSON</button></div>');
}
async function backup(kind,btn){
  btn.disabled=true;const e0=$('bke');if(e0)e0.textContent='';
  try{
    const out={};
    for(const nm of ['warehouses','items','orders','moves','users']){
      try{const s=await getDocs(collection(C.db,nm));out[nm]=s.docs.map(d=>ser(Object.assign({id:d.id},d.data())))}
      catch(e){if(!isPerm(e))throw e;out[nm]=[]}
    }
    const day=new Date().toISOString().slice(0,10);
    if(kind==='json'){dl('EZO-backup-'+day+'.json',new Blob([JSON.stringify(out,null,1)],{type:'application/json'}))}
    else{
      const X=await loadXL(),wn={};out.warehouses.forEach(w=>{wn[w.id]=w.name});
      const wb=X.utils.book_new();wb.Workbook={Views:[{RTL:true}]};
      const add=(nm,rows)=>X.utils.book_append_sheet(wb,X.utils.json_to_sheet(rows.length?rows:[{'—':''}]),nm);
      add('الأصناف',out.items.map(i=>({'الصنف':i.name,'الكود':i.code,'الشركة':i.company,'رقم الكرتون':i.boxes,'المخزن':wn[i.wh]||'','السعر':i.price,'الكمية الكلية':i.qty,'المتبقي':i.rem,'عدد الكراتين':i.cartons,'الوزن':i.weight,'الوحدة':i.unit,'تاريخ الوصول':i.arr,'تاريخ الانتهاء':i.exp})));
      add('المخازن',out.warehouses.map(w=>({'المخزن':w.name})));
      add('الطلبيات',out.orders.map(o=>({'رقم السند':o.no||'','التاريخ':o.createdAt||'','المستلم':o.recipient,'الهاتف':o.phone,'الأصناف':(o.lines||[]).map(l=>l.name+(l.box?' [كرتون '+l.box+']':'')+' × '+l.qty).join(' | '),'الإجمالي':o.total,'الحالة':o.status==='active'?'نشطة':'ملغاة','المسجّل':o.by})));
      add('الحركات',out.moves.map(m=>({'التاريخ':m.createdAt||'','الصنف':m.name,'المخزن':m.whName,'النوع':(MT[m.type]||[m.type])[0],'التغيير':m.delta,'قبل':m.before,'بعد':m.after,'المستخدم':m.by})));
      X.writeFile(wb,'EZO-backup-'+day+'.xlsx');
    }
    BK=new Date();
    setDoc(doc(C.db,'meta','backup'),{lastAt:serverTimestamp(),by:mail()},{merge:true}).catch(()=>{});
    closeS();C.toast('تم تنزيل النسخة الاحتياطية');if(act()&&page==='home')draw();
  }catch(e){const x=$('bke');if(x)x.textContent='تعذّر إنشاء النسخة. تأكد من الإنترنت وحاول مرة أخرى.';btn.disabled=false}
}

/* ---------- المزيد ---------- */
function moreV(){
  const L=[['wh',C.ic.wh,'المخازن','إضافة وإدارة المخازن']].concat(C.P.role==='admin'?[['users',C.ic.users,'المستخدمون','الصلاحيات والحسابات']]:[],[['me',C.ic.me,'حسابي','الحساب وتسجيل الخروج']]);
  $('pg').innerHTML=L.map(x=>'<div class="card it r" data-a="nav" data-p="'+x[0]+'"><div class="mi"><span class="ico">'+x[1]+'</span><div><b>'+x[2]+'</b><div class="m">'+x[3]+'</div></div></div><span class="chev">‹</span></div>').join('')+(C.P.role==='admin'?'<div class="card it r" data-o="bk"><div class="mi"><span class="ico">'+C.ic.bk+'</span><div><b>النسخ الاحتياطي</b><div class="m">تنزيل نسخة كاملة من البيانات</div></div></div><span class="chev">‹</span></div>':'');
}
document.addEventListener('input',e=>{
  const t=e.target;if(!C)return;
  if(t.id==='oq'){q=t.value;L()}
  else if(t.id==='mq'){mq=t.value;fillLog()}
  else if(t.dataset&&t.dataset.qi){setQ(t.dataset.qi,parseFloat(t.value),true)}
});
document.addEventListener('change',e=>{if(C&&e.target.id==='ocw'){cw=e.target.value;L()}});
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-o]');if(!b||!C)return;
  const a=b.dataset.o,k=b.dataset.id;
  if(a==='close')closeS();else if(a==='cart')cartSheet();else if(a==='clear'){cart={};closeS();if(page==='order')orderV()}
  else if(a==='confirm'&&canW())await confirmOrder(b);else if(a==='cancel'&&canW())await cancelOrder(k,b);
  else if(a==='sel'){sel=!sel;L()}
  else if(a==='inc'){const i=data().IT[k];if(i)setQ(k,Math.min((cart[k]||0)+1,Math.max(i.rem,0)))}
  else if(a==='dec')setQ(k,(cart[k]||0)-1)
  else if(a==='voucher'){if(OR[k])vSheet(OR[k])}
  else if(a==='vprint')window.print();
  else if(a==='vshare')vShare();
  else if(a==='lv'){lv=b.dataset.v;if(lv==='moves')subM();logV()}
  else if(a==='bk')bkSheet();
  else if(a==='bkx')await backup('xlsx',b);
  else if(a==='bkj')await backup('json',b);
});
