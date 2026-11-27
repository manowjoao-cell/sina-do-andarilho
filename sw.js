// Sina do Andarilho: funciona sem internet e sempre busca a versão nova quando há conexão.
const CACHE='sina-v1';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  // Firebase (login, banco de dados) nunca passa pelo cache.
  if(u.hostname.includes('googleapis.com')&&!u.hostname.startsWith('fonts'))return;
  if(u.hostname.includes('firebaseio')||u.hostname.includes('identitytoolkit')||u.hostname.includes('securetoken'))return;
  const page=r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/');
  if(page||u.origin===location.origin){
    // Rede primeiro: atualizações chegam na hora; sem internet, usa a cópia salva.
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
  }else{
    // Fontes e bibliotecas: cópia salva primeiro, atualiza em segundo plano.
    e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>m);return m||net}));
  }
});
