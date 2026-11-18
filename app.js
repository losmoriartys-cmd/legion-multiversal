        // Fuente de verdad del roster: editar role para cambiar jerarquía; completar powers y log con datos confirmados.
        let heroesData = [];
let creatorNameRegistry = {};
let epicCreatorPrograms = null;

async function loadRosterData() {
    const response = await fetch('./roster-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar roster-data.json (' + response.status + ').');
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.heroes) || payload.heroes.length === 0) {
        throw new Error('roster-data.json no contiene integrantes válidos.');
    }
    const identifiers = new Set();
    for (const hero of payload.heroes) {
        const identifier = hero && (hero.id || hero.slug);
        if (!identifier || identifiers.has(identifier)) {
            throw new Error('roster-data.json contiene un integrante sin identificador o con ID duplicado.');
        }
        identifiers.add(identifier);
    }
    heroesData = payload.heroes;
    creatorNameRegistry = payload.name_registry || {};
    return payload;
}

function renderRosterLoadError(error) {
    const host = document.getElementById('roster-container');
    if (!host) return;
    console.error('No se pudo inicializar el roster:', error);
    const selectorHost = document.getElementById('roster-selector');
    if (selectorHost) selectorHost.innerHTML = '<section class="roster-selector-load-error" role="alert"><strong>NO SE PUDO CARGAR EL ROSTER</strong><p>Los ocho perfiles siguen en el archivo. Revisá la conexión e intentá cargar nuevamente.</p></section>';
    host.setAttribute('aria-busy', 'false');
    host.innerHTML = '<section class="roster-load-error" role="alert" aria-live="assertive"><strong>EL ARCHIVO NO PUDO CARGARSE</strong><p>La información del Roster no está disponible en este momento. No significa que los expedientes se hayan perdido.</p><button class="roster-load-retry" type="button">REINTENTAR CARGA</button></section>';
    const retry = host.querySelector('.roster-load-retry');
    retry?.addEventListener('click', async () => {
        if (!retry) return;
        retry.disabled = true;
        retry.textContent = 'VOLVIENDO A INTENTAR…';
        host.setAttribute('aria-busy', 'true');
        try {
            await loadRosterData();
            await loadResourceOnce('creator-records', loadCreatorRecords);
            renderRoster();
            renderMultiverseMap();
            restoreHeroProfileFromHash();
        } catch (retryError) {
            retry.disabled = false;
            retry.textContent = 'REINTENTAR CARGA';
            host.setAttribute('aria-busy', 'false');
            const message = host.querySelector('p');
            if (message) message.textContent = 'Todavía no se pudo leer la fuente de datos. Revisá la conexión y volvé a intentar. Los detalles técnicos quedaron registrados en la consola.';
            console.error('Reintento de carga del roster fallido:', retryError);
        }
    });
}


        
let sullyGnomeData = null;
function findSullyChannel(hero){
 if(!sullyGnomeData || !hero || !hero.twitch)return null;
 const login=hero.twitch.split('/').filter(Boolean).pop().toLowerCase();
 return (sullyGnomeData.channels||[]).find(c=>(c.login||'').toLowerCase()===login) || null;
}
function escapeStatsHtml(value){
 return String(value===null||value===undefined?'—':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function renderEpicCreatorCodeCard(creatorId,variant='alliance'){
 const creator=epicCreatorPrograms?.creators?.[creatorId];
 if(!creator)return '<p class="epic-code-unavailable" role="status">Código pendiente de cargar desde el registro central.</p>';
 const safe=escapeStatsHtml;
 const status=safe(creator.display_status||epicCreatorPrograms.display_policy?.status_label||'REGISTRO DEL PROYECTO');
 const id=creator.creator_id?'<span><b>ID DE CREADOR</b> '+safe(creator.creator_id)+'</span>':'';
 const owner=safe(creator.owner), code=safe(creator.code);
 const note=safe(creator.evidence||'Registro interno del proyecto.');
 const verificationNote=safe(creator.verification_note||'La actividad actual debe comprobarse en la cuenta autenticada.');
 const activityNote=creator.account_details_evidence?'':' La actividad actual debe comprobarse en la cuenta autenticada.';
 const links=epicCreatorPrograms.official_links||{};
 return '<article class="epic-code-record epic-code-record-'+variant+'"><div class="epic-code-record-head"><span class="alliance-stamp alliance-stamp-platform">EPIC GAMES · SUPPORT-A-CREATOR</span><span class="epic-code-state">'+status+'</span></div><p class="epic-code-owner">'+owner+'</p><strong class="epic-code-value">'+code+'</strong><div class="alliance-code-meta"><span><b>CÓDIGO</b> '+code+'</span>'+id+'</div><div class="epic-code-actions"><button type="button" class="epic-code-copy" onclick="copyEpicCreatorCode(\''+safe(creatorId)+'\')">COPIAR CÓDIGO</button><a href="'+safe(links.account||'https://www.epicgames.com/account')+'" target="_blank" rel="noopener noreferrer">VER CUENTA EPIC ↗</a><a href="'+safe(links.dashboard||'https://sac.epicgames.com/dashboard/insights')+'" target="_blank" rel="noopener noreferrer">PANEL DEL CREADOR ↗</a></div><small class="epic-code-evidence">'+note+' Registro: '+safe(creator.recorded_at||'fecha no indicada')+'.'+activityNote+'</small><small class="epic-code-verification-note">'+verificationNote+'</small><span class="epic-code-copy-status" id="epic-code-copy-status-'+safe(creatorId)+'" role="status" aria-live="polite"></span></article>';
}
function renderEpicCreatorPrograms(){
 const collective=document.getElementById('epic-creator-programs-collective');
 const individual=document.getElementById('epic-creator-programs-rod3r1k');
 if(collective)collective.innerHTML=renderEpicCreatorCodeCard('moriartys','collective');
 if(individual)individual.innerHTML=renderEpicCreatorCodeCard('rod3r1k','individual');
 document.querySelectorAll('[data-epic-profile-code]').forEach(host=>{
  const creatorId=host.dataset.epicProfileCode;
  host.innerHTML=renderEpicCreatorCodeCard(creatorId,'roster-profile');
 });
}
async function loadEpicCreatorPrograms(){
 try{
  const response=await fetch('./creator-programs.json',{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo cargar creator-programs.json ('+response.status+').');
  const payload=await response.json();
  for(const id of ['moriartys','rod3r1k']){
   const creator=payload?.creators?.[id];
   if(!creator||!creator.code||!creator.owner||creator.account_portal_revalidated!==false)throw new Error('Registro Epic incompleto o con estado de verificación ambiguo: '+id);
  }
  epicCreatorPrograms=payload;
  renderEpicCreatorPrograms();
  return payload;
 }catch(error){
  console.error('No se pudo cargar el registro de códigos Epic:',error);
  const message='<p class="epic-code-unavailable" role="status">No se pudo consultar el registro central. No se muestra un código desde una copia local desactualizada.</p>';
  ['epic-creator-programs-collective','epic-creator-programs-rod3r1k'].forEach(id=>{const host=document.getElementById(id);if(host)host.innerHTML=message;});
  return null;
 }
}
async function copyEpicCreatorCode(creatorId){
 const code=epicCreatorPrograms?.creators?.[creatorId]?.code;
 const status=document.getElementById('epic-code-copy-status-'+creatorId);
 if(!code||!navigator.clipboard?.writeText){if(status)status.textContent='No fue posible copiar automáticamente. Seleccioná el código.';return;}
 try{await navigator.clipboard.writeText(code);if(status)status.textContent='Código copiado.';}
 catch(error){if(status)status.textContent='No fue posible copiar automáticamente. Seleccioná el código.';console.warn('Clipboard Epic code copy failed:',error);}
}
function renderEpicCreatorProfileBadge(hero){
 const creatorId=hero?.id==='moriartys'?'moriartys':hero?.id==='rod3r1k'?'rod3r1k':null;
 if(!creatorId||!epicCreatorPrograms?.creators?.[creatorId])return '';
 return renderEpicCreatorCodeCard(creatorId,'profile');
}

function renderTwitchClipPreview(clipId,title,destination){
 const id=String(clipId||'').trim();
 if(!id)return '<div class="twitch-clip-preview-empty">CLIP PENDIENTE DE ENLACE</div>';
 const fallback='https://clips.twitch.tv/'+encodeURIComponent(id);
 const candidate=String(destination||'').trim();
 const href=/^https:\/\/(?:www\.)?twitch\.tv\//i.test(candidate)||/^https:\/\/clips\.twitch\.tv\//i.test(candidate)?candidate:fallback;
 const label=String(title||'Clip destacado');
 return '<a class="twitch-clip-preview-link" href="'+escapeStatsHtml(href)+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir '+escapeStatsHtml(label)+' en Twitch"><span class="twitch-clip-play" aria-hidden="true">▶</span><strong>ABRIR CLIP EN TWITCH</strong><small>Se abre en una pestaña nueva</small></a>';
}

function statsNumber(value,digits=1){
 if(value===null||value===undefined||value==='')return '—';
 return typeof value==='number'?value.toLocaleString('es-AR',{maximumFractionDigits:digits}):escapeStatsHtml(value);
}
function statsDate(value){
 if(!value)return '—';
 const p=String(value).split('-');
 return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:escapeStatsHtml(value);
}
function statsDuration(stream){
 if(stream.duration_hours!==undefined)return statsNumber(stream.duration_hours,2)+' h';
 if(stream.duration_minutes!==undefined){
  const mins=Number(stream.duration_minutes);
  return Math.floor(mins/60)+' h '+(mins%60)+' min';
 }
 return '—';
}
function renderStatsBars(title,items,labelFn,valueFn,suffix,maxItems=10){
 const rows=(Array.isArray(items)?items:[]).map(item=>({item,value:Number(valueFn(item))})).filter(row=>Number.isFinite(row.value)&&row.value>=0).slice(-maxItems);
 if(!rows.length||!rows.some(row=>row.value>0))return '';
 const max=Math.max(...rows.map(row=>row.value),1);
 let out='<div class="stats-chart"><div class="stats-chart-title"><span>'+escapeStatsHtml(title)+'</span><small>'+escapeStatsHtml(suffix)+'</small></div>';
 rows.forEach(row=>{
  const width=Math.max(row.value>0?2:0,Math.min(100,(row.value/max)*100));
  out+='<div class="stats-bar-row"><span class="stats-bar-label" title="'+escapeStatsHtml(labelFn(row.item))+'">'+escapeStatsHtml(labelFn(row.item))+'</span><span class="stats-bar-track"><i class="stats-bar-fill" style="width:'+width.toFixed(1)+'%"></i></span><b class="stats-bar-value">'+statsNumber(row.value,1)+'</b></div>';
 });
 return out+'</div>';
}
function renderTwitchMetricsStats(channel){
 if(!channel||!channel.login)return '';
 const profile=twitchMetricsData?.channels?.[channel.login];
 if(!profile)return '';
 const m=profile.metrics||{}, streams=Array.isArray(profile.recent_streams)?profile.recent_streams:[];
 const period=profile.period_label||'Período no indicado';
 let out='<section class="stats-section pilot-stats"><div class="stats-source-head"><div><strong>TWITCHMETRICS · ANALÍTICA DEL CANAL</strong><br><small>Fuente externa complementaria · independiente de SullyGnome y Twitch Helix</small></div><span class="stats-status partial">REGISTRO PARCIAL</span></div>';
 out+='<p class="stats-section-intro">Ventana consultada: '+escapeStatsHtml(period)+'. Datos públicos visibles en TwitchMetrics al 4 nov 2026. La plataforma advierte que sus registros de directos pueden estar limitados a transmisiones con más de 10 espectadores.</p>';
 out+='<div class="pilot-lifetime-grid tm-metrics-grid">';
 [['Seguidores',m.followers,'canal'],['Variación de seguidores',m.follower_change,'ventana consultada'],['Horas vistas',m.viewer_hours,'ventana consultada'],['Pico de espectadores',m.peak_viewers,'ventana consultada'],['Horas en directo',m.hours_live,'ventana consultada'],['Promedio de espectadores',m.average_viewers,'últimos 30 días, según FAQ']].forEach(v=>{if(v[1]!==null&&v[1]!==undefined)out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+statsNumber(v[1])+(v[0].includes('Horas')?' h':'')+'</strong><small>'+v[2]+'</small></div>';});
 out+='</div>';
 if(streams.length){
  out+='<section class="pilot-subsection"><div class="pilot-subhead"><h5>DIRECTOS RECIENTES VISIBLES</h5><small>Muestra pública, no necesariamente el historial completo</small></div>';
  if(streams.length>1){
   out+='<div class="pilot-chart-card"><div class="pilot-chart-heading"><strong>PROMEDIO DE ESPECTADORES POR DIRECTO</strong><small>Comparación de las sesiones visibles</small></div><div class="pilot-bar-list">';
   streams.forEach(s=>out+='<div class="pilot-bar-row"><span class="pilot-bar-label">'+escapeStatsHtml(s.date_label)+'</span><div class="pilot-bar-track"><i style="width:'+Math.round(Number(s.average_viewers)/Math.max(...streams.map(x=>Number(x.average_viewers)||0),1)*100)+'%"></i></div><b>'+statsNumber(s.average_viewers)+'</b></div>');
   out+='</div></div>';
  }
  out+='<div class="stats-table-wrap"><table class="stats-table pilot-table"><thead><tr><th>Fecha</th><th>Duración</th><th>Juegos / categorías</th><th>Promedio</th><th>Pico</th></tr></thead><tbody>';
  streams.forEach(s=>out+='<tr><th>'+escapeStatsHtml(s.date_label)+'</th><td>'+escapeStatsHtml(s.duration_label)+'</td><td>'+escapeStatsHtml((s.games||[]).map(g=>g.name+(g.share?' ('+g.share+')':'')).join(' · '))+'</td><td class="num">'+statsNumber(s.average_viewers)+'</td><td class="num">'+statsNumber(s.peak_viewers)+'</td></tr>');
  out+='</tbody></table></div></section>';
 }
 out+='<div class="pilot-callout"><strong>Lectura comercial:</strong> '+escapeStatsHtml(profile.commercial_read||'Los datos permiten describir actividad y audiencia observada, pero no proyectar resultados de campaña.')+'</div>';
 out+='<p class="stats-note">Fuente: <a class="stats-link" href="'+escapeStatsHtml(profile.source_url)+'" target="_blank" rel="noopener">abrir perfil e historial en TwitchMetrics ↗</a>. Las métricas de esta fuente se muestran separadas de SullyGnome y de las muestras propias de Twitch Helix; no se suman entre sí. Las categorías de un directo mixto no equivalen a promedios de audiencia por juego.</p></section>';
 return out;
}
function renderSullyStats(channel){
 if(!channel)return '<div class="stats-empty"><strong>Historial no disponible</strong>No hay registros históricos cargados para este canal.</div>';
 // MORIARTYS utiliza el mismo render histórico que el resto del roster: evita cifras antiguas hardcodeadas y mantiene la fuente y el período visibles.
 const sourceStatus=channel.status||'pending';
 const status=sourceStatus==='partial'?'partial':(sourceStatus==='user_supplied_summary'||sourceStatus==='user_supplied_annual_summary'?'partial':'pending');
 const statusLabel=sourceStatus==='partial'?'REGISTRO PARCIAL':sourceStatus==='user_supplied_summary'?'RESUMEN APORTADO':sourceStatus==='user_supplied_annual_summary'?'RESUMEN ANUAL APORTADO':'PENDIENTE DE DATOS';
 const period=channel.period&&channel.period.start_date?
  statsDate(channel.period.start_date)+' — '+statsDate(channel.period.end_date):'Período todavía no disponible';
 let out='<section class="stats-section"><div class="stats-source-head"><div><strong>SULLYGNOME · HISTORIAL</strong><br><small>Fuente histórica externa · separada del muestreo propio</small></div><span class="stats-status '+status+'">'+statusLabel+'</span></div>';
 out+='<p class="stats-section-intro">Período: '+period+' · <a class="stats-link" href="'+escapeStatsHtml(channel.source_url)+'" target="_blank" rel="noopener">Abrir historial de SullyGnome ↗</a></p>';
 const a=channel.annual_summary_2026;
 const x=channel.summary||{};
 if(a){
  out+='<div class="stats-kpis">';
  [['Directos',a.streams,'acumulado 2026'],['Horas transmitidas',a.hours_streamed,'acumulado 2026'],['Horas vistas',a.hours_watched,'acumulado 2026'],['Promedio',a.average_viewers,'espectadores'],['Pico',a.peak_viewers,'espectadores'],['Seguidores ganados',a.followers_gained,'según resumen anual']].forEach(k=>out+='<div class="stats-kpi"><span>'+k[0]+'</span><strong>'+statsNumber(k[1])+'</strong><em>'+k[2]+'</em></div>');
  out+='</div>';
  const c=a.comparisons_to_2025||{};
  const changes=[['Horas vistas',c.hours_watched_percent],['Seguidores',c.followers_gained_percent],['Pico',c.peak_viewers_percent],['Horas emitidas',c.hours_streamed_percent],['Directos',c.streams_percent]];
  if(changes.some(v=>v[1]!==null&&v[1]!==undefined)){
   out+='<div class="stats-mini-grid">'+changes.filter(v=>v[1]!==null&&v[1]!==undefined).map(v=>'<div class="stats-mini-card"><strong>VARIACIÓN · '+v[0].toUpperCase()+'</strong><span>'+statsNumber(v[1])+'% respecto de 2025</span></div>').join('')+'</div>';
  }
 }else if(['partial','user_supplied_summary','user_supplied_annual_summary'].includes(sourceStatus)){
  out+='<div class="stats-kpis">';
  [['Transmisiones',x.streams_count,'informa la fuente'],['Tiempo emitido',x.airtime_minutes!==null&&x.airtime_minutes!==undefined?Math.floor(x.airtime_minutes/60)+' h '+(x.airtime_minutes%60)+' min':'—','informa la fuente'],['Horas vistas',x.hours_watched,'informa la fuente'],['Promedio',x.average_viewers_duration_weighted,'espectadores'],['Pico máximo',x.peak_viewers,'espectadores'],['Seguidores ganados',x.followers_gain_reported,'en el período']].forEach(k=>out+='<div class="stats-kpi"><span>'+k[0]+'</span><strong>'+escapeStatsHtml(k[1])+'</strong><em>'+k[2]+'</em></div>');
  out+='</div>';
 }
 const gameRows=Array.isArray(channel.game_breakdown)?channel.game_breakdown:[];
 if(gameRows.length){
  out+='<h4>JUEGOS Y CATEGORÍAS · DESGLOSE DEL PERÍODO</h4><p class="stats-section-intro">Horas emitidas, horas vistas y audiencia media/pico según el resumen compartido.</p><div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>Categoría</th><th>Horas emitidas</th><th>% emisión</th><th>Horas vistas</th><th>% vistas</th><th>Promedio</th><th>Pico</th></tr></thead><tbody>';
  gameRows.forEach(g=>out+='<tr><td>'+escapeStatsHtml(g.name)+'</td><td class="num">'+statsNumber(g.stream_hours,1)+'</td><td class="num">'+statsNumber(g.stream_share_pct,1)+'%</td><td class="num">'+statsNumber(g.hours_watched,1)+'</td><td class="num">'+statsNumber(g.watch_share_pct,1)+'%</td><td class="num">'+statsNumber(g.average_viewers,0)+'</td><td class="num">'+statsNumber(g.peak_viewers,0)+'</td></tr>');
  out+='</tbody></table></div>';
 }
 const streams=Array.isArray(channel.streams)?channel.streams:[];
 if(streams.length){
  out+=renderStatsBars('HORAS VISTAS POR DIRECTO',streams.slice().reverse(),v=>statsDate(v.date),v=>v.hours_watched,'horas vistas',10);
  out+='<h4>REGISTRO DE DIRECTOS</h4><p class="stats-section-intro">Cada fila corresponde a una transmisión recibida en el historial disponible.</p><div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>Fecha</th><th>Inicio</th><th>Duración</th><th>Promedio</th><th>Pico</th><th>Horas vistas</th><th>Seguidores*</th></tr></thead><tbody>';
  streams.forEach(v=>out+='<tr><td>'+statsDate(v.date)+'</td><td>'+(v.start_time?escapeStatsHtml(v.start_time):'No informado')+'</td><td>'+statsDuration(v)+'</td><td class="num">'+statsNumber(v.average_viewers,0)+'</td><td class="num">'+statsNumber(v.peak_viewers,0)+'</td><td class="num">'+statsNumber(v.hours_watched,2)+'</td><td class="num">'+statsNumber(v.followers_reported,0)+'</td></tr>');
  out+='</tbody></table></div>';
 }else{
  const detailMessage=channel.observed_rows_summary
   ? 'El equipo reportó '+channel.observed_rows_summary.rows+' de '+channel.observed_rows_summary.expected_rows+' transmisiones, pero las filas individuales no están cargadas en este archivo. No se reconstruye la bitácora sin los registros originales.'
   : 'No hay filas individuales de transmisiones cargadas para este canal. Se conserva el resumen o desglose disponible sin reconstruir una bitácora.';
  out+='<div class="stats-empty"><strong>Detalle de transmisiones no cargado</strong>'+escapeStatsHtml(detailMessage)+'</div>';
 }
 if(channel.observed_rows_summary && a){
  const o=channel.observed_rows_summary;
  const durationHours=o.duration_hours!==undefined?o.duration_hours:(o.duration_minutes!==undefined?o.duration_minutes/60:null);
  out+='<div class="stats-note">Detalle visible: '+o.rows+' de '+a.streams+' transmisiones del año · '+statsNumber(durationHours,1)+' horas de duración · '+statsNumber(o.hours_watched,1)+' horas vistas. El pico de estas filas ('+statsNumber(o.peak_viewers_in_rows,0)+') no reemplaza el pico anual ('+statsNumber(a.peak_viewers,0)+').</div>';
 }
 if(channel.notes?.length){
  out+='<div class="stats-note warning">'+channel.notes.map(n=>escapeStatsHtml(n)).join('<br>')+'</div>';
 }
 if(channel.login==='habitos_atomicos'&&channel.observed_rows_summary){
  out+='<div class="stats-note warning">Detalle recibido: '+channel.observed_rows_summary.rows+' de '+channel.observed_rows_summary.expected_rows+' transmisiones. '+escapeStatsHtml(channel.observed_rows_summary.note)+' El máximo de 29 espectadores se conserva sin fecha hasta resolver la discrepancia del informe.</div>';
 }
 if(channel.login==='losmoriartys'){
  out+='<div class="stats-note warning">La fuente recibida no incluye horarios de inicio para estas transmisiones; por eso se muestran como “No informado”. La columna de seguidores conserva el valor reportado por SullyGnome y no se interpreta como ganancia confirmada.</div>';
 }
 out+='</section>';
 return out;
}
function renderLosMoriartysHelixPilot(channel){
 const w=channel.window||{}, samples=Array.isArray(channel.snapshots)?channel.snapshots:[];
 const last=channel.updated_at?new Date(channel.updated_at).toLocaleString('es-AR'):'Sin fecha de sincronización';
 const firstSample=samples.length&&samples[0].sampled_at?new Date(samples[0].sampled_at).toLocaleDateString('es-AR'):'—';
 const lastSample=samples.length&&samples[samples.length-1].sampled_at?new Date(samples[samples.length-1].sampled_at).toLocaleDateString('es-AR'):'—';
 const interval=Number(instituteStatsData?.sampling_interval_minutes||15);
 const firstTime=samples.length?Date.parse(samples[0].sampled_at):NaN;
 const lastTime=samples.length?Date.parse(samples[samples.length-1].sampled_at):NaN;
 const expected=Number.isFinite(firstTime)&&Number.isFinite(lastTime)&&lastTime>=firstTime?Math.floor((lastTime-firstTime)/(interval*60000))+1:0;
 const coverage=expected?Math.min(100,samples.length/expected*100):null;
 const gaps=samples.slice(1).map((v,i)=>(Date.parse(v.sampled_at)-Date.parse(samples[i].sampled_at))/60000).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 const medianGap=gaps.length?(gaps.length%2?gaps[(gaps.length-1)/2]:(gaps[gaps.length/2-1]+gaps[gaps.length/2])/2):null;
 const maxGap=gaps.length?Math.max(...gaps):null;
 const coverageText=coverage===null?'cobertura no calculable':'cobertura del tramo observado: '+statsNumber(coverage,1)+'% ('+statsNumber(samples.length,0)+'/'+statsNumber(expected,0)+' muestras esperadas) · separación mediana: '+(medianGap===null?'—':statsNumber(medianGap,1)+' min')+' · mayor intervalo sin muestra: '+(maxGap===null?'—':statsNumber(maxGap,1)+' min');
 const liveSamples=Number(w.live_samples)||0, detectedStreams=Number(w.streams_observed)||0;
 const isLive=Boolean(channel.live);
 const observationText=liveSamples>0
  ? 'Se registraron '+statsNumber(liveSamples,0)+' muestras en directo correspondientes a '+statsNumber(detectedStreams,0)+' transmisión(es) detectada(s). Es una muestra todavía pequeña y no alcanza para presentar un promedio estable ni describir el rendimiento habitual del canal.'
  : 'No se registraron muestras en directo en las consultas conservadas. Esto no demuestra que el canal no haya transmitido durante los intervalos no observados.';
 let out='<section class="stats-section pilot-stats"><div class="stats-source-head"><div><strong>SEGUIMIENTO PROPIO · TWITCH HELIX</strong><br><small>Telemetría observada por Legión Multiversal · fuente separada del historial</small></div><span class="stats-status '+(isLive?'partial':'pending')+'">'+(isLive?'EN DIRECTO':'OFFLINE EN ÚLTIMA LECTURA')+'</span></div>';
 out+='<p class="stats-section-intro">Última sincronización: '+last+' · frecuencia programada: cada '+interval+' minutos · muestras conservadas: '+firstSample+' a '+lastSample+' · '+coverageText+'. La frecuencia programada no garantiza que todas las ejecuciones ocurran a ese ritmo.</p>';
 out+='<div class="pilot-status-grid"><div class="pilot-status-item"><span>Consultas recibidas</span><strong>'+statsNumber(w.samples_total,0)+'</strong></div><div class="pilot-status-item"><span>Muestras en directo</span><strong>'+statsNumber(liveSamples,0)+'</strong></div><div class="pilot-status-item"><span>Directos detectados</span><strong>'+statsNumber(detectedStreams,0)+'</strong></div><div class="pilot-status-item"><span>Seguidores</span><strong>'+(channel.followers_total===null||channel.followers_total===undefined?'No disponible':statsNumber(channel.followers_total,0))+'</strong></div></div>';
 out+='<div class="pilot-callout"><strong>Cómo leer este panel.</strong> '+observationText+' El muestreo es una observación técnica y no reemplaza el historial completo de Twitch ni las métricas oficiales del panel de creador.</div>';
 out+='<div class="pilot-callout warning"><strong>Qué falta para publicar una tendencia:</strong> acumular más sesiones observadas y completar el historial de forma sostenida. Hasta entonces no presentamos promedio, pico, horas vistas ni evolución como indicadores representativos. La ventana técnica configurada es de '+(instituteStatsData?.window_days||30)+' días; la cobertura real depende de las muestras efectivamente guardadas.</div>';
 out+='</section>';
 return out;
}
function renderHelixDashboard(channel){
 if(!channel)return '<div class="stats-empty"><strong>SIN DATOS VERIFICADOS</strong>El canal está registrado, pero todavía no existe una captura utilizable de Twitch Helix para este perfil.</div>';
 const w=channel.window||{};
 const capturedAt=channel.updated_at||instituteStatsData?.updated_at||null;
 const capturedDate=capturedAt?new Date(capturedAt):null;
 const ageMinutes=capturedDate&&!Number.isNaN(capturedDate.getTime())?(Date.now()-capturedDate.getTime())/60000:Infinity;
 const interval=Number(instituteStatsData?.sampling_interval_minutes)||55;
 const fresh=ageMinutes>=-5&&ageMinutes<=Math.max(interval*2.5,120);
 const live=Boolean(fresh&&channel.live);
 const statusLabel=!Number.isFinite(ageMinutes)?'FECHA NO DISPONIBLE':!fresh?'DATOS DEMORADOS':live?'● EN DIRECTO':'OFFLINE · CAPTURA RECIENTE';
 const statusClass=!fresh?'partial':live?'verified':'pending';
 const snaps=Array.isArray(channel.snapshots)?channel.snapshots.filter(v=>v&&v.sampled_at):[];
 const first=snaps.length?Date.parse(snaps[0].sampled_at):NaN;
 const last=snaps.length?Date.parse(snaps[snaps.length-1].sampled_at):NaN;

 const expected=Number.isFinite(first)&&Number.isFinite(last)&&last>=first?Math.floor((last-first)/(interval*60000))+1:0;
 const coverage=expected?Math.min(100,snaps.length/expected*100):null;
 const gaps=snaps.slice(1).map((v,i)=>(Date.parse(v.sampled_at)-Date.parse(snaps[i].sampled_at))/60000).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 const medianGap=gaps.length?(gaps.length%2?gaps[(gaps.length-1)/2]:(gaps[gaps.length/2-1]+gaps[gaps.length/2])/2):null;
 const maxGap=gaps.length?Math.max(...gaps):null;
 const quality=coverage===null?'SIN COBERTURA CALCULABLE':coverage>=80?'COBERTURA ADECUADA':coverage>=50?'COBERTURA PARCIAL':'MUESTRA INSUFICIENTE';
 const qualityClass=coverage===null?'pending':coverage>=80?'verified':coverage>=50?'partial':'pending';
 const periodLabel=Number.isFinite(first)&&Number.isFinite(last)?new Date(first).toLocaleString('es-AR')+' — '+new Date(last).toLocaleString('es-AR'):'Fechas no disponibles';
 let out='<section class="stats-section"><div class="stats-source-head"><div><strong>TWITCH HELIX · SEGUIMIENTO PROPIO</strong><br><small>Observaciones periódicas de Legión Multiversal · no equivalen al panel analítico oficial</small></div><span class="stats-status '+statusClass+'">'+statusLabel+'</span></div>';
 out+='<div class="stats-source-head"><div><strong>CALIDAD DE LA MUESTRA</strong><br><small>'+quality+' · objetivo de recolección: cada '+interval+' minutos</small></div><span class="stats-status '+qualityClass+'">'+(coverage===null?'SIN DATOS':statsNumber(coverage,1)+'%')+'</span></div>';
 out+='<p class="stats-section-intro">Período realmente observado: '+escapeStatsHtml(periodLabel)+'. Registros: '+statsNumber(snaps.length,0)+' de '+statsNumber(expected,0)+' esperados en ese intervalo. Separación mediana: '+(medianGap===null?'—':statsNumber(medianGap,1)+' min')+'; mayor intervalo sin muestra: '+(maxGap===null?'—':statsNumber(maxGap,1)+' min')+'. Esta cobertura describe el tramo observado, no los 30 días configurados.</p>';
 out+='<div class="stats-kpis">';
 [['Espectadores ahora',fresh?channel.current_viewers:null,fresh?'lectura reciente':'dato oculto: captura demorada'],['Seguidores',channel.followers_total,'no disponible vía Helix público'],['Directos detectados',w.streams_observed,'sesiones observadas; no historial completo'],['Muestras en directo',w.live_samples,'observaciones con canal en vivo'],['Promedio muestreado',w.average_viewers_sampled,'espectadores concurrentes observados'],['Pico observado',w.peak_viewers_sampled,'pico entre muestras; no oficial'],['Horas en directo observadas',w.observed_live_hours,'estimación entre muestras válidas'],['Horas vistas estimadas',w.estimated_hours_watched,'estimación; no analítica oficial']].forEach(k=>out+='<div class="stats-kpi"><span>'+k[0]+'</span><strong>'+(k[1]===null||k[1]===undefined?'SIN DATOS VERIFICADOS':statsNumber(k[1],1))+'</strong><em>'+k[2]+'</em></div>');
 out+='</div><p class="stats-muted">Categoría en la última captura: '+escapeStatsHtml(channel.current_game||'No disponible')+' · Última sincronización: '+(capturedDate&&!Number.isNaN(capturedDate.getTime())?capturedDate.toLocaleString('es-AR'):'Pendiente')+(fresh?'':' · No se interpreta como estado actual porque la captura superó la ventana de frescura.')+'</p>';
 const liveSamples=Number(w.live_samples)||0;
 out+=liveSamples<20?'<div class="stats-note">Muestra de directos todavía reducida ('+statsNumber(liveSamples,0)+' observaciones en vivo). Los promedios y picos se muestran como señales descriptivas del tramo observado, no como rendimiento habitual ni garantía de audiencia.</div>':'<div class="stats-note">Las métricas de audiencia son observaciones del muestreo y no analíticas oficiales. El promedio se calcula solo sobre muestras en directo; el pico es el máximo observado entre esas muestras.</div>';
 out+=renderStatsBars('ACTIVIDAD DIARIA OBSERVADA',(w.daily_activity||[]).slice(-10),v=>statsDate(v.date),v=>v.live_samples,'muestras en directo',10);
 out+=renderStatsBars('CATEGORÍAS MÁS OBSERVADAS',w.game_breakdown||[],v=>v.name,v=>v.live_samples,'muestras por categoría',5);
 const sessions=new Map();
 snaps.filter(v=>v&&v.is_live&&v.stream_id).forEach(v=>{
  const id=String(v.stream_id);
  if(!sessions.has(id))sessions.set(id,{started_at:v.started_at||null,last:v.sampled_at||null,samples:0,peak:null,game:v.game_name||'—'});
  const x=sessions.get(id);x.samples++;if(v.sampled_at)x.last=v.sampled_at;
  if(typeof v.viewer_count==='number')x.peak=x.peak===null?v.viewer_count:Math.max(x.peak,v.viewer_count);
  if(v.started_at&&!x.started_at)x.started_at=v.started_at;
 });
 const rows=Array.from(sessions.values()).sort((a,b)=>String(b.started_at||'').localeCompare(String(a.started_at||'')));
 if(rows.length){
  out+='<h4>DIRECTOS DETECTADOS POR HORARIO</h4><div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>Inicio detectado</th><th>Categoría</th><th>Pico muestreado</th><th>Muestras</th></tr></thead><tbody>';
  rows.slice(0,12).forEach(v=>out+='<tr><td>'+(v.started_at?new Date(v.started_at).toLocaleString('es-AR'):'—')+'</td><td>'+escapeStatsHtml(v.game)+'</td><td class="num">'+statsNumber(v.peak,0)+'</td><td class="num">'+v.samples+'</td></tr>');
  out+='</tbody></table></div>';
 }else out+='<p class="stats-muted">Todavía no se detectaron sesiones en la ventana disponible.</p>';
 out+='<div class="stats-note">Las horas y picos de esta sección son observaciones/estimaciones propias del muestreo. No sustituyen las métricas oficiales del panel de creador de Twitch ni reconstruyen directos anteriores al inicio de la recolección.</div></section>';
 return out;
}
function normalizeCreatorNameToken(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]/g, '');
}
function getCanonicalCreatorName(value) {
    const token = normalizeCreatorNameToken(value);
    if (!token) return value || '';
    for (const identity of Object.values(creatorNameRegistry || {})) {
        const candidates = [identity.display_name, identity.username, identity.character_alias, ...(identity.variants || [])];
        if (candidates.some(candidate => normalizeCreatorNameToken(candidate) === token)) return identity.display_name;
        for (const person of identity.represented_people || []) {
            const personNames = [person.display_name, ...(person.variants || [])];
            if (personNames.some(candidate => normalizeCreatorNameToken(candidate) === token)) return person.display_name;
        }
    }
    return value;
}
function getHeroDisplayName(hero) {
    const identity = creatorNameRegistry[hero?.id || hero?.slug];
    return identity?.display_name || hero?.display_name || hero?.name || 'Integrante';
}


function renderStatsExecutiveSource(title,period,metrics,note,sourceUrl){
 const safe=escapeStatsHtml;
 const cards=(Array.isArray(metrics)?metrics:[]).filter(item=>item.value!==null&&item.value!==undefined&&item.value!==''&&!(typeof item.value==='number'&&!Number.isFinite(item.value))).slice(0,6);
 if(!cards.length)return '';
 return '<article class="stats-executive-source"><div class="stats-executive-source-head"><strong>'+safe(title)+'</strong><span>'+safe(period||'Período no informado')+'</span></div><div class="stats-executive-metrics">'+cards.map(item=>'<div><strong>'+safe(item.value)+'</strong><span>'+safe(item.label)+'</span></div>').join('')+'</div>'+(note?'<p class="stats-executive-note">'+safe(note)+'</p>':'')+(sourceUrl?'<a class="stats-link stats-executive-source-link" href="'+safe(sourceUrl)+'" target="_blank" rel="noopener noreferrer">CONSULTAR FUENTE ↗</a>':'')+'</article>';
}
function renderStatsDashboard(hero,helix,sully){
 const safe=escapeStatsHtml,tmProfile=helix?.login?twitchMetricsData?.channels?.[helix.login]:null,tm=tmProfile?.metrics||{},platformProfile=platformStatsData?.creators?.[platformStatsKey(hero)],sources=[];
 if(helix?.window){
  const w=helix.window,samples=Array.isArray(helix.snapshots)?helix.snapshots.filter(x=>x?.sampled_at):[],dates=samples.map(x=>String(x.sampled_at).slice(0,10)).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
  const period=w.period_start&&w.period_end?statsDate(String(w.period_start).slice(0,10))+' — '+statsDate(String(w.period_end).slice(0,10)):dates.length?statsDate(dates[0])+' — '+statsDate(dates[dates.length-1]):'Ventana reciente';
  const metrics=[{label:'Directos detectados',value:w.streams_observed==null?null:statsNumber(w.streams_observed,0)},{label:'Promedio de espectadores',value:w.average_viewers_sampled==null?null:statsNumber(w.average_viewers_sampled,1)},{label:'Pico observado',value:w.peak_viewers_sampled==null?null:statsNumber(w.peak_viewers_sampled,0)},{label:'Horas en directo',value:w.observed_live_hours==null?null:statsNumber(w.observed_live_hours,1)+' h'}];
  const card=renderStatsExecutiveSource('TWITCH · SEGUIMIENTO PÚBLICO',period,metrics,'Lecturas observadas del canal; no equivalen a analítica privada de Twitch.','https://www.twitch.tv/'+safe(helix.login));if(card)sources.push(card);
 }
 if(sully){
  const m=sully.annual_summary_2026||sully.summary||{},period=sully.period?.start_date&&sully.period?.end_date?statsDate(sully.period.start_date)+' — '+statsDate(sully.period.end_date):sully.annual_summary_2026?'Acumulado 2026':'Historial disponible';
  const metrics=[{label:'Transmisiones',value:m.streams??m.streams_count??null},{label:'Horas transmitidas',value:m.hours_streamed??m.airtime_hours??(m.airtime_minutes!=null?statsNumber(m.airtime_minutes/60,1)+' h':null)},{label:'Horas vistas',value:m.hours_watched??null},{label:'Promedio de espectadores',value:m.average_viewers??m.average_viewers_duration_weighted??null},{label:'Pico de espectadores',value:m.peak_viewers??null},{label:'Seguidores ganados',value:m.followers_gained??m.followers_gain_reported??null}];
  const card=renderStatsExecutiveSource('SULLYGNOME · HISTORIAL',period,metrics,'Historial externo del canal; se mantiene separado de otras fuentes.',sully.source_url||null);if(card)sources.push(card);
 }
 if(tmProfile){
  const metrics=[{label:'Seguidores',value:tm.followers??null},{label:'Horas vistas',value:tm.viewer_hours==null?null:statsNumber(tm.viewer_hours,0)+' h'},{label:'Promedio de espectadores',value:tm.average_viewers??null},{label:'Pico de espectadores',value:tm.peak_viewers??null}];
  const card=renderStatsExecutiveSource('TWITCHMETRICS · ANALÍTICA PÚBLICA',tmProfile.period_label||tmProfile.period||'Ventana consultada',metrics,'Datos públicos publicados por TwitchMetrics.',tmProfile.source_url||null);if(card)sources.push(card);
 }
 if(platformProfile?.platforms)Object.entries(platformProfile.platforms).forEach(([platform,p])=>{
  if(p.status!=='verified')return;
  const m=p.metrics||{},metrics=platform==='youtube'?[{label:'Suscriptores',value:m.subscribers},{label:'Visualizaciones',value:m.total_views},{label:'Videos publicados',value:m.videos_total}]:platform==='kick'?[{label:'Estado',value:m.live===true?'EN DIRECTO':m.live===false?'OFFLINE':null},{label:'Espectadores actuales',value:m.current_viewers}]:[];
  const card=renderStatsExecutiveSource(platform.toUpperCase()+' · CANAL VINCULADO',platformStatsData?.updated_at||'Captura disponible',metrics,'Datos públicos de '+platform.toUpperCase()+'.',p.url||null);if(card)sources.push(card);
 });
 return '<div class="stats-dashboard stats-dashboard-editorial"><header class="stats-executive-header"><div><span>RENDIMIENTO DEL CANAL</span><h4>'+safe(getHeroDisplayName(hero))+'</h4><p>Indicadores disponibles, con su fuente y período. Cada plataforma se presenta por separado.</p></div></header><div class="stats-executive-grid">'+(sources.length?sources.join(''):'<p class="stats-executive-empty">Todavía no hay métricas públicas verificadas para mostrar.</p>')+'</div></div>';
}

function renderHeroProfileTabs(hero) {
 const safe=escapeStatsHtml,record=getCreatorRecord(hero),channel=findChannelStats(hero),sullyChannel=findSullyChannel(hero),win=channel?.window||{},live=getRosterLiveState(hero);
 const yt=platformStatsData?.creators?.[platformStatsKey(hero)]?.platforms?.youtube;
 const clips=twitchClipsData?.creators?.[creatorRecordKey(hero)]?.clips||[];
 const snapshots=Array.isArray(channel?.snapshots)?channel.snapshots:[];

 const games=getMostPlayedGames(hero,channel,sullyChannel);
 const gameHtml=games.length?'<section class="hero-profile-integrated-games"><h4>JUEGOS Y RITMO</h4><div class="hero-profile-game-grid">'+games.map(name=>'<article><strong>'+safe(name)+'</strong></article>').join('')+'</div></section>':'';
 const metricDefinitions=[
  {label:'DIRECTOS OBSERVADOS',value:win.streams_observed,note:'sesiones',key:'streams_observed'},
  {label:'PROMEDIO DE ESPECTADORES',value:win.average_viewers_sampled,note:'promedio muestreado',key:'average_viewers_sampled'},
  {label:'PICO OBSERVADO',value:win.peak_viewers_sampled,note:'máxima lectura',key:'peak_viewers_sampled'},
  {label:'HORAS EN DIRECTO',value:win.observed_live_hours,note:'horas observadas',key:'observed_live_hours'}
 ];
 if(yt?.status==='verified'&&yt.metrics?.subscribers!=null)metricDefinitions.unshift({label:'SUSCRIPTORES',value:yt.metrics.subscribers,note:'YouTube · dato público',key:'youtube_subscribers'});
 const metricPeerValues=key=>heroesData.map(peer=>{if(key==='youtube_subscribers'){const data=platformStatsData?.creators?.[platformStatsKey(peer)]?.platforms?.youtube;return data?.status==='verified'?Number(data.metrics?.subscribers):null;}const peerWindow=findChannelStats(peer)?.window||{},rawValue=peerWindow[key];return rawValue==null?null:Number(rawValue);}).filter(value=>Number.isFinite(value)&&value>=0);
 const metricHtml=metricDefinitions.map(({label,value,note,key})=>{const numericValue=Number(value),peers=metricPeerValues(key),maxValue=peers.length>1?Math.max(...peers):0,showBar=value!=null&&Number.isFinite(numericValue)&&peers.length>1&&maxValue>0,percentage=showBar?Math.max(0,Math.min(100,(numericValue/maxValue)*100)):0;const bar=showBar?'<div class="hero-profile-metric-scale" role="meter" aria-label="'+safe(label)+' en comparación con los perfiles que tienen este dato" aria-valuemin="0" aria-valuemax="'+safe(maxValue)+'" aria-valuenow="'+safe(numericValue)+'"><span style="width:'+percentage.toFixed(1)+'%"></span></div><small class="hero-profile-metric-scale-note">Escala relativa entre integrantes con dato disponible; no es un ranking ni una métrica de plataforma.</small>':'';return '<article class="hero-profile-metric"><small>'+safe(label)+'</small><strong>'+(value==null?'—':safe(typeof value==='number'?value.toLocaleString('es-AR',{maximumFractionDigits:1}):value))+'</strong><span>'+safe(note)+'</span>'+bar+'</article>';}).join('');
 const period=win.period_start&&win.period_end?statsDate(String(win.period_start).slice(0,10))+' – '+statsDate(String(win.period_end).slice(0,10)):'ventana disponible de muestreo';
 const lastLive=[...snapshots].reverse().find(s=>s?.is_live&&s.sampled_at)?.sampled_at;
 const lastLiveLabel=lastLive?new Date(lastLive).toLocaleString('es-AR',{dateStyle:'medium',timeStyle:'short'}):'Sin directo detectado en la ventana';
 const liveLabel=live?.fresh&&live.channel?.live?'● EN VIVO':live?.fresh?'OFFLINE · CAPTURA ACTUALIZADA':'ESTADO NO DISPONIBLE';
 const freq=win.streams_observed!=null?statsNumber(win.streams_observed,0)+' directos detectados':'Sin frecuencia cuantificable';
 const profileRatings=hero.mediaProfile?.ratings||hero.mediaProfile?.scorecard||hero.scorecard||{};
 const ratingDefinitions=[['CONSTANCIA','constancia'],['CARISMA','carisma'],['GAMEPLAY','gameplay'],['COMUNIDAD','comunidad'],['HYPE','hype']];
 const ratingHtml=ratingDefinitions.map(([label,key])=>{const raw=profileRatings[key]??profileRatings[label]??null;const value=raw==null?null:Number(raw);const valid=Number.isFinite(value)&&value>=0&&value<=100;return '<div class="comic-profile-rating"><div><strong>'+label+'</strong><b>'+(valid?Math.round(value):'—')+'</b></div><div class="comic-profile-rating-track" role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100"'+(valid?' aria-valuenow="'+Math.round(value)+'"':'')+'><span style="width:'+(valid?Math.round(value):0)+'%"></span></div></div>';}).join('');
 const accountForAction=(hero.accounts||[]).find(item=>item.account_type==='creator_channel')||(hero.accounts||[])[0]||null;
 const profileChannelUrl=accountForAction?.url||hero.twitch||hero.youtube||'';
 const overview='<div class="hero-profile-overview"><p class="hero-profile-bio">'+safe(hero.bio||'Presentación personal pendiente de completar.')+'</p>'+gameHtml+'</div>'
 const clipsHtml=clips.length?'<div class="hero-profile-clips-grid">'+clips.slice(0,4).map(clip=>'<article class="hero-profile-clip">'+(clip.thumbnail_url?'<a href="'+safe(clip.url)+'" target="_blank" rel="noopener noreferrer"><img src="'+safe(clip.thumbnail_url)+'" alt="" loading="lazy"></a>':'')+'<div><strong>'+safe(clip.title||'Clip destacado')+'</strong><small>'+safe(statsNumber(clip.view_count,0))+' visualizaciones · '+safe(clip.creator_name||'Creador')+'</small><a href="'+safe(clip.url)+'" target="_blank" rel="noopener noreferrer">VER CLIP ↗</a></div></article>').join('')+'</div>':'<p class="hero-profile-empty">'+(twitchClipsLoadError?'No se pudo cargar la captura de clips.':'Todavía no hay clips públicos disponibles para este canal en la ventana consultada.')+'</p>';
 const entries=[...(record.milestones||[]),...(record.collaborations||[])];
 const logHtml=entries.length?'<ul class="hero-profile-detail-list">'+entries.map(x=>'<li><strong>'+safe(x.title||'Registro')+'</strong><span>'+safe(x.description||'')+(x.url?' · <a href="'+safe(x.url)+'" target="_blank" rel="noopener noreferrer">'+(String(x.title||'').toLowerCase().includes('acceso a keys')?'ABRIR PLATAFORMA ↗':'Fuente ↗')+'</a>':'')+(x.source?'<small>FUENTE · '+safe(x.source)+'</small>':'')+'</span></li>').join('')+'</ul>':'<p class="hero-profile-empty">La bitácora individual todavía no tiene hitos o colaboraciones documentados.</p>';
 const editorial=hero.mediaProfile||{},formats=editorial.formats||hero.areas||[];
 const brandHtml='<div class="hero-profile-brand"><h4>IDENTIDAD Y PROPUESTA EDITORIAL</h4><p>'+safe(editorial.editorial||hero.bio||'Descripción comercial pendiente de completar.')+'</p><h4>TERRITORIOS Y ESPECIALIDADES</h4>'+(formats.length?'<ul class="hero-profile-detail-list">'+formats.map(x=>'<li><strong>'+safe(x)+'</strong></li>').join('')+'</ul>':'<p class="hero-profile-empty">Especialidades pendientes de confirmar.</p>')+'<h4>FORMATOS Y OPORTUNIDADES</h4>'+(editorial.opportunities?.length?'<ul class="hero-profile-detail-list">'+editorial.opportunities.map(x=>'<li><strong>'+safe(x)+'</strong></li>').join('')+'</ul>':'<p class="hero-profile-empty">Formatos por conversar con el creador.</p>')+'<p class="hero-profile-method">'+safe(editorial.disclaimer||'Oportunidades potenciales; no campañas contratadas.')+'</p>'+'</div>';
 const tabs=[['perfil','PERFIL'],['estadisticas','ESTADÍSTICAS'],['clips','CLIPS'],['bitacora','BITÁCORA']];
 const panels=['<section class="hero-profile-tab-panel is-active" id="profile-tab-perfil" role="tabpanel">'+overview+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-estadisticas" role="tabpanel" hidden><h4>ESTADÍSTICAS · FUENTES MULTIPLATAFORMA</h4>'+renderStatsDashboard(hero,channel,sullyChannel)+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-clips" role="tabpanel" hidden><h4>CLIPS DESTACADOS · MÁXIMO 4</h4>'+clipsHtml+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-bitacora" role="tabpanel" hidden><h4>BITÁCORA · TRAYECTORIA Y COLABORACIONES</h4>'+logHtml+brandHtml+((hero.id==='moriartys'||hero.id==='rod3r1k')?'<section class="hero-profile-epic-codes"><h4>CÓDIGO DE CREADOR · EPIC GAMES</h4><div data-epic-profile-code="'+hero.id+'">'+renderEpicCreatorCodeCard(hero.id==='moriartys'?'moriartys':'rod3r1k','roster-profile')+'</div></section>':'')+'</section>'].join('');
 return '<div class="hero-profile-tabs-wrap"><div class="hero-profile-tabs" role="tablist" aria-label="Secciones del perfil">'+tabs.map(([id,label],i)=>'<button type="button" class="hero-profile-tab'+(i===0?' is-active':'')+'" role="tab" aria-selected="'+(i===0?'true':'false')+'" aria-controls="profile-tab-'+id+'" tabindex="'+(i===0?'0':'-1')+'" data-profile-tab="'+id+'">'+label+'</button>').join('')+'</div>'+panels+'</div>';
}
function activateHeroProfileTab(button){const wrap=button.closest('.hero-profile-tabs-wrap');if(!wrap)return;if(button.dataset.profileTab==='bitacora')recordLegionProgress('bitacora');wrap.querySelectorAll('[data-profile-tab]').forEach(tab=>{const active=tab===button;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1;});wrap.querySelectorAll('.hero-profile-tab-panel').forEach(panel=>{const active=panel.id==='profile-tab-'+button.dataset.profileTab;panel.hidden=!active;panel.classList.toggle('is-active',active);});}

function openHeroProfile(index, triggerElement = document.activeElement, options = {}) {
    const hero = heroesData[index];
    if (!hero) return;
    recordLegionProgress('profile', hero.cardNumber || hero.name);
    const home = document.getElementById('roster-home');
    const page = document.getElementById('hero-profile-page');
    if (!home || !page) return;
    window.lastHeroProfileTrigger = triggerElement instanceof HTMLElement ? triggerElement : window.lastHeroProfileTrigger || null;
    window.currentHeroProfileIndex = index;
    const filteredProfiles = getRosterFilteredEntries();
    const profilePosition = filteredProfiles.findIndex(entry => entry.index === index);
    const previousDisabled = profilePosition <= 0;
    const nextDisabled = profilePosition < 0 || profilePosition >= filteredProfiles.length - 1;
    const liveState = getRosterLiveState(hero);
    const isLive = Boolean(liveState?.fresh && liveState.channel?.live);
    const liveBadge = isLive
        ? '<span class="hero-profile-live is-live">● EN VIVO · ' + escapeStatsHtml(liveState.channel.current_viewers ?? 'EN DIRECTO') + ' VIENDO</span>'
        : '<span class="hero-profile-live is-unknown">' + (liveState?.fresh ? '● CAPTURA ACTUALIZADA' : '● ESTADO NO DISPONIBLE') + '</span>';
    const portrait = hero.portrait || hero.img || '';
    const socials = renderCreatorPlatformLinks(hero);
    const rhythm = 'EN SEGUIMIENTO';
    const account = (hero.accounts || []).find(item => item.account_type === 'creator_channel') || (hero.accounts || [])[0] || null;
    const channelUrl = account?.url || hero.twitch || hero.youtube || '';
    const channelCta = channelUrl ? '<a class="comic-profile-channel-cta" href="' + escapeStatsHtml(channelUrl) + '" target="_blank" rel="noopener noreferrer">' + (isLive ? '● VER CANAL EN VIVO ↗' : 'VER CANAL ↗') + '</a>' : '';
    const topLine = '<div class="hero-profile-reference-head comic-profile-head"><button class="comic-profile-breadcrumb" type="button" onclick="closeHeroProfile()">LEGIÓN › ROSTER › ' + escapeStatsHtml(getHeroDisplayName(hero)) + '　← VOLVER AL ROSTER</button><div class="comic-profile-head-right"><span class="comic-profile-rhythm">RITMO: ' + rhythm + '</span>' + liveBadge + channelCta + '</div></div>';
    const leftRail = '<aside class="hero-profile-sidebar comic-profile-sidebar"><div class="hero-profile-id-card"><div class="hero-profile-id-image">' +
        (portrait ? '<img src="' + escapeStatsHtml(portrait) + '" alt="Fotografía de ' + escapeStatsHtml(getHeroDisplayName(hero)) + '" loading="eager" decoding="async">' : '<div class="hero-profile-art-fallback">RETRATO NO DISPONIBLE</div>') +
        '<span class="hero-profile-id-live">' + liveBadge + '</span><div class="hero-profile-id-name"><small>' + escapeStatsHtml(hero.codename || hero.role_label || 'INTEGRANTE DE LA LEGIÓN') + '</small><strong>' + escapeStatsHtml(getHeroDisplayName(hero)) + '</strong><span>' + escapeStatsHtml((hero.areas || []).slice(0,3).join(' · ') || hero.characterRole || 'Creador de contenido') + '</span></div></div></div>' +
        '<section class="hero-profile-sidebar-quote comic-profile-quote"><small>' + escapeStatsHtml(getHeroDisplayName(hero)) + ' DICE:</small><blockquote>' + escapeStatsHtml(hero.voice || 'Frase personal pendiente de completar.') + '</blockquote><p>Frase de identidad del canal.</p></section>' +
        (hero.character_card ? '<section class="hero-profile-character-card-link"><small>CARTA DEL PERSONAJE</small><button type="button" onclick="openHeroModal(' + index + ')">VER CARTA COMPLETA ↗</button></section>' : '') +
        '<section class="hero-profile-socials comic-profile-socials"><small>ENLACES DEL CANAL</small><div>' + (socials || '<p>Redes sociales pendientes de vincular.</p>') + '</div></section>' +
        '<button class="hero-profile-back comic-profile-back" type="button" onclick="closeHeroProfile()">← VOLVER AL ROSTER</button></aside>';
    page.innerHTML = '<div class="hero-profile-reference-layout comic-profile-layout">' + leftRail +
        '<main class="hero-profile-main comic-profile-main">' + topLine + renderHeroProfileTabs(hero) + '</main></div>';
    page.querySelectorAll('[data-profile-tab]').forEach(button => button.addEventListener('click', () => activateHeroProfileTab(button)));
    page.querySelector('.hero-profile-tabs')?.addEventListener('keydown', event => {
        if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
        const buttons = Array.from(page.querySelectorAll('[data-profile-tab]'));
        const current = buttons.indexOf(document.activeElement);
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        event.preventDefault();
        buttons[next]?.focus();
        if (buttons[next]) activateHeroProfileTab(buttons[next]);
    });
    home.hidden = true;
    page.hidden = false;
    page.classList.add('is-active');
    page.setAttribute('aria-hidden', 'false');
    setHeroProfileRoute(hero, options.historyMode || 'push');
    const profileTop=page.getBoundingClientRect().top+window.scrollY;
    const stickyHeader=document.querySelector('header');
    const stickyHeaderHeight=stickyHeader?.getBoundingClientRect().height||0;
    window.scrollTo({top:Math.max(0,profileTop-stickyHeaderHeight-12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    requestAnimationFrame(() => page.querySelector('[data-profile-tab]')?.focus({preventScroll:true}));
}
function navigateHeroProfile(direction) {
    const entries = getRosterFilteredEntries();
    const currentPosition = entries.findIndex(entry => entry.index === window.currentHeroProfileIndex);
    const nextEntry = entries[currentPosition + Number(direction)];
    if (!nextEntry) return;
    openHeroProfile(nextEntry.index, window.lastHeroProfileTrigger || document.activeElement, { historyMode: 'replace' });
}
function findHeroIndexBySlug(slug) {
    const normalized = String(slug || '').toLocaleLowerCase('es');
    return heroesData.findIndex(hero => getHeroRosterSlug(hero) === normalized
        || (Array.isArray(hero.legacy_slugs) && hero.legacy_slugs.some(value => String(value).toLocaleLowerCase('es') === normalized))
        || hero.name.toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,'-') === normalized);
}
function openHeroFromRoute(slug, normalizeHistory = false) {
    const index = findHeroIndexBySlug(slug);
    if (index < 0) return false;
    showRosterChapter();
    const hero = heroesData[index];
    if (normalizeHistory) {
        history.replaceState({ lmRosterBase: true }, '', '#roster');
        history.pushState({ lmRosterProfile: true }, '', '#roster/' + encodeURIComponent(getHeroRosterSlug(hero)));
    }
    openHeroProfile(index, null, { historyMode: 'none' });
    return true;
}
function restoreHeroProfileFromHash() {
    const hash = location.hash || '';
    if (hash === '#roster' || hash.startsWith('#roster?')) {
        showRosterChapter();
        if (hash.startsWith('#roster?')) {
            const match = hash.match(/^#roster\?hero=([^&]+)/i);
            if (match && match[1]) {
                let slug = match[1];
                try { slug = decodeURIComponent(slug); } catch (error) { /* conservar valor literal */ }
                const hero = heroesData.find(item => getHeroRosterSlug(item) === slug.toLowerCase() || String(item.id || item.slug) === slug);
                if (hero) selectedRosterCreatorId = hero.id || hero.slug;
            }
        }
        renderRosterSelector();
        return;
    }
    let slug = '', legacy = false;
    try {
        if (hash.startsWith('#roster/')) slug = decodeURIComponent(hash.slice('#roster/'.length));
        else if (hash.startsWith('#expediente-')) { slug = decodeURIComponent(hash.slice('#expediente-'.length)); legacy = true; }
    } catch (error) { slug = ''; }
    if (!slug) return;
    if (!openHeroFromRoute(slug, legacy || !history.state?.lmRosterProfile)) {
        history.replaceState({ lmRosterBase: true }, '', '#roster');
        showRosterChapter();
    }
}
window.addEventListener('popstate', () => {
    const hash = location.hash || '';
    if (hash === '#roster' || hash.startsWith('#roster?')) {
        if (window.currentHeroProfileIndex !== null && window.currentHeroProfileIndex !== undefined) closeHeroProfile({ fromHistory: true });
        showRosterChapter();
        if (hash.startsWith('#roster?')) {
            const match = hash.match(/^#roster\?hero=([^&]+)/i);
            if (match && match[1]) {
                let slug = match[1];
                try { slug = decodeURIComponent(slug); } catch (error) { /* conservar valor literal */ }
                const hero = heroesData.find(item => getHeroRosterSlug(item) === slug.toLowerCase() || String(item.id || item.slug) === slug);
                if (hero) selectedRosterCreatorId = hero.id || hero.slug;
            }
        }
        renderRosterSelector();
        return;
    }
    if (hash.startsWith('#roster/')) {
        let slug = '';
        try { slug = decodeURIComponent(hash.slice('#roster/'.length)); } catch (error) { /* ruta inválida */ }
        if (slug) openHeroFromRoute(slug, false);
        return;
    }
    if (hash.startsWith('#expediente-')) { restoreHeroProfileFromHash(); return; }
    if (window.currentHeroProfileIndex !== null && window.currentHeroProfileIndex !== undefined) closeHeroProfile({ fromHistory: true });
    if (hash.startsWith('#chapter-')) {
        const num = Number(hash.slice('#chapter-'.length));
        if (Number.isFinite(num)) switchChapter(num, { skipHistory: true });
    } else if (!hash || hash === '#') switchChapter(0, { skipHistory: true });
});
document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;
    const modal = document.getElementById('hero-modal');
    if (modal?.classList.contains('active')) return;
    const profilePage = document.getElementById('hero-profile-page');
    if (profilePage && !profilePage.hidden) {
        event.preventDefault();
        closeHeroProfile();
    }
});
function closeHeroProfile(options = {}) {
    if (!options.fromHistory && history.state?.lmRosterProfile) {
        history.back();
        return;
    }
    const home = document.getElementById('roster-home');
    const page = document.getElementById('hero-profile-page');
    if (page) {
        page.hidden = true;
        page.classList.remove('is-active');
        page.setAttribute('aria-hidden', 'true');
    }
    if (home) home.hidden = false;
    if (!options.fromHistory && location.hash.startsWith('#roster/')) {
        history.replaceState({ lmRosterBase: true }, '', '#roster');
    }
    document.getElementById('chapter-2')?.scrollIntoView({behavior:'smooth',block:'start'});
    const trigger = window.lastHeroProfileTrigger;
    window.lastHeroProfileTrigger = null;
    window.currentHeroProfileIndex = null;
    if (trigger && trigger.isConnected && typeof trigger.focus === 'function') {
        requestAnimationFrame(() => {
            if (trigger.isConnected) trigger.focus({preventScroll:true});
        });
    } else if (home) {
        home.setAttribute('tabindex', '-1');
        requestAnimationFrame(() => home.focus({preventScroll:true}));
    }
}

function renderProfileOverview(hero) {
    const data = hero.mediaProfile || {};
    let out = '<div class="profile-overview">';
    out += '<section class="profile-overview-lead"><span class="profile-section-kicker">PRESENTACIÓN DEL CREADOR</span><p>' + escapeStatsHtml(hero.bio || 'Presentación pendiente de completar.') + '</p></section>';
    if (data.project) {
        out += '<section class="profile-overview-section"><h4>EL PROYECTO</h4><p>' + escapeStatsHtml(data.project) + '</p><div class="profile-people-grid"><article><strong>DEMI</strong><p>' + escapeStatsHtml(data.demi || '') + '</p></article><article><strong>ARI</strong><p>' + escapeStatsHtml(data.ari || '') + '</p></article></div></section>';
    }
    if (data.editorial || data.formats || hero.areas) {
        out += '<section class="profile-overview-section"><h4>CONTENIDO Y ESPECIALIDADES</h4><p>' + escapeStatsHtml(data.editorial || 'Áreas de contenido y formatos del canal.') + '</p>';
        const formats = data.formats || hero.areas || [];
        if (formats.length) out += '<ul class="profile-detail-list">' + formats.map(v => '<li>' + escapeStatsHtml(v) + '</li>').join('') + '</ul>';
        out += '</section>';
    }
    if (data.opportunities && data.opportunities.length) {
        out += '<section class="profile-overview-section"><h4>POSIBILIDADES DE COLABORACIÓN</h4><p>Formatos que podrían integrarse de manera natural al contenido:</p><ul class="profile-detail-list">' + data.opportunities.map(v => '<li>' + escapeStatsHtml(v) + '</li>').join('') + '</ul><p class="stats-muted">' + escapeStatsHtml(data.disclaimer || 'Propuestas sujetas a conversación y disponibilidad.') + '</p></section>';
    }
    out += '</div>';
    return out;
}
function updateComicPageControls(enabled){
 const nav=document.getElementById('modal-comic-navigation');
 if(!nav)return;
 nav.hidden=!enabled;
 if(!enabled)return;
 const page=window.currentModalPage||0,total=window.currentComicTotal||4;
 const count=document.getElementById('comic-page-count');
 const prev=document.getElementById('comic-page-prev'),next=document.getElementById('comic-page-next');
 if(count)count.textContent='PÁGINA '+String(page+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
 if(prev)prev.disabled=page===0;
 if(next)next.disabled=page===total-1;
}
function renderRosterComicPages(hero,index,channelStats,sullyChannel){
 const safe=v=>escapeStatsHtml(v||'');
 const identity=hero.codename||'IDENTIDAD EN ARCHIVO';
 const role=hero.characterRole||hero.rank||'INTEGRANTE DE LA LEGIÓN';
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const displayName=getHeroDisplayName(hero);
 const voiceStyle=({MORIARTYS:'voice-moriartys',ROD3R1K:'voice-rod3r1k',LADYMORIARTY:'voice-lady',ARDIPII:'voice-ardipii',AKUMA:'voice-akuma','DAVE — NEXUS':'voice-nexus','PATO — ORATORIS':'voice-oratoris',HABITOS:'voice-habitos'})[hero.name]||'voice-default';
 const page=(chapter,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO '+chapter+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE '+safe(displayName)+' · PÁGINA 0'+chapter+'</small><h2>'+title+'</h2></div>'+body+'<footer class="comic-page-footer"><span>'+safe(displayName)+' · ARCHIVO INDIVIDUAL</span><b>0'+chapter+' / 04</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'S/N')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de '+safe(displayName)+'"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>'+safe(displayName)+'</h2><b>'+safe(hero.series||'01')+'</b></div><p class="comic-cover-subtitle">'+safe(identity)+' · '+safe(role)+'</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL HÉROE</b></div><p>'+safe(hero.bio||'Presentación individual pendiente de confirmación.')+'</p><p class="comic-panel-caption">Expediente individual. Los datos no disponibles se identifican como pendientes de verificación.</p></section>'+renderEpicCreatorProfileBadge(hero)+(hero.voice?'<aside class="hero-voice '+voiceStyle+'"><span>SU VOZ EN LA LEGIÓN</span><p>“'+safe(hero.voice)+'”</p></aside>':'')+'<footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const statsBody='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>ACTIVIDAD Y ALCANCE</b></div><p class="comic-panel-caption">Indicadores públicos disponibles para este canal, con su fuente y período.</p>'+renderStatsDashboard(hero,channelStats,sullyChannel)+'</section>';
 const stats=page('01','EL PODER DE LA AUDIENCIA',statsBody,'LA COMUNIDAD');
 const powerBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>CAPACIDADES REGISTRADAS</b></div><h3>'+safe(identity)+'</h3><p>'+safe(hero.powers||hero.powerSet||'Descripción de habilidades pendiente de confirmar con el integrante.')+'</p><p class="comic-panel-caption">Los elementos narrativos de la carta identifican al personaje dentro de la Legión; no representan certificaciones ni métricas de rendimiento.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>ESPECIALIDADES Y UNIVERSOS</b></div><div class="comic-format-list">'+(areas.length?areas.map(v=>'<span>'+safe(v)+'</span>').join(''):'<span>Especialidades pendientes de confirmar</span>')+'</div></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>BITÁCORA DE MISIONES</b></div>'+renderMissionArchive(hero)+'</section>';
 const missions=page('02','TRAYECTORIA Y MISIONES',powerBody,'LAS MISIONES');
 const profile=hero.mediaProfile||{};
 const formats=profile.formats||areas;
 const opportunities=profile.opportunities||[];
 const activationRows=(opportunities.length?opportunities:['Presentación de contenido y producto pertinente']).map((item,i)=>'<tr><td>'+safe(formats.length?formats[i%formats.length]:'Territorio por confirmar')+'</td><td>'+safe(item)+'</td><td>Idea a evaluar con el creador</td></tr>').join('');
 const activationTable='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>00</span><b>MATRIZ DE ENCAJE COMERCIAL</b></div><p class="comic-panel-caption">Una lectura práctica de cómo podría conectarse cada territorio con una activación. Son ideas para evaluar, no entregables comprometidos ni campañas realizadas.</p><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>TERRITORIO</th><th>FORMATO / ACTIVACIÓN POSIBLE</th><th>ESTADO</th></tr></thead><tbody>'+activationRows+'</tbody></table></div></section>';
 const commercialBody=activationTable+'<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>CONTENIDO, AUDIENCIA Y FORMATOS</b></div><p>'+safe(profile.editorial||'La propuesta editorial se construye a partir de las áreas y contenidos públicos del creador.')+'</p><p class="comic-panel-caption"><b>AFINIDAD TEMÁTICA:</b> '+safe(profile.audience_fit||'Afinidad por caracterizar junto al creador; sin atribuir datos demográficos ni tamaños de audiencia no medidos.')+'</p><div class="comic-format-list">'+(formats.length?formats.map(v=>'<span>'+safe(v)+'</span>').join(''):'<span>Formatos por confirmar</span>')+'</div></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>OPORTUNIDADES DE COLABORACIÓN</b></div>'+(opportunities.length?'<ul class="profile-detail-list">'+opportunities.map(v=>'<li>'+safe(v)+'</li>').join('')+'</ul>':'<p>Se pueden evaluar presentaciones de producto, pruebas de videojuegos, integraciones y acciones con comunidad, siempre sujetas a conversación y aprobación del creador.</p>')+'<p class="comic-panel-caption">'+safe(profile.disclaimer||'Propuestas potenciales; no implican campañas contratadas ni alianzas vigentes.')+'</p></section></div><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS COLABORACIONES</span><h3>HAGAMOS QUE TU MARCA FORME PARTE DE LA HISTORIA.</h3><p>Contacto y propuestas comerciales:</p>'+(profile.contact?'<a href="mailto:'+safe(profile.contact)+'">'+safe(profile.contact)+'</a>':'<p>Canal de contacto pendiente de confirmar con el creador.</p>')+'</section>';
 const commercial=page('03','EL UNIVERSO COMERCIAL',commercialBody,'COLABORACIONES');
 return [cover,stats,missions,commercial];
}

function normalizeRosterDossierPages(pages, hero) {
    const profileKey = escapeStatsHtml(hero.id || hero.slug || 'creator');
    return (Array.isArray(pages) ? pages : []).map((markup, index) => {
        if (typeof markup !== 'string') return markup;
        return markup.replace(/<article\b([^>]*\bcomic-book-sheet\b[^>]*)>/, (opening, attributes) => {
            const normalizedAttributes = attributes.replace(/class="([^"]*)"/, (match, classes) =>
                'class="' + classes.split(/\s+/).filter(Boolean).filter(name => name !== 'rod3r1k-page').concat('roster-dossier-page').filter((name, position, all) => all.indexOf(name) === position).join(' ') + '"'
            );
            return '<article' + normalizedAttributes + ' data-dossier-profile="' + profileKey + '" data-dossier-page="' + (index + 1) + '>';
        });
    });
}

function openHeroModal(index) {
    const hero = heroesData[index];
    if (!hero) return;
    const modal=document.getElementById('hero-modal');
    const modalContent=modal.querySelector('.modal-content');
    const isMoriartys=hero.name==='MORIARTYS';
    const isLady=hero.name==='LADYMORIARTY';
    document.getElementById('modal-hero-title').innerText = 'MEDIA KIT · ' + getHeroDisplayName(hero);
    document.getElementById('modal-tab-navigation').hidden=false;
    document.getElementById('modal-comic-navigation').hidden=true;
    modalContent.classList.add('comic-mode');
    let pages;
    const channelStats=findChannelStats(hero);
    const sullyChannel=findSullyChannel(hero);
    // Los ocho expedientes comparten el mismo renderer y las mismas fuentes dinámicas.
    // Se evita activar bitácoras históricas con métricas, horarios o textos duplicados.
    pages=renderRosterComicPages(hero,index,channelStats,sullyChannel);
    pages = normalizeRosterDossierPages(pages, hero);
    // A: identidad/contenido · B: audiencia, actividad y juegos · C: clips, hitos y colaboraciones.
    let profilePages, audiencePages, storyPages;
    if (pages.length >= 6) {
        profilePages = pages.slice(0, 2);
        audiencePages = pages.slice(2, 4);
        storyPages = pages.slice(4);
    } else if (pages.length === 5) {
        profilePages = pages.slice(0, 2);
        audiencePages = pages.slice(2, 3);
        storyPages = pages.slice(3);
    } else {
        profilePages = pages.slice(0, 1);
        audiencePages = pages.slice(1, Math.max(2, pages.length - 1));
        storyPages = pages.slice(Math.max(2, pages.length - 1));
    }
    const automaticClipsSection=renderAutomaticTwitchClips(hero);
    if(automaticClipsSection&&storyPages.length){
        const lastStoryIndex=storyPages.length-1;
        storyPages[lastStoryIndex]=storyPages[lastStoryIndex].replace(/<\/article>\s*$/,automaticClipsSection+'</article>');
    }
    document.getElementById('modal-profile-text').innerHTML=profilePages.join('');
    document.getElementById('modal-stats-text').innerHTML=audiencePages.join('');
    document.getElementById('modal-log-text').innerHTML=storyPages.join('');
    document.getElementById('modal-extra-text').innerHTML='';
    const fifth=document.getElementById('modal-lady-page-5');
    const sixth=document.getElementById('modal-lady-page-6');
    if(fifth)fifth.innerHTML='';
    if(sixth)sixth.innerHTML='';
    window.currentComicTotal=3;
    window.currentModalCreatorKey = hero.id || hero.slug || hero.name;
    const platformLabels = { twitch:"TWITCH", youtube:"YOUTUBE", instagram:"INSTAGRAM", kick:"KICK" };
    const accounts = (hero.accounts || []).filter(account => platformLabels[account.platform] && account.url);
    const modalLink = document.getElementById('modal-twitch-btn');
    const modalLinks = document.getElementById('modal-platform-links');
    if (accounts.length > 1 && modalLinks) {
        modalLink.hidden = true;
        modalLinks.hidden = false;
        modalLinks.innerHTML = accounts.map(account =>
            '<a class="twitch-link-btn" href="' + escapeStatsHtml(account.url) + '" target="_blank" rel="noopener noreferrer">VISITAR ' + platformLabels[account.platform] + ' ↗</a>'
        ).join('');
    } else {
        if (modalLinks) { modalLinks.hidden = true; modalLinks.innerHTML = ''; }
        const primary = accounts[0];
        const destination = primary?.url || hero.youtube || hero.twitch || "#";
        const platform = primary?.platform || (hero.youtube ? "youtube" : hero.twitch ? "twitch" : "");
        modalLink.href = destination;
        modalLink.textContent = platform === "youtube" ? "VISITAR CANAL DE YOUTUBE" : platform === "twitch" ? "VISITAR CANAL DE TWITCH" : platform ? "VISITAR " + platform.toUpperCase() : "PLATAFORMA NO DISPONIBLE";
        modalLink.hidden = !platform;
    }
    window.lastModalTrigger = document.activeElement;
    window.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setModalBackgroundInert(true);
    modal.classList.add('active');
    let rememberedPage = 0;
    try {
        const saved = Number(localStorage.getItem('legion-roster-modal-page:' + window.currentModalCreatorKey));
        if (Number.isInteger(saved) && saved >= 0 && saved < pages.length) rememberedPage = saved;
    } catch (error) { /* almacenamiento bloqueado: iniciar en la primera página */ }
    switchModalTab(rememberedPage, true);
    updateComicPageControls(false);
    modal.querySelector('.close-modal-btn')?.focus();
}
function setModalBackgroundInert(active){
    const targets=[document.querySelector('main'),document.querySelector('.site-technical-footer')].filter(Boolean);
    if(active){
        if(window.previousModalBackgroundState)return;
        window.previousModalBackgroundState=targets.map(element=>({
            element,
            inert:Boolean(element.inert),
            ariaHidden:element.getAttribute('aria-hidden')
        }));
        targets.forEach(element=>{
            element.inert=true;
            element.setAttribute('aria-hidden','true');
        });
        return;
    }
    (window.previousModalBackgroundState||[]).forEach(state=>{
        state.element.inert=state.inert;
        if(state.ariaHidden===null)state.element.removeAttribute('aria-hidden');
        else state.element.setAttribute('aria-hidden',state.ariaHidden);
    });
    window.previousModalBackgroundState=null;
}

function printHeroDossier(){
    const modal=document.getElementById('hero-modal');
    if(!modal||!modal.classList.contains('active'))return;
    const panes=Array.from(modal.querySelectorAll('.modal-tab-pane[role="tabpanel"]'));
    const previousHidden=panes.map(pane=>pane.hidden);
    panes.forEach(pane=>{pane.hidden=false;});
    let cleanupTimer=null;
    const cleanup=()=>{
        panes.forEach((pane,index)=>{pane.hidden=previousHidden[index];});
        document.body.classList.remove('printing-roster-dossier');
        window.removeEventListener('afterprint',cleanup);
        if(cleanupTimer!==null)window.clearTimeout(cleanupTimer);
    };
    document.body.classList.add('printing-roster-dossier');
    window.addEventListener('afterprint',cleanup);
    window.print();
    // Respaldo para navegadores móviles que omiten afterprint.
    cleanupTimer=window.setTimeout(cleanup,30000);
}

        function closeModal() {
            const modal = document.getElementById('hero-modal');
            if (!modal || !modal.classList.contains('active')) return;
            modal.classList.remove('active');
            setModalBackgroundInert(false);
            document.body.style.overflow = window.previousBodyOverflow || '';
            const trigger = window.lastModalTrigger;
            window.lastModalTrigger = null;
            if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) trigger.focus();
        }

        document.addEventListener('keydown', function(event) {
            const modal = document.getElementById('hero-modal');
            if (!modal || !modal.classList.contains('active')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
            if (!focusable.length) {
                event.preventDefault();
                modal.querySelector('.modal-content')?.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        });

        document.getElementById('modal-tab-navigation')?.addEventListener('keydown', event => {
            const tabs = Array.from(document.querySelectorAll('#modal-tab-navigation [role="tab"]'));
            const active = tabs.indexOf(document.activeElement);
            if (active < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
                : (active + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[next]?.focus();
            tabs[next]?.click();
        });
        function switchModalTab(tabIndex, silent = false) {
            const modalContent = document.querySelector('.modal-content');
            const isComic = modalContent?.classList.contains('comic-mode');
            const maxPage=isComic?(window.currentComicTotal||4):3;
            const previousIndex=window.currentModalPage??0;
            tabIndex=Math.max(0,Math.min(maxPage-1,Number(tabIndex)||0));
            for(let t=0;t<6;t++){
                const pane=document.getElementById(`modal-pane-${t}`);
                const btn=document.querySelectorAll('.modal-tab-btn')[t];
                if(pane){pane.classList.toggle('active',t===tabIndex);pane.hidden=t!==tabIndex;}
                if(btn){
                    btn.classList.toggle('active',t===tabIndex);
                    btn.setAttribute('aria-selected',String(t===tabIndex));
                    btn.tabIndex=t===tabIndex?0:-1;
                }
            }
            window.currentModalPage=tabIndex;
            if (modalContent) modalContent.scrollTop = 0;
            if(!silent&&window.currentModalCreatorKey){
                try { localStorage.setItem('legion-roster-modal-page:' + window.currentModalCreatorKey, String(tabIndex)); } catch (error) { /* sin persistencia */ }
            }
            if(!silent&&previousIndex!==tabIndex)playPageTurnCue();
            if(isComic&&!silent&&previousIndex!==tabIndex){
                const activePane=document.getElementById(`modal-pane-${tabIndex}`);
                if(activePane){activePane.classList.remove('comic-page-arrival');void activePane.offsetWidth;activePane.classList.add('comic-page-arrival');}
            }
            if(isComic)updateComicPageControls(false);
        }

        /* Identidad sonora: lounge jazz heroico, original y sintetizado en Web Audio.
           Rhodes cálido, bajo redondo y percusión tipo escobillas. Sin pistas externas ni autoplay. */
        let arcadeAudioContext = null;
        let arcadeAudioTimer = null;
        let jazzStep = 0;
        const jazzTempo = 76;
        const jazzBeatMs = 60000 / jazzTempo;
        const jazzProgression = [
            { chord:[130.81,164.81,196.00,246.94,293.66], bass:65.41, color:[523.25,587.33,659.25,783.99] }, // Cmaj9
            { chord:[110.00,130.81,164.81,196.00,246.94], bass:55.00, color:[493.88,587.33,659.25,783.99] }, // Am9
            { chord:[146.83,174.61,220.00,261.63,329.63], bass:73.42, color:[523.25,587.33,698.46,783.99] }, // Dm9
            { chord:[130.81,164.81,196.00,233.08,293.66], bass:65.41, color:[493.88,587.33,659.25,783.99] }  // G13
        ];
        function jazzVoice(frequency,duration,when,volume,wave='sine',cutoff=1800,attack=.12){
            if(!arcadeAudioContext)return;
            const osc=arcadeAudioContext.createOscillator();
            const filter=arcadeAudioContext.createBiquadFilter();
            const gain=arcadeAudioContext.createGain();
            osc.type=wave;osc.frequency.setValueAtTime(frequency,when);
            filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,when);filter.Q.value=.55;
            gain.gain.setValueAtTime(.0001,when);
            gain.gain.exponentialRampToValueAtTime(volume,when+attack);
            gain.gain.setValueAtTime(volume,Math.max(when+attack,when+duration-.22));
            gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
            osc.connect(filter);filter.connect(gain);gain.connect(arcadeAudioContext.destination);
            osc.start(when);osc.stop(when+duration+.03);
        }
        function jazzBrush(when){
            if(!arcadeAudioContext)return;
            const length=Math.floor(arcadeAudioContext.sampleRate*.19);
            const buffer=arcadeAudioContext.createBuffer(1,length,arcadeAudioContext.sampleRate);
            const data=buffer.getChannelData(0);
            for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
            const source=arcadeAudioContext.createBufferSource();
            const filter=arcadeAudioContext.createBiquadFilter();
            const gain=arcadeAudioContext.createGain();
            source.buffer=buffer;filter.type='bandpass';filter.frequency.value=3400;filter.Q.value=.7;
            gain.gain.setValueAtTime(.0001,when);gain.gain.linearRampToValueAtTime(.012,when+.025);gain.gain.exponentialRampToValueAtTime(.0001,when+.18);
            source.connect(filter);filter.connect(gain);gain.connect(arcadeAudioContext.destination);
            source.start(when);source.stop(when+.2);
        }
        function playArcadeStep(){
            if(!arcadeAudioContext||arcadeAudioContext.state!=='running')return;
            const now=arcadeAudioContext.currentTime;
            const step=jazzStep%16;
            const bar=Math.floor(jazzStep/16)%jazzProgression.length;
            const harmony=jazzProgression[bar];
            if(step===0){
                harmony.chord.forEach((note,index)=>jazzVoice(note,3.65,now,.012,index===0?'triangle':'sine',1250,.55));
                jazzVoice(harmony.bass,1.25,now,.075,'triangle',420,.08);
            }
            if(step===8)jazzVoice(harmony.bass*1.5,.72,now,.045,'triangle',500,.08);
            if(step===4||step===12)jazzBrush(now);
            // Motivo breve y espaciado: color de aventura, sin sonar a alarma de videojuego.
            const phrases={2:0,5:2,9:1,11:3,14:2};
            if(Object.prototype.hasOwnProperty.call(phrases,step)){
                const note=harmony.color[phrases[step]];
                jazzVoice(note,.48,now,.025,'sine',2200,.035);
            }
            jazzStep++;
        }
        async function toggleArcadeSound(){
            const button=document.getElementById('sound-toggle');
            if(!button)return;
            if(arcadeAudioTimer){
                window.clearInterval(arcadeAudioTimer);arcadeAudioTimer=null;
                if(arcadeAudioContext)await arcadeAudioContext.suspend();
                button.textContent='♫ SONIDO: OFF';button.setAttribute('aria-pressed','false');
                return;
            }
            try{
                const AudioContextClass=window.AudioContext||window.webkitAudioContext;
                if(!AudioContextClass){button.textContent='AUDIO NO DISPONIBLE';return;}
                if(!arcadeAudioContext)arcadeAudioContext=new AudioContextClass();
                await arcadeAudioContext.resume();
                jazzStep=0;playArcadeStep();
                arcadeAudioTimer=window.setInterval(playArcadeStep,jazzBeatMs/2);
                button.textContent='♫ JAZZ MODE: ON';button.setAttribute('aria-pressed','true');
            }catch(error){button.textContent='AUDIO NO DISPONIBLE';}
        }
        function playChapterCue(){
            if(!arcadeAudioContext||arcadeAudioContext.state!=='running')return;
            const now=arcadeAudioContext.currentTime;
            // Acorde maj7 suave, como una pequeña firma de entrada.
            [392.00,493.88,587.33,659.25].forEach((note,index)=>jazzVoice(note,.72,now+index*.025,.018,'sine',1700,.16));
        }
        function playPageTurnCue(){
            if(!arcadeAudioContext || arcadeAudioContext.state !== 'running') return;
            const now=arcadeAudioContext.currentTime;
            const length=Math.floor(arcadeAudioContext.sampleRate*.24);
            const buffer=arcadeAudioContext.createBuffer(1,length,arcadeAudioContext.sampleRate);
            const samples=buffer.getChannelData(0);
            for(let i=0;i<length;i++){
                const fade=1-i/length;
                samples[i]=(Math.random()*2-1)*fade;
            }
            const source=arcadeAudioContext.createBufferSource();
            const filter=arcadeAudioContext.createBiquadFilter();
            const gain=arcadeAudioContext.createGain();
            source.buffer=buffer;
            filter.type='bandpass';
            filter.frequency.setValueAtTime(1550,now);
            filter.frequency.exponentialRampToValueAtTime(620,now+.22);
            filter.Q.value=.65;
            gain.gain.setValueAtTime(.0001,now);
            gain.gain.linearRampToValueAtTime(.028,now+.035);
            gain.gain.exponentialRampToValueAtTime(.0001,now+.23);
            source.connect(filter);filter.connect(gain);gain.connect(arcadeAudioContext.destination);
            source.start(now);source.stop(now+.25);
        }

        function renderChapterPager(activeNumber) {
            const panels = Array.from(document.querySelectorAll('.chapter-panel')).filter(panel => panel.dataset.pager !== 'false').sort((a,b) =>
                Number(a.dataset.editorialNumber || 999) - Number(b.dataset.editorialNumber || 999)
            );
            const index = panels.findIndex(panel => Number(panel.id.replace('chapter-','')) === Number(activeNumber));
            const panel = panels[index];
            if (!panel) return;
            let pager = panel.querySelector('.chapter-pager');
            if (!pager) {
                pager = document.createElement('nav');
                pager.className = 'chapter-pager';
                pager.setAttribute('aria-label','Navegación entre capítulos');
                panel.appendChild(pager);
            }
            const labelFor = target => {
                const number = Number(target.id.replace('chapter-',''));
                const nav = document.querySelector('.nav-btn[data-chapter="' + number + '"]');
                return nav ? nav.textContent.replace(/^\d+\s*/, '').trim() : (number === 0 ? 'ÍNDICE' : 'CAPÍTULO ' + String(target.dataset.editorialNumber || number).padStart(2,'0'));
            };
            const previous = panels[index-1], next = panels[index+1];
            pager.innerHTML = '';
            const prevButton = document.createElement('button');
            prevButton.type = 'button'; prevButton.className = 'chapter-pager-button chapter-pager-prev';
            prevButton.disabled = !previous; prevButton.textContent = previous ? '← ANTERIOR · ' + labelFor(previous) : '← INICIO';
            prevButton.addEventListener('click', () => { if (previous) switchChapter(Number(previous.id.replace('chapter-',''))); });
            const indexButton = document.createElement('button');
            indexButton.type = 'button'; indexButton.className = 'chapter-pager-index'; indexButton.textContent = 'VOLVER AL ÍNDICE';
            indexButton.addEventListener('click', () => switchChapter(0));
            const nextButton = document.createElement('button');
            nextButton.type = 'button'; nextButton.className = 'chapter-pager-button chapter-pager-next';
            nextButton.disabled = !next; nextButton.textContent = next ? labelFor(next) + ' · SIGUIENTE →' : 'FIN DEL ARCHIVO →';
            nextButton.addEventListener('click', () => { if (next) switchChapter(Number(next.id.replace('chapter-',''))); });
            pager.append(prevButton,indexButton,nextButton);
        }

        const chapterResourcePromises = new Map();

        function loadResourceOnce(key, loader) {
            if (!chapterResourcePromises.has(key)) {
                const pending = Promise.resolve().then(loader).catch(error => {
                    chapterResourcePromises.delete(key);
                    throw error;
                });
                chapterResourcePromises.set(key, pending);
            }
            return chapterResourcePromises.get(key);
        }

        function ensureRosterResources() {
            return loadResourceOnce('roster', async () => {
                try {
                    await loadRosterData();
                    await loadResourceOnce('creator-records', loadCreatorRecords);
                    renderRoster();
                    renderMultiverseMap();
                    restoreHeroProfileFromHash();
                } catch (error) {
                    renderRosterLoadError(error);
                    throw error;
                }
            });
        }

        function loadChapterResources(chapterNum) {
            const jobs = [];
            const add = (key, loader) => jobs.push(loadResourceOnce(key, loader));

            // Inicio y central EN VIVO: solo necesitan el estado público resumido.
            if ([0, 3, 10].includes(Number(chapterNum))) add('institute-stats', loadInstituteStats);

            // Roster, estadísticas y mapa comparten las fuentes de perfiles y métricas.
            if ([2, 3, 13].includes(Number(chapterNum))) {
                jobs.push(ensureRosterResources());
                add('sullygnome', loadSullyGnomeData);
                add('twitch-metrics', loadTwitchMetricsData);
                add('creator-records', loadCreatorRecords);
                add('platform-stats', loadPlatformStatsData);
                add('twitch-clips', loadTwitchClipsData);
            }

            // El expediente incluye códigos Epic; cargar el registro al entrar en el Roster.
            if (Number(chapterNum) === 2) add('epic-programs', loadEpicCreatorPrograms);

            // Las credenciales externas solo se consultan al entrar en Alianzas.
            if (Number(chapterNum) === 8) {
                add('epic-programs', loadEpicCreatorPrograms);
                add('partner-metrics', loadPartnerMetrics);
                add('platform-stats', loadPlatformStatsData);
            }

            // Noticias y playbook se descargan al abrir Comunidad.
            if (Number(chapterNum) === 9) {
                jobs.push(ensureRosterResources().then(() => loadResourceOnce('community-playbook', loadCommunityPlaybook)));
                add('legion-news', loadLegionNews);
            }

            return Promise.allSettled(jobs);
        }

        let lmGlobalChapterStylesPromise = null;
        function ensureGlobalChapterStyles() {
            const link = document.getElementById('lm-global-chapter-styles');
            if (!link || link.dataset.loaded === 'true' || link.dataset.failed === 'true') return Promise.resolve();
            if (lmGlobalChapterStylesPromise) return lmGlobalChapterStylesPromise;
            lmGlobalChapterStylesPromise = new Promise(resolve => {
                link.addEventListener('load', () => {
                    link.dataset.loaded = 'true';
                    resolve();
                }, { once: true });
                link.addEventListener('error', () => {
                    link.dataset.failed = 'true';
                    resolve();
                }, { once: true });
                link.href = link.dataset.href;
            });
            return lmGlobalChapterStylesPromise;
        }

        // El CSS global solo se solicita cuando el visitante abandona la primera pantalla.
        window.addEventListener('scroll', () => { void ensureGlobalChapterStyles(); }, { once: true, passive: true });
        document.addEventListener('pointerdown', () => { void ensureGlobalChapterStyles(); }, { once: true, passive: true, capture: true });
        document.addEventListener('keydown', () => { void ensureGlobalChapterStyles(); }, { once: true, capture: true });

        function switchChapter(chapterNum, options = {}) {
            const panel = document.getElementById('chapter-' + chapterNum);
            if (!panel) return;
            const globalStylesLink = document.getElementById('lm-global-chapter-styles');
            if (Number(chapterNum) !== 0 && globalStylesLink && globalStylesLink.dataset.loaded !== 'true' && globalStylesLink.dataset.failed !== 'true') {
                ensureGlobalChapterStyles().then(() => switchChapter(chapterNum, options));
                return;
            }
            loadChapterResources(Number(chapterNum));
            if (Number(chapterNum) !== 2 && window.currentHeroProfileIndex !== null && window.currentHeroProfileIndex !== undefined) {
                const profilePage = document.getElementById('hero-profile-page');
                const rosterHome = document.getElementById('roster-home');
                if (profilePage) {
                    profilePage.hidden = true;
                    profilePage.classList.remove('is-active');
                    profilePage.setAttribute('aria-hidden', 'true');
                }
                if (rosterHome) rosterHome.hidden = false;
                window.lastHeroProfileTrigger = null;
                window.currentHeroProfileIndex = null;
            }
            if (!options.skipHistory) {
                const targetHash = Number(chapterNum) === 0 ? '#' : (Number(chapterNum) === 2 ? '#roster' : '#chapter-' + chapterNum);
                if (location.hash !== targetHash) {
                    try { history.pushState({ lmChapter: Number(chapterNum) }, '', targetHash); } catch (error) { /* historial restringido */ }
                }
            }
            const current = document.querySelector('.chapter-panel.active');
            if (current === panel) return;
            const transition = document.getElementById('chapter-transition');
            const chapterName = (document.querySelector('.nav-btn[data-chapter="' + chapterNum + '"]') || {}).textContent || panel.querySelector('h2')?.textContent || 'NUEVO EXPEDIENTE';
            const readableChapterName = chapterName.replace(/\s+/g, ' ').trim();
            document.title = Number(chapterNum) === 0 ? 'LEGIÓN MULTIVERSAL | Diferentes mundos. Una misma Legión.' : readableChapterName + ' | LEGIÓN MULTIVERSAL';
            const announcement = document.getElementById('chapter-announcement');
            if (announcement) announcement.textContent = 'Sección ' + readableChapterName + ' abierta.';
            if (transition) {
                transition.setAttribute('data-title', chapterName.trim());
                transition.classList.remove('play');
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { void transition.offsetWidth; transition.classList.add('play'); }
            }
            document.querySelectorAll('.chapter-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-btn[data-chapter]').forEach(button => {
                const isCurrent = Number(button.dataset.chapter) === Number(chapterNum);
                button.classList.toggle('active', isCurrent);
                if (isCurrent) button.setAttribute('aria-current', 'page');
                else button.removeAttribute('aria-current');
            });
            panel.classList.add('active');
            recordLegionProgress('chapter', String(chapterNum));
            renderChapterPager(chapterNum);
            playChapterCue();
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
        const rosterContainer = document.getElementById('roster-container');
        function initializeLegionApp() {
            const hash = location.hash || '';
            if (hash.startsWith('#chapter-')) {
                const num = Number(hash.slice('#chapter-'.length));
                if (Number.isFinite(num) && document.getElementById('chapter-' + num)) switchChapter(num, { skipHistory: true });
            } else if (hash === '#roster' || hash.startsWith('#roster?') || hash.startsWith('#roster/') || hash.startsWith('#expediente-')) {
                switchChapter(2, { skipHistory: true });
            }
            const initialChapter = document.querySelector('.chapter-panel.active');
            const initialNumber = initialChapter ? Number(initialChapter.id.replace('chapter-', '')) : 0;
            if (initialChapter) renderChapterPager(initialNumber);
            loadChapterResources(initialNumber);
            loadResourceOnce('community-playbook', loadCommunityPlaybook);
            if (hash.startsWith('#roster') || hash.startsWith('#expediente-')) loadChapterResources(2);
            if (initialChapter) recordLegionProgress('chapter', String(initialNumber));
            window.setInterval(() => {
                if (document.querySelector('#chapter-0.active, #chapter-2.active, #chapter-3.active, #chapter-10.active')) loadInstituteStats();
            }, 60 * 1000);
            window.setInterval(() => {
                if (document.getElementById('chapter-3')?.classList.contains('active') || document.getElementById('chapter-2')?.classList.contains('active')) loadPlatformStatsData();
            }, 15 * 60 * 1000);
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeLegionApp, { once: true });
        else initializeLegionApp();

window.getCanonicalCreatorName = getCanonicalCreatorName;
