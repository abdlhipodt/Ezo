import {collection,onSnapshot,addDoc,updateDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const $=i=>document.getElementById(i),UN={g:'جم',kg:'كجم',ml:'مل',l:'لتر'};
let C=null,WH={},IT={},unW=null,unI=null,q='',cw='all',page='';
const n=x=>Number(x||0).toLocaleString('en',{maximumFractionDigits:3});
const canW=()=>C.P.role==='admin'||C.P.role==='keeper',isA=()=>C.P.role==='admin';
const norm=t=>String(t||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const T0=new Date();T0.setHours(0,0,0,0);
const dd=d=>d?Math.round((new Date(d+'T00:00:00')-T0)/864e5):9999;
const wname=id=>WH[id]?WH[id].name:'—';
const wtxt=i=>i.weight?n(i.weight)+' '+(UN[i.unit]||''):'';
function tot(i){if(!i.weight)return '';let v=i.rem*i.weight,u=i.unit;if(u==='g'&&v>=1000){v/=1000;u='kg'}else if(u==='ml'&&v>=1000){v/=1000;u='l'}return n(v)+' '+UN[u]}
function exTag(i){if(!i.exp)return '';const d=dd(i.exp);return d<0?'<span class="tag tb">منتهي</span>':d<=30?'<span class="tag tb">ينتهي بعد '+d+' يوم</span>':d<=90?'<span class="tag tw">ينتهي بعد '+d+' يوم</span>':'<span class="tag to">سليم</span>'}
const hooks=[];
export const onData=f=>hooks.push(f);
export const data=()=>({WH,IT});
export const setPage=p=>{page=p};
export function stopPage(){closeS()}
export function stopAll(){if(unW)unW();if(unI)unI();unW=unI=null;WH={};IT={}}
function sub(){
  if(unW)return;
  unW=onSnapshot(collection(C.db,'warehouses'),s=>{WH={};s.forEach(d=>{WH[d.id]=d.data()});R();hooks.forEach(h=>h())},e=>C.toast(C.msg(e)));
  unI=onSnapshot(collection(C.db,'items'),s=>{IT={};s.forEach(d=>{IT[d.id]=d.data()});R();hooks.forEach(h=>h())},e=>C.toast(C.msg(e)));
}
export function ensure(ctx){C=ctx;sub()}
export function mountPage(p,ctx){C=ctx;page=p;closeS();$('pg').innerHTML='<div class="card m">جارٍ التحميل...</div>';sub();R()}
function R(){if(page==='wh')whV();else if(page==='items')itemsV()}
function whV(){
  const ids=Object.keys(WH).sort((a,b)=>WH[a].name.localeCompare(WH[b].name,'ar'));
  $('pg').innerHTML=(isA()?'<div class="card"><b>إضافة مخزن</b><input id="wn" placeholder="اسم المخزن" style="margin-top:8px"><button style="width:100%" data-s="addwh">إضافة</button></div>':'')+
  (ids.length?ids.map(id=>{const a=Object.keys(IT).filter(k=>IT[k].wh===id),v=a.reduce((s,k)=>s+(IT[k].price||0)*IT[k].rem,0);
    return '<div class="card"><div class="r"><b>'+C.esc(WH[id].name)+'</b><span>'+n(v)+'</span></div><div class="m">'+a.length+' صنف</div>'+(isA()?'<div class="g2" style="margin-top:8px"><button class="s x" data-s="renwh" data-id="'+id+'">تسمية</button><button class="d x" data-s="delwh" data-id="'+id+'">حذف</button></div>':'')+'</div>'}).join(''):'<div class="card m">لا توجد مخازن بعد.'+(isA()?' أضف أول مخزن من الأعلى.':' اطلب من المدير إضافة مخزن.')+'</div>');
}
function itemsV(){
  const ids=Object.keys(WH);
  $('pg').innerHTML='<select id="cw"><option value="all">كل المخازن</option>'+ids.map(id=>'<option value="'+id+'"'+(cw===id?' selected':'')+'>'+C.esc(WH[id].name)+'</option>').join('')+'</select><input id="q" type="search" placeholder="ابحث بالاسم أو الكود أو رقم الصندوق" value="'+C.esc(q)+'"><div id="lst"></div>'+(canW()?'<button class="fab" data-s="new" aria-label="إضافة صنف">+</button>':'');
  L();
}
function L(){
  const w=norm(q).split(/\s+/).filter(Boolean),ks=Object.keys(IT).filter(k=>{const i=IT[k];if(cw!=='all'&&i.wh!==cw)return false;const h=norm(i.name+' '+i.code+' '+i.company+' '+(i.boxes||''));return w.every(x=>h.includes(x))}).sort((a,b)=>IT[a].name.localeCompare(IT[b].name,'ar'));
  $('lst').innerHTML=!Object.keys(IT).length?'<div class="card m">لا توجد أصناف بعد.'+(canW()?' اضغط + لإضافة أول صنف.':'')+'</div>':ks.length?ks.map(k=>{const i=IT[k];
    return '<div class="card it" data-s="open" data-id="'+k+'"><div class="r"><span class="nm">'+C.esc(i.name)+'</span>'+(i.rem<=0?'<span class="tag tb">نافد</span>':'')+'</div><div class="r" style="margin-top:4px"><span>المتبقي: <b class="big">'+n(i.rem)+'</b></span>'+exTag(i)+'</div><div class="m">'+C.esc(wname(i.wh))+(i.weight?' · '+wtxt(i):'')+(i.price!==''&&i.price!=null?' · السعر '+n(i.price):'')+'</div>'+(i.boxes?'<div class="m">الصناديق: '+C.esc(i.boxes)+'</div>':'')+'</div>'}).join(''):'<div class="card m">لا يوجد صنف بهذا الاسم.</div>';
}
function sheet(h){closeS();const d=document.createElement('div');d.className='sh';d.id='shx';d.onclick=e=>{if(e.target===d)closeS()};d.innerHTML='<div>'+h+'</div>';document.body.appendChild(d)}
function closeS(){const s=$('shx');if(s)s.remove()}
const hd=t=>'<div class="r"><span class="nm" style="font-size:20px">'+t+'</span><button class="s x" data-s="close">إغلاق</button></div>';
function open(id){
  const i=IT[id];if(!i)return;
  const kv=(k,v)=>v===''||v==null?'':'<div class="kv"><span class="m">'+k+'</span><b>'+v+'</b></div>';
  sheet(hd(C.esc(i.name))+'<div class="card" style="margin-top:10px;text-align:center"><div class="m">المتبقي في '+C.esc(wname(i.wh))+'</div><div class="big" style="font-size:36px">'+n(i.rem)+'</div>'+exTag(i)+'</div>'+
  kv('الكود',C.esc(i.code))+kv('الشركة',C.esc(i.company))+kv('أرقام الصناديق',C.esc(i.boxes))+kv('السعر',i.price!==''&&i.price!=null?n(i.price):'')+kv('الوزن/الحجم للعبوة',wtxt(i))+kv('إجمالي المتبقي',tot(i))+kv('الكمية الكلية',n(i.qty))+kv('الكراتين',i.cartons!==''&&i.cartons!=null?n(i.cartons):'')+kv('تاريخ الوصول',i.arr)+kv('تاريخ الانتهاء',i.exp)+kv('قيمة المتبقي',i.price!==''&&i.price!=null?n(i.price*i.rem):'')+
  (canW()?'<button style="width:100%;margin-top:12px" data-s="edit" data-id="'+id+'">تعديل / استلام كمية</button>':'')+(isA()?'<button class="d" style="width:100%;margin-top:8px" data-s="del" data-id="'+id+'">حذف الصنف</button>':''));
}
function form(id){
  const i=id?IT[id]:{name:'',code:'',price:'',qty:'',rem:'',cartons:'',company:'',boxes:'',weight:'',unit:'g',arr:new Date().toISOString().slice(0,10),exp:'',wh:cw!=='all'?cw:''};
  const f=(k,l,t,v)=>'<label>'+l+'</label><input id="f_'+k+'" type="'+t+'" value="'+C.esc(v==null?'':v)+'"'+(t==='number'?' inputmode="decimal" min="0" step="any"':'')+'>';
  const ids=Object.keys(WH);
  if(!ids.length){sheet(hd('إضافة صنف')+'<div class="card m">أنشئ مخزناً أولاً من تبويب المخازن.</div>');return}
  sheet(hd(id?'تعديل صنف':'إضافة صنف')+'<label>المخزن *</label><select id="f_wh">'+ids.map(k=>'<option value="'+k+'"'+(i.wh===k?' selected':'')+'>'+C.esc(WH[k].name)+'</option>').join('')+'</select>'+f('name','اسم الصنف *','text',i.name)+f('code','الكود','text',i.code)+
  '<div class="g2"><div>'+f('price','السعر','number',i.price)+'</div><div>'+f('company','الشركة','text',i.company)+'</div></div>'+f('boxes','أرقام الصناديق (مثال: 11/96 - 55/96)','text',i.boxes)+
  '<div class="g2"><div>'+f('weight','وزن/حجم العبوة','number',i.weight)+'</div><div><label>الوحدة</label><select id="f_unit">'+Object.keys(UN).map(u=>'<option value="'+u+'"'+(i.unit===u?' selected':'')+'>'+UN[u]+'</option>').join('')+'</select></div></div>'+
  (id?'<div class="g2"><div>'+f('qty','الكمية الكلية','number',i.qty)+'</div><div>'+f('rem','المتبقي','number',i.rem)+'</div></div>'+f('cartons','عدد الكراتين','number',i.cartons):'<div class="g2"><div>'+f('qty','الكمية *','number','')+'</div><div>'+f('cartons','عدد الكراتين','number','')+'</div></div>')+
  '<div class="g2"><div>'+f('arr','تاريخ الوصول','date',i.arr)+'</div><div>'+f('exp','تاريخ الانتهاء','date',i.exp)+'</div></div>'+(id?'<label>وصلت كمية جديدة؟ تُضاف للمتبقي والكلية</label><input id="f_add" type="number" inputmode="numeric" min="0" placeholder="0">':'')+
  '<div id="fe" class="er"></div><button style="width:100%" data-s="save" data-id="'+(id||'')+'">حفظ</button>');
}
async function save(id,btn){
  const g=k=>{const e=$('f_'+k);return e?e.value.trim():''},num=k=>g(k)===''?'':parseFloat(g(k)),er=m=>{$('fe').textContent=m};
  if(!g('name'))return er('اكتب اسم الصنف');
  const o={name:g('name'),code:g('code'),company:g('company'),boxes:g('boxes'),price:num('price'),cartons:num('cartons'),weight:num('weight'),unit:g('unit'),arr:g('arr'),exp:g('exp'),wh:g('wh')};
  if(!o.wh)return er('اختر المخزن');
  for(const k of['price','cartons','weight'])if(o[k]!==''&&!(o[k]>=0))return er('أرقام غير صحيحة');
  let q=parseFloat(g('qty')),r=id?parseFloat(g('rem')):q;
  if(!(q>=0)||!(r>=0))return er('اكتب الكمية والمتبقي بشكل صحيح');
  const a=id?(parseFloat(g('add'))||0):0;q+=a;r+=a;if(r>q)return er('المتبقي أكبر من الكمية الكلية');
  o.qty=q;o.rem=r;o.updatedAt=serverTimestamp();o.by=String(C.U.email).toLowerCase();
  btn.disabled=true;
  try{if(id)await updateDoc(doc_(id),o);else{o.createdAt=serverTimestamp();await addDoc(collection(C.db,'items'),o)}closeS();C.toast(a?'أُضيف '+n(a)+' للمخزون':'تم الحفظ')}
  catch(e){er(C.msg(e));btn.disabled=false}
}
import {doc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const doc_=id=>doc(C.db,'items',id);
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;if($('lst'))L()}});
document.addEventListener('change',e=>{if(e.target.id==='cw'){cw=e.target.value;L()}});
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-s]');if(!b||!C)return;
  const a=b.dataset.s,id=b.dataset.id;
  try{
    if(a==='close')closeS();else if(a==='open')open(id);else if(a==='new'&&canW())form('');else if(a==='edit'&&canW())form(id);else if(a==='save'&&canW())await save(id,b);
    else if(a==='del'&&isA()){if(confirm('حذف هذا الصنف نهائياً؟')){await deleteDoc(doc_(id));closeS();C.toast('تم الحذف')}}
    else if(a==='addwh'&&isA()){const v=$('wn').value.trim();if(!v)return;b.disabled=true;await addDoc(collection(C.db,'warehouses'),{name:v,createdAt:serverTimestamp()});C.toast('تمت إضافة المخزن');b.disabled=false}
    else if(a==='renwh'&&isA()){const v=prompt('الاسم الجديد',WH[id].name);if(v&&v.trim())await updateDoc(doc(C.db,'warehouses',id),{name:v.trim()})}
    else if(a==='delwh'&&isA()){if(Object.keys(IT).some(k=>IT[k].wh===id))return C.toast('انقل أصنافه أو احذفها أولاً');if(confirm('حذف هذا المخزن؟'))await deleteDoc(doc(C.db,'warehouses',id))}
  }catch(e){C.toast(C.msg(e));b.disabled=false}
});
