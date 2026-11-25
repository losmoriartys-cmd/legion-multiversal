        // Fuente de verdad del roster: editar role para cambiar jerarquía; completar powers y log con datos confirmados.
        let heroesData = [];
let creatorNameRegistry = {};
let epicCreatorPrograms = null;

async function loadRosterData() {
    const response = await fetch('./data/roster.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar data/roster.json (' + response.status + ').');
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.heroes) || payload.heroes.length === 0) {
        throw new Error('data/roster.json no contiene integrantes válidos.');
    }
    const identifiers = new Set();
    for (const hero of payload.heroes) {
        const identifier = hero && (hero.id || hero.slug);
        if (!identifier || identifiers.has(identifier)) {
            throw new Error('data/roster.json contiene un integrante sin identificador o con ID duplicado.');
        }
        identifiers.add(identifier);
    }
    try {
        const colorResponse = await fetch('./data/creator-colors.json', { cache: 'no-store' });
        const colorPayload = colorResponse.ok ? await colorResponse.json() : null;
        payload.heroes.forEach(hero => {
            const colorEntry = colorPayload && colorPayload.creators && colorPayload.creators[hero.id || hero.slug];
            const color = colorEntry && colorEntry.color;
            if (/^#[0-9a-fA-F]{6}$/.test(color || '')) hero.accent_color = color;
        });
    } catch (error) { console.warn('Colores de integrantes no disponibles:', error); }
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
 return '<article class="stats-executive-source"><div class="stats-executive-source-head"><strong>'+safe(title)+'</strong><span>'+safe(period||'Período no informado')+'</span></div><div class="stats-executive-metrics">'+cards.map(item=>'<div><strong>'+safe(typeof item.value==='number'?statsNumber(item.value,Number.isInteger(item.value)?0:1):item.value)+'</strong><span>'+safe(item.label)+'</span></div>').join('')+'</div>'+(note?'<p class="stats-executive-note">'+safe(note)+'</p>':'')+(sourceUrl?'<a class="stats-link stats-executive-source-link" href="'+safe(sourceUrl)+'" target="_blank" rel="noopener noreferrer">CONSULTAR FUENTE ↗</a>':'')+'</article>';
}
function renderStatsSourceDetails(title,description,content){
 return '<details class="stats-source-details"><summary><span><strong>'+escapeStatsHtml(title)+'</strong><small>'+escapeStatsHtml(description)+'</small></span><b>VER DETALLE <i aria-hidden="true">＋</i></b></summary><div class="stats-source-details-body">'+content+'</div></details>';
}
function renderStatsDashboard(hero,helix,sully){
 const safe=escapeStatsHtml,sources=[];
 const twitchAccount=(hero?.accounts||[]).find(item=>item?.platform==='twitch'&&item.account_type==='creator_channel');
 const youtubeAccount=(hero?.accounts||[]).find(item=>item?.platform==='youtube'&&item.account_type==='creator_channel');
 const captureLabel=metrics=>{
  const dates=(metrics||[]).map(item=>item?.capturedAt).filter(Boolean).sort();
  return dates.length?normalizedMetricCaptureLabel({capturedAt:dates[dates.length-1]}):'captura no disponible';
 };
 const periodLabel=metrics=>{
  const period=(metrics||[]).map(item=>item?.period).find(value=>value?.from&&value?.to);
  return period?statsDate(String(period.from).slice(0,10))+' — '+statsDate(String(period.to).slice(0,10)):(metrics||[]).some(item=>item?.period?.kind==='cumulative')?'Acumulado público':'Ventana observada';
 };

 if(twitchAccount){
  const definitions=[
   {key:'followers_total',label:'Seguidores actuales',digits:0,suffix:' seguidores'},
   {key:'streams_observed',label:'Directos detectados',digits:0,suffix:' sesiones'},
   {key:'average_viewers_sampled',label:'Promedio de espectadores',digits:1,suffix:' espectadores'},
   {key:'peak_viewers_sampled',label:'Pico observado',digits:0,suffix:' espectadores'},
   {key:'observed_live_hours',label:'Horas en directo',digits:2,suffix:' h'}
  ];
  const resolved=definitions.map(definition=>({
   definition,
   metric:getNormalizedCreatorMetric(hero,definition.key,'twitch')
  }));
  const metrics=resolved.map(({definition,metric})=>({
   label:definition.label,
   value:metric&&['available','stale'].includes(metric.state)&&metric.value!==null&&metric.value!==undefined?statsNumber(metric.value,definition.digits)+(definition.suffix||'')+(metric.state==='stale'?' · HISTÓRICO':''):null
  }));
  const status=getNormalizedLiveStatus(hero);
  const historical=resolved.some(item=>item.metric?.state==='stale');
  const note='Estado del canal: '+status.label+'. Fuente Twitch Helix; promedio y pico son observaciones muestreadas, no analítica privada ni CCV oficial. '+(historical?'Los valores vencidos se conservan identificados como HISTÓRICOS; no representan el estado actual. ':'')+'Captura: '+captureLabel(resolved.map(item=>item.metric))+'.';
  const card=renderStatsExecutiveSource('TWITCH · MÉTRICAS NORMALIZADAS',periodLabel(resolved.map(item=>item.metric)),metrics,note,twitchAccount.url||hero.twitch||null);
  if(card)sources.push(card);
 }

 if(sully){
  const m=sully.annual_summary_2026||sully.summary||{},period=sully.period?.start_date&&sully.period?.end_date?statsDate(sully.period.start_date)+' — '+statsDate(sully.period.end_date):sully.annual_summary_2026?'Acumulado 2026':'Historial disponible';
  const metrics=[{label:'Transmisiones',value:m.streams??m.streams_count??null},{label:'Horas transmitidas',value:m.hours_streamed??m.airtime_hours??(m.airtime_minutes!=null?statsNumber(m.airtime_minutes/60,1)+' h':null)},{label:'Horas vistas',value:m.hours_watched??null},{label:'Promedio de espectadores',value:m.average_viewers??m.average_viewers_duration_weighted??null},{label:'Pico de espectadores',value:m.peak_viewers??null},{label:'Seguidores',value:m.followers_total??null},{label:'Seguidores ganados',value:m.followers_gained??m.followers_gain_reported??null}];
  const card=renderStatsExecutiveSource('SULLYGNOME · REFERENCIA HISTÓRICA',period,metrics,'Referencia externa histórica; nunca se combina con las métricas normalizadas de Twitch Helix.',sully.source_url||null);if(card)sources.push(card);
 }

 const tmProfile=helix?.login?twitchMetricsData?.channels?.[helix.login]:null,tm=tmProfile?.metrics||{};
 if(tmProfile){
  const metrics=[{label:'Seguidores',value:tm.followers??null},{label:'Horas vistas',value:tm.viewer_hours==null?null:statsNumber(tm.viewer_hours,0)+' h'},{label:'Promedio de espectadores',value:tm.average_viewers??null},{label:'Pico de espectadores',value:tm.peak_viewers??null}];
  const card=renderStatsExecutiveSource('TWITCHMETRICS · REFERENCIA HISTÓRICA',tmProfile.period_label||tmProfile.period||'Ventana consultada',metrics,'Captura externa del 04/11/2026; referencia histórica independiente del muestreo Helix, no es una lectura actual.',tmProfile.source_url||null);if(card)sources.push(card);
 }

 if(youtubeAccount){
  const definitions=[
   {key:'subscribers',label:'Suscriptores',digits:0},
   {key:'total_views',label:'Visualizaciones',digits:0},
   {key:'videos_total',label:'Videos publicados',digits:0}
  ];
  const resolved=definitions.map(definition=>({
   definition,
   metric:getNormalizedCreatorMetric(hero,definition.key,'youtube')
  }));
  const metrics=resolved.map(({definition,metric})=>({
   label:definition.label,
   value:metric&&['available','stale'].includes(metric.state)&&metric.value!==null&&metric.value!==undefined?statsNumber(metric.value,definition.digits)+(metric.state==='stale'?' · HISTÓRICO':''):null
  }));
  const historical=resolved.some(item=>item.metric?.state==='stale');
  const note='Fuente YouTube Data API v3. Los contadores son acumulados públicos; suscriptores pueden estar redondeados. '+(historical?'Los valores vencidos se conservan identificados como HISTÓRICOS; no representan el estado actual. ':'')+'Captura: '+captureLabel(resolved.map(item=>item.metric))+'.';
  const card=renderStatsExecutiveSource('YOUTUBE · CANAL VINCULADO',periodLabel(resolved.map(item=>item.metric)),metrics,note,youtubeAccount.url||hero.youtube||null);
  if(card)sources.push(card);
 }

 const platformProfile=platformStatsData?.creators?.[platformStatsKey(hero)];
 if(platformProfile?.platforms)Object.entries(platformProfile.platforms).forEach(([platform,p])=>{
  if(platform==='youtube')return;
  if(p.status!=='verified')return;
  const m=p.metrics||{},metrics=platform==='kick'?[{label:'Estado',value:m.live===true?'EN DIRECTO':m.live===false?'OFFLINE':null},{label:'Espectadores actuales',value:m.current_viewers}]:[];
  const card=renderStatsExecutiveSource(platform.toUpperCase()+' · CANAL VINCULADO',platformStatsData?.updated_at||'Captura disponible',metrics,'Datos públicos de '+platform.toUpperCase()+'.',p.url||null);if(card)sources.push(card);
 });
 const coverageKeys=twitchAccount?['average_viewers_sampled','peak_viewers_sampled','observed_live_hours','streams_observed']:youtubeAccount?['subscribers','total_views','videos_total']:[];
 const coverageMetrics=coverageKeys.map(key=>getNormalizedCreatorMetric(hero,key,twitchAccount?'twitch':'youtube'));
 const coverageAvailable=coverageMetrics.filter(metric=>metric.state==='available').length;
 const coverageNote=coverageMetrics.length
  ? '<p class="stats-metrics-coverage" data-metrics-coverage="'+coverageAvailable+'/'+coverageMetrics.length+'"><strong>COBERTURA NORMALIZADA · '+coverageAvailable+'/'+coverageMetrics.length+'</strong> métricas principales disponibles y actualizadas. '+(coverageAvailable===coverageMetrics.length?'Todas las métricas requeridas están presentes.':'Revisar: '+coverageMetrics.filter(metric=>metric.state!=='available').map(metric=>metric.key).join(', ')+'.')+'</p>'
  : '<p class="stats-metrics-coverage">No hay una plataforma con métricas normalizadas configurada para esta cuenta.</p>';
 return '<div class="stats-dashboard stats-dashboard-editorial"><header class="stats-executive-header"><div><span>RENDIMIENTO DEL CANAL</span><h4>'+safe(getHeroDisplayName(hero))+'</h4><p>Indicadores disponibles, con su fuente, período y frescura. Cada plataforma se presenta por separado.</p>'+coverageNote+'</div></header><div class="stats-executive-grid">'+(sources.length?sources.join(''):'<p class="stats-executive-empty">Todavía no hay métricas públicas verificadas para mostrar.</p>')+'</div></div>';
}
function renderAutomaticTwitchClips(hero){
 const account=(hero?.accounts||[]).find(item=>item.platform==='twitch'&&item.account_type==='creator_channel');
 if(!account)return '';
 const creatorId=hero.id||hero.slug;
 const record=twitchClipsData?.creators?.[creatorId];
 const safe=escapeStatsHtml;
 const captured=record?.captured_at?new Date(record.captured_at):null;
 const capturedLabel=captured&&!Number.isNaN(captured.getTime())?captured.toLocaleString('es-AR'):'sin captura exitosa';
 const method=safe(twitchClipsData?.selection?.methodology||'Muestra pública limitada por la API; no es una videoteca exhaustiva.');
 let out='<section class="comic-panel comic-panel-wide automatic-twitch-clips"><div class="comic-panel-heading"><span>↗</span><b>CLIPS PÚBLICOS DETECTADOS · TWITCH</b></div><p class="comic-panel-caption">Fuente: Twitch Helix Get Clips · ventana de '+safe(twitchClipsData?.window_days||30)+' días · última captura correcta: '+safe(capturedLabel)+'.</p>';
 if(twitchClipsLoadError||!twitchClipsData){
  out+='<p class="mission-empty">No se pudo leer el archivo de clips públicos en esta visita. Los clips editoriales del expediente siguen disponibles por separado.</p>';
 }else if(!record||record.status==='awaiting_collection'){
  out+='<p class="mission-empty">El registro está preparado, pero el colector todavía no completó su primera captura en el entorno principal.</p>';
 }else{
  if(record.status==='error'){
   out+='<p class="mission-empty">Aviso: la última consulta de este canal falló. Se conserva y muestra la captura correcta anterior, cuando existe.</p>';
  }
  if(!Array.isArray(record.clips)||!record.clips.length){
   out+='<p class="mission-empty">'+(record.status==='error'?'No existe una captura correcta previa para mostrar.':'La consulta no encontró clips públicos en la ventana informada. Esto no demuestra que el canal nunca haya publicado clips.')+'</p>';
  }else{
   out+='<p class="comic-panel-caption">'+safe(record.displayed_count||record.clips.length)+' clips mostrados entre hasta '+safe(record.result_count||record.clips.length)+' resultados devueltos por Twitch. Orden de selección: visualizaciones descendentes; no es ranking editorial ni listado cronológico.</p><div class="automatic-twitch-clips-grid">';
   record.clips.forEach((clip,index)=>{
    const url=String(clip.url||'');
    const validUrl=/^https:\/\/(?:www\.twitch\.tv|clips\.twitch\.tv)\//i.test(url);
    const thumbnail=String(clip.thumbnail_url||'');
    const validThumbnail=/^https:\/\//i.test(thumbnail);
    out+='<article class="automatic-twitch-clip-card"><div class="automatic-twitch-clip-thumb">'+(validThumbnail?'<img src="'+safe(thumbnail)+'" alt="" loading="lazy" decoding="async" width="320" height="180">':'<span>CLIP TWITCH</span>')+'</div><div class="automatic-twitch-clip-copy"><small>CLIP PÚBLICO · '+String(index+1).padStart(2,'0')+'</small><h4>'+safe(clip.title||'Clip sin título')+'</h4><p>'+(clip.created_at?safe(statsDate(String(clip.created_at).slice(0,10))):'Fecha no disponible')+' · '+(clip.view_count===null||clip.view_count===undefined?'Visualizaciones no informadas':safe(statsNumber(clip.view_count,0))+' visualizaciones')+'</p>'+(validUrl?'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">VER CLIP EN TWITCH ↗</a>':'<span>ENLACE NO DISPONIBLE</span>')+'</div></article>';
   });
   out+='</div>';
  }
 }
 out+='<p class="comic-panel-caption">'+method+' La selección automática no reemplaza los clips destacados elegidos por cada creador.</p></section>';
 return out;
}
function renderMissionArchive(hero){
 const record=getCreatorRecord(hero);
 const groups=[['COLABORACIONES Y ACCESOS A JUEGOS','collaborations'],['HITOS Y TRAYECTORIA','milestones'],['CLIPS DESTACADOS','highlights']];
 let out='<div class="mission-archive"><div class="mission-hero-card"><span class="eyebrow">TRAYECTORIA · MEDIA KIT</span><p>'+escapeStatsHtml(hero.log||'Trayectoria y colaboraciones del creador.')+'</p></div>';
 groups.forEach(([label,field])=>{
  const items=Array.isArray(record[field])?record[field]:[];
  if(!items.length && field!=='highlights')return;
  out+='<section class="mission-section"><h4>'+label+'</h4>';
  if(!items.length){
   out+='<p class="mission-empty">Los clips seleccionados se incorporarán aquí con sus enlaces directos.</p>';
  }else{
   out+='<div class="mission-grid">';
   items.forEach(item=>{
    out+='<article class="mission-card"><h5>'+escapeStatsHtml(item.title||'Registro')+'</h5>';
    if(item.date)out+='<p>FECHA · '+statsDate(item.date)+'</p>';
    if(item.description && !item.description.includes('Pendiente de descripción editorial'))out+='<p>'+escapeStatsHtml(item.description)+'</p>';
    if(item.platform==='twitch' && item.clip_id){
     out+='<div class="mission-clip-embed">'+renderTwitchClipPreview(item.clip_id,item.title,item.url)+'</div>';
     out+='<a href="https://clips.twitch.tv/'+encodeURIComponent(item.clip_id)+'" target="_blank" rel="noopener">ABRIR EN TWITCH ↗</a>';
    }else if(item.url)out+='<a href="'+escapeStatsHtml(item.url)+'" target="_blank" rel="noopener">VER DETALLE ↗</a>';
    out+='</article>';
   });
   out+='</div>';
  }
  out+='</section>';
 });
 out+='<p class="stats-muted">Los clips aparecen una sola vez en esta sección. Se priorizan enlaces directos a piezas concretas, no accesos generales repetidos al canal.</p></div>';
 return out;
}
let twitchMetricsData = null;
async function loadTwitchMetricsData(){
 try{
  const res=await fetch('twitchmetrics-data.json',{cache:'no-store'});
  if(!res.ok)throw new Error('No se pudo leer twitchmetrics-data.json');
  twitchMetricsData=await res.json();
 }catch(e){console.warn('TwitchMetrics data unavailable:',e);}
}
async function loadSullyGnomeData(){
 try{
  const res=await fetch('sullygnome-data.json',{cache:'no-store'});
  if(!res.ok)throw new Error('No se pudo leer sullygnome-data.json');
  sullyGnomeData=await res.json();
 }catch(e){console.warn('SullyGnome roster data unavailable:',e);}
}

let creatorRecordsData = null;
let creatorMetricsData = null;
let creatorProfileBundle = null;
let platformStatsData = null;
let twitchClipsData = null;
let twitchClipsLoadError = false;
async function loadTwitchClipsData(){
 try{
  const bundle=await window.LegionCreatorProfiles.load({files:['clips']});
  const payload=bundle.clips;
  if(payload?.schema_version!==1||!payload.creators||typeof payload.creators!=='object')throw new Error('El archivo de clips no cumple el contrato esperado.');
  twitchClipsData=payload;
  twitchClipsLoadError=false;
 }catch(error){
  twitchClipsData=null;
  twitchClipsLoadError=true;
  console.warn('Twitch public clips unavailable:',error);
 }
}
async function loadPlatformStatsData(){
 try{
  const bundle=await window.LegionCreatorProfiles.load({files:['platforms']});
  platformStatsData=bundle.platforms;
  renderStatsPlatformDirectory();
  renderRosterSelector();
  refreshRosterMetricsViews();
 }catch(e){
  console.warn('Platform statistics unavailable:',e);
  const host=document.getElementById('stats-platform-grid');
  if(host)host.innerHTML='<p class="stats-note">Las estadísticas de otras plataformas no están disponibles en esta consulta. Volvé a intentarlo más tarde.</p>';
  renderRosterSelector();
 }
}
function renderStatsPlatformDirectory(){
 const host=document.getElementById('stats-platform-grid');
 if(!host)return;
 const creators=Object.entries(platformStatsData?.creators||{});
 if(!creators.length){
  host.innerHTML='<p class="stats-note">Todavía no hay cuentas de otras plataformas registradas con datos verificables.</p>';
  return;
 }
 let out='';
 creators.forEach(([key,creator])=>{
  Object.entries(creator.platforms||{}).forEach(([platform,p])=>{
   const verified=p.status==='verified';
   const label=platform==='youtube'?'YOUTUBE':platform==='kick'?'KICK':platform.toUpperCase();
   const status=verified?'FUENTE OFICIAL':p.status==='credentials_required'?'CONFIGURACIÓN PENDIENTE':p.status==='error'?'ERROR DE CONSULTA':'REFERENCIA';
   const linkedHero=heroesData.find(hero=>hero.id===key)||null;
   const thumbnail=p.thumbnail_url||'';
   const avatar=thumbnail?'<img class="stats-platform-avatar" src="'+escapeStatsHtml(thumbnail)+'" alt="Logo de '+escapeStatsHtml(creator.display_name||key)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true">':'';
   out+='<article class="stats-platform-card"><div class="stats-platform-creator">'+avatar+'<div><h5>'+escapeStatsHtml(creator.display_name||key)+'</h5><p class="stats-platform-handle">'+escapeStatsHtml(p.handle||'Cuenta registrada')+'</p><small>'+escapeStatsHtml(linkedHero?.characterRole||linkedHero?.tagline||'Creador de contenido')+'</small></div></div><div class="stats-platform-card-top"><span>'+escapeStatsHtml(label)+'</span><span class="stats-status '+(verified?'verified':'pending')+'">'+status+'</span></div>';
   if(!verified){
    out+='<p class="stats-platform-note">'+escapeStatsHtml(p.note||'La cuenta está registrada, pero todavía no hay una lectura pública disponible.')+'</p>';
   }else if(platform==='youtube'){
    const m=p.metrics||{};
    out+='<div class="stats-platform-metrics"><div><strong>'+statsNumber(m.subscribers,0)+'</strong><span>SUSCRIPTORES</span></div><div><strong>'+statsNumber(m.total_views,0)+'</strong><span>VISUALIZACIONES</span></div><div><strong>'+statsNumber(m.videos_total,0)+'</strong><span>VIDEOS PUBLICADOS</span></div></div>';
    const videos=Array.isArray(p.recent_videos)?p.recent_videos.slice(0,3):[];
    if(videos.length){
     out+='<div class="stats-platform-recent"><b>PUBLICACIONES RECIENTES</b>';
     videos.forEach(v=>out+='<a href="'+escapeStatsHtml(v.url)+'" target="_blank" rel="noopener noreferrer"><span>'+escapeStatsHtml(v.title||'Video de YouTube')+'</span><small>'+statsNumber(v.views,0)+' vistas · '+escapeStatsHtml(v.published_at?v.published_at.slice(0,10):'fecha no disponible')+' ↗</small></a>');
     out+='</div>';
    }
    out+='<p class="stats-platform-note">Datos acumulados del canal · YouTube Data API v3 · captura '+escapeStatsHtml(platformStatsData.updated_at||'sin fecha')+'. El contador de suscriptores puede estar redondeado por YouTube.</p>';
   }else if(platform==='kick'){
    const m=p.metrics||{};
    out+='<div class="stats-platform-metrics"><div><strong>'+escapeStatsHtml(m.live?'EN DIRECTO':'OFFLINE')+'</strong><span>ESTADO</span></div><div><strong>'+statsNumber(m.current_viewers,0)+'</strong><span>ESPECTADORES ACTUALES</span></div><div><strong>'+escapeStatsHtml(m.category||'—')+'</strong><span>CATEGORÍA</span></div></div><p class="stats-platform-note">Última lectura de Kick Developer Public API · '+escapeStatsHtml(platformStatsData.updated_at||'sin fecha')+'. No representa analítica histórica.</p>';
   }else{
    out+='<p class="stats-platform-note">'+escapeStatsHtml(p.methodology||'Datos de plataforma disponibles.')+'</p>';
   }
   if(p.url)out+='<a class="stats-platform-open" href="'+escapeStatsHtml(p.url)+'" target="_blank" rel="noopener noreferrer">ABRIR CANAL ↗</a>';
   out+='</article>';
  });
 });
 host.innerHTML=out||'<p class="stats-note">No hay cuentas de otras plataformas configuradas.</p>';
}
function renderPlatformStats(hero,onlyPlatform=null){
 const key=platformStatsKey(hero);
 const profile=platformStatsData?.creators?.[key];
 if(!profile || !profile.platforms)return '';
 const captureDate=platformStatsData.updated_at?new Date(platformStatsData.updated_at):null;
 const captureAge=captureDate&&!Number.isNaN(captureDate.getTime())?(Date.now()-captureDate.getTime())/60000:Infinity;
 const sourceFresh=captureAge>=-5&&captureAge<=120;
 const captureLabel=captureDate&&!Number.isNaN(captureDate.getTime())?captureDate.toLocaleString('es-AR'):'fecha no disponible';
 let out='';
 Object.entries(profile.platforms).forEach(([platform,p])=>{
  if(onlyPlatform&&platform!==onlyPlatform)return;
  const title=platform==='youtube'?'YOUTUBE · DATOS PÚBLICOS DEL CANAL':platform==='kick'?'KICK · ACTIVIDAD DEL CANAL':platform.toUpperCase();
  const verified=p.status==='verified';
  const status=verified?(sourceFresh?'FUENTE OFICIAL':'FUENTE OFICIAL · CAPTURA DEMORADA'):p.status==='credentials_required'?'CONFIGURACIÓN PENDIENTE':p.status==='error'?'ERROR DE CONSULTA':'REFERENCIA';
  const statusClass=verified?(sourceFresh?'verified':'partial'):'pending';
  out+='<section class="stats-section"><div class="stats-source-head"><div><strong>'+title+'</strong><br><small>Cuenta vinculada: '+escapeStatsHtml(p.handle||'—')+'</small></div><span class="stats-status '+statusClass+'">'+status+'</span></div>';
  if(p.status!=='verified'){
   out+='<div class="stats-empty"><strong>Datos automáticos todavía no disponibles</strong>'+escapeStatsHtml(p.note||'La cuenta está registrada, pero falta completar su configuración.')+'</div>';
  }else if(platform==='youtube'){
   const m=p.metrics||{};
   out+='<p class="stats-section-intro">Captura: '+escapeStatsHtml(captureLabel)+' · fuente: YouTube Data API v3. '+(sourceFresh?'Lectura dentro de la ventana de actualización esperada.':'La captura tiene más de dos horas o no tiene fecha; se conserva como referencia histórica, no como estado actual.')+' No se mezcla con estadísticas de streaming.</p><div class="pilot-lifetime-grid tm-metrics-grid">';
   [['Suscriptores',m.subscribers],['Visualizaciones totales',m.total_views],['Videos publicados',m.videos_total]].forEach(v=>out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+statsNumber(v[1],0)+'</strong><small>Acumulado del canal</small></div>');
   out+='</div>';
   const videos=Array.isArray(p.recent_videos)?p.recent_videos:[];
   if(videos.length){out+='<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>Video reciente</th><th>Publicado</th><th>Vistas</th></tr></thead><tbody>';videos.forEach(v=>out+='<tr><td><a class="stats-link" href="'+escapeStatsHtml(v.url)+'" target="_blank" rel="noopener">'+escapeStatsHtml(v.title)+'</a></td><td>'+escapeStatsHtml(v.published_at?v.published_at.slice(0,10):'—')+'</td><td class="num">'+statsNumber(v.views,0)+'</td></tr>');out+='</tbody></table></div>';}
  }else if(platform==='kick'){
   const m=p.metrics||{};
   out+='<p class="stats-section-intro">Captura: '+escapeStatsHtml(captureLabel)+' · fuente: Kick Developer Public API. La API permite consultar estado y audiencia actual; no equivale a historial completo. '+(sourceFresh?'':'La lectura está demorada y no se presenta como estado actual.')+'</p><div class="pilot-lifetime-grid tm-metrics-grid">';
   [['Estado',sourceFresh?(m.live?'En directo':'Offline'):'SIN DATOS VERIFICADOS'],['Espectadores actuales',sourceFresh?m.current_viewers:null],['Categoría',m.category],['Título',m.stream_title]].forEach(v=>out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+(v[1]===null||v[1]===undefined?'SIN DATOS VERIFICADOS':escapeStatsHtml(v[1]))+'</strong><small>Última lectura</small></div>');
   out+='</div>';
  }
  if(p.url)out+='<p class="stats-note">Fuente: <a class="stats-link" href="'+escapeStatsHtml(p.url)+'" target="_blank" rel="noopener">abrir canal en '+platform.toUpperCase()+' ↗</a>. '+escapeStatsHtml(p.methodology||'Cada métrica conserva su propia metodología.')+'</p>';
  out+='</section>';
 });
 return out;
}
function creatorRecordKey(hero){
 return hero?.id || hero?.slug || '';
}
function getCreatorRecord(hero){
 const key=creatorRecordKey(hero);
 return creatorRecordsData?.channels?.[key] || {};
}
function platformStatsKey(hero) {
 return hero?.id || hero?.slug || creatorRecordKey(hero);
}
function renderCreatorRecords(hero){
 const record=getCreatorRecord(hero);
 const lines=['TRAYECTORIA REAL DEL CREADOR · REGISTROS VERIFICADOS'];
 const groups=[
  ['HITOS','milestones'],
  ['COLABORACIONES','collaborations'],
  ['DIRECTOS / CLIPS DESTACADOS','highlights']
 ];
 groups.forEach(([label,field])=>{
  lines.push(label+':');
  const items=Array.isArray(record?.[field])?record[field]:[];
  if(!items.length){lines.push('Sin registros verificados cargados todavía.');return;}
  items.forEach((item,i)=>{
   const date=item.date?(' · '+item.date):'';
   lines.push((i+1)+'. '+(item.title||'Registro sin título')+date);
   if(item.description)lines.push('   '+item.description);
   if(item.url)lines.push('   Enlace: '+item.url);
   if(item.source)lines.push('   Fuente: '+item.source);
  });
 });
 lines.push('Los registros se incorporan con fecha y enlace/fuente comprobable; el lore del personaje se conserva separado de la trayectoria real.');
 return lines.join('\\n');
}
async function loadCreatorRecords(){
 try{
  const bundle=await window.LegionCreatorProfiles.load({files:['records','metrics']});
  if(!bundle.metrics||bundle.metrics.schema_version!==2||!bundle.metrics.creators||typeof bundle.metrics.creators!=='object'){
   throw new Error('creator-metrics.json no cumple el contrato schema_version=2.');
  }
  if(!bundle.metrics.generated_at||!Number.isFinite(Date.parse(bundle.metrics.generated_at))){
   throw new Error('creator-metrics.json no informa una fecha generated_at válida.');
  }
  creatorProfileBundle=bundle;
  creatorRecordsData=bundle.records;
  creatorMetricsData=bundle.metrics;
  const expectedIds=(heroesData||[]).map(hero=>hero.id||hero.slug).filter(Boolean);
  const actualIds=Object.keys(bundle.metrics.creators);
  const missingIds=expectedIds.filter(id=>!Object.prototype.hasOwnProperty.call(bundle.metrics.creators,id));
  const unexpectedIds=actualIds.filter(id=>!expectedIds.includes(id));
  if(expectedIds.length&&(missingIds.length||unexpectedIds.length)){
   console.error('Cobertura de creator-metrics.json distinta del Roster:',{missingIds,unexpectedIds});
  }
  return bundle;
 }catch(e){
  creatorProfileBundle=null;
  creatorRecordsData=null;
  creatorMetricsData=null;
  console.warn('Creator records and normalized metrics unavailable:',e);
  return null;
 }
}

// El workflow de métricas corre cada 15 minutos (cron 7,22,37,52).
// Twitch actualiza el estado Helix en cada ejecución; el muestreo histórico agrega
// una nueva observación aproximadamente cada 45–55 minutos. Dos horas toleran
// ocho ciclos programados y demoras moderadas de cola sin presentar datos viejos como actuales.
const NORMALIZED_METRIC_FRESHNESS_MINUTES = Object.freeze({
 twitch: 120,
 youtube: 120,
 kick: 120
});
const NORMALIZED_METRIC_CLOCK_SKEW_MINUTES = 5;

function normalizedMetricMissing(hero, metricKey, platform, reason){
 return Object.freeze({
  creatorId:hero?.id||hero?.slug||null,
  platform:platform||null,
  key:metricKey,
  value:null,
  unit:null,
  accountHandle:null,
  capturedAt:null,
  fresh:false,
  state:'missing',
  reason
 });
}

function normalizeMetricAccountHandle(value){
 return String(value||'').trim().replace(/^@/,'').toLowerCase();
}

function getNormalizedCreatorMetric(hero, metricKey, platform, now=Date.now()){
 const creatorId=hero?.id||hero?.slug||'';
 if(!hero||!creatorId||!creatorMetricsData||!creatorProfileBundle?.getCreator){
  return normalizedMetricMissing(hero,metricKey,platform,'bundle_unavailable');
 }
 const profile=creatorProfileBundle.getCreator(hero);
 if(!profile)return normalizedMetricMissing(hero,metricKey,platform,'creator_unresolved');
 const selectedPlatform=platform||profile.accounts?.find(account=>account?.account_type==='creator_channel')?.platform||null;
 if(!selectedPlatform)return normalizedMetricMissing(hero,metricKey,platform,'platform_unavailable');
 const metric=window.LegionCreatorProfiles?.findMetric(profile,metricKey,selectedPlatform)||null;
 if(!metric)return normalizedMetricMissing(hero,metricKey,selectedPlatform,'metric_missing');

 const account=(profile.accounts||[]).find(item=>item?.platform===selectedPlatform&&item.account_type==='creator_channel')||
  (profile.accounts||[]).find(item=>item?.platform===selectedPlatform)||null;
 const expectedHandles=[account?.handle,account?.login].map(normalizeMetricAccountHandle).filter(Boolean);
 const actualHandle=normalizeMetricAccountHandle(metric.account_handle);
 if(!account||!actualHandle||!expectedHandles.includes(actualHandle)){
  return normalizedMetricMissing(hero,metricKey,selectedPlatform,'account_mismatch');
 }

 const capturedAt=metric.captured_at||null;
 const capturedMs=capturedAt?Date.parse(capturedAt):NaN;
 if(!Number.isFinite(capturedMs))return normalizedMetricMissing(hero,metricKey,selectedPlatform,'capture_timestamp_missing');
 const ageMinutes=(Number(now)-capturedMs)/60000;
 const freshnessLimit=NORMALIZED_METRIC_FRESHNESS_MINUTES[selectedPlatform]||120;
 if(!Number.isFinite(ageMinutes)||ageMinutes < -NORMALIZED_METRIC_CLOCK_SKEW_MINUTES){
  return normalizedMetricMissing(hero,metricKey,selectedPlatform,'capture_timestamp_in_future');
 }
 if(ageMinutes>freshnessLimit){
  return Object.freeze({
   creatorId:profile.key,platform:selectedPlatform,key:metric.key,value:metric.value,
   unit:metric.unit||null,accountHandle:metric.account_handle,capturedAt,ageMinutes,
   fresh:false,state:'stale',sourceStatus:metric.status||null,source:metric.source||null,
   visibility:metric.visibility||null,period:metric.period||null,reason:'capture_expired'
  });
 }
 const valuePresent=metricKey==='live_status'
  ? ['live','offline'].includes(metric.value)
  : typeof metric.value==='number'&&Number.isFinite(metric.value);
 if(!valuePresent)return normalizedMetricMissing(hero,metricKey,selectedPlatform,'value_missing');
 const acceptedStatuses=metricKey==='live_status'?['fresh']:['sampled','estimated','verified_public','fresh','live','offline'];
 if(metric.visibility!=='public'||!acceptedStatuses.includes(metric.status)){
  return normalizedMetricMissing(hero,metricKey,selectedPlatform,'source_not_public_or_unavailable');
 }
 return Object.freeze({
  creatorId:profile.key,
  platform:selectedPlatform,
  key:metric.key,
  value:metric.value,
  unit:metric.unit||null,
  accountHandle:metric.account_handle,
  capturedAt,
  ageMinutes,
  fresh:true,
  state:'available',
  sourceStatus:metric.status||null,
  source:metric.source||null,
  visibility:metric.visibility||null,
  period:metric.period||null,
  reason:null
 });
}

function getNormalizedLiveStatus(hero,now=Date.now()){
 const twitchAccount=(hero?.accounts||[]).find(item=>item?.platform==='twitch'&&item.account_type==='creator_channel');
 if(!twitchAccount&&!hero?.twitch){
  const youtubeAccount=(hero?.accounts||[]).some(item=>item?.platform==='youtube'&&item.account_type==='creator_channel')||Boolean(hero?.youtube);
  return {state:'not_applicable',label:youtubeAccount?'YOUTUBE · ESTADO NO APLICA':'SIN DATOS',metric:null};
 }
 const metric=getNormalizedCreatorMetric(hero,'live_status','twitch',now);
 if(metric.state==='stale')return {state:'stale',label:'ESTADO SIN ACTUALIZAR',metric};
 if(metric.state==='missing')return {state:'missing',label:'SIN DATOS',metric};
 if(metric.value==='live')return {state:'live',label:'EN DIRECTO',metric};
 if(metric.value==='offline')return {state:'offline',label:'OFFLINE',metric};
 return {state:'missing',label:'SIN DATOS',metric};
}

function normalizedMetricValue(metric,digits=1,suffix=''){
 if(!metric||metric.state==='missing')return 'SIN DATOS';
 const valuePresent=metric.value!==null&&metric.value!==undefined&&Number.isFinite(Number(metric.value));
 if(!valuePresent)return metric.state==='stale'?'DATO HISTÓRICO NO DISPONIBLE':'SIN DATOS';
 const formatted=statsNumber(metric.value,digits)+(suffix||'');
 return metric.state==='stale'?formatted+' · HISTÓRICO':formatted;
}

function normalizedMetricCaptureLabel(metric){
 if(!metric?.capturedAt)return 'sin captura';
 const date=new Date(metric.capturedAt);
 return Number.isNaN(date.getTime())?'fecha no disponible':date.toLocaleString('es-AR');
}

function renderNormalizedMetricSummary(hero){
 const account=(hero?.accounts||[]).find(item=>item.account_type==='creator_channel')||(hero?.accounts||[])[0]||null;
 if(!account)return '<div class="hero-profile-metric-grid hero-profile-normalized-summary"><article class="hero-profile-metric"><small>FUENTE</small><strong>SIN DATOS</strong><span>Cuenta no vinculada</span></article></div>';
 if(account.platform==='twitch'){
  const live=getNormalizedLiveStatus(hero);
  const average=getNormalizedCreatorMetric(hero,'average_viewers_sampled','twitch');
  const peak=getNormalizedCreatorMetric(hero,'peak_viewers_sampled','twitch');
  const hours=getNormalizedCreatorMetric(hero,'observed_live_hours','twitch');
  const streams=getNormalizedCreatorMetric(hero,'streams_observed','twitch');
  const capture=normalizedMetricCaptureLabel(average);
  const cards=[
   '<article class="hero-profile-metric"><small>ESTADO DEL CANAL</small><strong>'+escapeStatsHtml(live.label)+'</strong><span>Twitch Helix · '+escapeStatsHtml(normalizedMetricCaptureLabel(live.metric))+'</span></article>',
   '<article class="hero-profile-metric"><small>PROMEDIO DE ESPECTADORES</small><strong>'+escapeStatsHtml(normalizedMetricValue(average,1))+'</strong><span>Promedio muestreado · '+escapeStatsHtml(capture)+'</span></article>',
   '<article class="hero-profile-metric"><small>PICO OBSERVADO</small><strong>'+escapeStatsHtml(normalizedMetricValue(peak,0))+'</strong><span>Máximo entre muestras · no oficial</span></article>',
   '<article class="hero-profile-metric"><small>HORAS EN DIRECTO</small><strong>'+escapeStatsHtml(normalizedMetricValue(hours,2,' h'))+'</strong><span>Horas observadas por muestreo</span></article>',
   '<article class="hero-profile-metric"><small>DIRECTOS DETECTADOS</small><strong>'+escapeStatsHtml(normalizedMetricValue(streams,0))+'</strong><span>Sesiones identificadas en la ventana observada</span></article>'
  ];
  return '<div class="hero-profile-metric-grid hero-profile-normalized-summary" aria-label="Resumen normalizado de Twitch">'+cards.join('')+'</div>';
 }
 if(account.platform==='youtube'){
  const subscribers=getNormalizedCreatorMetric(hero,'subscribers','youtube');
  const views=getNormalizedCreatorMetric(hero,'total_views','youtube');
  const videos=getNormalizedCreatorMetric(hero,'videos_total','youtube');
  const cards=[
   '<article class="hero-profile-metric"><small>SUSCRIPTORES</small><strong>'+escapeStatsHtml(normalizedMetricValue(subscribers,0))+'</strong><span>YouTube Data API v3 · acumulado público</span></article>',
   '<article class="hero-profile-metric"><small>VISUALIZACIONES</small><strong>'+escapeStatsHtml(normalizedMetricValue(views,0))+'</strong><span>Vistas acumuladas · YouTube</span></article>',
   '<article class="hero-profile-metric"><small>VIDEOS PUBLICADOS</small><strong>'+escapeStatsHtml(normalizedMetricValue(videos,0))+'</strong><span>Publicaciones del canal</span></article>'
  ];
  return '<div class="hero-profile-metric-grid hero-profile-normalized-summary" aria-label="Resumen normalizado de YouTube">'+cards.join('')+'</div>';
 }
 return '<div class="hero-profile-metric-grid hero-profile-normalized-summary"><article class="hero-profile-metric"><small>'+escapeStatsHtml(String(account.platform).toUpperCase())+'</small><strong>SIN DATOS</strong><span>Fuente registrada sin métricas normalizadas disponibles</span></article></div>';
}
let instituteStatsData = null;
function findChannelStats(hero){
 if(!instituteStatsData || !hero || !hero.twitch)return null;
 const login=hero.twitch.split('/').filter(Boolean).pop().toLowerCase();
 return Object.values(instituteStatsData.channels||{}).find(c=>(c.login||'').toLowerCase()===login) || null;
}
function renderObservedStreams(channel){
 if(!channel)return '';
 const snapshots=Array.isArray(channel.snapshots)?channel.snapshots:[];
 const sessions=new Map();
 snapshots.filter(s=>s && s.is_live && s.stream_id).forEach(s=>{
  const id=String(s.stream_id);
  if(!sessions.has(id))sessions.set(id,{id,started_at:s.started_at||null,first:s.sampled_at||null,last:s.sampled_at||null,samples:0,peak:null,games:new Set()});
  const session=sessions.get(id);
  session.samples++;
  if(s.sampled_at)session.last=s.sampled_at;
  if(s.started_at&&!session.started_at)session.started_at=s.started_at;
  if(typeof s.viewer_count==='number')session.peak=session.peak===null?s.viewer_count:Math.max(session.peak,s.viewer_count);
  if(s.game_name)session.games.add(s.game_name);
 });
 const rows=Array.from(sessions.values()).sort((a,b)=>String(b.started_at||b.first).localeCompare(String(a.started_at||a.first)));
 const lines=['REGISTRO DE DIRECTOS DETECTADOS','Fuente: muestreo propio de Twitch Helix · ventana de '+(instituteStatsData?.window_days||10)+' días','Sesiones detectadas: '+rows.length];
 if(!rows.length)lines.push('Todavía no se detectaron sesiones en la ventana disponible.');
 rows.slice(0,6).forEach((v,i)=>{
  const date=v.started_at||v.first;
  const when=date?new Date(date).toLocaleString('es-AR'):'Fecha no disponible';
  lines.push((i+1)+'. '+when+' · '+(v.games.size?Array.from(v.games).join(' / '):'Categoría no disponible')+' · pico entre muestras: '+(v.peak===null?'—':v.peak)+' · muestras en directo: '+v.samples);
 });
 lines.push('Importante: son sesiones captadas por el muestreo; no representan necesariamente todos los directos ni sustituyen el historial/VOD de Twitch.');
 return lines.join('\\n');
}
function renderCreatorEvolution(channel){
 if(!channel || !channel.window)return '';
 const w=channel.window;
 const lines=['EVOLUCIÓN DEL CANAL · VENTANA MÓVIL DE '+(instituteStatsData?.window_days||30)+' DÍAS'];
 const games=Array.isArray(w.game_breakdown)?w.game_breakdown:[];
 lines.push('JUEGOS / CATEGORÍAS MÁS OBSERVADOS (por muestras en directo):');
 if(games.length){
  games.slice(0,5).forEach((g,i)=>lines.push((i+1)+'. '+g.name+' · '+g.live_samples+' muestras · '+g.streams_observed+' directos detectados · promedio '+formatMetric(g.average_viewers_sampled)+' · pico '+formatMetric(g.peak_viewers_sampled,0)));
 }else lines.push('Sin muestras en directo suficientes para elaborar el ranking.');
 const days=Array.isArray(w.daily_activity)?w.daily_activity:[];
 lines.push('ACTIVIDAD POR DÍA (UTC):');
 if(days.length){
  days.slice(-7).forEach(d=>lines.push(d.date+' · '+d.streams_observed+' directos detectados · '+d.live_samples+' muestras · pico '+formatMetric(d.peak_viewers_sampled,0)));
 }else lines.push('Todavía no hay días con directos observados.');
 lines.push('Lectura correcta: ranking por cantidad de muestras, no por horas jugadas. La ventana de 30 días comienza a acumularse desde que se amplió el colector; no reconstruye el período anterior.');
 return lines.join('\\n');
}
function formatMetric(value,digits=2){
 if(value===null||value===undefined)return 'Pendiente de verificación';
 return typeof value==='number'?value.toLocaleString('es-AR',{maximumFractionDigits:digits}):value;
}
function renderLiveProgram(){
 const host=document.getElementById('live-directory');
 if(!host||!window.LMLiveProgram)return false;
 window.LMLiveProgram.render(host,{heroes:Array.isArray(heroesData)?heroesData:[],activity:instituteStatsData,clips:twitchClipsData,platform:platformStatsData,nameOf:getHeroDisplayName,liveStateOf:getRosterLiveState,goChapter:n=>switchChapter(n)});
 return true;
}
function renderLiveDirectory(channels){
 const host=document.getElementById('live-directory');if(!host)return;
 if(host.classList.contains('live-program')&&renderLiveProgram())return;
 const detectedLive=(channels||[]).filter(c=>c.live);
 const offline=(channels||[]).filter(c=>!c.live);
 const updated=instituteStatsData?.updated_at?new Date(instituteStatsData.updated_at):null;
 const updatedLabel=updated&&!Number.isNaN(updated.getTime())?updated.toLocaleString('es-AR'):'fecha no disponible';
 const interval=Number(instituteStatsData?.sampling_interval_minutes)||55;
 const ageMinutes=updated?(Date.now()-updated.getTime())/60000:Infinity;
 const fresh=Boolean(updated&&!Number.isNaN(updated.getTime())&&ageMinutes>=-5&&ageMinutes<=Math.max(interval*2.5,120));
 const live=fresh?detectedLive:[];
 const staleLive=(channels||[]).filter(c=>c.live&&!fresh);
  const refreshNote='<p class="stats-note live-refresh-note">Última captura: '+escapeStatsHtml(updatedLabel)+' · el colector consulta Twitch con una cadencia objetivo de '+interval+' minutos; la página vuelve a leer el archivo cada 60 segundos. No es una conexión en tiempo real.</p>';
 if(!live.length){
  host.innerHTML=refreshNote+'<div class="premium-panel"><div class="premium-kicker">ESTADO DE TRANSMISIONES</div><h3>'+(staleLive.length?'La última captura registró '+staleLive.length+' canal(es) en directo, pero los datos están demorados':'En la última captura no había integrantes detectados en directo')+'</h3><p>Los canales permanecen en seguimiento aunque estén offline. Consultá cada perfil para comprobar si inició una transmisión más reciente.</p></div>'+(channels||[]).map(c=>'<article class="live-channel-card offline"><strong>'+escapeStatsHtml(c.display_name)+'</strong><small>'+(staleLive.includes(c)?'Último estado registrado: EN DIRECTO · captura demorada':'OFFLINE · continúa en seguimiento')+'</small><a href="https://twitch.tv/'+encodeURIComponent(c.login)+'" target="_blank" rel="noopener noreferrer">Visitar canal ↗</a></article>').join('');
  return;
 }
 host.innerHTML=refreshNote+live.map(c=>'<article class="live-channel-card"><span class="stats-status partial">● EN DIRECTO</span><strong>'+escapeStatsHtml(c.display_name)+'</strong><small>'+escapeStatsHtml(c.current_game||'Categoría no informada')+' · '+(c.current_viewers===null?'Espectadores no disponibles':statsNumber(c.current_viewers,0)+' espectadores')+'</small><button type="button" onclick="selectLiveChannel(\''+escapeStatsHtml(c.login)+'\',\''+escapeStatsHtml(c.display_name)+'\')">VER TRANSMISIÓN</button></article>').join('');
}

function closeLiveDrawer(){
 const wrap=document.getElementById('live-player-wrap'),player=document.getElementById('live-player');
 if(player)player.innerHTML='';
 if(wrap){wrap.hidden=true;wrap.classList.remove('is-open');}
 document.body.classList.remove('live-drawer-open');
}
async function openLiveDrawer(){
 const wrap=document.getElementById('live-player-wrap'),player=document.getElementById('live-player'),message=document.getElementById('live-player-message');
 if(!wrap)return;
 wrap.hidden=false;wrap.classList.add('is-open');document.body.classList.add('live-drawer-open');
 if(message)message.textContent='Consultando el último estado público de los canales…';
 if(player)player.innerHTML='';
 await loadInstituteStats();
 const data=instituteStatsData||{};
 const channels=(data.active_channels||Object.keys(data.channels||{})).map(login=>data.channels?.[login]).filter(Boolean);
 const updated=data.updated_at?new Date(data.updated_at):null,interval=Number(data.sampling_interval_minutes)||55;
 const age=updated?(Date.now()-updated.getTime())/60000:Infinity;
 const fresh=Boolean(updated&&!Number.isNaN(updated.getTime())&&age>=-5&&age<=Math.max(interval*2.5,120));
 const live=channels.find(channel=>channel.live);
 if(fresh&&live){selectLiveChannel(live.login,live.display_name||live.login);return;}
 const title=document.getElementById('live-player-title');
 if(title)title.textContent='CENTRAL EN VIVO';
 if(message)message.textContent=!fresh?'La última captura está demorada. No podemos confirmar qué canal transmite ahora.':'No se detectan canales en directo en la última captura. Consultá el directorio completo.';
 const link=document.getElementById('live-open-channel');
 if(link){link.href='#en-vivo';link.textContent='ABRIR DIRECTORIO DE CANALES ↗';link.onclick=()=>{closeLiveDrawer();switchChapter(10);};}
}
function openMultiverseMap(){switchChapter(13);}
function updateMissionHeader(){
 const count=document.getElementById('mission-progress-count'),trigger=document.getElementById('mission-progress-trigger');
 if(!count||!communityPlaybook)return;
 const missions=communityPlaybook.missions||[],state=readLegionProgress();
 const progressFor=key=>key==='profiles'?state.profiles.length:key==='chapters'?state.chapters.length:key==='bitacora'?Number(state.bitacora):key==='live'?Number(state.live):0;
 const complete=missions.filter(m=>{const target=m.target==='roster_total'?Math.max(1,heroesData.length):Math.max(1,Number(m.target)||1);return progressFor(m.progress_key)>=target;}).length;
 count.textContent=complete+'/'+missions.length;
 if(trigger){trigger.setAttribute('aria-label','Abrir Mapa Multiversal: '+complete+' de '+missions.length+' misiones completadas');trigger.hidden=missions.length===0;}
}
function selectAllianceModelTab(key){
 ['individual','multichannel','platform'].forEach(id=>{
  const panel=document.getElementById('alliance-model-'+id),tab=document.getElementById('alliance-tab-'+id),active=id===key;
  if(panel)panel.hidden=!active;
  if(tab){tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
 });
}
function setRecruitmentMode(mode){
 const creator=document.getElementById('creator-application'),brand=document.getElementById('brand-proposal');
 const creatorTab=document.getElementById('recruitment-tab-creator'),brandTab=document.getElementById('recruitment-tab-brand');
 const showCreator=mode==='creator';
 if(creator)creator.hidden=!showCreator;
 if(brand)brand.hidden=showCreator;
 if(creatorTab)creatorTab.setAttribute('aria-selected',String(showCreator));
 if(brandTab)brandTab.setAttribute('aria-selected',String(!showCreator));
}
function filterArsenal(filter){
 document.querySelectorAll('.arsenal-card[data-genre]').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.genre!==filter;});
 document.querySelectorAll('[data-arsenal-filter]').forEach(button=>{const active=button.dataset.arsenalFilter===filter;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
}

function selectLiveChannel(login,displayName){
 const wrap=document.getElementById('live-player-wrap'),player=document.getElementById('live-player'),title=document.getElementById('live-player-title'),link=document.getElementById('live-open-channel');
 if(!wrap||!player)return;
 const parent=window.location.hostname;
 const safeLogin=String(login||'').toLowerCase().replace(/[^a-z0-9_]/g,'');
 if(!safeLogin||!parent)return;
 title.textContent='EN VIVO · '+displayName;
 link.href='https://twitch.tv/'+safeLogin;
 player.innerHTML='<iframe src="https://player.twitch.tv/?channel='+encodeURIComponent(safeLogin)+'&parent='+encodeURIComponent(parent)+'&autoplay=false&muted=true" allowfullscreen="true" scrolling="no" title="Transmisión de '+escapeStatsHtml(displayName)+' en Twitch"></iframe>';
 wrap.hidden=false;wrap.classList.add('is-open');const message=document.getElementById('live-player-message');if(message)message.textContent='Transmisión seleccionada · '+displayName;document.body.classList.add('live-drawer-open');link.onclick=null;
}
let legionNewsData = null;
async function loadLegionNews() {
    const host = document.getElementById('legion-news-feed');
    if (!host) return;
    try {
        const response = await fetch('news-data.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo leer news-data.json');
        legionNewsData = await response.json();
        renderLegionNews();
    } catch (error) {
        host.innerHTML = '<p class="stats-note">Las novedades no están disponibles temporalmente.</p>';
        console.warn('Legion news unavailable:', error);
    }
}
function renderLegionNews() {
    const host = document.getElementById('legion-news-feed');
    if (!host) return;
    const items = Array.isArray(legionNewsData?.items) ? legionNewsData.items.slice() : [];
    items.sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    if (!items.length) {
        host.innerHTML = '<p class="stats-note">Todavía no hay novedades publicadas. Las entradas aparecerán cuando exista una actualización confirmada.</p>';
        return;
    }
    host.innerHTML = items.map(item => {
        const date = String(item.date || '');
        const validDate = date.length === 10 && date[4] === '-' && date[7] === '-' && !Number.isNaN(Date.parse(date));
        const source = String(item.source_url || '');
        const safeSource = source.startsWith('https://') || source.startsWith('./') || source.startsWith('../') || source.startsWith('/') ? source : '';
        const sourceLink = safeSource ? '<a href="' + escapeStatsHtml(safeSource) + '" target="' + (safeSource.startsWith('http') ? '_blank' : '_self') + '" rel="noopener noreferrer">' + escapeStatsHtml(item.source_label || 'Consultar fuente') + ' ↗</a>' : '';
        return '<article class="legion-news-card"><div class="legion-news-meta"><span>' + escapeStatsHtml(item.category || 'ACTUALIZACIÓN') + '</span>' + (validDate ? '<time datetime="' + date + '">' + statsDate(date) + '</time>' : '<span>FECHA NO INFORMADA</span>') + '</div><h4>' + escapeStatsHtml(item.title || 'Actualización') + '</h4><p>' + escapeStatsHtml(item.summary || '') + '</p>' + sourceLink + '</article>';
    }).join('');
}
let instituteStatsLoading = false;
let instituteStatsRefreshQueued = false;
let instituteStatsSnapshot = null;
let statsDirectoryFilter = 'all';
let statsDirectorySort = 'live';

function statsCreatorForLogin(login){
 const normalized=String(login||'').toLowerCase();
 return heroesData.find(hero=>(hero.accounts||[]).some(account=>account.platform==='twitch'&&String(account.login||'').toLowerCase()===normalized))||null;
}
function statsCreatorSchedule(hero){
 return String(hero?.schedule||'Sin horario declarado');
}
function statsRenderChannelDirectory(channels,isFresh){
 const host=document.getElementById('stats-channel-grid');
 if(!host)return;
 let rows=channels.slice();
 if(statsDirectoryFilter==='live')rows=rows.filter(channel=>channel.live&&isFresh);
 if(statsDirectoryFilter==='offline')rows=rows.filter(channel=>!channel.live||!isFresh);
 const metric=channel=>channel.window||{};
 rows.sort((a,b)=>{
  if(statsDirectorySort==='name')return String(a.display_name||a.login).localeCompare(String(b.display_name||b.login),'es');
  if(statsDirectorySort==='average')return (metric(b).average_viewers_sampled??-1)-(metric(a).average_viewers_sampled??-1);
  if(statsDirectorySort==='peak')return (metric(b).peak_viewers_sampled??-1)-(metric(a).peak_viewers_sampled??-1);
  if(statsDirectorySort==='hours')return (metric(b).observed_live_hours??-1)-(metric(a).observed_live_hours??-1);
  return Number(Boolean(b.live&&isFresh))-Number(Boolean(a.live&&isFresh))||String(a.display_name||a.login).localeCompare(String(b.display_name||b.login),'es');
 });
 host.innerHTML=rows.map(channel=>{
  const w=metric(channel),hero=statsCreatorForLogin(channel.login),image=channel.profile_image_url||'',name=channel.display_name||channel.login;
  const live=Boolean(channel.live&&isFresh),avg=w.average_viewers_sampled,peak=w.peak_viewers_sampled;
  const ratio=typeof avg==='number'&&typeof peak==='number'&&peak>0?Math.max(0,Math.min(100,avg/peak*100)):null;
  const games=Array.isArray(w.game_breakdown)?w.game_breakdown.slice().sort((a,b)=>(b.live_samples||0)-(a.live_samples||0)).slice(0,3):[];
  const schedule=statsCreatorSchedule(hero);
  const avatar=image?'<img src="'+escapeStatsHtml(image)+'" alt="Logo de '+escapeStatsHtml(name)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="stats-avatar-fallback" hidden>'+escapeStatsHtml(String(name).slice(0,2).toUpperCase())+'</span>':'<span class="stats-avatar-fallback">'+escapeStatsHtml(String(name).slice(0,2).toUpperCase())+'</span>';
  const status=live?'<span class="stats-status verified">● EN VIVO</span>':channel.live?'<span class="stats-status partial">ÚLTIMA CAPTURA DEMORADA</span>':'<span class="stats-status pending">OFFLINE · EN SEGUIMIENTO</span>';
  const capturedAt=channel.updated_at||channel.last_status_at||channel.last_snapshot_at;
  const capturedDate=capturedAt?new Date(capturedAt):null;
  const capturedLabel=capturedDate&&!Number.isNaN(capturedDate.getTime())?capturedDate.toLocaleString('es-AR'):'fecha no disponible';
  const captureStatus=isFresh?'CAPTURA RECIENTE':'DATOS CON DEMORA';
  const followersTotal=channel.followers_total===null||channel.followers_total===undefined?'NO DISPONIBLE':statsNumber(channel.followers_total,0);
  const followersCapturedAt=channel.followers_captured_at?new Date(channel.followers_captured_at):null;
  const followersCapturedLabel=followersCapturedAt&&!Number.isNaN(followersCapturedAt.getTime())?followersCapturedAt.toLocaleString('es-AR'):'captura no disponible';
  const followersStatus=channel.followers_status==='fresh'?'CAPTURA RECIENTE':channel.followers_status==='stale'?'DATOS CON DEMORA':channel.followers_status==='unavailable'?'SIN DATOS':'ESTADO NO VERIFICADO';
  const followersSource=escapeStatsHtml(channel.followers_source||'Fuente no registrada');
  const followersHtml='<div class="stats-channel-capture"><strong>SEGUIDORES · '+escapeStatsHtml(followersTotal)+'</strong><span>'+followersSource+' · '+escapeStatsHtml(followersStatus)+' · '+escapeStatsHtml(followersCapturedLabel)+'</span><small>ACTIVIDAD DEL CANAL · '+escapeStatsHtml(captureStatus)+' · '+escapeStatsHtml(capturedLabel)+'</small></div>';
  const gamesHtml=games.length?games.map(game=>'<span class="stats-game-tag">'+escapeStatsHtml(game.name)+' <small>'+Number(game.live_samples||0)+' muestras</small></span>').join(''):'<span class="stats-game-tag is-declared">Sin categorías observadas en la ventana</span>';
  const fmtMetric=(v,d=1)=>v===null||v===undefined?'—':statsNumber(v,d);
  return '<article class="stats-channel-card stats-dossier-card '+(live?'is-live':'is-offline')+'" data-login="'+escapeStatsHtml(channel.login)+'"'+(hero&&/^#[0-9a-fA-F]{6}$/.test(hero.accent_color||'')?' style="--creator-color:'+hero.accent_color+'"':'')+'><div class="stats-dossier-head"><div class="stats-dossier-avatar">'+avatar+'</div><div class="stats-dossier-identity"><h5>'+escapeStatsHtml(name)+'</h5><a href="https://twitch.tv/'+encodeURIComponent(channel.login)+'" target="_blank" rel="noopener noreferrer">@'+escapeStatsHtml(channel.login)+' ↗</a><small>'+escapeStatsHtml(hero?.characterRole||hero?.tagline||'Canal Twitch del roster')+'</small></div><span class="stats-channel-platform">TWITCH</span></div><div class="stats-dossier-status">'+status+'<span>'+fmtMetric(channel.current_viewers,0)+' espectadores actuales</span></div>'+followersHtml+'<dl><div><dt>Promedio observado</dt><dd>'+fmtMetric(avg)+'</dd></div><div><dt>Pico observado</dt><dd>'+fmtMetric(peak,0)+'</dd></div><div><dt>Horas observadas</dt><dd>'+fmtMetric(w.observed_live_hours)+' h</dd></div><div><dt>Muestras</dt><dd>'+fmtMetric(w.samples_total,0)+'</dd></div></dl><div class="stats-average-peak"><span>PROMEDIO / PICO</span><b>'+(ratio===null?'s/d':Math.round(ratio)+'%')+'</b><div class="stats-average-track"><i data-stats-fill="'+(ratio===null?0:ratio)+'" style="width:0%"></i></div></div><div class="stats-dossier-games"><b>JUEGOS · OBSERVADOS</b><div>'+gamesHtml+'</div></div><p class="stats-dossier-schedule">HORARIO DECLARADO · '+escapeStatsHtml(schedule)+'</p></article>';
 }).join('')||'<p class="stats-note">No hay canales que coincidan con este filtro.</p>';
 statsRevealDossierCards(host);
}
function statsRevealDossierCards(host){
 const cards=[...host.querySelectorAll('.stats-dossier-card')];
 const reveal=card=>{
  card.classList.add('is-revealed');
  card.querySelectorAll('[data-stats-fill]').forEach(fill=>{fill.style.width=fill.dataset.statsFill+'%';});
 };
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window)){
  cards.forEach(reveal);return;
 }
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  reveal(entry.target);observer.unobserve(entry.target);
 }),{threshold:.12});
 cards.forEach(card=>observer.observe(card));
}
function statsRenderComparison(channels){
 const host=document.getElementById('stats-twitch-comparison');if(!host)return;
 const rows=channels.map(channel=>({channel,avg:channel.window?.average_viewers_sampled,peak:channel.window?.peak_viewers_sampled}))
  .filter(row=>typeof row.avg==='number'&&Number.isFinite(row.avg)&&typeof row.peak==='number'&&Number.isFinite(row.peak)&&row.peak>0);
 if(!rows.length){host.innerHTML='<p class="stats-note">Todavía no hay promedios y picos comparables para mostrar.</p>';return;}
 const max=Math.max(1,...rows.map(row=>row.peak));
 host.innerHTML='<div class="stats-comparison-legend"><span><i class="is-average"></i> Promedio observado</span><span><i class="is-peak"></i> Pico observado</span></div>'+rows.sort((a,b)=>b.peak-a.peak).map(row=>{
  const name=escapeStatsHtml(row.channel.display_name||row.channel.login),avgWidth=Math.max(0,Math.min(100,row.avg/max*100)),peakWidth=Math.max(0,Math.min(100,row.peak/max*100));
  return '<div class="stats-comparison-row"><strong>'+name+'</strong><div class="stats-comparison-bars"><div class="stats-comparison-track"><i class="is-average" style="width:'+avgWidth+'%"></i></div><div class="stats-comparison-track"><i class="is-peak" style="width:'+peakWidth+'%"></i></div></div><span>'+statsNumber(row.avg,1)+' / '+statsNumber(row.peak,0)+'</span></div>';
 }).join('')+'<p class="stats-evolution-note">Valores del muestreo propio en la ventana disponible. No son promedios oficiales de Twitch ni métricas de toda la vida del canal.</p>';
}
function statsRenderGamePerformance(channels){
 const host=document.getElementById('stats-game-performance');if(!host)return;
 const api=window.LegionStatsGames;
 if(!api){host.innerHTML='<p class="stats-note">El rendimiento por juego no está disponible en este momento.</p>';return;}
 const rows=api.aggregate(channels,login=>{const hero=statsCreatorForLogin(login);return hero&&hero.id?hero.id:'';}).slice(0,15);
 if(!rows.length){host.innerHTML='<p class="stats-note">Todavía no hay transmisiones observadas con juego o categoría para comparar.</p>';return;}
 const maxAvg=Math.max(0,...rows.map(row=>row.average||0));
 const creators=row=>'<div class="stats-game-creators">'+row.creators.map(item=>'<span class="stats-game-creator"'+(item.id?' data-creator-id="'+escapeStatsHtml(item.id)+'"':'')+'><span class="creator-swatch" aria-hidden="true"></span>'+escapeStatsHtml(item.label)+'</span>').join('')+'</div>';
 host.innerHTML='<div class="stats-table-wrap"><table class="stats-table game-performance-table"><caption class="sr-only">Rendimiento observado por juego o categoría, de mayor a menor cantidad de transmisiones</caption><thead><tr><th scope="col">Juego o categoría</th><th scope="col">Quiénes lo jugaron</th><th scope="col" class="num">Transmisiones</th><th scope="col" class="num">Promedio</th><th scope="col" class="num">Pico</th></tr></thead><tbody>'+rows.map(row=>{
  const flag=row.streams<3?'<span class="stats-game-flag">Pocas transmisiones</span>':'';
  const avgCell=row.average===null?'<td class="num is-empty" data-label="Promedio">Sin datos</td>':'<td class="num" data-label="Promedio"><span class="stats-databar" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,maxAvg>0?row.average/maxAvg*100:0))+'%"></i></span>'+statsNumber(row.average,1)+'</td>';
  const peakCell=row.peak===null?'<td class="num is-empty" data-label="Pico">Sin datos</td>':'<td class="num" data-label="Pico">'+statsNumber(row.peak,0)+'</td>';
  return '<tr><td class="stats-channel-cell" data-label="Juego o categoría">'+escapeStatsHtml(row.name)+flag+'</td><td data-label="Quiénes lo jugaron">'+creators(row)+'</td><td class="num" data-label="Transmisiones">'+statsNumber(row.streams,0)+'</td>'+avgCell+peakCell+'</tr>';
 }).join('')+'</tbody></table></div><p class="stats-game-note">Promedio ponderado por las muestras en directo de cada canal y pico más alto observado. Es muestreo propio de la ventana disponible, no analítica oficial de Twitch; con pocas transmisiones es una referencia, no una proyección. Los juegos suman a todos los canales que los transmitieron.</p>';
}
function statsRenderEvolution(channels){
 const host=document.getElementById('stats-evolution');if(!host)return;
 const days=new Map();
 channels.forEach(channel=>(channel.window?.daily_activity||[]).forEach(day=>{
  if(!day?.date)return;
  const current=days.get(day.date)||{date:day.date,streams:0,samples:0,avgWeighted:0,weight:0};
  const streams=Number(day.streams_observed)||0,samples=Number(day.live_samples)||0,avg=Number(day.average_viewers_sampled);
  current.streams+=streams;current.samples+=samples;
  if(Number.isFinite(avg)&&samples>0){current.avgWeighted+=avg*samples;current.weight+=samples;}
  days.set(day.date,current);
 }));
 const rows=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
 if(!rows.length){host.innerHTML='<p class="stats-note">Todavía no hay suficientes registros diarios para construir la evolución.</p>';return;}
 const max=Math.max(1,...rows.flatMap(row=>[row.streams,row.samples]));
 host.innerHTML='<div class="stats-evolution-legend"><span><i></i> Transmisiones observadas</span><span><i></i> Muestras en directo</span></div><div class="stats-evolution-bars">'+rows.map(row=>{
  const label=statsDate(row.date).slice(0,5),streamHeight=row.streams?Math.max(3,row.streams/max*100):0,sampleHeight=row.samples?Math.max(3,row.samples/max*100):0;
  return '<div class="stats-evolution-day" title="'+escapeStatsHtml(statsDate(row.date))+': '+row.streams+' transmisiones, '+row.samples+' muestras en directo"><div class="stats-evolution-pair"><div class="stats-evolution-bar"><i style="height:'+streamHeight+'%"></i></div><div class="stats-evolution-bar is-samples"><i style="height:'+sampleHeight+'%"></i></div></div><b>'+row.streams+'</b><small>'+label+'</small><span>'+row.samples+' muestras</span></div>';
 }).join('')+'</div><p class="stats-evolution-note">Total del tramo visible: '+rows.reduce((sum,row)=>sum+row.streams,0)+' transmisiones observadas y '+rows.reduce((sum,row)=>sum+row.samples,0)+' muestras en directo. Promedio ponderado de las muestras: '+(rows.reduce((sum,row)=>sum+row.avgWeighted,0)/Math.max(1,rows.reduce((sum,row)=>sum+row.weight,0))).toLocaleString('es-AR',{maximumFractionDigits:1})+' espectadores.</p>';
}
function statsRenderWeek(){
 const host=document.getElementById('stats-week-grid');if(!host)return;
 const days=['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
 const scheduleRows=heroesData.map(hero=>({hero,schedule:statsCreatorSchedule(hero)}));
 const declared=[
  {match:/lunes y miércoles 20:00/i,days:{0:'20:00',2:'20:00'}},
  {match:/viernes 21:00/i,days:{4:'21:00'}},
  {match:/lunes a viernes 20:00/i,days:{0:'20:00',1:'20:00',2:'20:00',3:'20:00',4:'20:00'}},
  {match:/martes y jueves 23:00/i,days:{1:'23:00',3:'23:00'}},
  {match:/lunes a viernes 21:00/i,days:{0:'21:00',1:'21:00',2:'21:00',3:'21:00',4:'21:00'}},
  {match:/lunes a sábado/i,days:{0:'Mañana / tarde',1:'Mañana / tarde',2:'Mañana / tarde',3:'Mañana / tarde',4:'Mañana / tarde',5:'Mañana / tarde'}}
 ];
 const header='<div class="stats-week-name-head">INTEGRANTE</div>'+days.map(day=>'<div class="stats-week-day-head">'+day+'</div>').join('');
 const rows=scheduleRows.map(({hero,schedule})=>{
  const map={};declared.forEach(rule=>{if(rule.match.test(schedule))Object.assign(map,rule.days);});
  const isVariable=/1 a 2 veces|sin horario fijo/i.test(schedule);
  const isNoSchedule=/sin directos|sin directos programados/i.test(schedule);
  return '<div class="stats-week-name">'+escapeStatsHtml(hero.display_name||hero.name)+'</div>'+days.map((day,index)=>{
   const value=map[index];
   if(value)return '<div class="stats-week-cell is-declared">'+escapeStatsHtml(value)+'</div>';
   if(isVariable)return '<div class="stats-week-cell is-variable">Variable</div>';
   if(isNoSchedule)return '<div class="stats-week-cell is-none">—</div>';
   return '<div class="stats-week-cell is-none">—</div>';
  }).join('')+(isVariable||isNoSchedule?'<div class="stats-week-note">'+escapeStatsHtml(schedule)+'</div>':'');
 }).join('');
 host.innerHTML='<div class="stats-week-table">'+header+rows+'</div><p class="stats-evolution-note">Los horarios son declaraciones del roster, no predicciones de disponibilidad ni registros de transmisiones realizadas.</p>';
}
function statsAnimateCounters(host){
 if(!host||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 host.querySelectorAll('[data-stats-count]').forEach(node=>{
  const target=Number(node.dataset.statsCount);if(!Number.isFinite(target))return;
  const decimals=Number.isInteger(target)?0:1,start=performance.now(),duration=850;
  const tick=now=>{
   const progress=Math.min(1,(now-start)/duration);
   node.textContent=(target*(1-Math.pow(1-progress,3))).toLocaleString('es-AR',{maximumFractionDigits:decimals});
   if(progress<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
 });
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-stats-filter]');if(!button)return;
 statsDirectoryFilter=button.dataset.statsFilter;
 document.querySelectorAll('[data-stats-filter]').forEach(node=>{const active=node===button;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active));});
 if(instituteStatsSnapshot)statsRenderChannelDirectory(instituteStatsSnapshot.channels,instituteStatsSnapshot.isFresh);
});
document.addEventListener('change',event=>{
 if(event.target?.id!=='stats-sort')return;
 statsDirectorySort=event.target.value;
 if(instituteStatsSnapshot)statsRenderChannelDirectory(instituteStatsSnapshot.channels,instituteStatsSnapshot.isFresh);
});


async function loadInstituteStats(){
 const body=document.getElementById('stats-table-body'); if(!body)return;
 if(instituteStatsLoading){instituteStatsRefreshQueued=true;return;}
 instituteStatsLoading=true;
 const fmt=(v,d=1)=>v===null||v===undefined?'—':(typeof v==='number'?v.toLocaleString('es-AR',{maximumFractionDigits:d}):v);
 try{
  const bundle=await window.LegionCreatorProfiles.load({files:['activity']});
  const data=bundle.activity; instituteStatsData=data;
  const activeLogins=Array.isArray(data.active_channels)?data.active_channels:Object.keys(data.channels||{});
  const channels=activeLogins.map(login=>data.channels?.[login]).filter(Boolean);
  const liveCount=channels.filter(c=>c.live).length;
  const totalSamples=channels.reduce((n,c)=>n+(c.window?.samples_total||0),0);
  const observedStreams=channels.reduce((n,c)=>n+(c.window?.streams_observed||0),0);
  const liveSamples=channels.reduce((n,c)=>n+(c.window?.live_samples||0),0);
  const currentViewers=channels.reduce((n,c)=>n+(c.live&&c.current_viewers!==null&&c.current_viewers!==undefined?Number(c.current_viewers)||0:0),0);
  const observedHours=channels.reduce((n,c)=>n+(Number(c.window?.observed_live_hours)||0),0);
  const estimatedAudienceHours=channels.reduce((n,c)=>n+(Number(c.window?.estimated_hours_watched)||0),0);
  const youtubeChannels=heroesData.filter(hero=>(hero.accounts||[]).some(account=>account.platform==='youtube')).length;
  const interval=Number(data.sampling_interval_minutes)||15;
  const updated=data.updated_at?new Date(data.updated_at):null;
  const updatedValid=updated&&!Number.isNaN(updated.getTime());
  const updatedLabel=updatedValid?updated.toLocaleString('es-AR'):'fecha no disponible';
  const collection=data.collection||{};
  const expectedChannels=Number(collection.expected_channels)||activeLogins.length;
  const resolvedChannels=Number(collection.resolved_channels)||channels.length;
  const skippedChannels=Array.isArray(collection.skipped_channels)?collection.skipped_channels:[];
  const sampledChannels=Array.isArray(collection.sampled_channels)?collection.sampled_channels:[];
  const accountedChannels=new Set([...sampledChannels,...skippedChannels]);
  const collectionComplete=collection.complete===true && expectedChannels>0 && resolvedChannels>=expectedChannels && accountedChannels.size>=expectedChannels;
  const ageMinutes=updatedValid?(Date.now()-updated.getTime())/60000:Infinity;
  const freshnessLimit=Math.max(interval*2.5,120);
  const isFresh=ageMinutes>=-5&&ageMinutes<=freshnessLimit;
  const statusLabel=!updatedValid?'FECHA NO DISPONIBLE':!isFresh?'DATOS CON DEMORA':collectionComplete?'CAPTURA COMPLETA':'CAPTURA PARCIAL';
  const updatedNode=document.getElementById('stats-updated');
  if(updatedNode){
   updatedNode.textContent='Última actualización: '+updatedLabel+' · '+channels.length+' canales activos · '+statusLabel+' · intervalo objetivo: '+interval+' min.';
   updatedNode.hidden=false;
   updatedNode.dataset.status=!updatedValid||!isFresh?'stale':collectionComplete?'complete':'partial';
  }
  const samplingNote=document.getElementById('stats-methodology-sampling');
  if(samplingNote)samplingNote.textContent='La actividad de Twitch se obtiene de Twitch Helix mediante data.json. La cadencia objetivo del colector es de '+interval+' minutos y la ventana móvil configurada es de hasta '+fmt(data.window_days,0)+' días. La continuidad real depende de las ejecuciones y de la disponibilidad de la API; una ventana configurada no equivale a un período completo de datos.';
  const coverageNote=document.getElementById('stats-methodology-coverage');
  if(coverageNote)coverageNote.textContent='En la última captura se resolvieron '+resolvedChannels+' de '+expectedChannels+' canales esperados'+(skippedChannels.length?' y se omitieron '+skippedChannels.length+' ('+skippedChannels.join(', ')+')':'')+'. Estado informado por el colector: '+(collectionComplete?'completo':'parcial o pendiente')+'. Los espectadores actuales reflejan la última consulta; promedios y picos son valores observados por muestreo, no analíticas oficiales de Twitch.';
  document.getElementById('stats-summary').innerHTML=[
   [fmt(channels.length,0),'CANALES TWITCH','Canales registrados en el seguimiento del roster'],
   [fmt(youtubeChannels,0),'CANALES YOUTUBE','Cuentas de YouTube registradas; sus métricas se muestran por separado'],
   [isFresh?fmt(liveCount,0):'—','EN VIVO AHORA',isFresh?'Canales detectados en la última captura':'Estado de transmisión con datos demorados'],
   [isFresh?fmt(currentViewers,0):'—','ESPECTADORES AHORA',isFresh?'Suma de espectadores de canales detectados en vivo':'No se informa como actual porque la captura está demorada'],
   [fmt(observedHours,1),'HORAS DE DIRECTO OBSERVADAS','Tiempo de transmisión estimado entre muestras consecutivas'],
   [fmt(totalSamples,0),'MUESTRAS REGISTRADAS','Consultas públicas acumuladas en la ventana disponible'],
   [fmt(estimatedAudienceHours,1),'HORAS DE AUDIENCIA ESTIMADAS','Estimación propia entre muestras consecutivas; no es analítica oficial']
  ].map(([value,label,note])=>{
   const normalized=String(value).replace(/\./g,'').replace(',','.');
   const numeric=/^\d+(?:\.\d+)?$/.test(normalized)?Number(normalized):null;
   return '<article class="impact-kpi"><strong'+(numeric!==null?' data-stats-count="'+numeric+'"':'')+'>'+value+'</strong><span>'+label+'</span><small>'+note+'</small></article>';
  }).join('');
  statsAnimateCounters(document.getElementById('stats-summary'));
  const homeLiveStatus=document.getElementById('home-live-status');
  const homeLiveUpdated=document.getElementById('home-live-updated');
  const liveChannels=channels.filter(c=>c.live);
  if(homeLiveStatus)homeLiveStatus.textContent=!isFresh?'Estado temporalmente demorado':liveCount?liveCount+' canal(es) detectado(s) en directo: '+liveChannels.map(c=>c.display_name||c.login).join(', '):'No se detectan canales en directo en la última captura.';
  if(homeLiveUpdated)homeLiveUpdated.textContent='Última captura: '+updatedLabel+' · '+channels.length+' canales Twitch consultados · cadencia objetivo '+interval+' min. No es una conexión en tiempo real.';
  const homeFollowLink=document.getElementById('home-follow-link');
  if(homeFollowLink)homeFollowLink.hidden=isFresh&&liveCount>0;
  const liveNav=document.querySelector('.nav-btn-live[data-chapter="10"]');
  if(liveNav){const showLive=isFresh&&liveCount>0;liveNav.classList.toggle('is-live',showLive);liveNav.innerHTML='EN VIVO <span aria-hidden="true">'+(showLive?'● '+liveCount:'●')+'</span>';liveNav.setAttribute('aria-label',showLive?liveCount+' canal(es) detectado(s) en directo en la última captura':'Consultar estado de transmisiones; '+(isFresh?'sin canales en directo en la última captura':'última captura demorada'));}
  instituteStatsSnapshot={channels,isFresh};
  statsRenderChannelDirectory(channels,isFresh);
  statsRenderEvolution(channels);
  statsRenderComparison(channels);
  statsRenderGamePerformance(channels);
  statsRenderWeek();
  const games={};
  channels.forEach(c=>(c.window?.game_breakdown||[]).forEach(g=>{if(g?.name)games[g.name]=(games[g.name]||0)+(g.live_samples||0);}));
  const topGames=Object.entries(games).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const highlights=document.getElementById('stats-highlights');
  if(highlights)highlights.innerHTML='<div class="impact-highlight-copy"><span>LECTURA DEL PERÍODO</span><strong>'+fmt(totalSamples,0)+' muestras de actividad registradas</strong><p>La cifra reúne consultas realizadas a los '+channels.length+' canales Twitch activos; '+liveCount+' detectados en directo en la última consulta. No equivale a espectadores ni a horas vistas.</p></div>'+(topGames.length?'<div class="impact-game-list"><span>CATEGORÍAS CON MÁS CAPTURAS EN DIRECTO</span>'+topGames.map(([name,count])=>'<div><b>'+escapeStatsHtml(name)+'</b><span>'+fmt(count,0)+' muestras</span></div>').join('')+'</div>':'<div class="impact-game-list"><span>CATEGORÍAS</span><p>Aún no hay suficientes muestras para mostrar un resumen.</p></div>');
  body.innerHTML=channels.map(c=>{const samples=Array.isArray(c.snapshots)?c.snapshots.filter(s=>s?.sampled_at):[];const first=samples.length?Date.parse(samples[0].sampled_at):NaN;const last=samples.length?Date.parse(samples[samples.length-1].sampled_at):NaN;const expected=Number.isFinite(first)&&Number.isFinite(last)&&last>=first?Math.floor((last-first)/(Number(data.sampling_interval_minutes||15)*60000))+1:0;const coverage=expected?Math.min(100,(samples.length/expected)*100):null;const coverageLabel=coverage===null?'Insuficiente':coverage.toLocaleString('es-AR',{maximumFractionDigits:1})+'% ('+samples.length+'/'+expected+')';return '<tr><td>'+escapeStatsHtml(c.display_name)+'</td><td>'+(c.live?'EN DIRECTO':'OFFLINE')+'</td><td>'+fmt(c.current_viewers,0)+'</td><td>'+escapeStatsHtml(fmt(c.current_game))+'</td><td>'+fmt(c.window?.average_viewers_sampled)+'</td><td>'+fmt(c.window?.peak_viewers_sampled,0)+'</td><td>'+fmt(c.window?.observed_live_hours)+'</td><td>'+fmt(c.window?.samples_total,0)+'</td><td>'+coverageLabel+'</td></tr>';}).join('');
  renderLiveDirectory(channels);
  refreshRosterLiveIndicators();
  renderRosterSelector();
 }catch(e){
  body.innerHTML='<tr><td colspan="9">Estadísticas temporalmente no disponibles. '+escapeStatsHtml(e.message)+'</td></tr>';
  const summary=document.getElementById('stats-summary');if(summary)summary.innerHTML='<article class="impact-kpi"><strong>—</strong><span>DATOS NO DISPONIBLES</span><small>La fuente de actividad no respondió. No se interpreta el último estado conocido como actual.</small></article>';
  const updatedNode=document.getElementById('stats-updated');if(updatedNode){updatedNode.textContent='No se pudo consultar data.json. El estado en directo queda sin confirmar hasta la próxima carga exitosa.';updatedNode.dataset.status='error';}
  const channelGrid=document.getElementById('stats-channel-grid');if(channelGrid)channelGrid.innerHTML='<p class="stats-note" role="status">Estado de canales no disponible: no se pudo leer la fuente de actividad. Los datos anteriores no se presentan como actuales.</p>';
  refreshRosterLiveIndicators();
  renderRosterSelector();
 } finally {
  instituteStatsLoading=false;
  if(instituteStatsRefreshQueued){instituteStatsRefreshQueued=false;loadInstituteStats();}
 }
}

async function loadPartnerMetrics(){
 const body=document.getElementById('partner-metrics-body'); if(!body)return;
 const fmt=(v,d=2)=>v===null||v===undefined?'Pendiente':(typeof v==='number'?v.toLocaleString('es-AR',{maximumFractionDigits:d}):v);
 try{
  const res=await fetch('data.json',{cache:'no-store'}); if(!res.ok)throw new Error('No se pudo leer data.json');
  const data=await res.json(); const activeLogins=Array.isArray(data.active_channels)?data.active_channels:Object.keys(data.channels||{}); const channels=activeLogins.map(login=>data.channels?.[login]).filter(Boolean);
  body.innerHTML=channels.map(c=>'<tr><td>'+escapeStatsHtml(c.display_name)+'</td><td>'+(c.live?'EN DIRECTO':'OFFLINE')+'</td><td>'+fmt(c.current_viewers,0)+'</td><td>'+fmt(c.current_game)+'</td><td>'+fmt(c.window?.average_viewers_sampled)+'</td><td>'+fmt(c.window?.peak_viewers_sampled,0)+'</td><td>'+fmt(c.window?.samples_total,0)+'</td></tr>').join('');
 }catch(e){body.innerHTML='<tr><td colspan="7">Métricas temporalmente no disponibles.</td></tr>';}
}

let communityPlaybook = null;
let legionProgressFallback = { profiles: [], chapters: [], bitacora: false, live: false };
const LEGION_PROGRESS_KEY = 'legion-multiversal-exploration-v1';
function readLegionProgress() {
    try {
        const stored = JSON.parse(localStorage.getItem(LEGION_PROGRESS_KEY) || 'null');
        if (stored && typeof stored === 'object') return {
            profiles: Array.isArray(stored.profiles) ? stored.profiles : [],
            chapters: Array.isArray(stored.chapters) ? stored.chapters : [],
            bitacora: Boolean(stored.bitacora),
            live: Boolean(stored.live)
        };
    } catch (error) { /* almacenamiento local no disponible */ }
    return legionProgressFallback;
}
function saveLegionProgress(state) {
    legionProgressFallback = state;
    try { localStorage.setItem(LEGION_PROGRESS_KEY, JSON.stringify(state)); } catch (error) { /* se mantiene en memoria */ }
}
function recordLegionProgress(type, value) {
    const state = readLegionProgress();
    if (type === 'profile' && value !== undefined && !state.profiles.includes(String(value))) state.profiles.push(String(value));
    if (type === 'chapter' && value !== undefined && !state.chapters.includes(String(value))) state.chapters.push(String(value));
    if (type === 'bitacora') state.bitacora = true;
    if (type === 'live') state.live = true;
    if (type === 'chapter' && String(value) === '10') state.live = true;
    saveLegionProgress(state);
    renderCommunityProgress();
}
function renderMultiverseMap() {
    const host = document.getElementById('multiverse-map');
    if (!host || !heroesData.length) return;
    const makeNode = (hero, index) => '<button type="button" class="multiverse-node" onclick="openMappedHero(' + index + ')" aria-label="Abrir expediente de ' + escapeStatsHtml(getHeroDisplayName(hero)) + '"><span class="multiverse-node-number">N.º ' + escapeStatsHtml(hero.cardNumber || 'S/N') + '</span><strong>' + escapeStatsHtml(getHeroDisplayName(hero)) + '</strong><span class="multiverse-node-role">' + 'INTEGRANTE DE LA LEGIÓN' + '</span><span class="multiverse-node-areas">' + (hero.areas || []).slice(0,3).map(area => '<i>' + escapeStatsHtml(area) + '</i>').join('') + '</span><em>ABRIR EXPEDIENTE ↗</em></button>';
    const top = heroesData.slice(0,4).map(makeNode).join('');
    const bottom = heroesData.slice(4).map((hero,index) => makeNode(hero,index+4)).join('');
    host.innerHTML = '<div class="multiverse-map-canvas"><svg class="multiverse-connections" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">' + [125,375,625,875].map(x => '<line x1="500" y1="310" x2="' + x + '" y2="105"></line><line x1="500" y1="310" x2="' + x + '" y2="515"></line>').join('') + '</svg><div class="multiverse-node-row">' + top + '</div><div class="multiverse-core"><span>LM</span><strong>NEXUS CENTRAL</strong><small>' + heroesData.length + ' UNIVERSOS CONECTADOS</small></div><div class="multiverse-node-row">' + bottom + '</div></div>';
}
function openMappedHero(index) {
    switchChapter(2);
    window.lastHeroProfileTrigger = null;
    openHeroProfile(index, null);
}
async function loadCommunityPlaybook() {
    try {
        const response = await fetch('community-playbook.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo leer community-playbook.json');
        communityPlaybook = await response.json();
        renderCommunityProgress();
    } catch (error) {
        const missions = document.getElementById('community-missions');
        const achievements = document.getElementById('community-achievements');
        if (missions) missions.innerHTML = '<p class="stats-note">Las misiones no están disponibles temporalmente.</p>';
        if (achievements) achievements.innerHTML = '<p class="stats-note">Las insignias no están disponibles temporalmente.</p>';
    }
}
function renderCommunityProgress() {
    if (!communityPlaybook) return;
    const state = readLegionProgress();
    const progressFor = key => key === 'profiles' ? state.profiles.length : key === 'chapters' ? state.chapters.length : key === 'bitacora' ? Number(state.bitacora) : key === 'live' ? Number(state.live) : 0;
    const missionsHost = document.getElementById('community-missions');
    if (missionsHost) missionsHost.innerHTML = (communityPlaybook.missions || []).map(mission => {
        const value = progressFor(mission.progress_key);
        const target = mission.target === 'roster_total' ? Math.max(1, heroesData.length) : Math.max(1, Number(mission.target) || 1);
        const percent = Math.min(100, value / target * 100);
        const complete = value >= target;
        return '<article class="community-mission' + (complete ? ' is-complete' : '') + '"><div class="community-mission-top"><span>' + escapeStatsHtml(mission.category || 'MISIÓN') + '</span><b>' + (complete ? 'COMPLETADA' : 'EN CURSO') + '</b></div><h4>' + escapeStatsHtml(mission.title) + '</h4><p>' + escapeStatsHtml(mission.description) + '</p><div class="community-progress-track" role="progressbar" aria-label="' + escapeStatsHtml(mission.title) + '" aria-valuemin="0" aria-valuemax="' + target + '" aria-valuenow="' + Math.min(value,target) + '"><i style="width:' + percent.toFixed(1) + '%"></i></div><small>' + Math.min(value,target) + ' / ' + target + ' · ' + escapeStatsHtml(mission.progress_label || 'progreso') + '</small></article>';
    }).join('');
    updateMissionHeader();
    const achievementsHost = document.getElementById('community-achievements');
    if (achievementsHost) achievementsHost.innerHTML = (communityPlaybook.achievements || []).map(achievement => {
        const achievementTarget = achievement.target === 'roster_total' ? Math.max(1, heroesData.length) : Number(achievement.target || 1);
        const unlocked = progressFor(achievement.progress_key) >= achievementTarget;
        return '<article class="community-achievement' + (unlocked ? ' is-unlocked' : ' is-locked') + '"><span class="achievement-seal">' + (unlocked ? '✦' : '◇') + '</span><div><small>' + (unlocked ? 'INSIGNIA DESBLOQUEADA' : 'INSIGNIA POR DESCUBRIR') + '</small><h4>' + escapeStatsHtml(achievement.title) + '</h4><p>' + escapeStatsHtml(achievement.description) + '</p></div></article>';
    }).join('');
}
function getRosterFilteredEntries() {
    const search = (document.getElementById('roster-search')?.value || '').trim().toLocaleLowerCase('es');
    const role = document.getElementById('roster-role-filter')?.value || 'all';
    const platform = document.getElementById('roster-platform-filter')?.value || 'all';
    const area = document.getElementById('roster-area-filter')?.value || 'all';
    const sort = document.getElementById('roster-sort')?.value || 'featured';
    const entries = heroesData.map((hero, index) => ({ hero, index })).filter(({hero}) => {
        const accountTerms = (hero.accounts || []).flatMap(account => [account.handle, account.login, account.platform]);
        const haystack = [hero.name, hero.display_name, hero.slug, hero.codename, hero.characterRole, hero.bio, hero.voice, hero.log, ...(hero.areas || []), ...(hero.platforms || []), ...(hero.mediaProfile?.formats || []), ...(hero.mediaProfile?.opportunities || []), ...accountTerms].join(' ').toLocaleLowerCase('es');
        return (!search || haystack.includes(search))
            && (role === 'all' || hero.role === role)
            && (platform === 'all' || (hero.platforms || []).includes(platform) || (hero.accounts || []).some(account => account.platform === platform))
            && (area === 'all' || (hero.areas || []).includes(area));
    });
    if (sort === 'name') entries.sort((a,b) => (a.hero.display_name || a.hero.name).localeCompare(b.hero.display_name || b.hero.name, 'es'));
    return entries;
}

function bindRosterControls() {
    const root = document.getElementById('roster-home');
    if (!root || root.dataset.controlsBound === 'true') return;
    root.dataset.controlsBound = 'true';
    const areaSelect = document.getElementById('roster-area-filter');
    if (areaSelect && areaSelect.dataset.optionsReady !== 'true') {
        const areas = [...new Set(heroesData.flatMap(hero => hero.areas || []))].sort((a,b) => a.localeCompare(b, 'es'));
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });
        areaSelect.dataset.optionsReady = 'true';
    }
    ['roster-search','roster-role-filter','roster-platform-filter','roster-area-filter','roster-sort'].forEach(id => {
        const control = document.getElementById(id);
        if (control) control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderRoster);
    });
    root.addEventListener('click', event => {
        const quickFilter = event.target.closest('[data-roster-filter]');
        if (quickFilter) {
            const type = quickFilter.getAttribute('data-roster-filter');
            const value = quickFilter.getAttribute('data-value') || 'all';
            const control = document.getElementById(type === 'role' ? 'roster-role-filter' : type === 'platform' ? 'roster-platform-filter' : '');
            if (control) { control.value = value; renderRoster(); }
            return;
        }
        if (event.target.closest('[data-reset-roster-empty]')) {
            document.getElementById('roster-reset')?.click();
            return;
        }
        const clearButton = event.target.closest('[data-remove-roster-filter]');
        if (!clearButton) return;
        const id = clearButton.getAttribute('data-remove-roster-filter');
        if (id === 'all') {
            ['roster-search','roster-role-filter','roster-platform-filter','roster-area-filter'].forEach(filterId => {
                const field = document.getElementById(filterId);
                if (field) field.value = filterId === 'roster-search' ? '' : 'all';
            });
            renderRoster();
            return;
        }
        const control = document.getElementById(id);
        if (!control) return;
        control.value = id === 'roster-search' ? '' : 'all';
        renderRoster();
        if (id === 'roster-search') control.focus();
    });
    document.getElementById('roster-filters-close')?.addEventListener('click', () => {
        const details = document.getElementById('roster-advanced-filters');
        if (details) details.open = false;
        document.getElementById('roster-more-filters')?.focus();
    });
    document.addEventListener('keydown', event => {
        const details = document.getElementById('roster-advanced-filters');
        if (!details?.open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            details.open = false;
            document.getElementById('roster-more-filters')?.focus();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(details.querySelectorAll('summary, button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]'))
            .filter(element => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !details.contains(document.activeElement))) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !details.contains(document.activeElement))) {
            event.preventDefault(); first.focus();
        }
    });
    document.getElementById('roster-reset')?.addEventListener('click', () => {
        ['roster-search','roster-role-filter','roster-platform-filter','roster-area-filter'].forEach(id => {
            const control = document.getElementById(id);
            if (control) control.value = id === 'roster-search' ? '' : 'all';
        });
        const sort = document.getElementById('roster-sort');
        if (sort) sort.value = 'featured';
        const details = document.getElementById('roster-advanced-filters');
        if (details) details.open = false;
        renderRoster();
        document.getElementById('roster-search')?.focus();
    });
}

function setRosterCardFace(card, flipped) {
    const front = card.querySelector('.roster-card-front');
    const back = card.querySelector('.roster-card-back');
    if (!front || !back) return;
    front.inert = Boolean(flipped);
    back.inert = !flipped;
    front.toggleAttribute('inert', Boolean(flipped));
    back.toggleAttribute('inert', !flipped);
    front.setAttribute('aria-hidden', String(Boolean(flipped)));
    back.setAttribute('aria-hidden', String(!flipped));
    card.classList.toggle('is-flipped', Boolean(flipped));
}
function updateRosterFilterSummary() {
    const host = document.getElementById('roster-active-filters');
    if (!host) return;
    const fields = [
        ['roster-search', 'Búsqueda', value => '«' + value + '»'],
        ['roster-role-filter', 'Vínculo', value => document.querySelector('#roster-role-filter option:checked')?.textContent || value],
        ['roster-platform-filter', 'Plataforma', value => value.toUpperCase()],
        ['roster-area-filter', 'Especialidad', value => value]
    ];
    const active = fields.filter(([id]) => {
        const value = document.getElementById(id)?.value;
        return value && value !== 'all';
    });
    document.querySelectorAll('[data-roster-filter]').forEach(button => {
        const type = button.getAttribute('data-roster-filter');
        const control = document.getElementById(type === 'role' ? 'roster-role-filter' : 'roster-platform-filter');
        button.setAttribute('aria-pressed', String(Boolean(control && control.value === button.getAttribute('data-value'))));
    });
    host.innerHTML = active.length
        ? '<span class="roster-filter-caption">FILTROS ACTIVOS</span>' + active.map(([id,label,format]) => {
            const value = document.getElementById(id).value;
            return '<button type="button" class="roster-filter-chip" data-remove-roster-filter="' + id + '" aria-label="Quitar filtro ' + escapeStatsHtml(label) + ': ' + escapeStatsHtml(format(value)) + '">' + escapeStatsHtml(label) + ': ' + escapeStatsHtml(format(value)) + ' <span aria-hidden="true">×</span></button>';
        }).join('') + '<button type="button" class="roster-filter-clear-inline" data-remove-roster-filter="all">LIMPIAR</button>'
        : '<span class="roster-filter-caption">MOSTRANDO EL ARCHIVO COMPLETO</span>';
}

function getRosterLiveState(hero) {
    if (!hero || !instituteStatsData) return null;
    const account = (hero.accounts || []).find(item => item.platform === 'twitch' && item.account_type === 'creator_channel');
    const login = (account?.login || (hero.twitch ? hero.twitch.split('/').filter(Boolean).pop() : '') || '').toLowerCase();
    if (!login) return null;
    const channel = instituteStatsData.channels?.[login];
    if (!channel) return null;
    const updated = new Date(instituteStatsData.updated_at || channel.updated_at || '');
    const ageMinutes = (Date.now() - updated.getTime()) / 60000;
    const interval = Number(instituteStatsData.sampling_interval_minutes) || 55;
    const fresh = Number.isFinite(ageMinutes) && ageMinutes >= -5 && ageMinutes <= Math.max(interval * 2.5, 120);
    return { login, channel, fresh, updatedAt: instituteStatsData.updated_at || channel.updated_at || null, ageMinutes, url: account?.url || hero.twitch || ('https://twitch.tv/' + login) };
}
function refreshRosterLiveIndicators() {
    document.querySelectorAll('.roster-collectible-card[data-creator-id]').forEach(card => {
        const hero = heroesData.find(item => (item.id || item.slug || item.name) === card.dataset.creatorId);
        const badge = card.querySelector('.roster-card-live-badge');
        if (!badge) return;
        const trackedOnTwitch = Boolean(hero && ((hero.accounts || []).some(item => item.platform === 'twitch' && item.account_type === 'creator_channel') || hero.twitch));
        if (!trackedOnTwitch) {
            badge.hidden = true;
            badge.removeAttribute('href');
            badge.tabIndex = -1;
            badge.classList.remove('is-stale');
            return;
        }
        const state = getRosterLiveState(hero);
        const isLive = Boolean(state && state.fresh && state.channel.live);
        const isStale = Boolean(state && !state.fresh);
        const unavailable = !state;
        badge.hidden = !isLive && !isStale && !unavailable;
        badge.classList.toggle('is-stale', !isLive);
        if (isLive) {
            const game = state.channel.current_game ? ' · ' + state.channel.current_game : '';
            badge.href = state.url;
            badge.tabIndex = 0;
            badge.removeAttribute('aria-disabled');
            badge.textContent = '● EN VIVO' + game;
            badge.title = state.channel.current_title || 'Abrir transmisión en directo';
            badge.setAttribute('aria-label', 'Abrir transmisión en directo de ' + (hero.display_name || hero.name) + (state.channel.current_game ? ' jugando ' + state.channel.current_game : ''));
        } else {
            badge.removeAttribute('href');
            badge.tabIndex = -1;
            badge.setAttribute('aria-disabled', 'true');
            const captured = state?.updatedAt ? new Date(state.updatedAt).toLocaleString('es-AR') : '';
            badge.textContent = unavailable ? 'ESTADO NO DISPONIBLE' : 'ESTADO SIN ACTUALIZAR';
            badge.title = captured ? 'Última captura disponible: ' + captured : 'No hay una captura disponible para esta cuenta.';
            badge.setAttribute('aria-label', badge.textContent + ' para ' + (hero.display_name || hero.name));
        }
    });
}


let selectedRosterCreatorId = null;
function renderRosterMetricSummary(hero){
 return renderNormalizedMetricSummary(hero);
}

function getMostPlayedGames(hero,channel,sullyChannel){
 const isGame=name=>Boolean(name)&&!['just chatting','categoría no informada'].includes(String(name).trim().toLocaleLowerCase('es-AR'));
 const historical=Array.isArray(sullyChannel?.game_breakdown)?sullyChannel.game_breakdown:[];
 const ranked=historical.filter(item=>isGame(item?.name)&&Number.isFinite(Number(item.stream_hours))&&Number(item.stream_hours)>0).sort((a,b)=>Number(b.stream_hours)-Number(a.stream_hours)).map(item=>item.name);
 if(ranked.length)return [...new Set(ranked)].slice(0,6);
 const observed=Array.isArray(channel?.window?.game_breakdown)?channel.window.game_breakdown:[];
 return [...new Set(observed.filter(item=>isGame(item?.name)&&Number(item.streams_observed)>0).sort((a,b)=>Number(b.streams_observed)-Number(a.streams_observed)||Number(b.live_samples)-Number(a.live_samples)).map(item=>item.name))].slice(0,6);
}

function getRosterBrandContext(hero, channel, account) {
    const platform = account?.platform || null;
    const metric = key => getNormalizedCreatorMetric(hero, key, platform);
    const youtube = platform === 'youtube'
        ? platformStatsData?.creators?.[platformStatsKey(hero)]?.platforms?.youtube
        : null;
    const latestVideo = (Array.isArray(youtube?.recent_videos) ? youtube.recent_videos : [])
        .filter(video => video && video.published_at && Number.isFinite(Date.parse(video.published_at)))
        .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0] || null;
    const formatDate = value => {
        if (!value || !Number.isFinite(Date.parse(value))) return null;
        return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    };
    const metrics = platform === 'twitch'
        ? {
            average: metric('average_viewers_sampled'),
            hours: metric('observed_live_hours'),
            streams: metric('streams_observed'),
            peak: metric('peak_viewers_sampled')
        }
        : platform === 'youtube'
            ? {
                subscribers: metric('subscribers'),
                views: metric('total_views'),
                videos: metric('videos_total')
            }
            : {};
    return {
        platform,
        metrics,
        channel,
        yt: { last_published: latestVideo ? formatDate(latestVideo.published_at) : null },
        rhythm: platform === 'twitch' && window.LMBrand
            ? window.LMBrand.computeRhythm(channel)
            : null,
        lastActivity: platform === 'twitch' && window.LMBrand
            ? window.LMBrand.lastActivity(channel)
            : null
    };
}
function normalizedMetricSlotDetail(metric) {
    if (!metric || metric.state === 'missing') {
        const reasons = {
            bundle_unavailable: 'Registro normalizado no disponible',
            creator_unresolved: 'Perfil no vinculado al registro',
            metric_missing: 'La fuente no entregó esta métrica',
            account_mismatch: 'La cuenta de origen no coincide',
            capture_timestamp_missing: 'Captura sin fecha verificable',
            capture_timestamp_in_future: 'Fecha de captura inválida',
            source_not_public_or_unavailable: 'Dato no publicable por la fuente'
        };
        return reasons[metric?.reason] || 'Sin dato verificable';
    }
    const source = metric.source || 'Fuente no indicada';
    const captured = metric.capturedAt ? new Date(metric.capturedAt) : null;
    const date = captured && !Number.isNaN(captured.getTime())
        ? captured.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'fecha no disponible';
    const period = metric.period?.from && metric.period?.to
        ? new Date(metric.period.from).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) + '–' +
          new Date(metric.period.to).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
        : metric.period?.kind === 'cumulative' ? 'acumulado público' : 'período no indicado';
    return source + ' · ' + period + ' · captura ' + date + (metric.state === 'stale' ? ' · DESACTUALIZADO' : '');
}
function getRosterBrandSlots(hero, context) {
    const metrics = context?.metrics || {};
    const account = (hero?.accounts || []).find(item => item.account_type === 'creator_channel') || (hero?.accounts || [])[0];
    if (account?.platform === 'twitch') {
        return [
            ['Media de viewers', normalizedMetricValue(metrics.average, 1), normalizedMetricSlotDetail(metrics.average)],
            ['Horas en directo', normalizedMetricValue(metrics.hours, 2, ' h'), normalizedMetricSlotDetail(metrics.hours)],
            ['Directos detectados', normalizedMetricValue(metrics.streams, 0), normalizedMetricSlotDetail(metrics.streams)]
        ];
    }
    if (account?.platform === 'youtube') {
        return [
            ['Suscriptores', normalizedMetricValue(metrics.subscribers, 0), normalizedMetricSlotDetail(metrics.subscribers)],
            ['Visualizaciones', normalizedMetricValue(metrics.views, 0), normalizedMetricSlotDetail(metrics.views)],
            ['Videos publicados', normalizedMetricValue(metrics.videos, 0), normalizedMetricSlotDetail(metrics.videos)]
        ];
    }
    return [['Estadísticas', 'SIN DATOS', 'No hay una fuente de métricas conectada para esta plataforma']];
}
function renderRosterBrandSlots(hero, context) {
    const slots = getRosterBrandSlots(hero, context);
    return '<span class="comic-roster-brand-slots" aria-label="Métricas públicas normalizadas">' +
        slots.map(([label, value, detail], index) => {
            const classes = index === 0 ? 'comic-roster-stat-average comic-roster-stat-audience' :
                index === 1 ? 'comic-roster-stat-activity' : 'comic-roster-stat-streams';
            return '<span class="comic-roster-stat' + (/^(No informado|Sin datos|SIN DATOS)$/i.test(String(value || '').trim()) ? ' is-empty' : '') + ' ' + classes + '"><span>' + escapeStatsHtml(label) + '</span><b>' + escapeStatsHtml(value) +
                '</b><small>' + escapeStatsHtml(detail || '') + '</small></span>';
        }).join('') + '</span>';
}
function renderRosterSelector() {
    const host = document.getElementById('roster-selector');
    if (!host || !Array.isArray(heroesData) || !heroesData.length) return;
    const safe = escapeStatsHtml;
    const primaryAccount = hero => (hero.accounts || []).find(account => account.account_type === 'creator_channel') || (hero.accounts || [])[0] || null;
    const cards = heroesData.map((hero, index) => {
        const account = primaryAccount(hero);
        const liveStatus = getNormalizedLiveStatus(hero);
        const isLive = liveStatus.state === 'live';
        const channel = findChannelStats(hero);
        const brandContext = getRosterBrandContext(hero, channel, account);
        const isVideo = account?.platform === 'youtube' || hero.creator_type === 'video_creator';
        const rhythmLabel = isVideo ? 'RITMO: NO APLICA' : 'RITMO: ' + (brandContext.rhythm?.label || 'SIN DATOS SUFICIENTES');
        const lastActivityDate = brandContext.lastActivity?.date
            ? new Date(brandContext.lastActivity.date + 'T00:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
            : null;
        const platformName = String(account?.platform || 'CANAL').toUpperCase();
        const typeLabel = isVideo ? 'CREADOR DE VIDEO' : hero.creator_type === 'live_streamer' ? 'CREADOR EN DIRECTO' : 'FORMATO POR CONFIRMAR';
        const games = getMostPlayedGames(hero, channel, findSullyChannel(hero));
        const gameLabel = games.length ? '<em>🎮 MÁS JUGADO · ' + safe(games[0]) + '</em>' : isVideo ? '<em>CONTENIDO EDUCATIVO</em>' : '';
        const specialties = (hero.areas || []).filter(Boolean).slice(0, 3);
        const identity = 'INTEGRANTE DE LA LEGIÓN';
        const activityBadge = liveStatus.state === 'not_applicable' ? 'CONTENIDO · YOUTUBE' : liveStatus.label;
        const viewersMetric = isLive ? getNormalizedCreatorMetric(hero, 'current_viewers', 'twitch') : null;
        const viewersNow = viewersMetric?.state === 'available' && Number.isFinite(Number(viewersMetric.value)) ? Number(viewersMetric.value) : null;
        const liveBadge = isLive ? '<span class="roster-selector-tile-live">● EN DIRECTO' + (viewersNow !== null ? ' · ' + safe(statsNumber(viewersNow, 0)) + ' VIENDO' : '') + '</span>' : '';
        const hoursMetric = !isVideo ? getNormalizedCreatorMetric(hero, 'observed_live_hours', 'twitch') : null;
        const markup = '<button type="button" class="roster-selector-tile comic-roster-card' + (isLive ? ' is-live' : '') + '" data-roster-select="' + index + '" data-creator-id="' + safe(hero.id || hero.slug) + '" data-roster-role="' + safe(hero.role || 'member') + '" aria-label="Abrir expediente de ' + safe(getHeroDisplayName(hero)) + '">' +
          '<span class="comic-roster-photo">' +
            (hero.portrait ? '<img src="' + safe(hero.portrait) + '" alt="Fotografía carnet de ' + safe(getHeroDisplayName(hero)) + '" loading="' + (index < 4 ? 'eager' : 'lazy') + '" decoding="async">' : '<span class="roster-selector-no-portrait">' + safe((hero.display_name || hero.name || '?').slice(0, 1)) + '</span>') +
            '<span class="comic-roster-photo-shade"></span><span class="comic-roster-photo-copy"><small>' + safe(identity) + '</small><strong>' + safe(getHeroDisplayName(hero)) + '</strong>' + gameLabel + '</span>' + liveBadge +
          '</span>' +
          '<span class="comic-roster-card-data"><span class="comic-roster-badges"><b class="comic-roster-frequency">' + safe(rhythmLabel) + '</b><b class="comic-roster-activity">' + safe(activityBadge) + '</b><b class="comic-roster-type">' + safe(typeLabel) + '</b></span>' +
            (lastActivityDate ? '<span class="comic-roster-last-live">ÚLTIMO DIRECTO OBSERVADO: ' + safe(lastActivityDate) + '</span>' : '') +
            renderRosterBrandSlots(hero, brandContext) +
            '<span class="comic-roster-games">' + (specialties.length ? specialties.map(item => '<i>' + safe(item) + '</i>').join('') : '<i>Especialidad por confirmar</i>') + '</span>' +
            (hero.tagline ? '<span class="comic-roster-card-tagline">' + safe(hero.tagline) + '</span>' : '') +
            (window.LMSocial?.renderSocialIcons ? window.LMSocial.renderSocialIcons(hero) : '') +
            '<span class="comic-roster-card-footer"><strong>VER PERFIL →</strong></span></span>' +
        '</button>';
        return { markup, isLive, index };
    });
    const cardsHtml = cards.slice().sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.index - b.index).map(card => card.markup).join('');
    host.innerHTML = '<div class="comic-roster-heading"><span>ARCHIVO CENTRAL · CAPÍTULO 03</span><h2>LAS PERSONAS DETRÁS DE LA LEGIÓN</h2><p>Ocho identidades. Una misma Legión. Cada carta abre directamente su expediente.</p></div><div class="comic-roster-grid" role="list" aria-label="Los ocho integrantes de Legión Multiversal">' + cardsHtml + '</div>';
    host.querySelectorAll('[data-roster-select]').forEach(button => {
        button.addEventListener('click', event => openHeroProfile(Number(button.dataset.rosterSelect), event.currentTarget));
    });
    host.querySelectorAll('.comic-roster-photo img').forEach(image => image.addEventListener('error', () => {
        image.replaceWith(Object.assign(document.createElement('span'), { className: 'roster-selector-no-portrait', textContent: 'RETRATO NO DISPONIBLE' }));
    }, { once: true }));
}

function refreshRosterMetricsViews(){
 renderRosterSelector();
 const index=window.currentHeroProfileIndex;
 if(index===null||index===undefined)return;
 const hero=heroesData[index],page=document.getElementById('hero-profile-page');
 if(!hero||!page||page.hidden)return;
 const channel=findChannelStats(hero),sully=findSullyChannel(hero);
 const profile=page.querySelector('#profile-tab-perfil .hero-profile-overview');
 if(profile){
  const games=getMostPlayedGames(hero,channel,sully),markup=games.length?'<section class="hero-profile-integrated-games"><h4>JUEGOS Y RITMO</h4><div class="hero-profile-game-grid">'+games.map(name=>'<article><strong>'+escapeStatsHtml(name)+'</strong></article>').join('')+'</div></section>':'';
  const current=profile.querySelector('.hero-profile-integrated-games');
  if(current)current.outerHTML=markup;
  else if(markup)profile.insertAdjacentHTML('beforeend',markup);
 }
 const marcasPanel=page.querySelector('#profile-tab-marcas');
 if(marcasPanel){
  const brand=marcasPanel.querySelector('.hero-profile-brand-summary'),brandMarkup=renderHeroBrandSummary(hero);
  if(brand)brand.outerHTML=brandMarkup;
  else marcasPanel.querySelector('h4')?.insertAdjacentHTML('afterend',brandMarkup);
 }
 const stats=page.querySelector('#profile-tab-estadisticas'),dashboard=renderStatsDashboard(hero,channel,sully),currentStats=stats?.querySelector('.stats-dashboard');
 if(currentStats)currentStats.outerHTML=dashboard;
 else if(stats)stats.insertAdjacentHTML('beforeend',dashboard);
}

function selectRosterCreator(index, moveFocus) {
    const hero = heroesData[index];
    if (!hero) return;
    openHeroProfile(index, document.querySelector('[data-roster-select="' + index + '"]'));
}

function renderRoster() {
    const container = document.getElementById('roster-container');
    if (container) container.setAttribute('aria-busy', 'false');
    renderRosterSelector();
}

function renderCommercialQuickView(hero) {
    const safe = escapeStatsHtml;
    const twitchLogin = hero.twitch ? hero.twitch.split("/").filter(Boolean).pop().toLowerCase() : "";
    const youtubeLogin = hero.youtube ? (hero.youtube.split("/").filter(Boolean).pop().replace("@","").toLowerCase()) : "";
    const profileKey = twitchLogin || youtubeLogin;
    const tailoredProfiles = {
        ther0d3r1k: {
            editorial: "Gaming y entretenimiento en directo con una presencia expresiva, energía de equipo y variedad de experiencias competitivas, de acción, terror y conversación.",
            opportunities: ["Presentación y prueba de videojuegos de acción, competitivos o de terror","Integraciones de periféricos y accesorios durante su uso real","Retos, eventos y dinámicas con otros creadores","Clips y piezas breves de momentos destacados"]
        },
        ladymoriarty01: {
            editorial: "Un canal individual de gaming, entretenimiento chill e IRL, con una identidad espontánea que combina gameplay, charla y experiencias fuera del juego.",
            opportunities: ["Presentación de videojuegos y experiencias de juego relajadas","Integraciones naturales en charlas o sesiones IRL","Dinámicas participativas y encuentros con la comunidad","Contenido breve a partir de momentos destacados"]
        },
        ardipii: {
            editorial: "Una propuesta de conversación, gaming y comunidad, con espacio para explicar, mostrar y conversar en directo de manera cercana.",
            opportunities: ["Presentación de juegos y primeras impresiones en directo","Integraciones de productos dentro de conversaciones pertinentes","Dinámicas participativas con la comunidad","Clips de momentos y conversaciones destacadas"]
        },
        akumazoldyck: {
            editorial: "Gaming, charlas y encuentros compartidos. Su propuesta combina experiencias de juego con el rol de anfitrión de una comunidad y eventos grupales.",
            opportunities: ["Presentación y prueba de videojuegos competitivos o de terror","Partidas especiales y eventos con otros creadores","Integraciones de productos gaming en contexto de uso","Dinámicas comunitarias y clips de una activación"]
        },
        daved0608: {
            editorial: "Un creador que inicia una nueva etapa de transmisiones. Su especialidad y sus líneas editoriales todavía están en definición; la propuesta debe construirse junto a Dave, sin atribuirle una trayectoria no documentada.",
            opportunities: ["Primeras impresiones y descubrimiento de videojuegos","Experiencias cooperativas y desafíos con la comunidad","Integraciones sencillas, acordadas con el creador","Registro de clips de la nueva etapa, cuando haya material disponible"]
        },
        habitos_atomicos: {
            editorial: "Gaming y conversación se cruzan con filosofía y desarrollo personal. El canal alterna entretenimiento con espacios para compartir ideas y reflexiones.",
            opportunities: ["Conversaciones temáticas vinculadas a ideas y hábitos cotidianos","Presentación de videojuegos y experiencias en directo","Dinámicas participativas que conecten juego y reflexión","Integraciones de productos pertinentes al contenido y a la audiencia"]
        },
        patoteexplica: {
            editorial: "Un perfil de creación audiovisual educativa y divulgación, con contenidos sobre programación HTML y JavaScript, ciencia y comportamiento. No realiza directos; su formato actual es YouTube.",
            opportunities: ["Videos educativos o explicativos","Presentación de herramientas y plataformas digitales","Integraciones editoriales de software o tecnología, sujetas a criterio de contenido","Piezas divulgativas patrocinadas con transparencia"]
        }
    };
    const data = hero.mediaProfile || tailoredProfiles[profileKey] || {};
    const record = getCreatorRecord(hero);
    const typeLabel = hero.creator_type === "video_creator" ? "CREADOR DE VIDEO" : hero.creator_type === "live_streamer" ? "CREADOR EN DIRECTO" : "FORMATO POR CONFIRMAR";
        const platformLinks = [];
    if (hero.twitch) platformLinks.push(["TWITCH",hero.twitch]);
    if (hero.youtube) platformLinks.push(["YOUTUBE",hero.youtube]);
    if (hero.instagram) platformLinks.push(["INSTAGRAM",hero.instagram]);
    if (hero.cafecito) platformLinks.push(["CAFECITO",hero.cafecito]);
    const areas = Array.isArray(hero.areas) ? hero.areas : [];
    const defaultOpportunities = hero.creator_type === "video_creator"
        ? ["Videos educativos o explicativos","Presentación de herramientas y plataformas digitales","Integraciones de marca pertinentes al contenido y al criterio editorial"]
        : ["Presentación y prueba de videojuegos","Integraciones naturales durante directos","Dinámicas participativas con la comunidad","Clips y piezas breves vinculadas a una activación"];
    const opportunities = Array.isArray(data.opportunities) && data.opportunities.length ? data.opportunities : defaultOpportunities;
    const highlights = Array.isArray(record.highlights) ? record.highlights.length : 0;
    const videos = Array.isArray(record.youtube_videos) ? record.youtube_videos.length : 0;
    const embeds = Array.isArray(record.featured_embeds) ? record.featured_embeds.length : 0;
    const collaborations = Array.isArray(record.collaborations) ? record.collaborations.length : 0;
    let out = '<section class="commercial-quickview" aria-label="Ficha comercial resumida">';
    out += '<div class="commercial-quickview-head"><span class="profile-section-kicker">LECTURA RÁPIDA PARA MARCAS</span><strong>FICHA EJECUTIVA</strong></div>';
    out += '<div class="commercial-quickview-meta" role="group" aria-label="Resumen del tipo de creador y plataformas declaradas"><span>' + safe("INTEGRANTE DE LA LEGIÓN") + '</span><span>' + safe(typeLabel) + '</span><span>' + safe((hero.platforms || []).map(v=>v.toUpperCase()).join(" · ") || "PLATAFORMA POR CONFIRMAR") + '</span></div>';
    if (data.editorial) out += '<section class="commercial-quickview-editorial"><h4>ENFOQUE PARA MARCAS</h4><p>' + safe(data.editorial) + '</p></section>';
    out += '<div class="commercial-quickview-grid">';
    out += '<section><h4>TERRITORIOS DE CONTENIDO</h4>' + (areas.length ? '<ul>' + areas.map(v=>'<li>'+safe(v)+'</li>').join('') + '</ul>' : '<p>Especialidades pendientes de documentar.</p>') + '</section>';
    out += '<section><h4>FORMATOS A CONVERSAR</h4><ul>' + opportunities.map(v=>'<li>'+safe(v)+'</li>').join('') + '</ul><small>Son posibilidades sujetas a conversación, disponibilidad y aprobación del creador; no representan campañas contratadas.</small></section>';
    out += '</div>';
    out += '<section class="commercial-quickview-proof"><h4>MATERIAL DE MUESTRA REGISTRADO</h4>';
    if (highlights || videos || embeds || collaborations) {
        const items=[];
        if (highlights) items.push(highlights + ' clips destacados registrados');
        if (videos) items.push(videos + ' videos de YouTube documentados');
        if (embeds) items.push(embeds + ' videos destacados embebibles');
        if (collaborations) items.push(collaborations + ' registros de alianzas o accesos documentados');
        out += '<p>' + items.map(safe).join(' · ') + '</p><small>La cantidad indica material cargado en el expediente, no visualizaciones ni rendimiento. Las alianzas y los accesos a plataformas se distinguen en la bitácora completa.</small>';
    } else {
        out += '<p>Aún no hay muestras o colaboraciones registradas en el archivo editorial de este perfil.</p><small>Esto describe el estado de documentación del expediente; no significa que el creador carezca de contenido o experiencia.</small>';
    }
    out += '</section>';
    if (platformLinks.length) {
        out += '<section class="commercial-quickview-links"><h4>PRESENCIA DIGITAL</h4><div>' + platformLinks.map(v=>'<a href="'+safe(v[1])+'" target="_blank" rel="noopener noreferrer">'+safe(v[0])+' ↗</a>').join('') + '</div></section>';
    }
    if (data.contact) out += '<p class="commercial-quickview-contact">CONTACTO COMERCIAL · <a href="mailto:'+safe(data.contact)+'">'+safe(data.contact)+'</a></p>';
    out += '</section>';
    return out;
}
function renderCreatorPlatformLinks(hero) {
    if (window.LMSocial?.renderSocialButtons) return window.LMSocial?.renderSocialButtons(hero) || '';
    return '';
}

function getHeroRosterSlug(hero) {
    return String(hero?.slug || hero?.id || hero?.name || '')
        .toLocaleLowerCase('es')
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function setHeroProfileRoute(hero, mode = 'push') {
    const slug = getHeroRosterSlug(hero);
    if (!slug || mode === 'none') return;
    const route = '#roster/' + encodeURIComponent(slug);
    if (mode === 'replace') {
        history.replaceState({ ...(history.state || {}), lmRosterProfile: true }, '', route);
        return;
    }
    if (!history.state?.lmRosterBase) {
        history.pushState({ lmRosterBase: true }, '', '#roster');
    }
    history.pushState({ lmRosterProfile: true }, '', route);
}
function showRosterChapter() {
    const chapter = document.getElementById('chapter-2');
    if (!chapter) return;
    if (!chapter.classList.contains('active')) switchChapter(2, { skipHistory: true });
}

function renderHeroBrandSummary(hero) {
 const safe=escapeStatsHtml;
 const account=(hero?.accounts||[]).find(item=>item.account_type==='creator_channel')||(hero?.accounts||[])[0]||null;
 const channel=findChannelStats(hero);
 const context=getRosterBrandContext(hero,channel,account);
 const slots=getRosterBrandSlots(hero,context);
 const isVideo=account?.platform==='youtube'||hero?.creator_type==='video_creator';
 const typeLabel=isVideo?'Creador de video':hero?.creator_type==='live_streamer'?'Creador en directo':'Formato por confirmar';
 const rhythm=context.rhythm?.label||(isVideo?'No aplica':'Sin datos suficientes');
 const activity=context.lastActivity?.date?new Date(context.lastActivity.date+'T00:00:00Z').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}):'Sin actividad observada';
 const metadata=[
  ['FORMATO',typeLabel],
  ['PLATAFORMA',String(account?.platform||'No informada').toUpperCase()],
  ['RITMO',rhythm],
  ['ÚLTIMA ACTIVIDAD',isVideo?(context.yt.last_published||'Sin fecha pública'):activity]
 ];
 if(hero.schedule)metadata.push(['HORARIO DECLARADO',hero.schedule]);
 if(hero.language)metadata.push(['IDIOMA',hero.language]);
 if(hero.country)metadata.push(['PAÍS',hero.country]);
 if(hero.availability)metadata.push(['DISPONIBILIDAD',hero.availability]);
 if(hero.content_notes)metadata.push(['NOTAS DE CONTENIDO',hero.content_notes]);
 const audienceFit=hero.mediaProfile?.audience_fit?'<p class="hero-profile-audience-fit"><strong>ENCAJE DE AUDIENCIA</strong>'+safe(hero.mediaProfile.audience_fit)+'</p>':'';
 const creatorName=getHeroDisplayName(hero);
 const contactCta='<a class="hero-profile-collab-cta" href="#brand-proposal" data-creator-proposal="'+safe(creatorName)+'">PROPONER UNA COLABORACIÓN CON '+safe(creatorName)+' ↗</a>';
 return '<section class="hero-profile-brand-summary" aria-label="Ficha ejecutiva para marcas"><div class="hero-profile-brand-summary-head"><small>FICHA PARA MARCAS</small><h4>DATOS COMPARABLES DEL CANAL</h4></div>'+
  '<div class="hero-profile-brand-slots">'+slots.map(([label,value,detail])=>'<article><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong><span>'+safe(detail||'')+'</span></article>').join('')+'</div>'+
  '<dl class="hero-profile-brand-meta">'+metadata.map(([label,value])=>'<div><dt>'+safe(label)+'</dt><dd>'+safe(value)+'</dd></div>').join('')+'</dl>'+
  audienceFit+contactCta+
  '<p class="hero-profile-brand-method">Las métricas principales provienen del registro normalizado y muestran fuente, período y fecha de captura. Las cifras de Twitch son observaciones de muestreo, no analítica privada ni espectadores únicos.</p></section>';
}
const HERO_TIMELINE_LABELS={origen:'ORIGEN',canal:'SU CANAL',expediente:'EXPEDIENTE',credencial:'CREDENCIAL',proximo:'LO QUE VIENE'};
const HERO_TIMELINE_ORDER=['origen','canal','expediente','credencial','proximo'];
function formatHeroTimelineDate(value){
 const m=/^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(value||''));
 if(!m)return '';
 return m[3]?m[3]+'/'+m[2]+'/'+m[1]:m[2]+'/'+m[1];
}
function renderHeroTimeline(hero,record){
 const safe=escapeStatsHtml;
 const own=(Array.isArray(hero?.bitacora)?hero.bitacora:[]).map(item=>({...item}));
 const credentials=[...(record?.milestones||[]),...(record?.collaborations||[])].map(item=>({type:'credencial',title:item.title||'Registro',text:item.description||'',url:item.url||'',source:item.source||'',credentialLink:true}));
 const entries=[...own,...credentials].map((item,order)=>({item,order})).sort((a,b)=>{
  const rank=x=>{const at=HERO_TIMELINE_ORDER.indexOf(x.item.type);return at<0?HERO_TIMELINE_ORDER.length:at;};
  return rank(a)-rank(b)||String(a.item.date||'').localeCompare(String(b.item.date||''))||a.order-b.order;
 }).map(x=>x.item);
 if(!entries.length)return '<p class="hero-profile-empty">La bitácora de este perfil todavía no tiene entradas.</p>';
 return '<ol class="hero-timeline">'+entries.map(item=>{
  const type=HERO_TIMELINE_ORDER.includes(item.type)?item.type:'canal';
  const date=formatHeroTimelineDate(item.date);
  const linkLabel=item.credentialLink?(String(item.title||'').toLowerCase().includes('acceso a keys')?'ABRIR PLATAFORMA ↗':'Fuente ↗'):'VER VOD ↗';
  return '<li class="hero-timeline-item is-'+type+'"><span class="hero-timeline-dot" aria-hidden="true"></span><div class="hero-timeline-card"><small>'+HERO_TIMELINE_LABELS[type]+(date?' · '+safe(date):'')+'</small><strong>'+safe(item.title)+'</strong>'+(item.text?'<p>'+safe(item.text)+'</p>':'')+(item.url?'<a href="'+safe(item.url)+'" target="_blank" rel="noopener noreferrer">'+linkLabel+'</a>':'')+(item.source?'<em>Fuente: '+safe(item.source)+'</em>':'')+'</div></li>';
 }).join('')+'</ol>';
}
function renderHeroGrowthTrend(points,title,unit,sourceLabel){
 const safe=escapeStatsHtml;
 const rows=(Array.isArray(points)?points:[]).map(point=>({
  date:point.date||String(point.captured_at||'').slice(0,10),
  value:Number(point.value)
 })).filter(point=>point.date&&Number.isFinite(point.value)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
 if(!rows.length)return '<p class="hero-growth-empty">Todavía no hay capturas históricas para construir una tendencia.</p>';
 if(rows.length===1)return '<div class="hero-growth-trend"><div class="hero-growth-trend-head"><strong>'+safe(title)+'</strong><span>PRIMERA CAPTURA · '+safe(statsDate(rows[0].date))+'</span></div><p>La serie comenzó con '+safe(statsNumber(rows[0].value,0))+' '+safe(unit)+'. La variación aparecerá cuando exista otra captura de un día distinto.</p><small>Fuente: '+safe(sourceLabel)+'</small></div>';
 const first=rows[0],last=rows[rows.length-1],delta=last.value-first.value;
 const percent=first.value!==0?(delta/first.value)*100:null;
 const max=Math.max(...rows.map(point=>point.value),1);
 const sign=delta>0?'+':'';
 const bars=rows.map(point=>{
  const h=Math.max(5,Math.round(point.value/max*64));
  return '<div class="hero-growth-bar-item" title="'+safe(statsDate(point.date))+': '+safe(statsNumber(point.value,0))+' '+safe(unit)+'"><span style="height:'+h+'px" aria-label="'+safe(statsDate(point.date))+': '+safe(statsNumber(point.value,0))+'"></span><small>'+safe(point.date.slice(5).replace('-','/'))+'</small></div>';
 }).join('');
 return '<section class="hero-growth-trend"><div class="hero-growth-trend-head"><strong>'+safe(title)+'</strong><span>'+safe(rows.length)+' CAPTURAS</span></div><div class="hero-growth-trend-result"><b class="'+(delta<0?'is-negative':'is-positive')+'">'+safe(sign+statsNumber(delta,0))+'</b><span>variación desde '+safe(statsDate(first.date))+' hasta '+safe(statsDate(last.date))+(percent===null?'':' · '+safe(sign+statsNumber(percent,1))+'%')+'</span></div><div class="hero-growth-bars" role="img" aria-label="'+safe(title)+'; evolución desde '+safe(statsDate(first.date))+' hasta '+safe(statsDate(last.date))+'">'+bars+'</div><small>Fuente: '+safe(sourceLabel)+' · valores diarios, una captura por fecha</small></section>';
}
function growthDisplayNumber(value,digits=1){
 return typeof value==='number'&&Number.isFinite(value)?statsNumber(value,digits):'—';
}
function growthSigned(value,digits=0){
 if(typeof value!=='number'||!Number.isFinite(value))return '—';
 return (value>0?'+':'')+statsNumber(value,digits);
}
function renderGrowthWindowPanel(windowData,key,platform){
 const safe=escapeStatsHtml,metrics=windowData?.metrics||{},coverage=windowData?.coverage||{},comparison=windowData?.comparison||{};
 const cards=[];
 const numberCard=(label,value,note)=>cards.push({label,value,note});
 if(platform==='twitch'){
  const follower=metrics.followers||{};
  const currentFollowers=metrics.followers_total;
  const followerCurrentLabel=metrics.followers_status==='fresh'?'SEGUIDORES ACTUALES':currentFollowers!==null?'ÚLTIMA CIFRA REGISTRADA':'SEGUIDORES ACTUALES';
  const followerCurrentNote=metrics.followers_status==='fresh'
   ?'Twitch Helix · captura '+normalizedMetricCaptureLabel({capturedAt:metrics.followers_captured_at})
   :currentFollowers!==null
    ?'Dato histórico, no vigente · última captura '+normalizedMetricCaptureLabel({capturedAt:metrics.followers_captured_at})
    :'Esperando autorización OAuth de solo lectura';
  numberCard(followerCurrentLabel,currentFollowers===null?'PENDIENTE':statsNumber(currentFollowers,0),followerCurrentNote);
  numberCard('SEGUIDORES GANADOS',follower.status==='available'?growthSigned(follower.change,0):follower.status==='baseline_pending'?'BASE PENDIENTE':'SIN DATOS',
   follower.status==='available'?(follower.basis==='since_first_capture'?'Desde primera captura propia · '+(follower.change_pct===null?'variación porcentual no disponible':growthSigned(follower.change_pct,1)+'%'):'Comparación de capturas públicas del período'): 'Hace falta una base de capturas diarias de seguidores');
  numberCard('DIRECTOS OBSERVADOS',growthDisplayNumber(metrics.streams_observed,0),'IDs de stream distintos detectados por Helix');
  numberCard('DIRECTOS / SEMANA',growthDisplayNumber(metrics.streams_per_week,2),'Ritmo calculado sobre '+windowData.days+' días');
  numberCard('DÍAS ACTIVOS',growthDisplayNumber(metrics.active_days,0)+' / '+windowData.days,'Días UTC con al menos una muestra en directo');
  numberCard('HORAS OBSERVADAS',growthDisplayNumber(metrics.observed_live_hours,1)+' h','Intervalos observados del mismo stream; no son horas oficiales del VOD');
  numberCard('HORAS OBSERVADAS / SEMANA',growthDisplayNumber(metrics.observed_hours_per_week,2)+' h','Promedio semanal estimado desde los intervalos observados');
  numberCard('SEMANAS ACTIVAS',growthDisplayNumber(metrics.active_weeks,0)+' semanas','Semanas calendario con al menos una muestra en directo');
  numberCard('PROMEDIO MUESTREADO',metrics.average_viewers_sampled===null?'SIN DATOS':growthDisplayNumber(metrics.average_viewers_sampled,1),'Muestras públicas de espectadores; no es CCV oficial');
  numberCard('PICO MUESTREADO',metrics.peak_viewers_sampled===null?'SIN DATOS':growthDisplayNumber(metrics.peak_viewers_sampled,0),'Mayor lectura puntual guardada por el colector');
 }else if(platform==='youtube'){
  const subs=metrics.subscribers_gained||{},views=metrics.views_gained||{},videos=metrics.videos_published||{};
  const value=item=>item.status==='available'?growthSigned(item.change,0):item.status==='baseline_pending'?'BASE PENDIENTE':'SIN DATOS';
  numberCard('SUSCRIPTORES GANADOS',value(subs),'Diferencia de capturas públicas diarias');
  numberCard('VISUALIZACIONES GANADAS',value(views),'Variación acumulada del canal en el período');
  numberCard('VIDEOS PUBLICADOS',value(videos),'Diferencia de contador del canal');
  numberCard('RITMO DE PUBLICACIÓN',videos.status==='available'?growthDisplayNumber(videos.change*7/windowData.days,2)+' videos / semana':'BASE PENDIENTE','Frecuencia calculada sobre '+windowData.days+' días');
 }
 const cardsHtml=cards.map(item=>'<article class="hero-growth-card"><small>'+safe(item.label)+'</small><strong>'+safe(item.value)+'</strong><span>'+safe(item.note)+'</span></article>').join('');
 const periodLabel=windowData?.period?.from&&windowData?.period?.to
  ?statsDate(String(windowData.period.from).slice(0,10))+' — '+statsDate(String(windowData.period.to).slice(0,10))
  :'período no informado';
 const lastObserved=coverage.last_observed_at?' · ÚLTIMA MUESTRA '+normalizedMetricCaptureLabel({capturedAt:coverage.last_observed_at}):' · SIN CAPTURAS EN EL PERÍODO';
 const coverageText='PERÍODO · '+safe(periodLabel)+' · COBERTURA · '+safe(coverage.sampled_days??0)+' / '+safe(coverage.expected_days??windowData.days)+' días · '+safe(growthDisplayNumber(coverage.coverage_pct,1))+'%'+safe(lastObserved);
 const coverageNote=coverage.status==='sufficient'
  ?'Cobertura suficiente para comparar con el período previo.'
  :'Cobertura parcial: los datos disponibles se muestran, pero no se comparan como si fueran una ventana completa.';
 const comparisonHtml=comparison.status==='available'
  ?'<div class="hero-growth-comparison"><strong>VS. LOS '+safe(windowData.days)+' DÍAS ANTERIORES</strong><div>'+Object.entries(comparison.metrics||{}).map(([metric,item])=>'<span><b>'+safe(metric==='streams_observed'?'Directos':metric==='active_days'?'Días activos':metric==='observed_live_hours'?'Horas observadas':metric==='average_viewers_sampled'?'Promedio muestreado':metric==='followers_gained'?'Seguidores ganados':metric==='subscribers_gained'?'Suscriptores':metric==='views_gained'?'Visualizaciones':'Videos')+'</b><strong>'+safe(growthSigned(item.change,metric==='average_viewers_sampled'?1:0))+'</strong></span>').join('')+'</div><small>Variación frente al período anterior de igual duración. Las unidades se mantienen por separado.</small></div>'
  :'<p class="hero-growth-comparison-pending">Comparación anterior no disponible: '+safe(comparison.status==='insufficient_coverage'?'falta cobertura histórica suficiente en ambos períodos.':'faltan capturas de referencia.')+'</p>';
 return '<section class="hero-growth-window-panel" data-growth-panel="'+safe(key)+'" '+(key==='30d'?'':'hidden')+'><div class="hero-growth-grid">'+cardsHtml+'</div><div class="hero-growth-coverage"><strong>'+coverageText+'</strong><span>'+safe(coverageNote)+'</span></div>'+comparisonHtml+'</section>';
}
function renderGrowthContentPerformance(content,platform){
 const safe=escapeStatsHtml;
 const items=platform==='youtube'?(content?.videos||[]):(content?.top_clips||[]);
 if(!items.length)return '<p class="hero-growth-empty">Todavía no hay contenido con métricas públicas suficientes para destacar.</p>';
 return '<div class="hero-growth-content-grid">'+items.slice(0,5).map(item=>{
  const change=item.views_gained?.['30d'];
  const changeLabel=change?.status==='available'?'+'+statsNumber(change.change,0)+' vistas desde '+(change.basis==='since_first_capture'?'la primera captura':'el inicio de la ventana'):change?.status==='baseline_pending'?'Evolución pendiente de una segunda captura':'Sin base histórica';
  const extra=platform==='youtube'
   ?'<small>Me gusta: '+safe(item.likes??'—')+' · Comentarios: '+safe(item.comments??'—')+' · Interacción pública: '+safe(item.public_interaction_rate_pct===null?'—':statsNumber(item.public_interaction_rate_pct,1)+'%')+'</small>'
   :'';
  return '<article class="hero-growth-content-card"><div><small>'+(platform==='youtube'?'YOUTUBE · VIDEO':'TWITCH · CLIP')+'</small><strong>'+safe(item.title||'Contenido destacado')+'</strong></div><b>'+safe(statsNumber(item.views,0))+' visualizaciones</b><span>'+safe(changeLabel)+'</span>'+extra+'<a href="'+safe(item.url)+'" target="_blank" rel="noopener noreferrer">VER CONTENIDO ↗</a></article>';
 }).join('')+'</div>';
}
function renderGrowthCollaborations(data){
 const safe=escapeStatsHtml,heroes=Array.isArray(heroesData)?heroesData:[];
 const cases=data?.shared_cases||[],results=data?.reported_results||[];
 const name=id=>getHeroDisplayName(heroes.find(hero=>hero.id===id)||{name:id||'Integrante'});
 const caseHtml=cases.map(item=>'<article class="hero-growth-case"><div class="hero-growth-case-head"><strong>'+safe(item.title)+'</strong><span>'+safe(item.date?statsDate(item.date):'Fecha no informada')+'</span></div><p>Participantes: '+safe((item.participants||[]).map(name).join(' · '))+'</p><p>Entregables enlazados: '+safe(item.deliverables?.length||0)+' VOD</p><div>'+(item.deliverables||[]).map(link=>'<a href="'+safe(link.url)+'" target="_blank" rel="noopener noreferrer">'+safe(name(link.creator_id))+' · VER VOD ↗</a>').join('')+'</div><small>Fuente: '+safe(item.source||'Bitácora')+' · caso documentado; no representa alcance total.</small></article>').join('');
 const resultHtml=results.map(item=>{
  const evidence=item.verification_status==='creator_reported'?'DATO APORTADO POR EL CREADOR':item.verification_status==='platform_verified'?'FUENTE DE PLATAFORMA':'FUENTE PÚBLICA';
  return '<article class="hero-growth-case hero-growth-case-result"><div class="hero-growth-case-head"><strong>'+safe(item.title)+'</strong><span>'+safe(item.date?statsDate(item.date):'Fecha no informada')+'</span></div><span class="hero-growth-evidence">'+safe(evidence)+'</span><p>'+safe(item.format||'Colaboración documentada')+' · participantes: '+safe((item.participants||[]).map(name).join(' · '))+'</p><div class="hero-growth-result-grid">'+(item.metrics||[]).map(metric=>'<span><small>'+safe(metric.label)+'</small><b>'+safe(statsNumber(metric.value,Number.isInteger(metric.value)?0:1))+'</b><em>'+safe(metric.unit)+'</em></span>').join('')+'</div><small>Alcance del registro: '+safe(name(item.channel_scope))+' · fuente: '+safe(item.source)+'. No se suman audiencias entre canales.</small>'+(item.note?'<p>'+safe(item.note)+'</p>':'')+'</article>';
 }).join('');
 if(!caseHtml&&!resultHtml)return '<p class="hero-growth-empty">Todavía no hay colaboraciones o resultados medibles documentados en este expediente.</p>';
 // Los vínculos de partners y plataformas de acceso ya se muestran en Recorrido.
 // Crecimiento conserva solo casos, entregables y resultados; evita duplicar esos enlaces.
 return '<div class="hero-growth-collaboration-grid">'+caseHtml+resultHtml+'</div>';
}
function renderGrowthAdvancedAudience(report){
 const safe=escapeStatsHtml;
 if(report?.status!=='authorized_public_aggregate'){
  return '<section class="hero-growth-audience"><strong>AUDIENCIA AVANZADA · INFORME DEL CREADOR</strong><p>No hay datos privados autorizados para publicar. Este apartado solo se completa con un informe agregado, su período y la autorización explícita del creador.</p><small>No se solicitan ni publican identidades, datos individuales ni segmentos con menos de cinco observaciones.</small></section>';
 }
 return '<section class="hero-growth-audience"><strong>AUDIENCIA AVANZADA · DATOS AGREGADOS AUTORIZADOS</strong><span>'+safe(report.source)+' · '+safe(report.captured_at?normalizedMetricCaptureLabel({capturedAt:report.captured_at}):'fecha no informada')+'</span><div class="hero-growth-result-grid">'+(report.metrics||[]).map(metric=>'<span><small>'+safe(metric.label)+'</small><b>'+safe(statsNumber(metric.value,Number.isInteger(metric.value)?0:1))+'</b><em>'+safe(metric.unit)+'</em></span>').join('')+'</div>'+(report.breakdowns?.length?'<div class="hero-growth-breakdowns">'+report.breakdowns.map(item=>'<span>'+safe(item.dimension==='age_range'?'Edad':item.dimension==='country'?'País':'Región')+': <b>'+safe(item.label)+'</b> · '+safe(statsNumber(item.share_pct,1))+'% ('+safe(item.sample_size)+' observaciones)</span>').join('')+'</div>':'')+'<small>'+safe(report.note)+'</small></section>';
}
function renderHeroGrowthChapter(hero,channel,sully){
 const safe=escapeStatsHtml,account=(hero?.accounts||[]).find(item=>item?.account_type==='creator_channel')||(hero?.accounts||[])[0]||null;
 const creator=creatorMetricsData?.creators?.[creatorRecordKey(hero)]||{};
 const growth=creator.growth||{},windows=growth.windows||{},platform=account?.platform||growth.platform;
 const selectedWindow=windows['30d'];
 const windowTabs=['7d','30d','90d'].map(key=>'<button type="button" class="hero-growth-window-tab'+(key==='30d'?' is-active':'')+'" role="tab" aria-selected="'+(key==='30d'?'true':'false')+'" aria-controls="growth-window-'+key+'" data-growth-window="'+key+'" onclick="activateHeroGrowthWindow(this)">'+key.toUpperCase()+'</button>').join('');
 const windowPanels=Object.entries(windows).map(([key,value])=>renderGrowthWindowPanel(value,key,platform).replace('data-growth-panel="'+key+'"','id="growth-window-'+key+'" data-growth-panel="'+key+'"')).join('');
 const coverageHtml=Object.keys(windows).length?'<section class="hero-growth-periods"><div class="hero-growth-period-head"><div><strong>EVOLUCIÓN Y CONSISTENCIA</strong><span>Período actual frente al anterior, cuando la cobertura lo permite</span></div><div class="hero-growth-window-tabs" role="tablist" aria-label="Seleccionar período de crecimiento">'+windowTabs+'</div></div>'+windowPanels+'</section>':'<p class="hero-growth-empty">La plataforma principal todavía no dispone de historial suficiente para construir ventanas comparables.</p>';
 const content= growth.content_performance||{};
 const contentCapture=content?.captured_at?normalizedMetricCaptureLabel({capturedAt:content.captured_at}):'captura no disponible';
 const contentStatus=content?.status==='error'||content?.status==='unavailable'
  ?'Última captura conservada; el recolector no pudo actualizar en el último intento.'
  :'Captura de referencia: '+contentCapture+'.';
 const contentHtml='<section class="hero-growth-content"><header><div><strong>RENDIMIENTO DEL CONTENIDO</strong><span>Contenido público destacado y crecimiento desde la primera captura propia</span></div><span class="hero-growth-source-stamp">'+safe(platform==='youtube'?'YOUTUBE DATA API':'TWITCH HELIX')+'</span></header>'+renderGrowthContentPerformance(content,platform)+'<small>'+safe(contentStatus)+' '+safe(content.methodology||'Las visualizaciones históricas comienzan cuando el recolector registra la primera observación diaria.')+'</small></section>';
 const collab=growth.collaborations||{};
 const collaborationHtml='<section class="hero-growth-collaborations"><header><div><strong>COLABORACIONES Y RESULTADOS</strong><span>Casos documentados, entregables y cifras individuales con su fuente</span></div></header>'+renderGrowthCollaborations(collab)+'</section>';
 const audienceHtml=renderGrowthAdvancedAudience(growth.advanced_audience);
 const summary=sully?.annual_summary_2026||sully?.summary||{};
 const externalStatus=sully?.status||'pending';
 const period=sully?.period?.start_date&&sully?.period?.end_date
  ?statsDate(sully.period.start_date)+' — '+statsDate(sully.period.end_date)
  :sully?.period?.label||'Período no informado';
 const externalMetrics=[
  ['SEGUIDORES GANADOS',summary.followers_gained??summary.followers_gain_reported,'seguidores'],
  ['DIRECTOS',summary.streams??summary.streams_count,'sesiones'],
  ['HORAS TRANSMITIDAS',summary.hours_streamed??summary.airtime_hours??(summary.airtime_minutes!=null?summary.airtime_minutes/60:null),'horas'],
  ['HORAS VISTAS',summary.hours_watched,'horas'],
  ['PROMEDIO DE AUDIENCIA',summary.average_viewers??summary.average_viewers_duration_weighted,'espectadores'],
  ['PICO DE AUDIENCIA',summary.peak_viewers,'espectadores']
 ].filter(item=>item[1]!==null&&item[1]!==undefined&&Number.isFinite(Number(item[1])));
 const sullyLabel=externalStatus==='user_supplied_summary'||externalStatus==='user_supplied_annual_summary'
  ?'RESUMEN APORTADO · NO VERIFICADO POR API'
  :externalStatus==='partial'?'REGISTRO PARCIAL · FUENTE EXTERNA':'SIN HISTORIAL DISPONIBLE';
 const sullyNote=externalStatus==='pending'
  ?'No hay un registro histórico suficiente para este canal en SullyGnome.'
  :externalStatus==='user_supplied_summary'||externalStatus==='user_supplied_annual_summary'
   ?'Resumen transcrito de información aportada. Se conserva separado de las capturas automáticas.'
   :'Referencia histórica de SullyGnome. Su período y cobertura no representan una lectura actual ni se mezclan con las métricas propias.';
 const sullyHtml=externalMetrics.length?'<section class="hero-growth-source"><div><strong>SULLYGNOME · HISTORIAL EXTERNO</strong><span>'+safe(sullyLabel)+' · '+safe(period)+'</span></div><div class="hero-growth-grid">'+externalMetrics.map(([label,value,unit])=>'<article class="hero-growth-card"><small>'+safe(label)+'</small><strong>'+safe(statsNumber(Number(value),Number.isInteger(Number(value))?0:1))+'</strong><span>'+safe(unit)+'</span></article>').join('')+'</div><p>'+safe(sullyNote)+'</p>'+(sully?.source_url?'<a href="'+safe(sully.source_url)+'" target="_blank" rel="noopener noreferrer">CONSULTAR FUENTE ORIGINAL ↗</a>':'')+'</section>'
  :'<section class="hero-growth-source"><div><strong>SULLYGNOME · HISTORIAL EXTERNO</strong><span>'+safe(sullyLabel)+' · '+safe(period)+'</span></div><p>'+safe(sullyNote)+'</p>'+(sully?.source_url?'<a href="'+safe(sully.source_url)+'" target="_blank" rel="noopener noreferrer">CONSULTAR FUENTE ORIGINAL ↗</a>':'')+'</section>';
 return '<section class="hero-growth-chapter" aria-label="Capítulo Crecimiento"><header class="hero-growth-heading"><div><small>BITÁCORA · CAPÍTULO 02</small><h4>CRECIMIENTO</h4><p>Audiencia, constancia, rendimiento del contenido y resultados colaborativos con trazabilidad.</p></div><span class="hero-growth-stamp">'+safe(platform==='youtube'?'YOUTUBE':platform==='twitch'?'TWITCH':'MULTIPLATAFORMA')+'</span></header>'+coverageHtml+contentHtml+collaborationHtml+audienceHtml+sullyHtml+'<p class="hero-growth-method">Metodología: las ventanas comparan períodos equivalentes de 7, 30 y 90 días y exigen al menos 65% de cobertura diaria en ambos tramos. Twitch usa muestras públicas de Helix; YouTube usa capturas públicas de Data API. Las estimaciones de observación no son analítica privada. Los reportes de panel se identifican como aportados por el creador. No se suman audiencias entre canales.</p></section>';
}
function activateHeroGrowthWindow(button){
 const wrap=button.closest('.hero-growth-periods');
 if(!wrap)return;
 wrap.querySelectorAll('[data-growth-window]').forEach(tab=>{
  const active=tab===button;
  tab.classList.toggle('is-active',active);
  tab.setAttribute('aria-selected',active?'true':'false');
 });
 wrap.querySelectorAll('[data-growth-panel]').forEach(panel=>{
  const active=panel.dataset.growthPanel===button.dataset.growthWindow;
  panel.hidden=!active;
 });
}
function activateHeroBitacoraView(button){
 const wrap=button.closest('.hero-bitacora-chapters');
 if(!wrap)return;
 wrap.querySelectorAll('[data-bitacora-view]').forEach(tab=>{
  const active=tab===button;
  tab.classList.toggle('is-active',active);
  tab.setAttribute('aria-selected',active?'true':'false');
  tab.tabIndex=active?0:-1;
 });
 wrap.querySelectorAll('[data-bitacora-panel]').forEach(panel=>{
  const active=panel.dataset.bitacoraPanel===button.dataset.bitacoraView;
  panel.hidden=!active;
  panel.classList.toggle('is-active',active);
 });
}

function renderHeroProfileTabs(hero) {
 const safe=escapeStatsHtml,record=getCreatorRecord(hero),channel=findChannelStats(hero),sullyChannel=findSullyChannel(hero);
 const clips=twitchClipsData?.creators?.[creatorRecordKey(hero)]?.clips||[];
 const games=getMostPlayedGames(hero,channel,sullyChannel);
 const gameHtml=games.length?'<section class="hero-profile-integrated-games"><h4>JUEGOS Y RITMO</h4><div class="hero-profile-game-grid">'+games.map(name=>'<article><strong>'+safe(name)+'</strong></article>').join('')+'</div></section>':'';

 const profileRatings=hero.mediaProfile?.ratings||hero.mediaProfile?.scorecard||hero.scorecard||{};
 const ratingDefinitions=[['CONSTANCIA','constancia'],['CARISMA','carisma'],['GAMEPLAY','gameplay'],['COMUNIDAD','comunidad'],['HYPE','hype']];
 const ratingHtml=ratingDefinitions.map(([label,key])=>{const raw=profileRatings[key]??profileRatings[label]??null;const value=raw==null?null:Number(raw);const valid=Number.isFinite(value)&&value>=0&&value<=100;return '<div class="comic-profile-rating"><div><strong>'+label+'</strong><b>'+(valid?Math.round(value):'—')+'</b></div><div class="comic-profile-rating-track" role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100"'+(valid?' aria-valuenow="'+Math.round(value)+'"':'')+'><span style="width:'+(valid?Math.round(value):0)+'%"></span></div></div>';}).join('');
 const accountForAction=(hero.accounts||[]).find(item=>item.account_type==='creator_channel')||(hero.accounts||[])[0]||null;
 const profileChannelUrl=accountForAction?.url||hero.twitch||hero.youtube||'';
 const overview='<div class="hero-profile-overview"><p class="hero-profile-bio">'+safe(hero.bio||'Presentación personal pendiente de completar.')+'</p>'+gameHtml+'</div>'
 const clipsHtml=clips.length?'<div class="hero-profile-clips-grid">'+clips.slice(0,4).map(clip=>'<article class="hero-profile-clip">'+(clip.thumbnail_url?'<a href="'+safe(clip.url)+'" target="_blank" rel="noopener noreferrer"><img src="'+safe(clip.thumbnail_url)+'" alt="" loading="lazy"></a>':'')+'<div><strong>'+safe(clip.title||'Clip destacado')+'</strong><small>'+safe(statsNumber(clip.view_count,0))+' visualizaciones · '+safe(clip.creator_name||'Creador')+'</small><a href="'+safe(clip.url)+'" target="_blank" rel="noopener noreferrer">VER CLIP ↗</a></div></article>').join('')+'</div>':'<p class="hero-profile-empty">'+(twitchClipsLoadError?'No se pudo cargar la captura de clips.':'Todavía no hay clips públicos disponibles para este canal en la ventana consultada.')+'</p>';
 const logHtml=renderHeroTimeline(hero,record);
 const growthHtml=renderHeroGrowthChapter(hero,channel,sullyChannel);
 const editorial=hero.mediaProfile||{},formats=editorial.formats||hero.areas||[];
 const brandHtml='<div class="hero-profile-brand"><h4>IDENTIDAD Y PROPUESTA EDITORIAL</h4><p>'+safe(editorial.editorial||hero.bio||'Descripción comercial pendiente de completar.')+'</p><h4>TERRITORIOS Y ESPECIALIDADES</h4>'+(formats.length?'<ul class="hero-profile-detail-list">'+formats.map(x=>'<li><strong>'+safe(x)+'</strong></li>').join('')+'</ul>':'<p class="hero-profile-empty">Especialidades pendientes de confirmar.</p>')+'<h4>FORMATOS Y OPORTUNIDADES</h4>'+(editorial.opportunities?.length?'<ul class="hero-profile-detail-list">'+editorial.opportunities.map(x=>'<li><strong>'+safe(x)+'</strong></li>').join('')+'</ul>':'<p class="hero-profile-empty">Formatos por conversar con el creador.</p>')+'<p class="hero-profile-method">'+safe(editorial.disclaimer||'Oportunidades potenciales; no campañas contratadas.')+'</p>'+'</div>';
 const tabs=[['perfil','PERFIL'],['estadisticas','ESTADÍSTICAS'],['clips','CLIPS'],['bitacora','BITÁCORA']];
 const panels=['<section class="hero-profile-tab-panel is-active" id="profile-tab-perfil" role="tabpanel">'+overview+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-estadisticas" role="tabpanel" hidden><h4>ESTADÍSTICAS · RENDIMIENTO</h4>'+renderStatsDashboard(hero,channel,sullyChannel)+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-clips" role="tabpanel" hidden><h4>CLIPS DESTACADOS · MÁXIMO 4</h4>'+clipsHtml+'</section>','<section class="hero-profile-tab-panel" id="profile-tab-bitacora" role="tabpanel" hidden><h4>BITÁCORA · SU RECORRIDO EN LA LEGIÓN</h4><div class="hero-bitacora-chapters"><div class="hero-bitacora-subtabs" role="tablist" aria-label="Capítulos de la Bitácora"><button type="button" class="hero-bitacora-subtab is-active" role="tab" aria-selected="true" aria-controls="bitacora-panel-recorrido" data-bitacora-view="recorrido" onclick="activateHeroBitacoraView(this)">RECORRIDO</button><button type="button" class="hero-bitacora-subtab" role="tab" aria-selected="false" aria-controls="bitacora-panel-crecimiento" tabindex="-1" data-bitacora-view="crecimiento" onclick="activateHeroBitacoraView(this)">CRECIMIENTO</button><button type="button" class="hero-bitacora-subtab" role="tab" aria-selected="false" aria-controls="bitacora-panel-marcas" tabindex="-1" data-bitacora-view="marcas" onclick="activateHeroBitacoraView(this)">PROPUESTA COMERCIAL</button></div><div id="bitacora-panel-recorrido" data-bitacora-panel="recorrido" class="hero-bitacora-subpanel is-active">'+logHtml+'</div><div id="bitacora-panel-crecimiento" data-bitacora-panel="crecimiento" class="hero-bitacora-subpanel" hidden>'+growthHtml+'</div><div id="bitacora-panel-marcas" data-bitacora-panel="marcas" class="hero-bitacora-subpanel" hidden><h4>PROPUESTA COMERCIAL · DATOS Y FORMATOS</h4>'+renderHeroBrandSummary(hero)+brandHtml+((hero.id==='moriartys'||hero.id==='rod3r1k')?'<section class="hero-profile-epic-codes"><h4>CÓDIGO DE CREADOR · EPIC GAMES</h4><div data-epic-profile-code="'+hero.id+'">'+renderEpicCreatorCodeCard(hero.id==='moriartys'?'moriartys':'rod3r1k','roster-profile')+'</div></section>':'')+'</div></div></section>'].join('');
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
    if (hero.accent_color) { page.style.setProperty('--hero-accent', hero.accent_color); page.style.setProperty('--creator-color', hero.accent_color); }
    const filteredProfiles = getRosterFilteredEntries();
    const profilePosition = filteredProfiles.findIndex(entry => entry.index === index);
    const previousDisabled = profilePosition <= 0;
    const nextDisabled = profilePosition < 0 || profilePosition >= filteredProfiles.length - 1;
    const liveStatus = getNormalizedLiveStatus(hero);
    const isLive = liveStatus.state === 'live';
    const currentViewers = isLive ? getNormalizedCreatorMetric(hero,'current_viewers','twitch') : null;
    const liveViewersLabel = currentViewers?.state === 'available' ? ' · ' + escapeStatsHtml(currentViewers.value) + ' VIENDO' : '';
    const liveBadge = '<span class="hero-profile-live ' + (isLive ? 'is-live' : 'is-unknown') + '">' + (isLive ? '● EN DIRECTO' + liveViewersLabel : escapeStatsHtml(liveStatus.label)) + '</span>';
    const portrait = hero.portrait || hero.img || '';
    const socials = renderCreatorPlatformLinks(hero);
    const profileAccount = (hero.accounts || []).find(item => item.account_type === 'creator_channel') || (hero.accounts || [])[0] || null;
    const profileChannel = findChannelStats(hero);
    const profileRhythm = profileAccount?.platform === 'twitch' && window.LMBrand
        ? window.LMBrand.computeRhythm(profileChannel).label
        : profileAccount?.platform === 'youtube' ? 'NO APLICA · VIDEO' : 'SIN DATOS SUFICIENTES';
    const rhythm = profileRhythm;
    const account = (hero.accounts || []).find(item => item.account_type === 'creator_channel') || (hero.accounts || [])[0] || null;
    const channelUrl = account?.url || hero.twitch || hero.youtube || '';
    const channelCta = channelUrl ? '<a class="comic-profile-channel-cta" href="' + escapeStatsHtml(channelUrl) + '" target="_blank" rel="noopener noreferrer">' + (isLive ? '● VER CANAL EN VIVO ↗' : 'VER CANAL ↗') + '</a>' : '';
    const topLine = '<div class="hero-profile-reference-head comic-profile-head"><button class="comic-profile-breadcrumb" type="button" onclick="closeHeroProfile()">LEGIÓN › ROSTER › ' + escapeStatsHtml(getHeroDisplayName(hero)) + '　← VOLVER AL ROSTER</button><div class="comic-profile-head-right"><span class="comic-profile-rhythm">RITMO: ' + rhythm + '</span>' + liveBadge + channelCta + '</div></div>';
    const leftRail = '<aside class="hero-profile-sidebar comic-profile-sidebar"><div class="hero-profile-id-card"><div class="hero-profile-id-image">' +
        (portrait ? '<img src="' + escapeStatsHtml(portrait) + '" alt="Fotografía de ' + escapeStatsHtml(getHeroDisplayName(hero)) + '" loading="eager" decoding="async">' : '<div class="hero-profile-art-fallback">RETRATO NO DISPONIBLE</div>') +
        '<span class="hero-profile-id-live">' + liveBadge + '</span><div class="hero-profile-id-name"><small>' + escapeStatsHtml(hero.codename || 'INTEGRANTE DE LA LEGIÓN') + '</small><strong>' + escapeStatsHtml(getHeroDisplayName(hero)) + '</strong><span>' + escapeStatsHtml((hero.areas || []).slice(0,3).join(' · ') || hero.characterRole || 'Creador de contenido') + '</span></div></div></div>' +
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
    // Alinear la cabecera del expediente con el encabezado fijo del sitio.
    // El desplazamiento instantáneo evita que la animación deje el perfil debajo del header
    // mientras el usuario ya está interactuando con las pestañas.
    const profileHead = page.querySelector('.comic-profile-head');
    const stickyHeader = document.querySelector('body > header');
    const headerBottom = stickyHeader?.getBoundingClientRect().bottom || 0;
    const profileHeadTop = profileHead?.getBoundingClientRect().top ?? page.getBoundingClientRect().top;
    const rootScroller = document.documentElement;
    const previousScrollBehavior = rootScroller.style.scrollBehavior;
    rootScroller.style.scrollBehavior = 'auto';
    window.scrollTo({ top: Math.max(0, window.scrollY + profileHeadTop - headerBottom - 12), behavior: 'instant' });
    rootScroller.style.scrollBehavior = previousScrollBehavior;
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
    const hashChapter = typeof chapterFromHash === 'function' ? chapterFromHash(hash) : null;
    if (hashChapter !== null) switchChapter(hashChapter, { skipHistory: true });
    else if (!hash || hash === '#') switchChapter(0, { skipHistory: true });
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
 const role=hero.characterRole||'INTEGRANTE DE LA LEGIÓN';
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const displayName=getHeroDisplayName(hero);
 const page=(chapter,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO '+chapter+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE '+safe(displayName)+' · PÁGINA 0'+chapter+'</small><h2>'+title+'</h2></div>'+body+'<footer class="comic-page-footer"><span>'+safe(displayName)+' · ARCHIVO INDIVIDUAL</span><b>0'+chapter+' / 04</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'S/N')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de '+safe(displayName)+'"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>'+safe(displayName)+'</h2><b>'+safe(hero.series||'01')+'</b></div><p class="comic-cover-subtitle">'+safe(identity)+' · '+safe(role)+'</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL HÉROE</b></div><p>'+safe(hero.bio||'Presentación individual pendiente de confirmación.')+'</p><p class="comic-panel-caption">Expediente individual. Los datos no disponibles se identifican como pendientes de verificación.</p></section>'+renderEpicCreatorProfileBadge(hero)+'<footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
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
                    renderStatsPlatformDirectory();
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
            if ([0, 10].includes(Number(chapterNum))) add('institute-stats', loadInstituteStats);

            // Roster, estadísticas y mapa comparten las fuentes de perfiles y métricas.
            if ([2, 3, 13].includes(Number(chapterNum))) {
                const rosterReady = ensureRosterResources();
                jobs.push(rosterReady);
                // Las fichas de Estadísticas necesitan identidad, roles y horarios del roster.
                // Esperar a que se resuelva evita que la primera captura pinte fichas incompletas.
                if ([2, 3].includes(Number(chapterNum))) jobs.push(rosterReady.then(() => loadInstituteStats()));
                add('sullygnome', loadSullyGnomeData);
                add('twitch-metrics', loadTwitchMetricsData);
                add('creator-records', loadCreatorRecords);
                add('platform-stats', loadPlatformStatsData);
                add('twitch-clips', loadTwitchClipsData);
            }

            // EN VIVO: perfiles, clips públicos y videos de YouTube alimentan la programación.
            if (Number(chapterNum) === 10) {
                jobs.push(ensureRosterResources());
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

            return Promise.allSettled(jobs).then(results => {
                if ([2, 3, 13].includes(Number(chapterNum)) && Array.isArray(heroesData) && heroesData.length) refreshRosterMetricsViews();
                if (Number(chapterNum) === 10) renderLiveProgram();
                return results;
            });
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

        // Anclajes por nombre (#roster, #estadisticas…). Los #chapter-N viejos siguen funcionando como alias.
        const CHAPTER_SLUGS = { 1: 'origen', 11: 'quienes-somos', 2: 'roster', 3: 'estadisticas', 12: 'colaboraciones', 10: 'en-vivo', 9: 'comunidad', 8: 'alianzas', 6: 'reclutamiento', 13: 'mapa' };
        const SLUG_TO_CHAPTER = Object.fromEntries(Object.entries(CHAPTER_SLUGS).map(([num, slug]) => [slug, Number(num)]));
        SLUG_TO_CHAPTER.arsenal = 12;
        function chapterFromHash(hash) {
            const value = String(hash || '');
            if (value.startsWith('#chapter-')) {
                let num = Number(value.slice('#chapter-'.length));
                if (num === 5) num = 12; // Arsenal quedó dentro de Colaboraciones
                return Number.isFinite(num) ? num : null;
            }
            const slug = value.replace(/^#/, '').split(/[/?]/)[0];
            return Object.prototype.hasOwnProperty.call(SLUG_TO_CHAPTER, slug) ? SLUG_TO_CHAPTER[slug] : null;
        }
        window.chapterFromHash = chapterFromHash;
        function switchChapter(chapterNum, options = {}) {
            // Arsenal se fusionó con Colaboraciones: los enlaces viejos al capítulo 5 llevan al catálogo.
            if (Number(chapterNum) === 5) {
                chapterNum = 12;
                if (typeof options.afterEnter !== 'function') {
                    options = Object.assign({}, options, { afterEnter: () => document.getElementById('collab-catalog')?.scrollIntoView({ block: 'start', behavior: 'auto' }) });
                }
            }
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
                const targetHash = Number(chapterNum) === 0 ? '#' : '#' + (CHAPTER_SLUGS[Number(chapterNum)] || 'chapter-' + chapterNum);
                if (location.hash !== targetHash) {
                    try { history.pushState({ lmChapter: Number(chapterNum) }, '', targetHash); } catch (error) { /* historial restringido */ }
                }
            }
            const current = document.querySelector('.chapter-panel.active');
            if (current === panel) {
                if (typeof options.afterEnter === 'function') {
                    window.requestAnimationFrame(() => options.afterEnter(panel));
                }
                return;
            }
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
            if (options.scrollBehavior === 'auto') {
                // Los saltos entre registros no deben competir con el scroll suave global.
                const rootScroller = document.documentElement;
                const previousScrollBehavior = rootScroller.style.scrollBehavior;
                rootScroller.style.scrollBehavior = 'auto';
                window.scrollTo({ top: 0, behavior: 'auto' });
                // Mantener el modo inmediato durante el siguiente frame (scrollIntoView del enlace destino).
                window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
                    rootScroller.style.scrollBehavior = previousScrollBehavior;
                }));
            } else {
                window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            }
            // Los enlaces entre registros esperan a que termine la animación de entrada del capítulo.
            if (typeof options.afterEnter === 'function') {
                const entranceAnimations = typeof panel.getAnimations === 'function'
                    ? panel.getAnimations().filter(animation => animation.effect?.target === panel && animation.playState === 'running')
                    : [];
                const revealTarget = () => window.requestAnimationFrame(() => options.afterEnter(panel));
                if (entranceAnimations.length) {
                    Promise.allSettled(entranceAnimations.map(animation => animation.finished)).then(revealTarget);
                } else {
                    revealTarget();
                }
            }
        }
        const rosterContainer = document.getElementById('roster-container');
        function initializeLegionApp() {
            const hash = location.hash || '';
            const hashChapter = chapterFromHash(hash);
            if (hash === '#roster' || hash.startsWith('#roster?') || hash.startsWith('#roster/') || hash.startsWith('#expediente-')) {
                switchChapter(2, { skipHistory: true });
            } else if (hashChapter !== null && document.getElementById('chapter-' + hashChapter)) {
                switchChapter(hashChapter, { skipHistory: true });
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
