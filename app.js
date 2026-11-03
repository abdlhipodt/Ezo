import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {initializeFirestore,getFirestore,persistentLocalCache,persistentMultipleTabManager,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig,ADMIN_EMAIL} from './config.js';
import {mountPage,stopPage,stopAll} from './stock.js';
import {mountOrders,stopOrders} from './orders.js';

const $=i=>document.getElementById(i);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES={admin:'مدير',keeper:'أمين مخزن',viewer:'مشاهد فقط'};
const ADMIN=String(ADMIN_EMAIL||'').trim().toLowerCase();
const IC={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg>',
  order:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  log:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  wh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-5 9 5v12"/><path d="M8 21v-7h8v7"/><path d="M8 17.5h8"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2 .8 3.5 2.6 3.5 5.6"/></svg>',
  me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>'
};
const GG='<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

let auth=null,db=null,U=null,P=null,unP=null,unU=null,page='home',UM={};
const ctx=()=>({db,P,U,esc,toast,msg,ic:IC});

function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2800)}
function screen(h){$('app').className='solo';$('app').innerHTML=h;$('nav').innerHTML=''}
function msg(e){const c=(e&&e.code)||'';if(c.includes('permission-denied'))return 'ليست لديك صلاحية لهذه العملية';if(c.includes('unavailable')||c.includes('network'))return 'لا يوجد اتصال بالإنترنت';return 'تعذّرت العملية'+(c?' ('+c+')':'')}
function stop(){if(unP){unP();unP=null}if(unU){unU();unU=null}stopPage();stopAll();stopOrders()}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

function setupV(){screen('<div class="splash"><div class="lg">EZO</div><h1>إعداد مطلوب</h1><p>افتح ملف config.js والصق إعدادات Firebase وإيميل المدير، ثم أعد رفعه.</p></div>')}
function loadV(t){screen('<div class="splash"><div class="sp"></div><p>'+esc(t||'جارٍ التحميل...')+'</p></div>')}
function loginV(m){
  screen('<div class="splash"><div class="lg">EZO</div><h1>EZO MEDIKAL</h1><p>نظام إدارة المخازن</p><button id="gl" class="g">'+GG+'<span>المتابعة بحساب Google</span></button><div class="er">'+esc(m||'')+'</div><div class="m ft">تطوير: عبدالله إبراهيم</div></div>');
  $('gl').onclick=login;
}
async function login(){
  try{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,p)}
  catch(e){const c=e&&e.code||'';if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return;
    loginV(c==='auth/unauthorized-domain'?'هذا الرابط غير مضاف في Firebase (Authorized domains)':c==='auth/popup-blocked'?'المتصفح منع النافذة، اسمح بالنوافذ المنبثقة':'تعذّر تسجيل الدخول'+(c?' ('+c+')':''))}
}
function deniedV(email,off){
  screen('<div class="splash"><div class="lg">EZO</div><h1>'+(off?'الحساب موقوف':'لا تملك صلاحية')+'</h1><p>'+esc(email)+'<br>'+(off?'تواصل مع المدير لإعادة تفعيل حسابك.':'اطلب من المدير إضافة هذا الإيميل ثم أعد المحاولة.')+'</p><button id="so" class="g">تسجيل الخروج</button></div>');
  $('so').onclick=()=>signOut(auth);
}
function errV(e,email){
  screen('<div class="splash"><div class="lg">EZO</div><h1>تعذّر التحميل</h1><p>'+esc(msg(e))+'<br>تأكد من الاتصال بالإنترنت (مطلوب عند أول دخول).</p><button id="rt" class="g">إعادة المحاولة</button><button id="so" class="s" style="margin-top:8px">تسجيل الخروج</button></div>');
  $('rt').onclick=()=>boot(U);$('so').onclick=()=>signOut(auth);
}

async function onAuth(u){
  stop();U=u;P=null;
  document.querySelectorAll('.sh,.toast').forEach(e=>e.remove());
  if(!u){page='home';window.scrollTo(0,0);return loginV()}
  loadV('جارٍ التحقق من حسابك...');
  boot(u);
}
async function boot(u){
  const email=String(u.email||'').toLowerCase(),ref=doc(db,'users',email);
  let s;
  try{
    s=await getDoc(ref);
    if(!s.exists()){
      if(email!==ADMIN||!ADMIN)return deniedV(email);
      await setDoc(ref,{name:u.displayName||email,role:'admin',active:true,createdAt:serverTimestamp()});
      s=await getDoc(ref);
    }
  }catch(e){
    if(e&&String(e.code||'').includes('permission-denied'))return deniedV(email);
    return errV(e,email);
  }
  P=s.data();if(email===ADMIN)P.role='admin';
  if(P.active===false)return deniedV(email,true);
  let first=true;
  unP=onSnapshot(ref,x=>{
    if(!x.exists()&&email!==ADMIN){toast('تم حذف حسابك');signOut(auth);return}
    if(x.exists()){const d=x.data();if(d.active===false&&email!==ADMIN){toast('تم إيقاف حسابك');signOut(auth);return}
      const role=email===ADMIN?'admin':d.role,ch=P.role!==role||P.name!==d.name;
      P=Object.assign({},d,{role:role});if(!first&&ch)shell()}
    first=false;
  },()=>{});
  shell();
}

function shell(){
  const adm=P.role==='admin';
  const T=[['home',IC.home,'الرئيسية'],['items',IC.box,'الأصناف'],['order',IC.order,'طلبية'],['log',IC.log,'السجل'],['more',IC.more,'المزيد']];
  if(!['home','items','order','log','more','wh','users','me'].includes(page)||(page==='users'&&!adm))page='home';
  $('app').className='';$('app').innerHTML='<div class="top r"><div class="brand"><div class="lg">EZO</div><div><b>EZO MEDIKAL</b><div class="m">'+esc(P.name||U.email)+'</div></div></div><span class="tag to">'+esc(ROLES[P.role]||'')+'</span></div><div id="pg"></div>';
  $('nav').innerHTML='<div style="--n:'+T.length+'">'+T.map(t=>'<button class="'+((page===t[0]||(t[0]==='more'&&['wh','users','me'].includes(page)))?'on':'')+'" data-a="nav" data-p="'+t[0]+'"><span>'+t[1]+'</span>'+t[2]+'</button>').join('')+'</div>';
  draw();
}
function draw(){
  if(unU){unU();unU=null}
  stopPage();
  if(page==='items'||page==='wh'){mountPage(page,ctx());return}
  if(['home','order','log','more'].includes(page)){mountOrders(page,ctx());return}
  if(page==='users'&&P.role==='admin')usersV();else if(page==='me')meV();else mountOrders('home',ctx());
}
function meV(){
  $('pg').innerHTML='<div class="card" style="text-align:center">'+(U.photoURL?'<img class="av" referrerpolicy="no-referrer" alt="" src="'+esc(U.photoURL)+'">':'<div class="av"></div>')+'<div class="nm">'+esc(P.name||'')+'</div><div class="m">'+esc(U.email)+'</div><div style="margin-top:6px"><span class="tag to">'+esc(ROLES[P.role]||'')+'</span></div></div><button class="d" style="width:100%" data-a="out">تسجيل الخروج</button><div class="card ab" style="margin-top:12px"><div class="lg">EZO</div><div class="nm">EZO MEDIKAL</div><div class="m">الإصدار 3.1</div><div style="margin-top:8px">تطوير: <b>عبدالله إبراهيم</b></div></div>';
}
function usersV(){
  $('pg').innerHTML='<div class="card"><b>إضافة مستخدم</b><label>إيميل جوجل</label><input id="ne" type="email" inputmode="email" autocapitalize="none" placeholder="name@gmail.com"><label>الاسم</label><input id="nn"><label>الصلاحية</label><select id="nr"><option value="keeper">أمين مخزن (إدخال وصرف)</option><option value="viewer">مشاهد فقط</option><option value="admin">مدير</option></select><div id="ue" class="er"></div><button style="width:100%" data-a="add">إضافة</button></div><h2>المستخدمون</h2><div id="ul"><div class="card m">جارٍ التحميل...</div></div>';
  unU=onSnapshot(collection(db,'users'),snap=>{
    UM={};snap.forEach(d=>{UM[d.id]=d.data()});
    const ks=Object.keys(UM).sort();
    $('ul').innerHTML=ks.map(k=>{const x=UM[k],fixed=k===ADMIN||k===String(U.email).toLowerCase();
      return '<div class="card"><div class="r"><b>'+esc(x.name||k)+'</b>'+(x.active===false?'<span class="tag tb">موقوف</span>':'<span class="tag to">فعّال</span>')+'</div><div class="m">'+esc(k)+(k===ADMIN?' · المدير الأساسي':'')+'</div>'+
      (fixed?'<div class="m" style="margin-top:6px">'+esc(ROLES[x.role]||'')+'</div>':'<div class="g2" style="margin-top:8px"><select data-e="'+esc(k)+'" style="margin:0">'+Object.keys(ROLES).map(r=>'<option value="'+r+'"'+(x.role===r?' selected':'')+'>'+ROLES[r]+'</option>').join('')+'</select><button class="s x" data-a="tog" data-e="'+esc(k)+'">'+(x.active===false?'تفعيل':'إيقاف')+'</button></div><button class="d x" style="width:100%;margin-top:8px" data-a="del" data-e="'+esc(k)+'">حذف المستخدم</button>')+'</div>'}).join('')||'<div class="card m">لا يوجد مستخدمون.</div>';
  },e=>{const l=$('ul');if(l)l.innerHTML='<div class="card er">'+esc(msg(e))+'</div>'});
}

function closeOut(){const d=$('sho');if(d)d.remove()}
function askOut(){closeOut();const d=document.createElement('div');d.className='sh dlg';d.id='sho';d.innerHTML='<div><h3>تسجيل الخروج</h3><p>هل تريد الخروج من حسابك؟</p><div class="g2"><button class="s" data-a="outno">إلغاء</button><button class="d" data-a="outyes">خروج</button></div></div>';d.onclick=e=>{if(e.target===d)closeOut()};document.body.appendChild(d)}
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,k=b.dataset.e;
  try{
    if(a==='nav'){page=b.dataset.p;shell()}
    else if(a==='out'){askOut()}
    else if(a==='outno'){closeOut()}
    else if(a==='outyes'){b.disabled=true;closeOut();await signOut(auth)}
    else if(a==='add'){
      const em=$('ne').value.trim().toLowerCase(),nm=$('nn').value.trim(),rl=$('nr').value,er=$('ue');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.textContent='اكتب إيميلاً صحيحاً';return}
      if(!nm){er.textContent='اكتب الاسم';return}
      if(UM[em]){er.textContent='هذا الإيميل مضاف مسبقاً';return}
      b.disabled=true;
      await setDoc(doc(db,'users',em),{name:nm,role:rl,active:true,addedBy:String(U.email).toLowerCase(),createdAt:serverTimestamp()});
      $('ne').value='';$('nn').value='';er.textContent='';toast('تمت إضافة المستخدم');b.disabled=false;
    }
    else if(a==='tog'){const x=UM[k];if(!x)return;await updateDoc(doc(db,'users',k),{active:x.active===false})}
    else if(a==='del'){if(!confirm('حذف هذا المستخدم نهائياً؟'))return;await deleteDoc(doc(db,'users',k))}
  }catch(e){toast(msg(e));b.disabled=false}
});
document.addEventListener('change',async ev=>{
  const s=ev.target;if(!s.matches||!s.matches('select[data-e]'))return;
  try{await updateDoc(doc(db,'users',s.dataset.e),{role:s.value});toast('تم تغيير الصلاحية')}catch(e){toast(msg(e))}
});

if(!firebaseConfig.apiKey||String(firebaseConfig.apiKey).startsWith('PASTE')||!ADMIN||ADMIN.startsWith('put_')){setupV()}
else{
  try{
    const app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    try{db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}catch(e){db=getFirestore(app)}
    onAuthStateChanged(auth,onAuth);
  }catch(e){screen('<div class="splash"><div class="lg">EZO</div><h1>خطأ في الإعداد</h1><p>راجع ملف config.js</p></div>')}
}
