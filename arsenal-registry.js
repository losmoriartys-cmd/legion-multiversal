(function () {
  'use strict';
  const root=document.getElementById('arsenal-registry');
  const grid=document.getElementById('arsenal-grid');
  const status=document.getElementById('arsenal-registry-status');
  const summary=document.getElementById('arsenal-registry-summary');
  const search=document.getElementById('arsenal-search');
  const stateFilter=document.getElementById('arsenal-status-filter');
  const categoryFilter=document.getElementById('arsenal-category-filter');
  const playersFilter=document.getElementById('arsenal-players-filter');
  const rouletteButton=document.getElementById('arsenal-roulette-button');
  const rouletteResult=document.getElementById('arsenal-roulette-result');
  const resetButton=document.getElementById('arsenal-reset-filters');
  if(!root||!grid||!status||!summary)return;
  let games=[];
  let visibleGames=[];
  function escapeHtml(value){
    return String(value===null||value===undefined?'':value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function normalize(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  }
  function safeHttps(value){
    if(typeof value!=='string')return '';
    try{const url=new URL(value);return url.protocol==='https:'?url.href:'';}catch(error){return '';}
  }
  function stateOf(game){
    if((game.sesiones||[]).length)return 'documented';
    if(game.expediente_comercial)return 'commercial';
    return 'discovery';
  }
  function stateLabel(game){
    const state=stateOf(game);
    if(state==='documented')return 'COLABORACIÓN DOCUMENTADA';
    if(state==='commercial')return 'EXPEDIENTE COMERCIAL · '+game.expediente_comercial;
    return 'POR DESCUBRIR';
  }
  function playersLabel(game){
    if(!game.jugadores)return 'Jugadores: cantidad sin verificar';
    const min=game.jugadores.min,max=game.jugadores.max;
    return min===max?'Jugadores: '+min:'Jugadores: '+min+'–'+max;
  }
  function renderCover(game){
    const src=safeHttps(game.portada);
    if(src)return '<div class="arsenal-registry-cover"><img src="'+escapeHtml(src)+'" alt="Arte de '+escapeHtml(game.nombre)+'" loading="lazy" decoding="async"><span>'+escapeHtml(stateLabel(game))+'</span></div>';
    return '<div class="arsenal-registry-cover arsenal-registry-cover-fallback"><span>'+escapeHtml(stateLabel(game))+'</span><strong>'+escapeHtml(game.nombre)+'</strong><small>PORTADA OFICIAL PENDIENTE</small></div>';
  }
  function renderMetadata(game){
    const values=[];
    if(game.plataformas&&game.plataformas.length)values.push('Plataforma · '+game.plataformas.join(', '));
    if(game.ediciones&&game.ediciones.length)values.push('Ediciones · '+game.ediciones.join(' / '));
    if(game.modalidad)values.push('Modalidad · '+game.modalidad);
    values.push(playersLabel(game));
    return '<ul class="arsenal-registry-meta">'+values.map(value=>'<li>'+escapeHtml(value)+'</li>').join('')+'</ul>';
  }
  function renderLinks(game){
    const links=[];
    const store=safeHttps(game.tienda);
    if(store)links.push('<a class="arsenal-store-link" href="'+escapeHtml(store)+'" target="_blank" rel="noopener noreferrer">FICHA OFICIAL ↗</a>');
    const sessions=game.sesiones||[];
    if(sessions.length){
      const povs=sessions.reduce((sum,session)=>sum+(session.pov||[]).length,0);
      const bit=sessions[0].bit.toLowerCase();
      links.push('<a class="arsenal-bit-link" href="#'+escapeHtml(bit)+'" data-open-bit="'+escapeHtml(bit)+'">BITÁCORA · '+sessions.length+(sessions.length===1?' SESIÓN':' SESIONES')+' · '+povs+' POV →</a>');
    }else if(game.expediente_comercial){
      links.push('<a class="arsenal-bit-link" href="#barfender-expediente" data-open-commercial="barfender">VER '+escapeHtml(game.expediente_comercial)+' →</a>');
    }
    return '<div class="arsenal-registry-links">'+links.join('')+'</div>';
  }
  function renderGame(game,index){
    const categories=(game.categorias||[]).map(category=>'<span class="arsenal-category-chip">'+escapeHtml(category)+'</span>').join('');
    const sessions=game.sesiones||[];
    const description=game.descripcion
      ?'<p class="arsenal-registry-description">'+escapeHtml(game.descripcion)+'</p>'
      :'<p class="arsenal-registry-description is-unverified">Descripción pendiente de completar con información oficial.</p>';
    const source=safeHttps(game.fuente_jugadores);
    const sourceLink=source?'<a class="arsenal-player-source" href="'+escapeHtml(source)+'" target="_blank" rel="noopener noreferrer">FUENTE DE JUGADORES ↗</a>':'';
    const povCount=sessions.reduce((sum,session)=>sum+(session.pov||[]).length,0);
    const evidence=sessions.length?sessions.length+(sessions.length===1?' sesión BIT':' sesiones BIT')+' · '+povCount+' POV disponibles':(game.expediente_comercial?'Registro comercial separado':'Sin sesión documentada');
    return '<article class="premium-card arsenal-card arsenal-registry-card" id="arsenal-game-'+escapeHtml(game.id)+'" data-arsenal-game="'+escapeHtml(game.id)+'" data-game-id="'+escapeHtml(game.id)+'" data-arsenal-state="'+stateOf(game)+'">'+
      renderCover(game)+'<div class="arsenal-registry-card-body">'+
      '<div class="premium-kicker">MISIÓN '+String(index+1).padStart(2,'0')+' · '+escapeHtml(stateLabel(game))+'</div>'+
      '<h3>'+escapeHtml(game.nombre)+'</h3><div class="arsenal-registry-categories">'+categories+'</div>'+
      description+renderMetadata(game)+'<div class="arsenal-registry-evidence"><span>'+escapeHtml(evidence)+'</span></div>'+
      sourceLink+renderLinks(game)+'</div></article>';
  }
  function populateCategories(){
    const categories=Array.from(new Set(games.flatMap(game=>game.categorias||[]))).sort((a,b)=>a.localeCompare(b,'es'));
    categoryFilter.innerHTML='<option value="all">Todas las categorías</option>'+categories.map(category=>'<option value="'+escapeHtml(category)+'">'+escapeHtml(category)+'</option>').join('');
  }
  function filtered(){
    const query=normalize(search.value);
    const state=stateFilter.value;
    const category=categoryFilter.value;
    const minPlayers=playersFilter.value==='all'?null:Number(playersFilter.value);
    return games.filter(game=>{
      const text=normalize([game.nombre,game.id,(game.aliases||[]).join(' '),(game.categorias||[]).join(' '),game.descripcion||'',game.modalidad||'',(game.plataformas||[]).join(' '),(game.ediciones||[]).join(' ')].join(' '));
      if(query&&!text.includes(query))return false;
      if(state!=='all'&&stateOf(game)!==state)return false;
      if(category!=='all'&&!(game.categorias||[]).includes(category))return false;
      if(minPlayers!==null&&(!game.jugadores||game.jugadores.max<minPlayers))return false;
      return true;
    });
  }
  function renderSummary(){
    const documented=games.filter(game=>(game.sesiones||[]).length>0).length;
    const discovery=games.filter(game=>stateOf(game)==='discovery').length;
    const commercial=games.filter(game=>stateOf(game)==='commercial').length;
    const bitCount=games.reduce((sum,game)=>sum+(game.sesiones||[]).length,0);
    summary.innerHTML='<article><strong>'+games.length+'</strong><span>JUEGOS ÚNICOS</span></article>'+
      '<article><strong>'+documented+'</strong><span>CON SESIÓN BIT · '+bitCount+' SESIONES</span></article>'+
      '<article><strong>'+discovery+'</strong><span>POR DESCUBRIR</span></article>'+
      '<article><strong>'+commercial+'</strong><span>EXPEDIENTES COMERCIALES</span></article>';
  }
  function render(){
    visibleGames=filtered();
    grid.innerHTML=visibleGames.length?visibleGames.map(renderGame).join(''):
      '<div class="arsenal-registry-empty"><strong>NO HAY JUEGOS CON ESOS FILTROS.</strong><p>Probá otra categoría, cantidad de jugadores o búsqueda.</p></div>';
    grid.dataset.loaded='true';
    grid.setAttribute('aria-busy','false');
    status.textContent=visibleGames.length+(visibleGames.length===1?' juego visible.':' juegos visibles.')+' · '+visibleGames.filter(game=>stateOf(game)==='documented').length+' con Bitácora.';
  }
  function roulette(){
    if(!visibleGames.length){rouletteResult.textContent='No hay juegos visibles para sortear. Cambiá o limpiá los filtros.';return;}
    const winner=visibleGames[Math.floor(Math.random()*visibleGames.length)];
    rouletteResult.innerHTML='<span class="arsenal-roulette-result-label">MISIÓN SELECCIONADA</span><strong>'+escapeHtml(winner.nombre)+'</strong><span>'+escapeHtml((winner.categorias||[]).join(' · '))+'</span><button type="button" data-roulette-open="'+escapeHtml(winner.id)+'">ABRIR ESTA FICHA →</button>';
  }
  function reset(){
    search.value='';stateFilter.value='all';categoryFilter.value='all';playersFilter.value='all';render();
    rouletteResult.textContent='La próxima aventura puede estar en cualquier universo.';
  }
  async function load(){
    root.setAttribute('aria-busy','true');
    try{
      const response=await fetch('./data/games.json',{cache:'no-store'});
      if(!response.ok)throw new Error('No se pudo cargar games.json ('+response.status+').');
      const payload=await response.json();
      if(!payload||!Array.isArray(payload.juegos)||!payload.juegos.length)throw new Error('games.json no contiene juegos.');
      games=payload.juegos;populateCategories();renderSummary();render();
      root.dataset.arsenalReady='true';root.setAttribute('aria-busy','false');return games.length;
    }catch(error){
      console.error('No se pudo cargar el Arsenal compartido:',error);
      root.dataset.arsenalReady='error';root.setAttribute('aria-busy','false');grid.setAttribute('aria-busy','false');
      status.textContent='No se pudo conectar con el catálogo compartido.';
      grid.innerHTML='<div class="arsenal-registry-empty" role="alert"><strong>EL CATÁLOGO NO ESTÁ DISPONIBLE.</strong><p>Los registros no se pierden; podés volver a intentar la carga.</p><button type="button" id="arsenal-retry">REINTENTAR</button></div>';
      document.getElementById('arsenal-retry')?.addEventListener('click',load);return null;
    }
  }
  [search,stateFilter,categoryFilter,playersFilter].forEach(control=>control.addEventListener(control===search?'input':'change',render));
  rouletteButton.addEventListener('click',roulette);
  resetButton.addEventListener('click',reset);
  grid.addEventListener('click',event=>{
    const link=event.target.closest('[data-open-bit]');
    if(!link)return;
    event.preventDefault();
    const bit=link.dataset.openBit;
    if(typeof window.switchChapter==='function')window.switchChapter(12,{scrollBehavior:'auto'});
    window.requestAnimationFrame(()=>{
      const session=document.getElementById(bit);
      const target=session?.querySelector('[data-open-arsenal]')||session;
      target?.scrollIntoView({block:'center',behavior:'auto'});
    });
  });
  grid.addEventListener('click',event=>{
    const link=event.target.closest('[data-open-commercial]');
    if(!link)return;
    event.preventDefault();
    if(typeof window.switchChapter==='function')window.switchChapter(12,{scrollBehavior:'auto'});
    window.requestAnimationFrame(()=>document.getElementById('barfender-expediente')?.scrollIntoView({block:'center',behavior:'auto'}));
  });
  rouletteResult.addEventListener('click',event=>{
    const button=event.target.closest('[data-roulette-open]');
    if(!button)return;
    document.getElementById('arsenal-game-'+button.dataset.rouletteOpen)?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
  window.arsenalRegistryReady=load();
})();