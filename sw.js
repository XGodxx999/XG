'use strict';
const CACHE='xg-prime-v76';
const SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png',
  './icon.png?v=6',
  './icon.svg',
  './assets/js/ai-tools.js?v=11',
  './assets/js/command-center.js?v=4'
];
const STATIC_DESTINATIONS=new Set(['script','style','image','font']);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('xg-prime-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch(error){
        return (await caches.match('./index.html'))||Response.error();
      }
    })());
    return;
  }
  if(!STATIC_DESTINATIONS.has(request.destination))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    const refresh=fetch(request).then(response=>{
      if(response.ok&&response.type==='basic')cache.put(request,response.clone());
      return response;
    });
    if(cached){
      event.waitUntil(refresh.then(()=>undefined).catch(()=>undefined));
      return cached;
    }
    try{return await refresh;}catch(error){return Response.error();}
  })());
});
