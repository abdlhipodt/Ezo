var V='ezo-pro-v6';
var FILES=['./','./index.html','./style.css','./config.js','./app.js','./stock.js','./orders.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==V}).map(function(x){return caches.delete(x)}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(V).then(function(x){x.put(r,c)})}return res}).catch(function(){return caches.match(r,{ignoreSearch:true}).then(function(m){return m||caches.match('./index.html')})}));
  }else if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res.ok||res.type==='opaque'){var c=res.clone();caches.open(V).then(function(x){x.put(r,c)})}return res})}));
  }else if(u.hostname==='www.gstatic.com'&&u.pathname.indexOf('/firebasejs/')===0){
    e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(V).then(function(x){x.put(r,c)})}return res})}));
  }
});
