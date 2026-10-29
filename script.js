var KEY='ezo_v2',D=null,tab='home',q='',cart={},T0=new Date();T0.setHours(0,0,0,0);
try{D=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!D){D={wh:[{id:1,name:'المخزن الرئيسي'}],items:[],log:[],seq:1,lseq:1,wseq:2,cw:'all'};
try{var o=JSON.parse(localStorage.getItem('makhzan_v1'));if(o){D.items=(o.items||[]).map(function(i){i.wh=1;return i});D.log=o.log||[];D.seq=o.seq||1;D.lseq=o.lseq||1}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){toast('تعذّر الحفظ، خذ نسخة احتياطية')}}
function $(i){return document.getElementById(i)}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function n(x){return Number(x||0).toLocaleString('en',{maximumFractionDigits:2})}
function norm(t){return String(t||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')}
function dd(d){return d?Math.round((new Date(d+'T00:00:00')-T0)/864e5):9999}
function exTag(i){if(!i.exp)return '';var d=dd(i.exp);return d<0?'<span class="tag tb">منتهي</span>':d<=30?'<span class="tag tb">ينتهي بعد '+d+' يوم</span>':d<=90?'<span class="tag tw">ينتهي بعد '+d+' يوم</span>':'<span class="tag to">سليم</span>'}
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(function(){e.remove()},2300)}
function find(id){return D.items.filter(function(i){return i.id==id})[0]}
function wn(id){var w=D.wh.filter(function(x){return x.id==(id||1)})[0];return w?w.name:'—'}
function low(i){return i.qty>0&&i.rem/i.qty<=.2}
function scope(){return D.items.filter(function(i){return D.cw=='all'||(i.wh||1)==D.cw})}
function match(a){var w=norm(q).split(/\s+/).filter(Boolean);return a.filter(function(i){var h=norm(i.name+' '+i.code+' '+i.company+' '+(i.boxes||''));return w.every(function(x){return h.indexOf(x)>-1})})}
function val(a){return a.reduce(function(s,i){return s+(i.price||0)*i.rem},0)}
function go(t){tab=t;q='';R();window.scrollTo(0,0)}
function cartN(){return Object.keys(cart).length}

function R(){
  var v={home:home,items:itemsV,order:orderV,log:logV,more:moreV};
  var h='<div class="brand"><div class="lg">EZO</div><div><b>EZO MEDIKAL</b><div class="m">نظام إدارة المخازن</div></div></div>';
  if(['home','items','order'].indexOf(tab)>-1)h+='<select onchange="D.cw=this.value;save();R()"><option value="all">كل المخازن</option>'+D.wh.map(function(w){return '<option value="'+w.id+'"'+(D.cw==w.id?' selected':'')+'>'+esc(w.name)+'</option>'}).join('')+'</select>';
  if(['items','order'].indexOf(tab)>-1)h+='<input id="q" type="search" placeholder="ابحث بالاسم أو الكود أو رقم الصندوق" value="'+esc(q)+'" oninput="q=this.value;L()">';
  $('app').innerHTML=h+v[tab]();
  var T=[['home','🏠','الرئيسية'],['items','📦','الأصناف'],['order','🧾','طلبية'],['log','🕘','السجل'],['more','⚙️','المزيد']];
  $('nav').innerHTML='<div>'+T.map(function(t){return '<button class="'+(tab==t[0]?'on':'')+'" onclick="go(\''+t[0]+'\')"><span>'+t[1]+'</span>'+t[2]+'</button>'}).join('')+'</div>';
  barr();
}
function L(){$('lst').innerHTML=tab=='items'?itemsList():orderList()}
function barr(){
  var h='',o=document.querySelector('.sh');
  if(!o){if(tab=='items')h+='<button class="fab" onclick="editItem()" aria-label="إضافة صنف">+</button>';
  if(cartN()&&(tab=='items'||tab=='order'))h+='<button class="cartbar" onclick="openCart()">الطلبية ('+cartN()+' أصناف) · تأكيد الصرف</button>'}
  $('bar').innerHTML=h;
}
function sheet(html){closeSheet();var d=document.createElement('div');d.className='sh';d.onclick=function(e){if(e.target==d)closeSheet()};d.innerHTML='<div>'+html+'</div>';document.body.appendChild(d);barr()}
function closeSheet(){var s=document.querySelector('.sh');if(s)s.remove();barr()}
function hd(t){return '<div class="r"><span class="nm" style="font-size:20px">'+t+'</span><button class="s x" onclick="closeSheet()">إغلاق</button></div>'}

function home(){
  var it=scope(),nr=it.filter(function(i){return i.rem>0&&dd(i.exp)<=90}).sort(function(a,b){return dd(a.exp)-dd(b.exp)}),lw=it.filter(function(i){return i.rem<=0||low(i)});
  var m=0,out={};D.log.forEach(function(l){if(l.undone||l.k=='t'||Date.now()-l.t>2592e6)return;l.lines.forEach(function(x){if(D.cw!='all'&&(x.wh||1)!=D.cw)return;m+=x.qty*(x.price||0);out[x.name]=(out[x.name]||0)+x.qty})});
  var top=Object.keys(out).sort(function(a,b){return out[b]-out[a]}).slice(0,3);
  var mx=Math.max.apply(null,[1].concat(D.wh.map(function(w){return val(D.items.filter(function(i){return(i.wh||1)==w.id}))})));
  var h='<div class="grid"><div class="stat hero"><span>قيمة المخزون</span><b>'+n(val(it))+'</b></div><div class="stat"><span class="m">عدد الأصناف</span><b>'+n(it.length)+'</b></div><div class="stat"><span class="m">مصروف آخر 30 يوم</span><b>'+n(m)+'</b></div><div class="stat"><span class="m">قريب الانتهاء</span><b style="color:var(--bad)">'+nr.length+'</b></div><div class="stat"><span class="m">ناقص أو نافد</span><b style="color:var(--wn)">'+lw.length+'</b></div></div>';
  if(D.cw=='all'&&D.wh.length>1){h+='<h2>المخازن</h2>';D.wh.forEach(function(w){var a=D.items.filter(function(i){return(i.wh||1)==w.id}),v=val(a);h+='<div class="card"><div class="r"><b>'+esc(w.name)+'</b><span>'+n(v)+'</span></div><div class="m">'+a.length+' صنف</div><div class="bar"><i style="width:'+Math.round(v/mx*100)+'%"></i></div></div>'})}
  h+='<h2>تنبيهات الانتهاء</h2>'+(nr.length?nr.slice(0,6).map(function(i){return '<div class="card it r" onclick="oi('+i.id+')"><div><b>'+esc(i.name)+'</b><div class="m">'+esc(wn(i.wh))+' · متبقي '+n(i.rem)+'</div></div>'+exTag(i)+'</div>'}).join(''):'<div class="card m">لا توجد أصناف قريبة الانتهاء.</div>');
  h+='<h2>نقص المخزون</h2>'+(lw.length?lw.slice(0,6).map(function(i){return '<div class="card it r" onclick="oi('+i.id+')"><div><b>'+esc(i.name)+'</b><div class="m">'+esc(wn(i.wh))+'</div></div><span class="tag '+(i.rem<=0?'tb':'tw')+'">'+(i.rem<=0?'نافد':'متبقي '+n(i.rem))+'</span></div>'}).join(''):'<div class="card m">لا يوجد نقص.</div>');
  h+='<h2>الأكثر خروجاً</h2>'+(top.length?top.map(function(k){return '<div class="card r"><span>'+esc(k)+'</span><b>'+n(out[k])+'</b></div>'}).join(''):'<div class="card m">ستظهر بعد أول صرف.</div>');
  return h;
}
function itemsV(){return '<div id="lst">'+itemsList()+'</div>'}
function itemsList(){
  if(!D.items.length)return '<div class="card m">لا توجد أصناف. اضغط + لإضافة أول صنف.</div>';
  var r=match(scope());if(!r.length)return '<div class="card m">لا يوجد صنف بهذا الاسم.</div>';
  return r.map(function(i){return '<div class="card it" onclick="oi('+i.id+')"><div class="r"><span class="nm">'+esc(i.name)+'</span>'+(cart[i.id]?'<span class="tag to">بالطلبية '+cart[i.id]+'</span>':'')+'</div><div class="r" style="margin-top:4px"><span>المتبقي: <b class="big" style="color:'+(i.rem<=0?'var(--bad)':'inherit')+'">'+n(i.rem)+'</b></span>'+exTag(i)+'</div><div class="m">'+(D.cw=='all'?esc(wn(i.wh))+' · ':'')+(i.price!==''&&i.price!=null?'السعر '+n(i.price)+' · ':'')+esc(i.company)+'</div>'+(i.boxes?'<div class="m">الصناديق: '+esc(i.boxes)+'</div>':'')+'</div>'}).join('');
}
function oi(id){
  var i=find(id);if(!i)return;
  function kv(k,v){return v===''||v==null?'':'<div class="kv"><span class="m">'+k+'</span><b>'+v+'</b></div>'}
  sheet(hd(esc(i.name))+'<div class="card" style="margin-top:10px;text-align:center"><div class="m">المتبقي في '+esc(wn(i.wh))+'</div><div class="big" style="font-size:36px">'+n(i.rem)+'</div>'+exTag(i)+'</div><label>الكمية المراد صرفها</label><input id="sq" class="qty" type="number" inputmode="numeric" min="1" placeholder="0"><div id="se" class="er"></div><div class="g2"><button onclick="out('+id+',1)">صرف الآن</button><button class="s" onclick="out('+id+',0)">أضف للطلبية</button></div><div style="margin-top:12px">'+kv('أرقام الصناديق',esc(i.boxes))+kv('الكود',esc(i.code))+kv('الشركة',esc(i.company))+kv('السعر',i.price!==''?n(i.price):'')+kv('الكمية الكلية',n(i.qty))+kv('الكراتين',i.cartons!==''?n(i.cartons):'')+kv('تاريخ الوصول',i.arr)+kv('تاريخ الانتهاء',i.exp)+kv('قيمة المتبقي',i.price!==''?n(i.price*i.rem):'')+'</div><div class="g2" style="margin-top:12px"><button class="s" onclick="editItem('+id+')">تعديل / استلام</button><button class="s" onclick="trf('+id+')">نقل لمخزن آخر</button></div><button class="d" style="width:100%;margin-top:8px" onclick="delItem('+id+')">حذف الصنف</button>');
  setTimeout(function(){var e=$('sq');if(e)e.focus()},50);
}
function out(id,now){
  var i=find(id),v=parseFloat($('sq').value);
  if(!(v>0)){$('se').textContent='اكتب الكمية أولاً';return}
  if(v>i.rem){$('se').textContent='الكمية أكبر من المتبقي ('+n(i.rem)+')';return}
  if(now){i.rem-=v;D.log.unshift({id:D.lseq++,t:Date.now(),name:'',phone:'',lines:[{id:i.id,name:i.name,qty:v,price:i.price,wh:i.wh}],undone:false});save();closeSheet();toast('تم صرف '+n(v)+' · المتبقي '+n(i.rem));R()}
  else{cart[id]=v;closeSheet();toast('أُضيف للطلبية');R()}
}
function orderV(){return '<div class="m" style="margin-bottom:8px">اكتب الكمية بجانب كل صنف مطلوب ثم اضغط تأكيد.</div><div id="lst">'+orderList()+'</div>'}
function orderList(){
  var r=match(scope());if(!r.length)return '<div class="card m">لا توجد أصناف.</div>';
  return r.map(function(i){return '<div class="card"><div class="ln" style="border:0;padding:0"><span style="flex:1"><b>'+esc(i.name)+'</b><div class="m">'+(D.cw=='all'?esc(wn(i.wh))+' · ':'')+'المتبقي: '+n(i.rem)+(i.boxes?' · '+esc(i.boxes):'')+'</div></span><input type="number" inputmode="numeric" min="0" placeholder="0" value="'+(cart[i.id]||'')+'" '+(i.rem<=0?'disabled':'')+' style="width:96px;margin:0;text-align:center;font-size:20px;font-weight:700" oninput="setQ('+i.id+',this)"></div></div>'}).join('');
}
function setQ(id,el){var v=parseFloat(el.value),i=find(id);if(v>0)cart[id]=v;else delete cart[id];el.style.borderColor=v>i.rem?'var(--bad)':'';barr()}
function openCart(){
  var tot=0,h=hd('تأكيد الطلبية')+'<div style="margin-top:8px">';
  Object.keys(cart).forEach(function(id){var i=find(id);if(!i)return;tot+=cart[id]*(i.price||0);h+='<div class="ln"><span>'+esc(i.name)+'<div class="m">'+esc(wn(i.wh))+' · متبقي '+n(i.rem)+'</div></span><b>× '+n(cart[id])+'</b></div>'});
  sheet(h+'</div><div class="r" style="margin:8px 0"><span>الإجمالي</span><b class="big">'+n(tot)+'</b></div><label>اسم المستلم (اختياري)</label><input id="cn"><label>رقم المستلم (اختياري)</label><input id="cp" type="tel" inputmode="tel"><div id="ce" class="er"></div><div class="g2"><button onclick="confirmCart()">تأكيد وخصم</button><button class="d" onclick="cart={};closeSheet();R()">مسح الطلبية</button></div>');
}
function confirmCart(){
  var lines=[],e='';
  Object.keys(cart).forEach(function(id){var i=find(id),v=cart[id];if(e)return;if(!i)return;if(v>i.rem){e='الكمية من '+i.name+' أكبر من المتبقي ('+n(i.rem)+')';return}lines.push({id:i.id,name:i.name,qty:v,price:i.price,wh:i.wh})});
  if(e){$('ce').textContent=e;return}
  lines.forEach(function(l){find(l.id).rem-=l.qty});
  D.log.unshift({id:D.lseq++,t:Date.now(),name:$('cn').value.trim(),phone:$('cp').value.trim(),lines:lines,undone:false});
  cart={};save();closeSheet();toast('تم الصرف وخصمه من المخزون');R();
}
function editItem(id){
  var i=id?find(id):{name:'',code:'',price:'',qty:'',cartons:'',rem:'',company:'',boxes:'',exp:'',arr:new Date().toISOString().slice(0,10),wh:D.cw=='all'?D.wh[0].id:D.cw};
  function f(k,l,t,v){return '<label>'+l+'</label><input id="e_'+k+'" type="'+t+'" value="'+esc(v)+'"'+(t=='number'?' inputmode="decimal" min="0" step="any"':'')+'>'}
  sheet(hd(id?'تعديل صنف':'إضافة صنف')+(id?'':'<label>المخزن</label><select id="e_wh">'+D.wh.map(function(w){return '<option value="'+w.id+'"'+(w.id==i.wh?' selected':'')+'>'+esc(w.name)+'</option>'}).join('')+'</select>')+f('name','اسم الصنف *','text',i.name)+f('code','الكود','text',i.code)+'<div class="g2"><div>'+f('price','السعر','number',i.price)+'</div><div>'+f('company','اسم الشركة','text',i.company)+'</div></div>'+f('boxes','أرقام الصناديق (مثال: 11/96 - 55/96)','text',i.boxes||'')+(id?'<div class="g2"><div>'+f('qty','الكمية الكلية','number',i.qty)+'</div><div>'+f('rem','المتبقي','number',i.rem)+'</div></div>'+f('cartons','عدد الكراتين','number',i.cartons):'<div class="g2"><div>'+f('qty','الكمية *','number','')+'</div><div>'+f('cartons','عدد الكراتين','number','')+'</div></div>')+'<div class="g2"><div>'+f('arr','تاريخ الوصول','date',i.arr)+'</div><div>'+f('exp','تاريخ الانتهاء','date',i.exp)+'</div></div>'+(id?'<label>وصلت كمية جديدة؟ اكتبها لتُضاف للمتبقي والكلية</label><input id="e_add" type="number" inputmode="numeric" min="0" placeholder="0">':'')+'<div id="ee" class="er"></div><button style="width:100%" onclick="saveItem('+(id||0)+')">حفظ</button>');
}
function saveItem(id){
  function g(k){var e=$('e_'+k);return e?e.value.trim():''}
  if(!g('name')){$('ee').textContent='اكتب اسم الصنف';return}
  var o={name:g('name'),code:g('code'),price:g('price')===''?'':parseFloat(g('price')),company:g('company'),boxes:g('boxes'),cartons:g('cartons')===''?'':parseFloat(g('cartons')),arr:g('arr'),exp:g('exp')};
  if(id){var i=find(id);o.qty=parseFloat(g('qty'))||0;o.rem=parseFloat(g('rem'))||0;var a=parseFloat(g('add'))||0;o.qty+=a;o.rem+=a;if(o.rem>o.qty){$('ee').textContent='المتبقي أكبر من الكمية الكلية';return}Object.assign(i,o);toast(a?'أُضيف '+n(a)+' للمخزون':'تم الحفظ')}
  else{var v=parseFloat(g('qty'));if(g('qty')===''||!(v>=0)){$('ee').textContent='اكتب الكمية';return}o.qty=v;o.rem=v;o.wh=parseInt(g('wh'));o.id=D.seq++;D.items.push(o);toast('تمت إضافة الصنف')}
  save();closeSheet();R();
}
function delItem(id){if(!confirm('حذف هذا الصنف نهائياً؟'))return;D.items=D.items.filter(function(i){return i.id!=id});delete cart[id];save();closeSheet();R()}
function trf(id){
  var i=find(id),o=D.wh.filter(function(w){return w.id!=i.wh});
  if(!o.length){toast('أضف مخزناً آخر أولاً من تبويب المزيد');return}
  sheet(hd('نقل: '+esc(i.name))+'<div class="m">من '+esc(wn(i.wh))+' · المتبقي '+n(i.rem)+'</div><label>إلى مخزن</label><select id="tw">'+o.map(function(w){return '<option value="'+w.id+'">'+esc(w.name)+'</option>'}).join('')+'</select><label>الكمية</label><input id="tq" class="qty" type="number" inputmode="numeric" min="1" placeholder="0"><div id="te" class="er"></div><button style="width:100%" onclick="doTrf('+id+')">نقل</button>');
}
function doTrf(id){
  var s=find(id),to=parseInt($('tw').value),v=parseFloat($('tq').value);
  if(!(v>0)){$('te').textContent='اكتب الكمية';return}
  if(v>s.rem){$('te').textContent='أكبر من المتبقي ('+n(s.rem)+')';return}
  s.rem-=v;s.qty-=v;
  var t=D.items.filter(function(x){return x.wh==to&&((s.code&&x.code==s.code)||x.name==s.name)})[0];
  if(t){t.rem+=v;t.qty+=v}else{var c=Object.assign({},s);c.id=D.seq++;c.wh=to;c.qty=v;c.rem=v;c.cartons='';D.items.push(c)}
  D.log.unshift({id:D.lseq++,t:Date.now(),k:'t',from:s.wh,to:to,lines:[{name:s.name,qty:v,price:s.price,wh:s.wh}],undone:false});
  save();closeSheet();toast('تم النقل إلى '+wn(to));R();
}
function logV(){
  if(!D.log.length)return '<div class="card m">لا توجد عمليات بعد.</div>';
  return D.log.map(function(l){var d=new Date(l.t),tot=0;l.lines.forEach(function(x){tot+=x.qty*(x.price||0)});
    return '<div class="card" style="'+(l.undone?'opacity:.55':'')+'"><div class="r"><b>'+(l.k=='t'?'نقل: '+esc(wn(l.from))+' ← '+esc(wn(l.to)):(esc(l.name)||'صرف')+(l.phone?' · '+esc(l.phone):''))+'</b><span class="m">'+d.toLocaleDateString('en')+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})+'</span></div>'+l.lines.map(function(x){return '<div class="r" style="padding:3px 0"><span>'+esc(x.name)+(l.k!='t'?' <span class="m">('+esc(wn(x.wh))+')</span>':'')+'</span><b>× '+n(x.qty)+'</b></div>'}).join('')+'<div class="r" style="margin-top:6px"><span class="m">'+(tot&&l.k!='t'?'الإجمالي '+n(tot):'')+'</span>'+(l.k=='t'?'':l.undone?'<span class="tag tb">تم التراجع</span>':'<button class="d x" onclick="undo('+l.id+')">تراجع</button>')+'</div></div>'}).join('');
}
function undo(id){var l=D.log.filter(function(x){return x.id==id})[0];if(!l||l.undone||!confirm('التراجع وإرجاع الكميات؟'))return;l.lines.forEach(function(x){var i=find(x.id);if(i)i.rem+=x.qty});l.undone=true;save();toast('تم التراجع');R()}
function moreV(){
  var h='<h2 style="margin-top:4px">المخازن</h2>'+D.wh.map(function(w){var c=D.items.filter(function(i){return(i.wh||1)==w.id}).length;return '<div class="card r"><div><b>'+esc(w.name)+'</b><div class="m">'+c+' صنف</div></div><span style="display:flex;gap:6px"><button class="s x" onclick="renWh('+w.id+')">تسمية</button><button class="d x" onclick="delWh('+w.id+')">حذف</button></span></div>'}).join('');
  h+='<div class="card"><input id="nw" placeholder="اسم مخزن جديد"><button style="width:100%" onclick="addWh()">+ إضافة مخزن</button></div>';
  h+='<h2>النسخ الاحتياطي</h2><div class="card"><div class="m">خذ نسخة بين فترة وأخرى.</div><div class="g2" style="margin-top:8px"><button onclick="backup()">حفظ نسخة</button><button class="s" onclick="$(\'imp\').click()">استرجاع نسخة</button></div><button class="s" style="width:100%;margin-top:8px" onclick="csv()">تصدير الأصناف (Excel)</button><input id="imp" type="file" accept=".json" style="display:none" onchange="restore(this)"></div>';
  return h+'<div class="card ab"><div class="lg">EZO</div><div class="nm">EZO MEDIKAL</div><div class="m">نظام إدارة المخازن · الإصدار 2.0</div><div style="margin-top:8px">تطوير: <b>عبدالله إبراهيم</b></div></div>';
}
function addWh(){var v=$('nw').value.trim();if(!v)return;D.wh.push({id:D.wseq++,name:v});save();toast('تمت إضافة المخزن');R()}
function renWh(id){var w=D.wh.filter(function(x){return x.id==id})[0],v=prompt('الاسم الجديد',w.name);if(v&&v.trim()){w.name=v.trim();save();R()}}
function delWh(id){
  if(D.wh.length<2){toast('لا يمكن حذف آخر مخزن');return}
  if(D.items.some(function(i){return(i.wh||1)==id})){toast('انقل أصنافه أو احذفها أولاً');return}
  if(!confirm('حذف هذا المخزن؟'))return;D.wh=D.wh.filter(function(w){return w.id!=id});if(D.cw==id)D.cw='all';save();R();
}
function dl(name,txt,type){try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('تم حفظ: '+name)}catch(e){toast('تعذّر التنزيل')}}
function backup(){dl('ezo-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(D),'application/json')}
function restore(el){var f=el.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var s=JSON.parse(r.result),m=null;if(s.wh&&s.items)m=s;else if(s.items){m={wh:[{id:1,name:'المخزن الرئيسي'}],items:s.items.map(function(i){i.wh=1;return i}),log:s.log||[],seq:s.seq||1,lseq:s.lseq||1,wseq:2,cw:'all'}}if(!m)throw 0;if(!confirm('سيستبدل هذا كل البيانات الحالية. متابعة؟'))return;D=m;cart={};save();toast('تم الاسترجاع');R()}catch(e){toast('الملف غير صالح')}};r.readAsText(f)}
function csv(){var c='\uFEFFالمخزن,الاسم,الكود,السعر,أرقام الصناديق,الكمية الكلية,الكراتين,المتبقي,الشركة,تاريخ الوصول,تاريخ الانتهاء\n';D.items.forEach(function(i){c+=[wn(i.wh),i.name,i.code,i.price,i.boxes,i.qty,i.cartons,i.rem,i.company,i.arr,i.exp].map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}).join(',')+'\n'});dl('ezo-items.csv',c,'text/csv')}
R();
