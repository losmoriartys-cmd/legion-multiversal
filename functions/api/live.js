function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=60, s-maxage=60",...headers}});}
async function fetchWithTimeout(url,options={},timeoutMs=8000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
async function getToken(env){
 const response=await fetchWithTimeout("https://id.twitch.tv/oauth2/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,client_secret:env.TWITCH_CLIENT_SECRET,grant_type:"client_credentials"})});
 if(!response.ok)throw new Error("No se pudo autenticar con Twitch.");
 return (await response.json()).access_token;
}
export async function onRequest({request,env}){
 if(request.method!=="GET")return json({error:"Método no permitido."},405);
 const cacheKey=new Request(new URL("/api/live",request.url).toString(),{method:"GET"});
 const cache=typeof caches!=="undefined"?caches.default:null;
 if(cache){const cached=await cache.match(cacheKey);if(cached)return cached;}
 if(!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET)return json({error:"Faltan credenciales de Twitch Helix."},503,{"cache-control":"no-store"});
 try{
  const rosterResponse=await fetchWithTimeout(new URL("/roster-data.json",request.url));
  if(!rosterResponse.ok)throw new Error("No se pudo leer el roster.");
  const roster=await rosterResponse.json();
  const tracked=(roster.heroes||[]).map(hero=>{
   const raw=String(hero.twitch||"").trim();
   const login=raw.split("/").filter(Boolean).pop()||"";
   return login?{login:login.toLowerCase(),display_name:hero.name||login}:null;
  }).filter(Boolean);
  if(!tracked.length){
   const response=json({source:"twitch-helix",updated_at:new Date().toISOString(),cache_seconds:60,channels:[]});
   if(cache)await cache.put(cacheKey,response.clone());
   return response;
  }
  const token=await getToken(env);
  const params=new URLSearchParams();
  tracked.forEach(item=>params.append("user_login",item.login));
  const helix=await fetchWithTimeout("https://api.twitch.tv/helix/streams?"+params.toString(),{headers:{"Client-ID":env.TWITCH_CLIENT_ID,"Authorization":"Bearer "+token}});
  if(!helix.ok)throw new Error("Twitch Helix respondió "+helix.status+".");
  const body=await helix.json();
  const liveByLogin=new Map((body.data||[]).map(stream=>[stream.user_login.toLowerCase(),stream]));
  const channels=tracked.map(item=>{
   const stream=liveByLogin.get(item.login);
   return {login:item.login,display_name:stream?.user_name||item.display_name,live:Boolean(stream),game_name:stream?.game_name||null,viewer_count:stream?.viewer_count??null,title:stream?.title||null,started_at:stream?.started_at||null};
  });
  const response=json({source:"twitch-helix",updated_at:new Date().toISOString(),cache_seconds:60,channels});
  if(cache)await cache.put(cacheKey,response.clone());
  return response;
 }catch(error){return json({error:error.message||"No se pudo consultar Twitch Helix."},502,{"cache-control":"no-store"});}
}
