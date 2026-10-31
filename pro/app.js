import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {initializeFirestore,getFirestore,persistentLocalCache,persistentMultipleTabManager,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig,ADMIN_EMAIL} from './config.js';

const $=i=>document.getElementById(i);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES={admin:'مدير',keeper:'أمين مخزن',viewer:'مشاهد فقط'};
const ADMIN=String(ADMIN_EMAIL||'').trim().toLowerCase();
let auth=null,db=null,U=null,P=null,unP=null,unU=null,page='home',UM={};

function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2800)}
function screen(h){$('app').innerHTML=h;$('nav').innerHTML=''}
function msg(e){const c=(e&&e.code)||'';if(c.includes('permission-denied'))return 'ليست لديك صلاحية لهذه العملية';if(c.includes('unavailable')||c.includes('network'))return 'لا يوجد اتصال بالإنترنت';return 'تعذّرت العملية'+(c?' ('+c+')':'')}
function stop(){if(unP){unP();unP=null}if(unU){unU();unU=null}}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

function setupV(){screen('<div class="hero"><div class="lg">EZO</div><h1>إعداد مطلوب</h1><p>افتح ملف config.js والصق إعدادات Firebase وإيميل المدير، ثم أعد رفعه.</p></div>')}
function loadV(t){screen('<div class="hero"><div class="sp"></div><p>'+esc(t||'جارٍ التحميل...')+'</p></div>')}
function loginV(m){
  screen('<div class="hero"><div class="lg">EZO</div><h1>EZO MEDIKAL</h1><p>نظام إدارة المخازن</p><button id="gl" class="g">تسجيل الدخول بحساب جوجل</button><div class="er">'+esc(m||'')+'</div><div class="m ft">تطوير: عبدالله إبراهيم</div></div>');
  $('gl').onclick=login;
}
async function login(){
  try{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,p)}
  catch(e){const c=e&&e.code||'';if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return;
    loginV(c==='auth/unauthorized-domain'?'هذا الرابط غير مضاف في Firebase (Authorized domains)':c==='auth/popup-blocked'?'المتصفح منع النافذة، اسمح بالنوافذ المنبثقة':'تعذّر تسجيل الدخول'+(c?' ('+c+')':''))}
}
function deniedV(email,off){
  screen('<div class="hero"><div class="lg">EZO</div><h1>'+(off?'الحساب موقوف':'لا تملك صلاحية')+'</h1><p>'+esc(email)+'<br>'+(off?'تواصل مع المدير لإعادة تفعيل حسابك.':'اطلب من المدير إضافة هذا الإيميل ثم أعد المحاولة.')+'</p><button id="so" class="g">تسجيل الخروج</button></div>');
  $('so').onclick=()=>signOut(auth);
}
function errV(e,email){
  screen('<div class="hero"><div class="lg">EZO</div><h1>تعذّر التحميل</h1><p>'+esc(msg(e))+'<br>تأكد من الاتصال بالإنترنت (مطلوب عند أول دخول).</p><button id="rt" class="g">إعادة المحاولة</button><button id="so" class="s" style="margin-top:8px">تسجيل الخروج</button></div>');
  $('rt').onclick=()=>boot(U);$('so').onclick=()=>signOut(auth);
}

async function onAuth(u){
  stop();U=u;P=null;
  if(!u)return loginV();
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
  const T=[['home','🏠','الرئيسية']].concat(adm?[['users','👥','المستخدمون']]:[],[['me','👤','حسابي']]);
  if(!T.some(t=>t[0]===page))page='home';
  $('app').innerHTML='<div class="top r"><div class="brand"><div class="lg">EZO</div><div><b>EZO MEDIKAL</b><div class="m">'+esc(P.name||U.email)+'</div></div></div><span class="tag to">'+esc(ROLES[P.role]||'')+'</span></div><div id="pg"></div>';
  $('nav').innerHTML='<div style="--n:'+T.length+'">'+T.map(t=>'<button class="'+(page===t[0]?'on':'')+'" data-a="nav" data-p="'+t[0]+'"><span>'+t[1]+'</span>'+t[2]+'</button>').join('')+'</div>';
  draw();
}
function draw(){
  if(unU){unU();unU=null}
  if(page==='users'&&P.role==='admin')usersV();else if(page==='me')meV();else homeV();
}
function homeV(){
  const ck=(ok,t)=>'<div class="ck">'+(ok?'✅ ':'⬜ ')+t+'</div>';
  $('pg').innerHTML='<div class="card"><div class="nm">أهلاً '+esc(P.name||'')+'</div><div class="m">صلاحيتك: '+esc(ROLES[P.role]||'')+'</div></div><div class="card"><b>حالة النظام</b>'+ck(1,'تسجيل الدخول بحساب جوجل')+ck(1,'إدارة المستخدمين والصلاحيات')+ck(1,'قاعدة بيانات سحابية محمية')+ck(0,'المخازن والأصناف')+ck(0,'الطلبيات والنقل')+ck(0,'الاستيراد من Excel')+ck(0,'التقارير وسند الصرف')+'</div><div class="card m">هذه النسخة تضع الأساس والحماية. بقية الصفحات تُضاف في المراحل التالية، ونسختك الحالية تبقى تعمل كما هي.</div>';
}
function meV(){
  $('pg').innerHTML='<div class="card" style="text-align:center">'+(U.photoURL?'<img class="av" referrerpolicy="no-referrer" alt="" src="'+esc(U.photoURL)+'">':'<div class="av"></div>')+'<div class="nm">'+esc(P.name||'')+'</div><div class="m">'+esc(U.email)+'</div><div style="margin-top:6px"><span class="tag to">'+esc(ROLES[P.role]||'')+'</span></div></div><button class="d" style="width:100%" data-a="out">تسجيل الخروج</button><div class="card ab" style="margin-top:12px"><div class="lg">EZO</div><div class="nm">EZO MEDIKAL</div><div class="m">الإصدار 3.0 · المرحلة 1</div><div style="margin-top:8px">تطوير: <b>عبدالله إبراهيم</b></div></div>';
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

document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,k=b.dataset.e;
  try{
    if(a==='nav'){page=b.dataset.p;shell()}
    else if(a==='out'){await signOut(auth)}
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
  }catch(e){screen('<div class="hero"><div class="lg">EZO</div><h1>خطأ في الإعداد</h1><p>راجع ملف config.js</p></div>')}
}
