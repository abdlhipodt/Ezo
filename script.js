var KEY='makhzan_v1',items=[],log=[],cart=[],tab=1,seq=1,lseq=1,ordMode=false;
try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){items=s.items||[];log=s.log||[];seq=s.seq||1;lseq=s.lseq||1}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({items:items,log:log,seq:seq,lseq:lseq}))}catch(e){toast('تعذّر الحفظ في هذا المتصفح، خذ نسخة احتياطية')}}
function $(i){return document.getElementById(i)}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function n(x){return Number(x).toLocaleString('en',{maximumFractionDigits:2})}
function norm(t){return String(t||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')}
var T0=new Date();T0.setHours(0,0,0,0);
function dd(d){return d?Math.round((new Date(d+'T00:00:00')-T0)/864e5):9999}
function exTag(i){if(!i.exp)return '';var d=dd(i.exp);if(d<0)return '<span class="tag tb">منتهي</span>';if(d<=30)return '<span class="tag tb">ينتهي بعد '+d+' يوم</span>';if(d<=90)return '<span class="tag tw">ينتهي بعد '+d+' يوم</span>';return '<span class="tag to">سليم</span>'}
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(function(){e.remove()},2300)}
function find(id){return items.filter(function(i){return i.id==id})[0]}
function inCart(id){return cart.filter(function(c){return c.id==id})[0]}
function matches(){var w=norm($('q').value).split(/\s+/).filter(Boolean);return items.filter(function(i){var h=norm(i.name+' '+i.code+' '+i.company+' '+(i.boxes||''));return w.every(function(x){return h.indexOf(x)>-1})})}

function render(){
  document.querySelector('.tabs').style.display=ordMode?'none':'';
  $('t1').className=tab==1?'on':'';$('t2').className=tab==2?'on':'';
  $('q').style.display=(ordMode||tab==1)?'':'none';
  if(ordMode)orderView();else if(tab==1)list();else logView();
  bar();
}
function refreshList(){if(ordMode)orderView();else list()}
function list(){
  var r=matches();
  var P=items.length?'<button style="width:100%;margin-bottom:10px" onclick="startOrder()">طلبية جديدة (كل المخزون)</button>':'';
  if(!items.length){$('main').innerHTML='<div class="card m">لا توجد أصناف بعد. اضغط زر + لإضافة أول صنف، أو استرجع نسخة احتياطية من تبويب السجل.</div>';return}
  if(!r.length){$('main').innerHTML=P+'<div class="card m">لا يوجد صنف بهذا الاسم.</div>';return}
  $('main').innerHTML=P+r.map(function(i){
    return '<div class="card it" onclick="openItem('+i.id+')"><div class="r"><span class="nm">'+esc(i.name)+'</span>'+(inCart(i.id)?'<span class="tag to">بالطلبية '+inCart(i.id).qty+'</span>':'')+'</div>'+
    '<div class="r" style="margin-top:4px"><span>المتبقي: <b class="big" style="color:'+(i.rem<=0?'var(--bad)':'inherit')+'">'+n(i.rem)+'</b></span>'+exTag(i)+'</div>'+
    '<div class="m">'+(i.price!==''?'السعر '+n(i.price)+' · ':'')+esc(i.company)+'</div>'+(i.boxes?'<div class="m">الصناديق: '+esc(i.boxes)+'</div>':'')+'</div>'}).join('');
}

function startOrder(){ordMode=true;$('q').value='';render();window.scrollTo(0,0)}
function exitOrder(){ordMode=false;render()}
function cancelOrder(){if(cart.length&&!confirm('إلغاء الطلبية ومسح الكميات المكتوبة؟'))return;cart=[];ordMode=false;render()}
function orderView(){
  var r=matches();
  var h='<div class="r" style="margin-bottom:6px"><b style="font-size:19px">طلبية جديدة</b><span style="display:flex;gap:6px"><button class="s x" onclick="exitOrder()">رجوع</button><button class="d x" onclick="cancelOrder()">إلغاء</button></span></div><div class="m" style="margin-bottom:8px">اكتب الكمية بجانب كل صنف مطلوب ثم اضغط تأكيد.</div>';
  if(!r.length)h+='<div class="card m">لا يوجد صنف بهذا الاسم.</div>';
  r.forEach(function(i){
    var c=inCart(i.id),v=c?c.qty:'',bad=c&&c.qty>i.rem;
    h+='<div class="card"><div class="ln" style="border:0;padding:0"><span style="flex:1"><b>'+esc(i.name)+'</b><div class="m">المتبقي: '+n(i.rem)+(i.boxes?' · '+esc(i.boxes):'')+'</div></span>'+
    '<input type="number" inputmode="numeric" min="0" placeholder="0" value="'+v+'" '+(i.rem<=0?'disabled':'')+' style="width:96px;text-align:center;font-size:20px;font-weight:700;'+(bad?'border-color:var(--bad)':'')+'" oninput="setQ('+i.id+',this)"></div></div>'});
  $('main').innerHTML=h;
}
function setQ(id,el){
  var v=parseFloat(el.value),i=find(id);
  cart=cart.filter(function(c){return c.id!=id});
  if(v>0)cart.push({id:id,qty:v});
  el.style.borderColor=(v>i.rem)?'var(--bad)':'';
  bar();
}

function bar(){
  var b=$('bar');var h='';
  var open=document.querySelector('.sh');
  if(ordMode){if(cart.length&&!open)h+='<button class="cartbar" style="left:12px" onclick="openCart()">تأكيد الطلبية ('+cart.length+' أصناف)</button>'}
  else{
    if(tab==1&&!open)h+='<button class="fab" onclick="editItem()" aria-label="إضافة صنف">+</button>';
    if(cart.length&&!open)h+='<button class="cartbar" onclick="openCart()">الطلبية ('+cart.length+' أصناف) · تأكيد الصرف</button>';
  }
  b.innerHTML=h;
}
function sheet(html){closeSheet();var d=document.createElement('div');d.className='sh';d.onclick=function(e){if(e.target==d)closeSheet()};d.innerHTML='<div>'+html+'</div>';document.body.appendChild(d);bar()}
function closeSheet(){var s=document.querySelector('.sh');if(s)s.remove();bar();if(ordMode)orderView()}

function openItem(id){
  var i=find(id);if(!i)return;
  function kv(k,v){return v===''||v==null?'':'<div class="kv"><span class="m">'+k+'</span><b>'+v+'</b></div>'}
  sheet('<div class="r"><span class="nm" style="font-size:20px">'+esc(i.name)+'</span><button class="s x" onclick="closeSheet()">إغلاق</button></div>'+
   '<div class="card" style="margin-top:10px;text-align:center"><div class="m">المتبقي في المخزن</div><div class="big" style="font-size:36px">'+n(i.rem)+'</div>'+exTag(i)+'</div>'+
   '<label for="sq">الكمية المراد صرفها</label><input id="sq" class="qty" type="number" inputmode="numeric" min="1" placeholder="0">'+
   '<div id="se" class="er"></div>'+
   '<div class="g2"><button onclick="out('+id+',true)">صرف الآن</button><button class="s" onclick="out('+id+',false)">أضف للطلبية</button></div>'+
   '<div style="margin-top:14px">'+kv('أرقام الصناديق',esc(i.boxes))+kv('الكود',esc(i.code))+kv('الشركة',esc(i.company))+kv('السعر',i.price!==''?n(i.price):'')+kv('الكمية الكلية',n(i.qty))+kv('عدد الكراتين',i.cartons!==''?n(i.cartons):'')+kv('تاريخ الوصول',i.arr)+kv('تاريخ الانتهاء',i.exp)+kv('قيمة المتبقي',i.price!==''?n(i.price*i.rem):'')+'</div>'+
   '<div class="g2" style="margin-top:12px"><button class="s" onclick="editItem('+id+')">تعديل / استلام كمية</button><button class="d" onclick="delItem('+id+')">حذف الصنف</button></div>');
  setTimeout(function(){var e=$('sq');if(e)e.focus()},50);
}
function out(id,now){
  var i=find(id),q=parseFloat($('sq').value);
  if(!(q>0)){$('se').textContent='اكتب الكمية أولاً';return}
  if(q>i.rem){$('se').textContent='الكمية أكبر من المتبقي ('+n(i.rem)+')';return}
  if(now){i.rem-=q;log.unshift({id:lseq++,t:Date.now(),name:'',phone:'',lines:[{id:i.id,name:i.name,qty:q,price:i.price}],undone:false});save();closeSheet();toast('تم صرف '+n(q)+' من '+i.name+' · المتبقي '+n(i.rem));render()}
  else{var c=inCart(id);if(c)c.qty=q;else cart.push({id:id,qty:q});closeSheet();toast('أُضيف للطلبية');render()}
}
function openCart(){
  var h='<div class="r"><span class="nm" style="font-size:20px">الطلبية</span><button class="s x" onclick="closeSheet()">إغلاق</button></div><div style="margin-top:8px">';
  cart.forEach(function(c,k){var i=find(c.id);h+='<div class="ln"><span>'+esc(i.name)+'<div class="m">المتبقي '+n(i.rem)+'</div></span><span class="r" style="gap:6px"><input type="number" inputmode="numeric" style="width:84px;text-align:center" value="'+c.qty+'" onchange="cart['+k+'].qty=parseFloat(this.value)||0"><button class="d x" onclick="cart.splice('+k+',1);cart.length?openCart():(closeSheet(),render())">حذف</button></span></div>'});
  h+='</div><label>اسم المستلم (اختياري)</label><input id="cn"><label>رقم المستلم (اختياري)</label><input id="cp" type="tel" inputmode="tel"><div id="ce" class="er"></div><button style="width:100%;margin-top:6px" onclick="confirmCart()">تأكيد الصرف وخصمه من المخزون</button>';
  sheet(h);
}
function confirmCart(){
  var lines=[],e='';
  cart.forEach(function(c){var i=find(c.id);if(e)return;if(!(c.qty>0)){e='كمية غير صحيحة لـ '+i.name;return}if(c.qty>i.rem){e='الكمية من '+i.name+' أكبر من المتبقي ('+n(i.rem)+')';return}lines.push({id:i.id,name:i.name,qty:c.qty,price:i.price})});
  if(e){$('ce').textContent=e;return}
  lines.forEach(function(l){find(l.id).rem-=l.qty});
  log.unshift({id:lseq++,t:Date.now(),name:$('cn').value.trim(),phone:$('cp').value.trim(),lines:lines,undone:false});
  cart=[];ordMode=false;save();closeSheet();toast('تم الصرف وخصمه من المخزون');render();
}
function editItem(id){
  var i=id?find(id):{name:'',code:'',price:'',qty:'',cartons:'',rem:'',company:'',boxes:'',exp:'',arr:new Date().toISOString().slice(0,10)};
  function f(k,l,t,v,x){return '<label>'+l+'</label><input id="e_'+k+'" type="'+t+'" value="'+esc(v)+'" '+(t=='number'?'inputmode="decimal" min="0" step="any"':'')+' '+(x||'')+'>'}
  sheet('<div class="r"><span class="nm" style="font-size:20px">'+(id?'تعديل صنف':'إضافة صنف')+'</span><button class="s x" onclick="closeSheet()">إغلاق</button></div>'+
   f('name','اسم الصنف *','text',i.name)+f('code','الكود','text',i.code)+
   '<div class="g2"><div>'+f('price','السعر','number',i.price)+'</div><div>'+f('company','اسم الشركة','text',i.company)+'</div></div>'+
   f('boxes','أرقام الصناديق (مثال: 11/96 - 55/96)','text',i.boxes||'')+
   (id?'<div class="g2"><div>'+f('qty','الكمية الكلية','number',i.qty)+'</div><div>'+f('rem','المتبقي','number',i.rem)+'</div></div>':
   '<div class="g2"><div>'+f('qty','الكمية (العدد) *','number','')+'</div><div>'+f('cartons','عدد الكراتين','number','')+'</div></div>')+
   (id?f('cartons','عدد الكراتين','number',i.cartons):'')+
   '<div class="g2"><div>'+f('arr','تاريخ الوصول','date',i.arr)+'</div><div>'+f('exp','تاريخ الانتهاء','date',i.exp)+'</div></div>'+
   (id?'<label>استلمت كمية جديدة؟ اكتبها لتُضاف للمتبقي والكلية</label><input id="e_add" type="number" inputmode="numeric" min="0" placeholder="0">':'')+
   '<div id="ee" class="er"></div><button style="width:100%" onclick="saveItem('+(id||0)+')">حفظ</button>');
}
function saveItem(id){
  function g(k){var e=$('e_'+k);return e?e.value.trim():''}
  var name=g('name');if(!name){$('ee').textContent='اكتب اسم الصنف';return}
  var o={name:name,code:g('code'),price:g('price')===''?'':parseFloat(g('price')),company:g('company'),boxes:g('boxes'),cartons:g('cartons')===''?'':parseFloat(g('cartons')),arr:g('arr'),exp:g('exp')};
  if(id){var i=find(id);o.qty=parseFloat(g('qty'))||0;o.rem=parseFloat(g('rem'))||0;var a=parseFloat(g('add'))||0;o.qty+=a;o.rem+=a;if(o.rem>o.qty){$('ee').textContent='المتبقي أكبر من الكمية الكلية';return}Object.assign(i,o);toast(a?'تمت إضافة '+n(a)+' للمخزون':'تم الحفظ')}
  else{var q=parseFloat(g('qty'));if(!(q>=0)||g('qty')===''){$('ee').textContent='اكتب الكمية';return}o.qty=q;o.rem=q;o.id=seq++;items.push(o);toast('تمت إضافة الصنف')}
  save();closeSheet();render();
}
function delItem(id){if(!confirm('حذف هذا الصنف نهائياً؟'))return;items=items.filter(function(i){return i.id!=id});cart=cart.filter(function(c){return c.id!=id});save();closeSheet();render()}

function logView(){
  var h='<div class="card"><b>النسخ الاحتياطي</b><div class="m">خذ نسخة بين فترة وأخرى واحفظها في مكان آمن.</div><div class="g2" style="margin-top:8px"><button onclick="backup()">حفظ نسخة</button><button class="s" onclick="$(\'imp\').click()">استرجاع نسخة</button></div><button class="s" style="width:100%;margin-top:8px" onclick="csv()">تصدير الأصناف (Excel)</button><input id="imp" type="file" accept=".json" style="display:none" onchange="restore(this)"></div><h2 style="font-size:17px;margin:16px 0 8px">سجل الصرف</h2>';
  if(!log.length)h+='<div class="card m">لا توجد عمليات صرف بعد.</div>';
  log.forEach(function(l){var d=new Date(l.t),tot=0;l.lines.forEach(function(x){tot+=x.qty*(x.price||0)});
    h+='<div class="card" style="'+(l.undone?'opacity:.55':'')+'"><div class="r"><b>'+(esc(l.name)||'صرف')+(l.phone?' · '+esc(l.phone):'')+'</b><span class="m">'+d.toLocaleDateString('en')+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})+'</span></div>'+
    l.lines.map(function(x){return '<div class="r" style="padding:3px 0"><span>'+esc(x.name)+'</span><b>× '+n(x.qty)+'</b></div>'}).join('')+
    '<div class="r" style="margin-top:6px"><span class="m">'+(tot?'الإجمالي '+n(tot):'')+'</span>'+(l.undone?'<span class="tag tb">تم التراجع</span>':'<button class="d x" onclick="undo('+l.id+')">تراجع</button>')+'</div></div>'});
  $('main').innerHTML=h;
}
function undo(id){var l=log.filter(function(x){return x.id==id})[0];if(!l||l.undone||!confirm('التراجع عن هذه العملية وإرجاع الكميات؟'))return;l.lines.forEach(function(x){var i=find(x.id);if(i)i.rem+=x.qty});l.undone=true;save();toast('تم التراجع وإرجاع الكميات');render()}
function dl(name,txt,type){try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('تم حفظ الملف: '+name)}catch(e){toast('تعذّر تنزيل الملف على هذا المتصفح')}}
function backup(){dl('makhzan-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({items:items,log:log,seq:seq,lseq:lseq}),'application/json')}
function restore(el){var f=el.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var s=JSON.parse(r.result);if(!s.items)throw 0;if(!confirm('سيستبدل هذا كل البيانات الحالية. متابعة؟'))return;items=s.items;log=s.log||[];seq=s.seq||1;lseq=s.lseq||1;cart=[];save();toast('تم استرجاع النسخة');render()}catch(e){toast('الملف غير صالح')}};r.readAsText(f)}
function csv(){var c='\uFEFFالاسم,الكود,السعر,أرقام الصناديق,الكمية الكلية,الكراتين,المتبقي,الشركة,تاريخ الوصول,تاريخ الانتهاء\n';items.forEach(function(i){c+=[i.name,i.code,i.price,i.boxes,i.qty,i.cartons,i.rem,i.company,i.arr,i.exp].map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}).join(',')+'\n'});dl('items.csv',c,'text/csv')}

$('q').addEventListener('input',refreshList);
$('t1').onclick=function(){tab=1;render()};$('t2').onclick=function(){tab=2;render()};
render();