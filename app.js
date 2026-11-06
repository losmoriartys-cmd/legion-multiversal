        // Fuente de verdad del roster: editar role para cambiar jerarquía; completar powers y log con datos confirmados.
        let heroesData = [];

async function loadRosterData() {
    const response = await fetch('./roster-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar roster-data.json (' + response.status + ').');
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.heroes) || payload.heroes.length === 0) {
        throw new Error('roster-data.json no contiene integrantes válidos.');
    }
    heroesData = payload.heroes;
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
function renderLosMoriartysSullyPilot(channel){
 const games=[
  {name:'Enshrouded',av:26,air:'4 h',fg:5,fph:'1',hw:null},
  {name:'Minecraft',av:34,air:'3 h',fg:7,fph:'2',hw:null},
  {name:'Fortnite',av:27,air:'4 h',fg:5,fph:'1',hw:'103',share:'22,7%'},
  {name:'Supercar Collection Together',av:31,air:'2 h',fg:null,fph:null,hw:null},
  {name:'Marvel Rivals',av:33,air:'2 h',fg:3,fph:'2',hw:null}
 ];
 const lifetime=[['Seguidores','1.145','Total actual del canal compartido · 05 nov 2026'],['Pico histórico','101','07 oct 2026'],['Días activos','335','Lifetime · dato aportado'],['Airtime acumulado','348 h','Lifetime · dato aportado'],['Bans','0','Lifetime · dato aportado']];
 const periodMetrics=[['HORAS VISTAS','860 h','últimos 30 días'],['PROMEDIO DE ESPECTADORES','26','últimos 30 días'],['PICO DE ESPECTADORES','101','7 oct 2026 · dentro del período'],['NUEVOS SEGUIDORES','+49','últimos 30 días'],['HORAS EMITIDAS','32 h 15 min','últimos 30 días'],['VISTAS EN DIRECTO','102','últimos 30 días']];
 let out='<section class="stats-section pilot-stats"><div class="stats-source-head"><div><strong>ANALÍTICA DEL CANAL · LOS MORIARTYS</strong><br><small>Canal compartido Los Moriartys · métricas de Demi y Ari, no estadísticas personales de MORIARTY</small></div><span class="stats-status partial">DATOS APORTADOS</span></div>';
 out+='<p class="stats-section-intro">La ficha individual identifica a MORIARTY como creador, pero las cifras de audiencia pertenecen al canal compartido Los Moriartys. Rendimiento de los últimos 30 días consultado el 5 nov 2026 en <a class="stats-link" href="https://streamscharts.com/channels/losmoriartys" target="_blank" rel="noopener">Streams Charts ↗</a>. Los datos Lifetime marcados como aportados proceden del panel compartido y no se atribuyen individualmente.</p>';
 out+='<section class="pilot-subsection"><div class="pilot-subhead"><h5>01 · JUEGOS POPULARES</h5><small>Selección aportada · período exacto no especificado</small></div>';
 out+='<div class="pilot-feature-strip"><strong>FORTNITE</strong><span><b>103 h</b> vistas</span><span><b>22,7%</b> del total</span></div>';
 out+='<div class="pilot-game-charts"><article class="pilot-chart-card"><div class="pilot-chart-heading"><strong>AUDIENCIA MEDIA</strong><small>Espectadores promedio por juego</small></div><div class="pilot-bar-list">';
 games.slice().sort((a,b)=>b.av-a.av).forEach(g=>out+='<div class="pilot-bar-row"><span class="pilot-bar-label">'+g.name+'</span><div class="pilot-bar-track"><i style="width:'+Math.round(g.av/34*100)+'%"></i></div><b>'+g.av+'</b></div>');
 out+='</div></article><article class="pilot-chart-card"><div class="pilot-chart-heading"><strong>RITMO DE SEGUIDORES</strong><small>Seguidores ganados por hora emitida · dato aportado</small></div><div class="pilot-bar-list">';
 games.filter(g=>g.fph!==null).slice().sort((a,b)=>Number(b.fph)-Number(a.fph)||b.fg-a.fg).forEach(g=>out+='<div class="pilot-bar-row"><span class="pilot-bar-label">'+g.name+'</span><div class="pilot-bar-track growth"><i style="width:'+Math.round(Number(g.fph)/2*100)+'%"></i></div><b>'+g.fph+'/h</b></div>');
 out+='</div><p class="pilot-chart-footnote">Solo se muestran juegos con dato de seguidores por hora disponible.</p></article></div>';
 out+='<div class="stats-table-wrap"><table class="stats-table pilot-table"><thead><tr><th>Juego</th><th>Horas emitidas</th><th>Promedio</th><th>Seguidores ganados</th><th>Por hora</th><th>Horas vistas</th></tr></thead><tbody>';
 games.forEach(g=>out+='<tr><th>'+g.name+'</th><td>'+g.air+'</td><td class="num">'+g.av+'</td><td class="num">'+(g.fg===null?'—':g.fg)+'</td><td class="num">'+(g.fph===null?'—':g.fph)+'</td><td class="num">'+(g.hw===null?'—':g.hw)+'</td></tr>');
 out+='</tbody></table></div><div class="pilot-callout"><strong>Lectura para marcas:</strong> Minecraft lidera la audiencia media registrada (34) y comparte el mejor ritmo de captación disponible (2 seguidores por hora) con Marvel Rivals. Fortnite aporta el único dato de horas vistas desglosado: 103 h, equivalentes al 22,7% del total informado. En los demás juegos no se completan métricas que no aparecen en la captura.</div><p class="stats-note">Promedio = espectadores medios del juego · Por hora = seguidores ganados por hora emitida; no es una tasa de conversión. La selección de juegos fue aportada por el creador y su período exacto no está identificado: no se compara directamente con los últimos 30 días. Las horas vistas solo están disponibles para Fortnite. El pico por juego no fue aportado.</p></section>';
 out+='<section class="pilot-subsection"><div class="pilot-subhead"><h5>02 · AUDIENCIA ACUMULADA</h5><small>Trayectoria histórica · Lifetime</small></div><div class="pilot-lifetime-grid">';
 lifetime.forEach((v,i)=>out+='<div class="pilot-metric pilot-lifetime-metric'+(i===1?' is-peak':'')+'"><span>'+v[0]+'</span><strong>'+v[1]+'</strong><small>'+v[2]+'</small></div>');
 out+='</div></section>';
 out+='<section class="pilot-subsection"><div class="pilot-subhead"><h5>03 · RENDIMIENTO DEL PERÍODO</h5><small>Últimos 30 días · consulta 05 nov 2026 · fuente: Streams Charts</small></div><div class="pilot-performance-grid">';
 periodMetrics.forEach(v=>out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+v[1]+'</strong><small>'+v[2]+'</small></div>');
 out+='</div><div class="pilot-callout"><strong>Nota de lectura:</strong> las variaciones porcentuales se reproducen tal como aparecen en la captura. Como el rango de fechas no está visible, no se asigna un período que no podamos verificar.</div></section></section>';
 return out;
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
 if(channel.login==='losmoriartys')return renderLosMoriartysSullyPilot(channel);
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
 let out='<section class="stats-section pilot-stats"><div class="stats-source-head"><div><strong>SEGUIMIENTO PROPIO · TWITCH HELIX</strong><br><small>Telemetría observada por el Instituto · fuente separada del historial</small></div><span class="stats-status '+(isLive?'partial':'pending')+'">'+(isLive?'EN DIRECTO':'OFFLINE EN ÚLTIMA LECTURA')+'</span></div>';
 out+='<p class="stats-section-intro">Última sincronización: '+last+' · frecuencia programada: cada '+interval+' minutos · muestras conservadas: '+firstSample+' a '+lastSample+' · '+coverageText+'. La frecuencia programada no garantiza que todas las ejecuciones ocurran a ese ritmo.</p>';
 out+='<div class="pilot-status-grid"><div class="pilot-status-item"><span>Consultas recibidas</span><strong>'+statsNumber(w.samples_total,0)+'</strong></div><div class="pilot-status-item"><span>Muestras en directo</span><strong>'+statsNumber(liveSamples,0)+'</strong></div><div class="pilot-status-item"><span>Directos detectados</span><strong>'+statsNumber(detectedStreams,0)+'</strong></div><div class="pilot-status-item"><span>Seguidores</span><strong>'+(channel.followers_total===null||channel.followers_total===undefined?'No disponible':statsNumber(channel.followers_total,0))+'</strong></div></div>';
 out+='<div class="pilot-callout"><strong>Cómo leer este panel.</strong> '+observationText+' El muestreo es una observación técnica y no reemplaza el historial completo de Twitch ni las métricas oficiales del panel de creador.</div>';
 out+='<div class="pilot-callout warning"><strong>Qué falta para publicar una tendencia:</strong> acumular más sesiones observadas y completar el historial de forma sostenida. Hasta entonces no presentamos promedio, pico, horas vistas ni evolución como indicadores representativos. La ventana técnica configurada es de '+(instituteStatsData?.window_days||30)+' días; la cobertura real depende de las muestras efectivamente guardadas.</div>';
 out+='</section>';
 return out;
}
function renderHelixDashboard(channel){
 if(channel && channel.login==='losmoriartys')return renderLosMoriartysHelixPilot(channel);
 if(!channel)return '<div class="stats-empty"><strong>Seguimiento propio</strong>Esperando la primera sincronización de Twitch Helix para este canal.</div>';
 const w=channel.window||{};
 const live=channel.live;
 const snaps=Array.isArray(channel.snapshots)?channel.snapshots.filter(v=>v&&v.sampled_at):[];
 const first=snaps.length?Date.parse(snaps[0].sampled_at):NaN;
 const last=snaps.length?Date.parse(snaps[snaps.length-1].sampled_at):NaN;
 const interval=Number(instituteStatsData?.sampling_interval_minutes||15);
 const expected=Number.isFinite(first)&&Number.isFinite(last)&&last>=first?Math.floor((last-first)/(interval*60000))+1:0;
 const coverage=expected?Math.min(100,snaps.length/expected*100):null;
 const gaps=snaps.slice(1).map((v,i)=>(Date.parse(v.sampled_at)-Date.parse(snaps[i].sampled_at))/60000).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 const medianGap=gaps.length?(gaps.length%2?gaps[(gaps.length-1)/2]:(gaps[gaps.length/2-1]+gaps[gaps.length/2])/2):null;
 const maxGap=gaps.length?Math.max(...gaps):null;
 const quality=coverage===null?'SIN COBERTURA CALCULABLE':coverage>=80?'COBERTURA ADECUADA':coverage>=50?'COBERTURA PARCIAL':'MUESTRA INSUFICIENTE';
 const qualityClass=coverage===null?'pending':coverage>=80?'verified':coverage>=50?'partial':'pending';
 const periodLabel=Number.isFinite(first)&&Number.isFinite(last)?new Date(first).toLocaleString('es-AR')+' — '+new Date(last).toLocaleString('es-AR'):'Fechas no disponibles';
 let out='<section class="stats-section"><div class="stats-source-head"><div><strong>TWITCH HELIX · SEGUIMIENTO PROPIO</strong><br><small>Observaciones periódicas del Instituto · no equivale al panel analítico oficial</small></div><span class="stats-status '+(live?'partial':'pending')+'">'+(live?'EN DIRECTO':'OFFLINE')+'</span></div>';
 out+='<div class="stats-source-head"><div><strong>CALIDAD DE LA MUESTRA</strong><br><small>'+quality+' · objetivo de recolección: cada '+interval+' minutos</small></div><span class="stats-status '+qualityClass+'">'+(coverage===null?'SIN DATOS':statsNumber(coverage,1)+'%')+'</span></div>';
 out+='<p class="stats-section-intro">Período realmente observado: '+escapeStatsHtml(periodLabel)+'. Registros: '+statsNumber(snaps.length,0)+' de '+statsNumber(expected,0)+' esperados en ese intervalo. Separación mediana: '+(medianGap===null?'—':statsNumber(medianGap,1)+' min')+'; mayor intervalo sin muestra: '+(maxGap===null?'—':statsNumber(maxGap,1)+' min')+'. Esta cobertura describe el tramo observado, no los 30 días configurados.</p>';
 out+='<div class="stats-kpis">';
 [['Espectadores ahora',channel.current_viewers,'lectura actual'],['Seguidores',channel.followers_total,'no disponible vía Helix público'],['Muestras',w.samples_total,'registros capturados'],['Promedio muestreado',w.average_viewers_sampled,'solo muestras en directo'],['Pico observado',w.peak_viewers_sampled,'no es pico oficial'],['Horas vistas estimadas',w.estimated_hours_watched,'solo intervalos consecutivos válidos']].forEach(k=>out+='<div class="stats-kpi"><span>'+k[0]+'</span><strong>'+statsNumber(k[1],1)+'</strong><em>'+k[2]+'</em></div>');
 out+='</div><p class="stats-muted">Categoría actual: '+escapeStatsHtml(channel.current_game||'No disponible')+' · Última sincronización: '+(channel.updated_at?new Date(channel.updated_at).toLocaleString('es-AR'):'Pendiente')+'</p>';
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
function renderStatsDashboard(hero,helix,sully){
 let out='<div class="stats-dashboard">';
 out+='<div class="stats-source-head"><div><strong>ARCHIVO DE RENDIMIENTO · '+escapeStatsHtml(hero.name)+'</strong><br><small>Ficha individual · cada fuente conserva su propio período y metodología</small></div></div>';
 if(hero.youtube && !hero.twitch && !hero.kick){
  out+=renderPlatformStats(hero);
 }else if(!hero.twitch && hero.kick){
  out+=renderPlatformStats(hero);
 }else{
  out+=renderHelixDashboard(helix);
  out+=renderSullyStats(sully);
  out+=renderTwitchMetricsStats(helix);
  out+=renderPlatformStats(hero);
 }
 out+='</div>';return out;
}
function renderMissionArchive(hero){
 const key=creatorRecordKey(hero),record=creatorRecordsData?.channels?.[key]||{};
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
     out+='<div class="mission-clip-embed"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(item.clip_id)+'&parent='+encodeURIComponent(location.hostname)+'" title="'+escapeStatsHtml(item.title||'Clip de Twitch')+'" loading="lazy" allowfullscreen="true" scrolling="no"></iframe></div>';
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
let platformStatsData = null;
async function loadPlatformStatsData(){
 try{
  const res=await fetch('platform-stats.json',{cache:'no-store'});
  if(!res.ok)throw new Error('No se pudo leer platform-stats.json');
  platformStatsData=await res.json();
 }catch(e){console.warn('Platform statistics unavailable:',e);}
}
function renderPlatformStats(hero){
 const key=creatorRecordKey(hero);
 const profile=platformStatsData?.creators?.[key];
 if(!profile || !profile.platforms)return '';
 let out='';
 Object.entries(profile.platforms).forEach(([platform,p])=>{
  const title=platform==='youtube'?'YOUTUBE · DATOS PÚBLICOS DEL CANAL':platform==='kick'?'KICK · ACTIVIDAD DEL CANAL':platform.toUpperCase();
  const status=p.status==='verified'?'FUENTE OFICIAL':p.status==='credentials_required'?'CONFIGURACIÓN PENDIENTE':p.status==='error'?'ERROR DE CONSULTA':'REFERENCIA';
  out+='<section class="stats-section"><div class="stats-source-head"><div><strong>'+title+'</strong><br><small>Cuenta vinculada: '+escapeStatsHtml(p.handle||'—')+'</small></div><span class="stats-status '+(p.status==='verified'?'verified':'pending')+'">'+status+'</span></div>';
  if(p.status!=='verified'){
   out+='<div class="stats-empty"><strong>Datos automáticos todavía no disponibles</strong>'+escapeStatsHtml(p.note||'La cuenta está registrada, pero falta completar su configuración.')+'</div>';
  }else if(platform==='youtube'){
   const m=p.metrics||{};
   out+='<p class="stats-section-intro">Captura: '+escapeStatsHtml(platformStatsData.updated_at||'fecha no disponible')+' · fuente: YouTube Data API v3. No se mezcla con estadísticas de streaming.</p><div class="pilot-lifetime-grid tm-metrics-grid">';
   [['Suscriptores',m.subscribers],['Visualizaciones totales',m.total_views],['Videos publicados',m.videos_total]].forEach(v=>out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+statsNumber(v[1],0)+'</strong><small>Acumulado del canal</small></div>');
   out+='</div>';
   const videos=Array.isArray(p.recent_videos)?p.recent_videos:[];
   if(videos.length){out+='<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>Video reciente</th><th>Publicado</th><th>Vistas</th></tr></thead><tbody>';videos.forEach(v=>out+='<tr><td><a class="stats-link" href="'+escapeStatsHtml(v.url)+'" target="_blank" rel="noopener">'+escapeStatsHtml(v.title)+'</a></td><td>'+escapeStatsHtml(v.published_at?v.published_at.slice(0,10):'—')+'</td><td class="num">'+statsNumber(v.views,0)+'</td></tr>');out+='</tbody></table></div>';}
  }else if(platform==='kick'){
   const m=p.metrics||{};
   out+='<p class="stats-section-intro">Captura: '+escapeStatsHtml(platformStatsData.updated_at||'fecha no disponible')+' · fuente: Kick Developer Public API. La API permite consultar estado y audiencia actual; no equivale a historial completo.</p><div class="pilot-lifetime-grid tm-metrics-grid">';
   [['Estado',m.live?'En directo':'Offline'],['Espectadores actuales',m.current_viewers],['Categoría',m.category],['Título',m.stream_title]].forEach(v=>out+='<div class="pilot-metric"><span>'+v[0]+'</span><strong>'+statsNumber(v[1],0)+'</strong><small>Última lectura</small></div>');
   out+='</div>';
  }
  if(p.url)out+='<p class="stats-note">Fuente: <a class="stats-link" href="'+escapeStatsHtml(p.url)+'" target="_blank" rel="noopener">abrir canal en '+platform.toUpperCase()+' ↗</a>. '+escapeStatsHtml(p.methodology||'Cada métrica conserva su propia metodología.')+'</p>';
  out+='</section>';
 });
 return out;
}
function creatorRecordKey(hero){
 if(hero && hero.youtube)return 'patoteexplica';
 if(hero && hero.twitch)return hero.twitch.split('/').filter(Boolean).pop().toLowerCase();
 if(hero && hero.kick)return hero.kick.split('/').filter(Boolean).pop().toLowerCase();
 return '';
}
function renderCreatorRecords(hero){
 const key=creatorRecordKey(hero);
 const record=creatorRecordsData?.channels?.[key];
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
  const res=await fetch('creator-records.json',{cache:'no-store'});
  if(!res.ok)throw new Error('No se pudo leer creator-records.json');
  creatorRecordsData=await res.json();
 }catch(e){console.warn('Creator records unavailable:',e);}
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
function renderLiveDirectory(channels){
 const host=document.getElementById('live-directory');if(!host)return;
 const live=(channels||[]).filter(c=>c.live);
 const offline=(channels||[]).filter(c=>!c.live);
 if(!live.length){
  host.innerHTML='<div class="premium-panel"><div class="premium-kicker">ESTADO ACTUAL</div><h3>En este momento no hay integrantes detectados en directo</h3><p>La próxima consulta programada actualizará el estado. Mientras tanto, podés visitar los canales del roster.</p></div>'+offline.map(c=>'<article class="live-channel-card offline"><strong>'+escapeStatsHtml(c.display_name)+'</strong><small>Sin directo detectado en la última consulta</small><a href="https://twitch.tv/'+encodeURIComponent(c.login)+'" target="_blank" rel="noopener noreferrer">Visitar canal ↗</a></article>').join('');
  return;
 }
 host.innerHTML=live.map(c=>'<article class="live-channel-card"><span class="stats-status partial">● EN DIRECTO</span><strong>'+escapeStatsHtml(c.display_name)+'</strong><small>'+escapeStatsHtml(c.current_game||'Categoría no informada')+' · '+(c.current_viewers===null?'Espectadores no disponibles':statsNumber(c.current_viewers,0)+' espectadores')+'</small><button type="button" onclick="selectLiveChannel(\''+escapeStatsHtml(c.login)+'\',\''+escapeStatsHtml(c.display_name)+'\')">VER TRANSMISIÓN</button></article>').join('');
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
 wrap.hidden=false;
 wrap.scrollIntoView({behavior:'smooth',block:'start'});
}
async function loadInstituteStats(){
 const body=document.getElementById('stats-table-body'); if(!body)return;
 const fmt=(v,d=2)=>v===null||v===undefined?'—':(typeof v==='number'?v.toLocaleString('es-AR',{maximumFractionDigits:d}):v);
 try{
  const res=await fetch('data.json',{cache:'no-store'}); if(!res.ok)throw new Error('No se pudo leer data.json');
  const data=await res.json(); instituteStatsData=data;
  const activeLogins=Array.isArray(data.active_channels)?data.active_channels:Object.keys(data.channels||{});
  const channels=activeLogins.map(login=>data.channels?.[login]).filter(Boolean);
  const liveCount=channels.filter(c=>c.live).length;
  const totalSamples=channels.reduce((n,c)=>n+(c.window?.samples_total||0),0);
  const observedHours=channels.reduce((n,c)=>n+(c.window?.observed_live_hours||0),0);
  const estimatedHoursWatched=channels.reduce((n,c)=>n+(c.window?.estimated_hours_watched||0),0);
  document.getElementById('stats-updated').textContent='Actualizado el '+new Date(data.updated_at).toLocaleString('es-AR')+' · '+channels.length+' canales del roster activo. Ventana máxima: '+fmt(data.window_days,0)+' días; cobertura efectiva variable según canal.';
  document.getElementById('stats-summary').innerHTML='<div class="premium-card"><h3>'+fmt(channels.length,0)+'</h3><p>Canales activos representados</p></div><div class="premium-card"><h3>'+fmt(liveCount,0)+'</h3><p>En directo en la última consulta</p></div><div class="premium-card"><h3>'+fmt(data.window_days,0)+' días</h3><p>Ventana máxima configurada</p></div><div class="premium-card"><h3>'+fmt(totalSamples,0)+'</h3><p>Muestras registradas</p></div>';
  body.innerHTML=channels.map(c=>{const samples=Array.isArray(c.snapshots)?c.snapshots.filter(s=>s?.sampled_at):[];const first=samples.length?Date.parse(samples[0].sampled_at):NaN;const last=samples.length?Date.parse(samples[samples.length-1].sampled_at):NaN;const expected=Number.isFinite(first)&&Number.isFinite(last)&&last>=first?Math.floor((last-first)/(Number(data.sampling_interval_minutes||15)*60000))+1:0;const coverage=expected?Math.min(100,(samples.length/expected)*100):null;const coverageLabel=coverage===null?'Insuficiente':coverage.toLocaleString('es-AR',{maximumFractionDigits:1})+'% ('+samples.length+'/'+expected+')';return '<tr><td>'+escapeStatsHtml(c.display_name)+'</td><td>'+(c.live?'EN DIRECTO':'OFFLINE')+'</td><td>'+fmt(c.current_viewers,0)+'</td><td>'+escapeStatsHtml(fmt(c.current_game))+'</td><td>'+fmt(c.window?.average_viewers_sampled)+'</td><td>'+fmt(c.window?.peak_viewers_sampled,0)+'</td><td>'+fmt(c.window?.observed_live_hours)+'</td><td>'+fmt(c.window?.samples_total,0)+'</td><td>'+coverageLabel+'</td></tr>';}).join('');
  renderLiveDirectory(channels);
 }catch(e){body.innerHTML='<tr><td colspan="9">Estadísticas temporalmente no disponibles. '+escapeStatsHtml(e.message)+'</td></tr>';}
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

function renderRoster() {
    const container = document.getElementById('roster-container');
    if (!container) return;
    container.innerHTML = '';
    const groups = [
        { key: 'director', title: 'DIRECCIÓN', desc: 'Quienes impulsan la visión compartida y coordinan el rumbo de la Legión.' },
        { key: 'teacher', title: 'PROFESORES', desc: 'Integrantes que aportan experiencia, orientación y distintas formas de acompañar al equipo.' },
        { key: 'student', title: 'ESTUDIANTE', desc: 'Un perfil en desarrollo que suma su propia mirada al universo de la Legión.' },
        { key: 'collaborator', title: 'COLABORADORES', desc: 'Creadores y especialistas que aportan conocimientos, experiencias y nuevas perspectivas.' }
    ];
    const counts = document.getElementById('roster-counts');
    if (counts) {
        counts.innerHTML = groups.map(group => {
            const total = heroesData.filter(hero => hero.role === group.key).length;
            const label = group.title.replace(' DEL INSTITUTO','');
            return '<a class="roster-jump-link ' + group.key + '" href="#roster-group-' + group.key + '" aria-label="Ir a ' + label + ', ' + total + ' integrantes"><strong>' + String(total).padStart(2,'0') + '</strong><span>' + label + '</span><i aria-hidden="true">EXPLORAR ↓</i></a>';
        }).join('');
    }
    groups.forEach(group => {
        const members = heroesData.map((hero, index) => ({ hero, index })).filter(item => item.hero.role === group.key);
        if (!members.length) return;
        const section = document.createElement('section');
        section.className = 'roster-section ' + (group.key === 'director' ? 'directors' : group.key === 'teacher' ? 'teachers' : group.key === 'student' ? 'students' : 'collaborators');
        section.id = 'roster-group-' + group.key;
        section.innerHTML = '<h3 class="roster-section-title">' + group.title + '</h3><p class="roster-section-desc">' + group.desc + '</p>';
        const grid = document.createElement('div');
        grid.className = 'roster-grid';
        members.forEach(({hero,index}) => {
            const card = document.createElement('button');
            card.type = 'button';
            const isMoriartyPilot = hero.name === 'MORIARTYS';
            card.className = 'roster-portrait-card' + (isMoriartyPilot ? ' roster-card--moriarty' : '');
            card.setAttribute('aria-label', 'Abrir bitácora de ' + hero.name);
            if (isMoriartyPilot) card.dataset.cardTilt = 'moriarty';
            card.onclick = (event) => openHeroProfile(index, event.currentTarget);
            const imageWrap = document.createElement('div');
            imageWrap.className = 'roster-portrait-wrap' + (isMoriartyPilot ? ' roster-portrait-wrap--collectible' : '');
            const image = document.createElement('img');
            image.src = hero.portrait || hero.img;
            image.alt = 'Carnet de integrante de ' + hero.name;
            image.loading = 'lazy';
            image.onerror = () => { imageWrap.textContent = 'CARNET PENDIENTE'; };
            imageWrap.appendChild(image);
            if (isMoriartyPilot) {
                const foil = document.createElement('span');
                foil.className = 'roster-card-foil';
                foil.setAttribute('aria-hidden', 'true');
                const number = document.createElement('span');
                number.className = 'roster-card-number';
                number.textContent = 'N.º ' + (hero.cardNumber || '047');
                const cue = document.createElement('span');
                cue.className = 'roster-card-cue';
                cue.textContent = 'EXPEDIENTE · TOCÁ PARA ABRIR';
                imageWrap.append(foil, number, cue);
            }
            const info = document.createElement('div');
            info.className = 'roster-portrait-info';
            const creatorTypeLabel = hero.creator_type === 'video_creator' ? 'CREADOR DE VIDEO' : hero.creator_type === 'live_streamer' ? 'STREAMER' : 'FORMATO POR DEFINIR';
            info.innerHTML = '<strong>' + escapeStatsHtml(hero.name) + '</strong><span>' + escapeStatsHtml(hero.rank || group.title) + '</span><span class="roster-creator-type">' + creatorTypeLabel + '</span>';
            card.append(imageWrap,info);
            if (isMoriartyPilot) {
                card.addEventListener('pointermove', (event) => {
                    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    const rect = card.getBoundingClientRect();
                    const x = (event.clientX - rect.left) / rect.width;
                    const y = (event.clientY - rect.top) / rect.height;
                    card.style.setProperty('--tilt-x', ((.5 - y) * 13).toFixed(2) + 'deg');
                    card.style.setProperty('--tilt-y', ((x - .5) * 16).toFixed(2) + 'deg');
                    card.style.setProperty('--shine-x', (x * 100).toFixed(1) + '%');
                    card.style.setProperty('--shine-y', (y * 100).toFixed(1) + '%');
                    card.classList.add('is-tilting');
                });
                card.addEventListener('pointerleave', () => {
                    card.classList.remove('is-tilting');
                    card.style.setProperty('--tilt-x', '0deg');
                    card.style.setProperty('--tilt-y', '0deg');
                    card.style.setProperty('--shine-x', '50%');
                    card.style.setProperty('--shine-y', '50%');
                });
            }
            grid.appendChild(card);
        });
        section.appendChild(grid);
        container.appendChild(section);
    });
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
    const record = creatorRecordsData?.channels?.[twitchLogin] || creatorRecordsData?.channels?.[youtubeLogin] || {};
    const typeLabel = hero.creator_type === "video_creator" ? "CREADOR DE VIDEO" : hero.creator_type === "live_streamer" ? "CREADOR EN DIRECTO" : "FORMATO POR CONFIRMAR";
    const roleLabels = {director:"DIRECCIÓN",teacher:"PROFESOR",student:"ESTUDIANTE",collaborator:"COLABORADOR"};
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
    out += '<div class="commercial-quickview-meta" role="group" aria-label="Resumen del rol institucional, tipo de creador y plataformas declaradas"><span>' + safe(roleLabels[hero.role] || "INTEGRANTE") + '</span><span>' + safe(typeLabel) + '</span><span>' + safe((hero.platforms || []).map(v=>v.toUpperCase()).join(" · ") || "PLATAFORMA POR CONFIRMAR") + '</span></div>';
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
function openHeroProfile(index, triggerElement = document.activeElement) {
    const hero = heroesData[index];
    if (!hero) return;
    const home = document.getElementById('roster-home');
    const page = document.getElementById('hero-profile-page');
    if (!home || !page) return;
    const channel = hero.youtube || hero.twitch || '';
    window.lastHeroProfileTrigger = triggerElement instanceof HTMLElement ? triggerElement : null;
    page.innerHTML = '<div class="hero-profile-layout hero-profile-gateway"><div class="hero-profile-copy"><span class="stats-status">EXPEDIENTE INDIVIDUAL · ' + escapeStatsHtml(hero.rank || 'CLASIFICACIÓN PENDIENTE') + '</span><p class="profile-section-kicker">ARCHIVO PERSONAL · ' + escapeStatsHtml(hero.cardNumber ? 'N.º ' + hero.cardNumber : 'REGISTRO DE LA LEGIÓN') + '</p><h3 id="hero-profile-title" tabindex="-1">' + escapeStatsHtml(hero.name) + '</h3><p>' + escapeStatsHtml(hero.bio || 'Presentación personal pendiente de completar.') + '</p><div class="hero-profile-actions"><button class="twitch-link-btn" type="button" onclick="openHeroModal(' + index + ')">ABRIR BITÁCORA COMPLETA</button>' + (channel ? '<a class="btn-link" href="' + escapeStatsHtml(channel) + '" target="_blank" rel="noopener">VISITAR CANAL</a>' : '') + '<button class="hero-profile-back" type="button" onclick="closeHeroProfile()">VOLVER AL ROSTER</button></div></div></div>' + renderCommercialQuickView(hero);
    home.hidden = true;
    page.hidden = false;
    history.replaceState(null, '', '#expediente-' + encodeURIComponent(hero.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')));
    page.scrollIntoView({behavior:'smooth',block:'start'});
    requestAnimationFrame(() => document.getElementById('hero-profile-title')?.focus({preventScroll:true}));
}
function restoreHeroProfileFromHash() {
    const slug = decodeURIComponent((location.hash || '').replace(/^#expediente-/, ''));
    if (!slug || slug === location.hash.replace(/^#/, '')) return;
    const index = heroesData.findIndex(hero => hero.name.toLowerCase().replace(/[^a-z0-9]+/g,'-') === slug);
    if (index >= 0) {
        const chapter = document.getElementById('chapter-2');
        document.querySelectorAll('.chapter-panel').forEach(panel => panel.classList.remove('active'));
        chapter?.classList.add('active');
        openHeroProfile(index);
    }
}
function closeHeroProfile() {
    const home = document.getElementById('roster-home');
    const page = document.getElementById('hero-profile-page');
    if (page) page.hidden = true;
    if (home) home.hidden = false;
    history.replaceState(null, '', '#chapter-2');
    document.getElementById('chapter-2')?.scrollIntoView({behavior:'smooth',block:'start'});
    const trigger = window.lastHeroProfileTrigger;
    window.lastHeroProfileTrigger = null;
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
function renderLadyMoriartyComicPages(hero,sullyChannel){
 const safe=v=>escapeStatsHtml(v===null||v===undefined?'':String(v));
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const profile=twitchMetricsData?.channels?.ladymoriarty01||{};
 const metrics=profile.metrics||{};
 const period=profile.period_label||'Período no indicado';
 const games=Array.isArray(sullyChannel?.game_performance)?sullyChannel.game_performance:[];
 const record=creatorRecordsData?.channels?.ladymoriarty01||{};
 const clips=Array.isArray(record.highlights)?record.highlights:[];
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 0'+n+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE LADYMORIARTY01 · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-lady"><span>VOZ DE LA BRUJA</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>LADYMORIARTY01 · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'S/N')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de LADYMORIARTY01"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>LADYMORIARTY01</h2><b>'+safe(hero.series||'01')+'</b></div><p class="comic-cover-subtitle">'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DE LA HEROÍNA</b></div><p>'+safe(hero.bio)+'</p><p class="comic-panel-caption">Canal individual LADYMORIARTY01: gameplay chill, IRL y contenido espontáneo. Lo importante es divertirnos y pasarla bien 💜</p></section><footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y ESTILO</b></div><h3>'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</h3><p>'+safe(hero.log)+'</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.rank)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">'+safe(hero.powers)+'</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>UNIVERSOS Y FORMATOS</b></div><div class="comic-format-list">'+areas.map(v=>'<span>'+safe(v)+'</span>').join('')+'</div><p class="comic-panel-caption">La identidad narrativa de la carta representa al personaje; no es una certificación ni una métrica de rendimiento.</p></section>';
 const identityPage=page(1,'LA BRUJA: IDENTIDAD PROPIA',identityBody,'EL PERSONAJE');
 let metricCards='';
 [['Seguidores',metrics.followers,'total publicado'],['Nuevos seguidores','+'+(metrics.follower_change??'—'),'ventana consultada'],['Horas vistas',metrics.viewer_hours,'ventana consultada'],['Pico de espectadores',metrics.peak_viewers,'ventana consultada'],['Horas en directo',metrics.hours_live,'ventana consultada'],['Promedio',metrics.average_viewers,'ventana consultada']].forEach(v=>metricCards+='<article class="comic-metric"><span>'+v[0]+'</span><strong>'+safe(v[1])+'</strong><small>'+v[2]+'</small></article>');
 const statsBody='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>SEÑALES DE AUDIENCIA</b></div><p class="comic-panel-caption">TwitchMetrics · '+safe(period)+' · consulta 4 nov 2026. Esta fuente externa registra una muestra pública limitada; no debe interpretarse como el historial completo del canal.</p><div class="comic-metric-grid">'+metricCards+'</div></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>ALCANCE OBSERVADO</b></div><p>En la ventana consultada se informan 59 horas vistas, un pico de 33 espectadores y una variación de +17 seguidores. El promedio publicado fue de 19 espectadores.</p><p class="comic-panel-caption">Los indicadores pertenecen exclusivamente a LADYMORIARTY01. No se suman ni se comparan con las estadísticas de MORIARTYS.</p><a href="'+safe(profile.source_url||'https://www.twitchmetrics.net/c/710295249-ladymoriarty01')+'" target="_blank" rel="noopener">CONSULTAR FUENTE TWITCHMETRICS ↗</a></section>';
 const statsPage=page(2,'EL PODER DE SU COMUNIDAD',statsBody,'LA AUDIENCIA');
 let gameRows='';
 games.forEach(g=>gameRows+='<tr><th>'+safe(g.name)+'</th><td>'+safe(g.stream_time_hours)+' h</td><td>'+safe(g.stream_time_share)+'</td><td>'+safe(g.watch_time_hours)+' h</td><td>'+safe(g.watch_time_share)+'</td><td>'+safe(g.average_viewers)+'</td><td>'+safe(g.peak_viewers)+'</td></tr>');
 const gamesBody='<p class="comic-page-lead">Seis juegos registrados en la tabla de SullyGnome para la ventana de los últimos 30 días. Las horas emitidas se reproducen tal como aparecen en la fuente, incluso cuando figuran redondeadas a cero.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>REGISTRO DE UNIVERSOS</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Juego</th><th>Emitidas</th><th>% tiempo</th><th>Vistas</th><th>% vistas</th><th>Media</th><th>Pico</th></tr></thead><tbody>'+gameRows+'</tbody></table></div><p class="comic-panel-caption">Fuente: <a href="https://sullygnome.com/channel/ladymoriarty01/games" target="_blank" rel="noopener">SullyGnome · juegos ↗</a>. Período: últimos 30 días. Las cifras y porcentajes corresponden a las columnas de la tabla consultada.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA DESTACADA</b></div><p>Aniimo lidera esta selección en horas vistas (28 h), promedio (23) y pico (33). Assassin’s Creed Odyssey registra 26 horas vistas y un promedio de 17 espectadores.</p></section>';
 const gamesPage=page(3,'CADA JUEGO, UNA NUEVA HISTORIA',gamesBody,'LAS MISIONES');
 let clipsHtml='';
 clips.forEach((c,i)=>{
  clipsHtml+='<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>MOMENTO DESTACADO</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(c.clip_id||'')+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Clip de LADYMORIARTY01" loading="lazy" allowfullscreen></iframe></div><h3>'+safe(c.title||('Momento destacado 0'+(i+1)))+'</h3><a href="https://clips.twitch.tv/'+encodeURIComponent(c.clip_id||'')+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>';
 });
 const clipsBody='<p class="comic-page-lead">Una selección de momentos del canal. Los títulos se mantienen neutrales mientras no haya una descripción editorial confirmada.</p><div class="comic-clips-grid">'+(clipsHtml||'<p>Clips pendientes de incorporar.</p>')+'</div>';
 const clipsPage=page(4,'MOMENTOS FUERA DEL GUIÓN',clipsBody,'EL ESPECTÁCULO');
 const collabs=Array.isArray(record.collaborations)?record.collaborations:[];
 const milestones=Array.isArray(record.milestones)?record.milestones:[];
 const collabBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>COLABORACIONES CONFIRMADAS</b></div>'+(collabs.length?'<ul class="profile-detail-list">'+collabs.map(c=>'<li><b>'+safe(c.title)+'</b> '+safe(c.description||'')+'</li>').join('')+'</ul>':'<p>Sin colaboraciones comerciales confirmadas cargadas en el expediente individual.</p>')+'</section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>HITOS Y TRAYECTORIA</b></div>'+(milestones.length?'<ul class="profile-detail-list">'+milestones.map(m=>'<li>'+safe(m.title)+' '+safe(m.description||'')+'</li>').join('')+'</ul>':'<p>Registro histórico pendiente de documentación verificable.</p>')+'</section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>FORMATOS PARA EXPLORAR</b></div><div class="comic-format-list"><span>Gaming y presentación de videojuegos</span><span>Entretenimiento y conversación</span><span>Experiencias IRL</span><span>Clips y momentos destacados</span></div><p class="comic-panel-caption">Líneas potenciales de colaboración, no campañas contratadas ni alianzas vigentes. Contacto comercial pendiente de confirmar.</p></section><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS HISTORIAS</span><h3>QUE TU MARCA ENTRE EN EL UNIVERSO DE LA BRUJA.</h3><p>Propuestas sujetas a conversación y aprobación de LADYMORIARTY01.</p></section><section class="lady-contact-panel"><span>CONTACTO COMERCIAL · LEGIÓN MULTIVERSAL</span><p>Para propuestas, campañas y consultas de colaboración:</p><a href="mailto:losmoriartys@gmail.com">losmoriartys@gmail.com</a></section>';
 const collabPage=page(5,'EL UNIVERSO DE LAS COLABORACIONES',collabBody,'NUEVAS ALIANZAS');
 return [cover,identityPage,statsPage,gamesPage,clipsPage,collabPage];
}

function renderHabitosComicPages(hero,sullyChannel){
 const safe=v=>escapeStatsHtml(v===null||v===undefined?'':String(v));
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const record=creatorRecordsData?.channels?.habitos_atomicos||{};
 const clips=Array.isArray(record.highlights)?record.highlights:[];
 const summary=sullyChannel?.summary||{};
 const games=Array.isArray(sullyChannel?.game_breakdown)?sullyChannel.game_breakdown:[];
 const period=sullyChannel?.period?.label||'6 oct — 5 nov 2026';
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 0'+n+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE HÁBITOS ATÓMICOS · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-habitos"><span>VOZ DEL FILÓSOFO ATÓMICO</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>HÁBITOS ATÓMICOS · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'007')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de HÁBITOS ATÓMICOS"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>HÁBITOS ATÓMICOS</h2><b>'+safe(hero.series||'03')+'</b></div><p class="comic-cover-subtitle">EL FILÓSOFO JUSTICIERO · FILÓSOFO ATÓMICO</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL CREADOR</b></div><p>'+safe(hero.bio)+'</p><p class="comic-panel-caption">Gaming, filosofía y desarrollo personal: conversación, ideas y entretenimiento en un mismo espacio.</p></section><aside class="hero-voice voice-habitos"><span>SU PRINCIPIO EN LA LEGIÓN</span><p>'+safe(hero.voice)+'</p></aside><footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<p class="comic-page-lead">No todo héroe necesita levantar la voz para dejar una marca. El Filósofo Atómico convierte el directo en un espacio para pensar, compartir experiencias y volver al juego con una perspectiva distinta.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y PROPÓSITO</b></div><h3>EL FILÓSOFO JUSTICIERO</h3><p>'+safe(hero.log)+'</p><p>Su eje no es prometer respuestas definitivas, sino abrir conversaciones, poner ideas a prueba y acompañar a la comunidad en el proceso de aprender y avanzar.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.characterRole)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">Poderes y rangos pertenecen al universo narrativo de Legión Multiversal; no son certificaciones ni indicadores de rendimiento.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>LOS TRES PILARES</b></div><div class="comic-format-list">'+areas.map(v=>'<span>'+safe(v)+'</span>').join('')+'</div><p class="comic-panel-caption">La filosofía y el desarrollo personal dan identidad a la conversación; el gaming aporta variedad, situaciones espontáneas y un punto de encuentro.</p></section>';
 const identityPage=page(1,'LA MENTE TAMBIÉN ES UN CAMPO DE BATALLA',identityBody,'EL PERSONAJE');
 const metricCards=[
  ['TRANSMISIONES',summary.streams_count,'en el período'],
  ['HORAS EMITIDAS',summary.airtime_hours+' h','en el período'],
  ['HORAS VISTAS',summary.hours_watched,'según resumen general'],
  ['PROMEDIO',summary.average_viewers_duration_weighted,'espectadores'],
  ['PICO MÁXIMO',summary.peak_viewers,'espectadores · fecha por confirmar'],
  ['SEGUIDORES GANADOS','+'+summary.followers_gain_reported,'en el período']
 ];
 const statsBody='<p class="comic-page-lead">Un corte de actividad de 30 días para entender el ritmo del canal. Los datos se presentan con su período y fuente, sin convertir una muestra parcial en una promesa de resultados.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>INDICADORES DEL PERÍODO</b></div><p class="comic-panel-caption">SullyGnome · '+safe(period)+' · resumen compartido por el creador.</p><div class="comic-metric-grid">'+metricCards.map(v=>'<article class="comic-metric"><span>'+v[0]+'</span><strong>'+safe(v[1])+'</strong><small>'+safe(v[2])+'</small></article>').join('')+'</div></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA DE LA ACTIVIDAD</b></div><p>El período informa 28 transmisiones y 124 horas emitidas. El promedio general publicado es de 3 espectadores y se reportan 27 seguidores ganados.</p><p class="comic-panel-caption">El máximo de 29 espectadores se conserva sin fecha asignada: los datos compartidos presentan discrepancias sobre el día del pico. El detalle individual recibido cubre 24 de las 28 transmisiones.</p><p class="comic-panel-caption">La cifra «Seguidores ganan rango» de SullyGnome se excluye porque representa una posición/rango del sitio y no el total de seguidores del canal.</p></section>';
 const statsPage=page(2,'UNA COMUNIDAD QUE CRECE CON CADA CHARLA',statsBody,'LA AUDIENCIA');
 const gameRows=games.map(g=>'<tr><th>'+safe(g.name)+'</th><td>'+safe(g.stream_hours)+' h</td><td>'+safe(g.stream_share_pct)+'%</td><td>'+safe(g.hours_watched)+' h</td><td>'+safe(g.watch_share_pct)+'%</td><td>'+safe(g.average_viewers)+'</td><td>'+safe(g.peak_viewers)+'</td></tr>').join('');
 const gameBody='<p class="comic-page-lead">El desglose muestra una identidad conversacional muy marcada: Solo charlando concentra la mayor parte del tiempo emitido y de las horas vistas del listado de categorías.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>JUEGOS Y CATEGORÍAS</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Categoría</th><th>Emitidas</th><th>% tiempo</th><th>Vistas</th><th>% vistas</th><th>Media</th><th>Pico</th></tr></thead><tbody>'+gameRows+'</tbody></table></div><p class="comic-panel-caption">Fuente: desglose de categorías compartido desde SullyGnome para '+safe(period)+'. Se reproducen las cifras informadas.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>EL DATO QUE DEFINE SU PROPUESTA</b></div><div class="comic-metric-grid"><article class="comic-metric"><span>SOLO CHARLANDO · TIEMPO EMITIDO</span><strong>83,6%</strong><small>105 horas del desglose por categoría</small></article><article class="comic-metric"><span>SOLO CHARLANDO · HORAS VISTAS</span><strong>89,5%</strong><small>474 horas según la tabla de categorías</small></article></div><p class="comic-panel-caption">Nota de consistencia: el resumen general informa 472 horas vistas, mientras que la fila de Solo charlando indica 474. Se mantienen separados los valores de cada bloque y queda pendiente revisar la diferencia con la fuente.</p></section>';
 const gamesPage=page(3,'EL UNIVERSO DONDE LA CONVERSACIÓN ES PROTAGONISTA',gameBody,'LAS MISIONES');
 const clipsBody='<p class="comic-page-lead">Cuatro escenas seleccionadas por el creador. Los enlaces ya están incorporados al expediente; los títulos editoriales se definirán en una revisión posterior, al analizar el contenido de cada clip.</p><div class="comic-clips-grid">'+(clips.length?clips.map((c,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>ESCENA DESTACADA</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(c.clip_id||'')+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Clip de HÁBITOS ATÓMICOS" loading="lazy" allowfullscreen></iframe></div><h3>'+safe(c.title||('Momento destacado 0'+(i+1)))+'</h3><a href="'+safe(c.url||('https://clips.twitch.tv/'+(c.clip_id||'')))+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>').join(''):'<p>Clips pendientes de incorporar.</p>')+'</div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>05</span><b>EL TONO DEL CANAL</b></div><p>La selección audiovisual acompaña una propuesta basada en la conversación, la cercanía y el entretenimiento espontáneo. Los clips permiten mostrar momentos concretos sin reducir el canal a una tabla de estadísticas.</p></section>';
 const clipsPage=page(4,'IDEAS, REACCIONES Y MOMENTOS REALES',clipsBody,'EL ESPECTÁCULO');
 const commercialBody='<p class="comic-page-lead">Una propuesta de colaboración que parte de lo que el canal ya hace: conversar, compartir experiencias y descubrir juegos con su comunidad. Las siguientes opciones son formatos posibles, no campañas contratadas ni alianzas vigentes.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS POSIBLES</b></div><ul class="profile-detail-list"><li>Presentación y prueba de videojuegos en directo.</li><li>Conversaciones temáticas vinculadas a hábitos, aprendizaje y bienestar cotidiano, sin promesas profesionales.</li><li>Integraciones de productos o servicios que tengan relación genuina con la audiencia.</li><li>Dinámicas participativas y desafíos con la comunidad.</li><li>Selección de clips para amplificar momentos de una activación.</li></ul></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>VALOR PARA UNA MARCA</b></div><p>El peso de Solo charlando en la actividad observada ofrece un contexto favorable para propuestas que necesiten explicación, intercambio y demostración, más allá de una mención rápida.</p><p>El gaming suma un entorno natural para probar experiencias y generar situaciones compartidas.</p><p class="comic-panel-caption">Toda acción debe acordarse con el creador y adaptarse a su estilo. No se garantizan visualizaciones, conversiones ni resultados comerciales.</p></section></div><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · CONVERSEMOS</span><h3>UNA BUENA IDEA MERECE UNA CONVERSACIÓN.</h3><p>Para conocer el canal y acercar una propuesta:</p><a href="'+safe(hero.twitch)+'" target="_blank" rel="noopener">TWITCH · HABITOS_ATOMICOS ↗</a></section>';
 const commercialPage=page(5,'UNA ALIANZA QUE EMPIEZA CON UNA IDEA',commercialBody,'COLABORACIONES');
 return [cover,identityPage,statsPage,gamesPage,clipsPage,commercialPage];
}



function renderAkumaComicPages(hero,sullyChannel){
 const safe=v=>escapeStatsHtml(v===null||v===undefined?'—':String(v));
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const summary=sullyChannel?.summary||{};
 const overview=sullyChannel?.last_30_days||{};
 const streams=Array.isArray(sullyChannel?.recent_streams_30d)?sullyChannel.recent_streams_30d:(Array.isArray(sullyChannel?.streams)?sullyChannel.streams:[]);
 const period=sullyChannel?.period||{};
 const periodLabel=period.start_date&&period.end_date?statsDate(period.start_date)+' — '+statsDate(period.end_date):'Período sin confirmar';
 const gamesCount={};
 streams.forEach(st=>(Array.isArray(st.games)?st.games:[]).forEach(g=>gamesCount[g]=(gamesCount[g]||0)+1));
 const games=Object.entries(gamesCount).sort((a,b)=>b[1]-a[1]);
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 0'+n+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE EL INFERNAL · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-akuma"><span>VOZ DEL INFERNAL</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>AKUMA · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'024')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de AKUMA"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>AKUMA</h2><b>'+safe(hero.series||'03')+'</b></div><p class="comic-cover-subtitle">EL INFERNAL · TANQUE DEMONÍACO</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL CREADOR</b></div><p>Apasionado por los videojuegos y de espíritu competitivo, AKUMA combina partidas intensas con humor y conversaciones abiertas. Su canal es un punto de encuentro para quienes disfrutan tanto del desafío como de compartir el momento.</p><p class="comic-panel-caption">Gaming competitivo, juegos de terror y comunidad en directo.</p></section><aside class="hero-voice voice-akuma"><span>SU PRINCIPIO EN LA LEGIÓN</span><p>'+safe(hero.voice)+'</p></aside><footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<p class="comic-page-lead">Cuando cae la noche, el portal vuelve a abrirse. Del otro lado esperan partidas competitivas, sustos inesperados y una comunidad que sabe que la diversión también forma parte de la misión.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y PROPÓSITO</b></div><h3>'+safe(hero.codename)+'</h3><p>'+safe(hero.bio)+'</p><p>Su propuesta combina intensidad y cercanía: competir, reírse de lo que sale mal y convertir cada directo en una reunión compartida.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.characterRole)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">Poderes y rangos pertenecen al universo narrativo de Legión Multiversal; no son certificaciones ni indicadores de rendimiento.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>TERRENOS DE COMBATE</b></div><div class="comic-format-list">'+areas.map(v=>'<span>'+safe(v)+'</span>').join('')+'</div><p class="comic-panel-caption">El perfil público destaca los videojuegos competitivos y de terror, con espacio para charlas y encuentros con la comunidad.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>04</span><b>HORARIO DE APERTURA DEL PORTAL</b></div><div class="comic-metric-grid"><article class="comic-metric"><span>FRECUENCIA PUBLICADA</span><strong>DIARIA</strong><small>Según la descripción pública del canal</small></article><article class="comic-metric"><span>HORARIO</span><strong>19:00</strong><small>Hora de México · huso horario local del creador</small></article></div></section>';
 const identityPage=page(1,'EL PORTAL SE ABRE CADA NOCHE',identityBody,'EL PERSONAJE');
 const metrics=[['SEGUIDORES TOTALES',overview.followers_total,'en el canal'],['DIRECTOS REGISTRADOS',overview.streams_count,'en los últimos 30 días'],['TIEMPO EN DIRECTO',overview.airtime_hours+' h','43 horas acumuladas'],['HORAS VISTAS',overview.hours_watched,'en los últimos 30 días'],['PROMEDIO DE ESPECTADORES',overview.average_viewers,'promedio de los últimos 30 días'],['PICO DE ESPECTADORES',overview.peak_viewers,'máximo el 24 de octubre']];
 const metricCards=metrics.map(v=>'<article class="comic-metric"><span>'+safe(v[0])+'</span><strong>'+safe(v[1])+'</strong><small>'+safe(v[2])+'</small></article>').join('');
 const growthBody='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>CRECIMIENTO FRENTE A LOS 30 DÍAS ANTERIORES</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Indicador</th><th>Variación</th><th>Cambio</th></tr></thead><tbody><tr><th>Promedio de espectadores</th><td>+2</td><td>+100,0%</td></tr><tr><th>Horas vistas</th><td>+135 h</td><td>+245,5%</td></tr><tr><th>Seguidores ganados</th><td>+32</td><td>+1.600%</td></tr><tr><th>Pico de espectadores</th><td>+33</td><td>+412,5%</td></tr><tr><th>Horas transmitidas</th><td>+23 h</td><td>+115,0%</td></tr><tr><th>Transmisiones</th><td>+7</td><td>+46,7%</td></tr></tbody></table></div><p class="comic-panel-caption">Comparación publicada por SullyGnome respecto de los 30 días anteriores.</p></section>';
 const statsBody='<p class="comic-page-lead">Resumen de SullyGnome para los últimos 30 días ('+safe(periodLabel)+'). Los indicadores agregados corresponden a 22 directos; la bitácora posterior muestra solo las diez transmisiones visibles en el detalle compartido.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>INDICADORES DEL EXPEDIENTE</b></div><div class="comic-metric-grid">'+metricCards+'</div><p class="comic-panel-caption">Fuente: SullyGnome · historial de transmisiones aportado por el creador. Estado: '+safe(overview.account_status)+' · Idioma: '+safe(overview.language)+' · Canal creado: '+safe(overview.created_date)+' · Contenido maduro: '+safe(overview.mature_content?'Sí':'No')+'.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA DEL RENDIMIENTO</b></div><p>En el período, AKUMA acumuló 43 horas de emisión y 190 horas vistas. El pico de 41 espectadores se registró el 24 de octubre de 2026 a las 18:55, durante Rogue Legacy.</p><p>El canal sumó 34 seguidores durante el período y registra 142 seguidores totales. La duración media publicada por transmisión es de 1 h 59 min.</p></section>'+growthBody;
 const statsPage=page(2,'LA FUERZA DE CADA ENCUENTRO',statsBody,'LA AUDIENCIA');
 const gameRows=games.map(g=>'<tr><th>'+safe(g[0])+'</th><td>'+safe(g[1])+' de '+safe(streams.length)+'</td></tr>').join('');
 const gamesBody='<p class="comic-page-lead">La variedad es parte del repertorio del Infernal: desde el competitivo hasta las charlas y las experiencias de terror. En los últimos 30 días, Clive Barker’s Hellraiser: Revival fue la categoría con más tiempo en directo (11 h), mientras que Echoes in Darkness registró el mayor promedio (13 espectadores).</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>JUEGOS Y CATEGORÍAS REGISTRADOS</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Juego / categoría</th><th>Transmisiones donde aparece</th></tr></thead><tbody>'+gameRows+'</tbody></table></div><p class="comic-panel-caption">Otros títulos destacados: Gears of War: E-Day (3 h 15 min). El detalle por juego se limita a los datos que el resumen de SullyGnome muestra; no se extrapolan cifras para categorías sin métricas.</p></section><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>COMPETENCIA Y ACCIÓN</b></div><p>Fortnite aporta el costado competitivo, mientras que Can ’Em All y Rogue Legacy suman experiencias de acción y desafío.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>03</span><b>CHARLAS Y JUEGO SOCIAL</b></div><p>Just Chatting y Among Us muestran espacio para la conversación, la interacción y las partidas compartidas.</p></section></div>';
 const gamesPage=page(3,'UN REPERTORIO Y SU BITÁCORA',gamesBody+streamBody,'MISIONES Y BITÁCORA');
 const streamRows=streams.map(st=>'<tr><th>'+safe(statsDate(st.date))+'<small>'+safe(st.start_time)+'–'+safe(st.end_time)+'</small></th><td>'+safe(statsDuration(st))+'</td><td>'+safe(st.hours_watched)+'</td><td>'+safe(st.average_viewers)+'</td><td>'+safe(st.peak_viewers)+'</td><td>'+safe(st.followers_gain)+'</td></tr>').join('');
 const streamBody='<p class="comic-page-lead">Diez transmisiones visibles dentro del resumen de 30 días, de un total de 22 emisiones registradas. Los horarios se mantienen tal como aparecen en la fuente; no se les asigna una zona horaria que no esté especificada.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>BITÁCORA DE TRANSMISIONES</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Fecha / horario</th><th>Duración</th><th>Horas vistas</th><th>Prom.</th><th>Pico</th><th>Seguidores</th></tr></thead><tbody>'+streamRows+'</tbody></table></div><p class="comic-panel-caption">Fuente: SullyGnome · diez filas visibles de 22 transmisiones · 24 oct–5 nov 2026. La suma de esta tabla parcial no reemplaza el total agregado de 34 seguidores del período.</p></section>';
 const streamPage=page(4,'DIEZ MISIONES, UN MISMO PORTAL',streamBody,'BITÁCORA');
 const eventBody='<p class="comic-page-lead">Una misión compartida demuestra otra dimensión del canal: la capacidad de integrarse a una experiencia coordinada con otros creadores y construir una transmisión colectiva.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>EXPEDIENTE DE CAMPAÑA · BAR FENDER</b></div><div class="comic-metric-grid"><article class="comic-metric"><span>FECHA</span><strong>05 NOV</strong><small>2026</small></article><article class="comic-metric"><span>CREADORES EN MULTISTREAM</span><strong>04</strong><small>Transmisiones simultáneas coordinadas</small></article><article class="comic-metric"><span>PICO CONJUNTO INFORMADO</span><strong>98</strong><small>Audiencia combinada · no individual</small></article></div><p>AKUMA participó junto a Los Moriartys, Roderik y Lady Moriarty en una sesión conjunta de Bar Fender. La acción reunió cuatro canales en una misma experiencia y dejó un registro de colaboración grupal.</p><p class="comic-panel-caption">El pico de 98 corresponde al conjunto informado para la activación. No debe atribuirse como audiencia individual de AKUMA ni sumarse a sus métricas personales.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LO QUE DEMUESTRA ESTA MISIÓN</b></div><div class="comic-format-list"><span>Multistream coordinado</span><span>Juego compartido</span><span>Interacción entre comunidades</span><span>Activación grupal</span></div><p class="comic-panel-caption">El archivo audiovisual específico de AKUMA queda pendiente de incorporar cuando estén disponibles clips seleccionados por el creador.</p></section>';
 const eventPage=page(4,'CUANDO CUATRO PORTALES SE ABREN A LA VEZ',eventBody,'MISIONES COMPARTIDAS');
 const commercialBody='<p class="comic-page-lead">AKUMA puede aportar una presencia competitiva, espontánea y cercana a campañas que busquen mostrar un videojuego en acción y compartir la experiencia con una comunidad. Cada propuesta debe respetar su estilo y acordarse con el creador.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS POSIBLES</b></div><ul class="profile-detail-list"><li>Presentación y prueba de videojuegos competitivos o de terror.</li><li>Desafíos, partidas especiales y dinámicas con la comunidad.</li><li>Integraciones de periféricos y accesorios gaming durante el uso real.</li><li>Sesiones multistream y eventos con otros creadores.</li><li>Clips y piezas breves para amplificar momentos de una activación.</li></ul></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>VALOR PARA UNA MARCA</b></div><p>La combinación de juego competitivo, humor y conversación permite presentar productos en contexto, mostrar mecánicas y generar momentos compartidos. La experiencia grupal de Bar Fender aporta un antecedente concreto de participación en una activación coordinada.</p><p class="comic-panel-caption">La campaña mencionada fue grupal. No se atribuyen a AKUMA resultados individuales no medidos ni se garantizan visualizaciones, conversiones o ventas.</p></section></div><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS ALIANZAS</span><h3>EL PRÓXIMO DESAFÍO PUEDE SER CON TU MARCA.</h3><p>Conocé el canal y acercá tu propuesta:</p><a href="'+safe(hero.twitch)+'" target="_blank" rel="noopener">TWITCH · AKUMAZOLDYCK ↗</a></section>';
 const commercialPage=page(5,'UNA ALIANZA CON ESPÍRITU COMPETITIVO',commercialBody,'COLABORACIONES');
 return [cover,identityPage,statsPage,gamesPage,eventPage,commercialPage];
}


function renderArdipiiComicPages(hero,sullyChannel){
 const safe=v=>escapeStatsHtml(v===null||v===undefined?'':String(v));
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const summary=sullyChannel?.summary||{};
 const streams=Array.isArray(sullyChannel?.streams)?sullyChannel.streams:[];
 const record=creatorRecordsData?.channels?.ardipii||{};
 const clips=Array.isArray(record.highlights)?record.highlights:[];
 const games=['GTA 6','Gears E-Day','Fortnite','Minecraft','Roblox','Dead by Daylight','Rocket League','Call of Duty','Clash of Clans','Pokémon Unite'];
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 0'+n+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE ARDIPII · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-ardipii"><span>VOZ DEL FANTASMA</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>ARDIPII · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'037')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de ARDIPII"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>ARDIPII</h2><b>'+safe(hero.series||'03')+'</b></div><p class="comic-cover-subtitle">'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL PROFESOR</b></div><p>'+safe(hero.bio)+'</p><p class="comic-panel-caption">Docente de la Legión · Canal individual de Twitch · México.</p></section><footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y PROPÓSITO</b></div><h3>'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</h3><p>'+safe(hero.log)+'</p><p>Su lugar en la Legión es el de Docente: una presencia que recibe a la comunidad y abre espacio para compartir cada misión.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.rank)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">Los poderes y rangos pertenecen al universo narrativo de Legión Multiversal; no son certificaciones ni indicadores de rendimiento.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>UNIVERSOS Y FORMATOS</b></div><div class="comic-format-list">'+areas.map(v=>'<span>'+safe(v)+'</span>').join('')+'</div><p class="comic-panel-caption">Rango institucional: Docente. Identidad narrativa: El Fantasma, Guardián Espectral.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>04</span><b>HORARIO HABITUAL</b></div><div class="comic-metric-grid"><article class="comic-metric"><span>DÍAS</span><strong>MARTES · JUEVES</strong><small>Frecuencia informada</small></article><article class="comic-metric"><span>HORA</span><strong>20:00</strong><small>Hora de México (MX)</small></article></div></section>';
 const identityPage=page(1,'EL FANTASMA: BIENVENIDOS A LA GUARIDA',identityBody,'EL PERSONAJE');
 const metricCards=[['TRANSMISIONES',summary.streams_count,'en los últimos 30 días'],['HORAS EMITIDAS',summary.airtime_hours+' h','tiempo total en directo'],['HORAS VISTAS',summary.hours_watched,'acumuladas en el período'],['PROMEDIO',summary.average_viewers_duration_weighted,'espectadores promedio'],['PICO MÁXIMO',summary.peak_viewers,'máximo de espectadores'],['NUEVOS SEGUIDORES','+'+summary.followers_gain_reported,'ganados en el período']];
 const statsBody='<p class="comic-page-lead">Una fotografía de actividad del canal durante los últimos 30 días. Las cifras se presentan como resumen del período y no como resultados garantizados para futuras campañas.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>INDICADORES DEL PERÍODO</b></div><p class="comic-panel-caption">SullyGnome · 6 oct — 5 nov 2026 · resumen de 30 días compartido por el creador.</p><div class="comic-metric-grid">'+metricCards.map(v=>'<article class="comic-metric"><span>'+safe(v[0])+'</span><strong>'+safe(v[1])+'</strong><small>'+safe(v[2])+'</small></article>').join('')+'</div></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA DE AUDIENCIA</b></div><p>En el período se registraron 8 transmisiones y 121 horas vistas. El promedio fue de 11 espectadores, con un máximo de 31. El canal sumó 83 seguidores durante la ventana consultada.</p><p class="comic-panel-caption">Los indicadores corresponden exclusivamente al canal ARDIPII. Fuente: resumen de SullyGnome facilitado para este expediente.</p></section>';
 const statsPage=page(2,'EL PODER DE UNA COMUNIDAD PRESENTE',statsBody,'LA AUDIENCIA');
 const gameRows=games.map((g,i)=>'<tr><th>'+(i+1)+'. '+safe(g)+'</th><td>Selección compartida</td></tr>').join('');
 const streamRows=streams.map(st=>'<tr><th>'+safe(st.date)+'</th><td>'+safe(st.duration_minutes)+' min</td><td>'+safe(st.average_viewers)+'</td><td>'+safe(st.peak_viewers)+'</td><td>'+safe(st.hours_watched)+'</td><td>'+safe(st.category)+'</td></tr>').join('');
 const gamesBody='<p class="comic-page-lead">El repertorio de juegos compartido para el perfil reúne títulos de acción, aventura, construcción, competencia y experiencias sociales.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>TOP 10 · UNIVERSOS DEL CANAL</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Selección</th><th>Referencia</th></tr></thead><tbody>'+gameRows+'</tbody></table></div><p class="comic-panel-caption">Listado de juegos proporcionado por el creador; no representa un ranking de rendimiento calculado por SullyGnome.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>BITÁCORA DE TRANSMISIONES · MUESTRA DEL PERÍODO</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Fecha</th><th>Duración</th><th>Media</th><th>Pico</th><th>Horas vistas</th><th>Categoría</th></tr></thead><tbody>'+streamRows+'</tbody></table></div><p class="comic-panel-caption">Ocho transmisiones del 6 oct al 5 nov de 2026. Se excluyó la fila del 6 nov porque queda fuera de la ventana del resumen de 30 días.</p></section>';
 const gamesPage=page(3,'CADA DIRECTO, UNA NUEVA MISIÓN',gamesBody,'JUEGOS Y BITÁCORA');
 const clipsBody='<p class="comic-page-lead">Cuatro momentos seleccionados del canal. Los títulos se mantienen neutrales hasta contar con una descripción confirmada de cada escena.</p><div class="comic-clips-grid">'+(clips.length?clips.map((c,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>MOMENTO DESTACADO</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(c.clip_id||'')+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Clip de ARDIPII" loading="lazy" allowfullscreen></iframe></div><h3>'+safe(c.title||('Momento destacado 0'+(i+1)))+'</h3><a href="https://clips.twitch.tv/'+encodeURIComponent(c.clip_id||'')+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>').join(''):'<p>Clips pendientes de incorporar.</p>')+'</div>';
 const clipsPage=page(4,'MOMENTOS FUERA DEL GUIÓN',clipsBody,'EL ESPECTÁCULO');
 const commercialBody='<p class="comic-page-lead">La propuesta de ARDIPII combina conversación, cercanía y entretenimiento. Su actividad reciente muestra una presencia principalmente en la categoría Just Chatting, con una aparición registrada en Gears of War: E-Day.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS POSIBLES</b></div><ul class="profile-detail-list"><li>Presentaciones y conversaciones sobre videojuegos.</li><li>Integraciones de productos o servicios dentro de una charla en directo.</li><li>Dinámicas participativas con la comunidad.</li><li>Contenido de gaming y experiencias compartidas.</li><li>Selección de clips para amplificar momentos de una activación.</li></ul></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>VALOR PARA UNA MARCA</b></div><p>El formato conversacional puede ofrecer espacio para explicar, presentar y responder preguntas en contexto. La comunidad y la interacción forman parte del tono del canal.</p><p class="comic-panel-caption">Son posibilidades de colaboración, no campañas contratadas ni alianzas vigentes. No se garantizan visualizaciones, conversiones ni resultados comerciales.</p></section></div><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS ALIANZAS</span><h3>UNA NUEVA MISIÓN PUEDE EMPEZAR CON TU MARCA.</h3><p>Conocé el canal y acercá tu propuesta:</p><a href="https://twitch.tv/ardipii" target="_blank" rel="noopener">TWITCH · ARDIPII ↗</a></section><section class="lady-contact-panel"><span>CONTACTO COMERCIAL · LEGIÓN MULTIVERSAL</span><p>Para propuestas y consultas de colaboración:</p><a href="mailto:losmoriartys@gmail.com">losmoriartys@gmail.com</a></section>';
 const commercialPage=page(5,'EL UNIVERSO DE LAS COLABORACIONES',commercialBody,'NUEVAS ALIANZAS');
 return [cover,identityPage,statsPage,gamesPage,clipsPage,commercialPage];
}



function renderDaveNexusComicPages(hero,sullyChannel){
 const safe=escapeStatsHtml;
 const summary=sullyChannel?.annual_summary_2026||{};
 const streams=Array.isArray(sullyChannel?.streams)?sullyChannel.streams:[];
 const record=creatorRecordsData?.channels?.daved0608||{};
 const clips=Array.isArray(record.highlights)?record.highlights:[];
 const games=[
  ['Backrooms: Escape Together',1],
  ['Marvel Rivals',5],
  ['Bombanana',1],
  ['Warhammer 40,000: Space Marine II',2],
  ['For Honor',4],
  ['Monster Hunter: World',2],
  ['Dark Souls Remastered',2],
  ['Project Zomboid',1]
 ];
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page nexus-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 0'+n+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE NEXUS · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-nexus"><span>VOZ DEL NEXO</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>DAVE — NEXUS · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet nexus-page"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'048')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de DAVE — NEXUS"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>DAVE</h2><b>NEXUS</b></div><p class="comic-cover-subtitle">EL NEXO · GUARDIÁN TECNOLÓGICO</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · EXPEDIENTE DEL CREADOR</b></div><p>'+safe(hero.bio)+'</p><p class="comic-panel-caption">Gaming · exploración · acción · experiencias cooperativas y de aventura, según las categorías registradas en las transmisiones compartidas.</p></section><aside class="hero-voice voice-nexus"><span>SU PRINCIPIO EN LA LEGIÓN</span><p>'+safe(hero.voice)+'</p></aside><footer class="comic-cover-footer"><span>TWITCH · DAVED0608</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<p class="comic-page-lead">En la Legión, NEXUS representa el punto de conexión entre sistemas, señales y mundos. Su identidad visual y narrativa ya están definidas; esta ficha separa ese universo creativo de los datos reales del canal.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y PROPÓSITO</b></div><h3>'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</h3><p>'+safe(hero.log)+'</p><p>Tras un tiempo de pausa, Dave vuelve a las transmisiones para iniciar una nueva etapa. El rango institucional <strong>ESTUDIANTE</strong> representa esta reincorporación y el comienzo de su nuevo recorrido dentro de la Legión; no define su experiencia previa ni su valor como creador.</p><p><strong>HORARIO HABITUAL:</strong> '+safe(hero.schedule||'Sin horario fijo confirmado')+'.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.rank)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">Poderes y rango pertenecen al universo narrativo de Legión Multiversal; no son certificaciones ni indicadores de rendimiento.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>ÁREAS OBSERVADAS EN DIRECTO</b></div><div class="comic-format-list"><span>Gaming</span><span>Acción y combate</span><span>Exploración</span><span>Supervivencia</span><span>Experiencias cooperativas</span></div><p class="comic-panel-caption">Áreas inferidas únicamente de los juegos que aparecen en la muestra de transmisiones; no sustituyen una descripción personal del canal.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>04</span><b>SEÑAL DE TRANSMISIÓN</b></div><p>Canal individual de Twitch: <a href="'+safe(hero.twitch)+'" target="_blank" rel="noopener">twitch.tv/daved0608 ↗</a></p><p class="comic-panel-caption">Horario: sin frecuencia fija confirmada.</p></section>';
 const identityPage=page(1,'NEXUS: CONEXIONES ENTRE MUNDOS',identityBody,'EL PERSONAJE');
 const metrics=[
  ['TRANSMISIONES',summary.streams,'2026 · acumulado informado'],
  ['HORAS EMITIDAS',summary.hours_streamed+' h','2026 · acumulado informado'],
  ['HORAS VISTAS',summary.hours_watched,'2026 · acumulado informado'],
  ['PROMEDIO',summary.average_viewers,'espectadores promedio'],
  ['PICO MÁXIMO',summary.peak_viewers,'máximo anual informado'],
  ['SEGUIDORES GANADOS','+'+summary.followers_gained,'2026 · acumulado informado']
 ];
 const metricCards=metrics.map(v=>'<article class="comic-metric"><span>'+safe(v[0])+'</span><strong>'+safe(v[1])+'</strong><small>'+safe(v[2])+'</small></article>').join('');
 const statsBody='<p class="comic-page-lead">Resumen anual 2026 de SullyGnome, según los datos compartidos para este expediente. Es un acumulado del año y no una ventana de últimos 30 días.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>INDICADORES DEL AÑO</b></div><p class="comic-panel-caption">SullyGnome · 1 ene — 3 nov 2026 · resumen anual facilitado por el creador.</p><div class="comic-metric-grid">'+metricCards+'</div></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>EVOLUCIÓN INTERANUAL</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Indicador</th><th>Variación frente a 2025</th></tr></thead><tbody><tr><th>Horas vistas</th><td>+725,0%</td></tr><tr><th>Seguidores ganados</th><td>+400,0%</td></tr><tr><th>Pico de espectadores</th><td>+80,0%</td></tr><tr><th>Horas emitidas</th><td>+423,1%</td></tr><tr><th>Transmisiones</th><td>+350,0%</td></tr></tbody></table></div><p class="comic-panel-caption">Porcentajes copiados del comparativo anual publicado en SullyGnome. No se recalcularon a partir de las diez filas visibles.</p></section>';
 const statsPage=page(2,'UNA SEÑAL QUE SIGUE CRECIENDO',statsBody,'LA AUDIENCIA');
 const streamRows=streams.map(st=>'<tr><th>'+safe(statsDate(st.date))+' · '+safe(st.start_time||'—')+'</th><td>'+safe(statsDuration(st))+'</td><td>'+safe(st.hours_watched)+'</td><td>'+safe(st.average_viewers)+'</td><td>'+safe(st.peak_viewers)+'</td><td>'+safe(st.followers_gained)+'</td><td>'+safe(st.followers_per_hour)+'</td><td>'+safe((st.games||[]).join(' · '))+'</td></tr>').join('');
 const logBody='<p class="comic-page-lead">Diez transmisiones visibles dentro del historial anual compartido. La muestra no equivale al total de 45 directos del resumen 2026.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>BITÁCORA DE TRANSMISIONES</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Inicio</th><th>Duración</th><th>H. vistas</th><th>Media</th><th>Pico</th><th>Seguidores</th><th>Seg./h</th><th>Juegos registrados</th></tr></thead><tbody>'+streamRows+'</tbody></table></div><p class="comic-panel-caption">Se conservan los valores por fila tal como aparecen en la tabla aportada. Las columnas «Seguidores» y «Seg./h» son las etiquetas de la fuente; no se suman para reemplazar el resumen anual.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA DE LA MUESTRA</b></div><p>Las diez filas visibles reúnen 35 horas aproximadas de emisión. La tabla es una selección del historial; el resumen anual informa 68 horas emitidas y 45 transmisiones en total.</p><p class="comic-panel-caption">Los datos de la muestra y el resumen anual se mantienen separados para evitar que una selección parcial se presente como historial completo.</p></section>';
 const logPage=page(3,'CADA SESIÓN DEJA UNA HUELLA',logBody,'BITÁCORA');
 const gameRows=games.map(g=>'<tr><th>'+safe(g[0])+'</th><td>'+safe(g[1])+' de 10 registros</td></tr>').join('');
 const gamesBody='<p class="comic-page-lead">La bitácora muestra un repertorio variado: acción de héroes, combate, supervivencia, exploración y experiencias cooperativas.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>UNIVERSOS REGISTRADOS</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Juego / categoría</th><th>Filas donde aparece</th></tr></thead><tbody>'+gameRows+'</tbody></table></div><p class="comic-panel-caption">Conteo de apariciones en las diez transmisiones visibles, no ranking de popularidad ni distribución anual completa.</p></section><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>ACCIÓN Y COMBATE</b></div><p>Marvel Rivals, For Honor y Warhammer 40,000: Space Marine II.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>03</span><b>EXPLORACIÓN Y SUPERVIVENCIA</b></div><p>Backrooms: Escape Together, Monster Hunter: World, Dark Souls Remastered y Project Zomboid.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>04</span><b>VARIEDAD EN EL REPERTORIO</b></div><p>Bombanana también aparece en una transmisión compartida. La selección permite presentar un canal que alterna experiencias y no se limita a una sola franquicia.</p></section>';
 const gamesPage=page(4,'UN NEXO ENTRE DISTINTOS UNIVERSOS',gamesBody,'LOS JUEGOS');
 const clipsBody='<p class="comic-page-lead">Dos momentos destacados aportados para el expediente. Se presentan con reproductor integrado y acceso directo al clip original.</p><div class="comic-clips-grid">'+(clips.length?clips.map((c,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>ARCHIVO AUDIOVISUAL</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(c.clip_id||'')+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Clip de DAVE — NEXUS" loading="lazy" allowfullscreen></iframe></div><h3>'+safe(c.title||('Momento destacado 0'+(i+1)))+'</h3><a href="https://clips.twitch.tv/'+encodeURIComponent(c.clip_id||'')+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>').join(''):'<p>Clips pendientes de incorporar.</p>')+'</div>';
 const clipsPage=page(4,'DOS MOMENTOS, DOS PORTALES',clipsBody,'CLIPS');
 const commercialBody='<p class="comic-page-lead">NEXUS puede presentarse a marcas desde una propuesta flexible de gaming, descubrimiento de títulos y experiencias compartidas. La ficha no registra patrocinios ni acuerdos comerciales confirmados para este canal.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS POSIBLES</b></div><div class="comic-format-list"><span>Presentación y primeras impresiones de videojuegos</span><span>Integraciones naturales durante partidas</span><span>Retos y dinámicas con la comunidad</span><span>Clips y momentos audiovisuales</span><span>Experiencias cooperativas y de exploración</span></div></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>VALOR DE LA PROPUESTA</b></div><p>Variedad de categorías registradas y una identidad visual reconocible dentro de Legión Multiversal. Las propuestas se pueden adaptar al juego, producto o dinámica que la marca quiera presentar.</p><p class="comic-panel-caption">Son formatos potenciales para conversar; no se presentan como campañas realizadas ni resultados garantizados.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>CONTACTO Y CANAL</b></div><p><a href="'+safe(hero.twitch)+'" target="_blank" rel="noopener">TWITCH · DAVED0608 ↗</a></p><p class="comic-panel-caption">Contacto comercial directo pendiente de confirmar. No se publica un correo no proporcionado.</p></section>';
 const commercialPage=page(5,'EL PRÓXIMO MUNDO PUEDE SER UNA ALIANZA',commercialBody,'COLABORACIONES');
 return [cover,identityPage,statsPage,logPage,clipsPage,commercialPage];
}


function renderPatoOratorisComicPages(hero){
 const safe=escapeStatsHtml;
 const record=creatorRecordsData?.channels?.patoteexplica||{};
 const videos=Array.isArray(record.youtube_videos)?record.youtube_videos:[];
 const embeds=Array.isArray(record.featured_embeds)?record.featured_embeds:[];
 const youtubeProfile=platformStatsData?.creators?.patoteexplica?.platforms?.youtube||{};
 const youtubeMetrics=youtubeProfile.metrics||{};
 const youtubeVerified=youtubeProfile.status==='verified';
 const captureDate=platformStatsData?.updated_at?new Date(platformStatsData.updated_at).toLocaleString('es-AR',{dateStyle:'medium',timeStyle:'short'}):'fecha no disponible';
 const statsLead=youtubeVerified?'Métricas públicas acumuladas del canal, obtenidas mediante la API oficial de YouTube. La fecha indica la última sincronización registrada; no son métricas de Twitch ni espectadores en directo.':'Referencia histórica del canal compartida por el equipo. La fecha de captura no está disponible y los valores no deben interpretarse como actuales.';
 const statsSource=youtubeVerified?'Fuente: YouTube Data API v3 · última sincronización: '+captureDate+'.':'Fuente: información compartida por el equipo a partir de la página del canal. Fecha de captura no especificada.';
 const page=(n,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page oratoris-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 03</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE ORATORIS · PÁGINA 0'+(n+1)+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice voice-oratoris"><span>VOZ DE ORATORIS</span><p>'+safe(hero.voice)+'</p></aside>':'')+body+'<footer class="comic-page-footer"><span>PATO — ORATORIS · ARCHIVO INDIVIDUAL</span><b>0'+(n+1)+' / 06</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet oratoris-page"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'039')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de PATO — ORATORIS"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>COLABORADOR</span><h2>PATO</h2><b>ORATORIS</b></div><p class="comic-cover-subtitle">EL ORADOR · COMUNICADOR DEL CONOCIMIENTO</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD · CREADOR AUDIOVISUAL</b></div><p>'+safe(hero.bio)+'</p><p class="comic-panel-caption">YouTube · Educación · Programación · Divulgación</p></section><aside class="hero-voice voice-oratoris"><span>SU PRINCIPIO EN LA LEGIÓN</span><p>'+safe(hero.voice)+'</p></aside><footer class="comic-cover-footer"><span>YOUTUBE · @PATOTEEXPLICA</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityBody='<p class="comic-page-lead">ORATORIS representa la capacidad de convertir ideas y conocimientos en herramientas que otras personas puedan comprender y aplicar. Su lugar en la Legión es el de colaborador: una voz educativa y audiovisual, distinta de los perfiles dedicados a transmitir en directo.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD Y PROPÓSITO</b></div><h3>'+safe(hero.codename)+' · '+safe(hero.characterRole)+'</h3><p>'+safe(hero.log)+'</p><p class="comic-panel-caption">COLABORADOR · CREADOR DE CONTENIDO PARA YOUTUBE.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>CAPACIDADES DEL PERSONAJE</b></div><h3>'+safe(hero.rank)+'</h3><p>'+safe(hero.powerSet)+'</p><p class="comic-panel-caption">La carta y sus poderes pertenecen al universo narrativo de la Legión; no son títulos ni certificaciones profesionales.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>ÁREAS DE CONOCIMIENTO</b></div><div class="comic-format-list">'+(hero.areas||[]).map(v=>'<span>'+safe(v)+'</span>').join('')+'</div><p class="comic-panel-caption">La cultura gamer se considera una posible línea futura y complementaria, no el eje actual del canal.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>04</span><b>PLATAFORMAS DEL CREADOR</b></div><p><a href="'+safe(hero.youtube)+'" target="_blank" rel="noopener">YOUTUBE · PATOTEEXPLICA ↗</a></p><p><a href="'+safe(hero.instagram)+'" target="_blank" rel="noopener">INSTAGRAM · PATOTEEXPLICA ↗</a></p><p><a href="'+safe(hero.cafecito)+'" target="_blank" rel="noopener">CAFECITO · PATOSANTO ↗</a></p><p class="comic-panel-caption">No se registra canal de Twitch para este expediente; las métricas de streaming no aplican.</p></section>';
 const identityPage=page(1,'LA VOZ QUE CONVIERTE IDEAS EN HERRAMIENTAS',identityBody,'IDENTIDAD');
 const metricCards=[['SUSCRIPTORES',youtubeMetrics.subscribers,youtubeVerified?'acumulado del canal':'referencia compartida'],['VIDEOS',youtubeMetrics.videos_total,youtubeVerified?'publicaciones del canal':'publicaciones informadas'],['VISUALIZACIONES',youtubeMetrics.total_views,youtubeVerified?'acumulado del canal':'acumulado informado']];
 const metricHtml=metricCards.map(v=>'<article class="comic-metric"><span>'+safe(v[0])+'</span><strong>'+safe(v[1])+'</strong><small>'+safe(v[2])+'</small></article>').join('');
 const statsBody='<p class="comic-page-lead">'+safe(statsLead)+'</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>'+(youtubeVerified?'DATOS PÚBLICOS DEL CANAL':'REFERENCIA DEL CANAL')+'</b></div><div class="comic-metric-grid">'+metricHtml+'</div><p class="comic-panel-caption">'+safe(statsSource)+'</p><p><a href="'+safe(youtubeProfile.url||hero.youtube)+'" target="_blank" rel="noopener">CONSULTAR CANAL EN YOUTUBE ↗</a></p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>LECTURA CORRECTA DE LOS DATOS</b></div><p>Estas cifras describen el tamaño acumulado del canal. No representan espectadores en directo, horas emitidas ni actividad de Twitch.</p><p class="comic-panel-caption">'+(youtubeVerified?'Los contadores pueden cambiar entre sincronizaciones. La captura no constituye una proyección de crecimiento ni una garantía de resultados.':'Las métricas se actualizarán cuando exista una nueva captura verificable.')+'</p></section>';
 const statsPage=page(2,'EL PUNTO DE PARTIDA DEL CANAL',statsBody,'ALCANCE');
 const videoRows=videos.map((v,i)=>'<tr><th>0'+(i+1)+'</th><td>'+safe(v.title)+'</td><td>'+safe(v.views)+'</td><td>'+safe(v.series||'—')+'</td></tr>').join('');
 const archiveBody='<p class="comic-page-lead">Las seis publicaciones compartidas muestran dos líneas concretas: una serie didáctica de iniciación a HTML y JavaScript y una pieza de divulgación sobre dopamina, motivación y adicción.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>ARCHIVO DE PRODUCCIONES</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>N.º</th><th>Video</th><th>Vistas informadas</th><th>Serie</th></tr></thead><tbody>'+videoRows+'</tbody></table></div><p class="comic-panel-caption">Títulos, visualizaciones y orden transcritos del listado compartido por el equipo. La antigüedad indicada para las publicaciones es aproximada: hace un año.</p></section><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>DOS FORMAS DE ENSEÑAR</b></div><div class="comic-page-split"><div><h3>TECNOLOGÍA</h3><p>Una secuencia de cinco clases introductorias que avanza desde la primera página HTML hasta la integración de JavaScript.</p></div><div><h3>DIVULGACIÓN</h3><p>Una explicación dedicada a dopamina, motivación y adicción, ampliando el canal más allá de los tutoriales de programación.</p></div></div></section>';
 let archivePage=page(3,'LO QUE YA CONSTRUYÓ',archiveBody,'PRODUCCIONES');
 const embedHtml=embeds.map((v,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>VIDEO COMPARTIDO</b></div><div class="comic-clip-preview"><iframe src="https://www.youtube.com/embed/'+encodeURIComponent(v.video_id)+'" title="Video de Pato — ORATORIS" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a href="https://www.youtube.com/watch?v='+encodeURIComponent(v.video_id)+'" target="_blank" rel="noopener">ABRIR EN YOUTUBE ↗</a><p class="comic-panel-caption">Título: '+safe(v.title||'Pendiente de identificar')+'.</p></article>').join('');

 archivePage=archivePage.replace('</article>','<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>VIDEOS DESTACADOS</b></div><div class="comic-clips-grid">'+(embedHtml||'<p>Videos destacados pendientes de incorporar.</p>')+'</div></section></article>');
 const futureBody='<p class="comic-page-lead">El proyecto no tiene actualmente una frecuencia de publicación definida. Pato comentó que posiblemente retome el canal durante 2027 con un enfoque renovado.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>BASE EDITORIAL</b></div><div class="comic-format-list"><span>Educación y divulgación</span><span>Programación y herramientas digitales</span><span>Comportamiento, motivación y hábitos</span></div><p class="comic-panel-caption">Líneas que sí aparecen en las publicaciones ya compartidas.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>POSIBLE EXPANSIÓN</b></div><div class="comic-format-list"><span>Videojuegos y cultura gamer</span><span>Contenido vinculado al universo de la Legión</span></div><p class="comic-panel-caption">Ideas mencionadas como posibilidades futuras. No son una programación confirmada ni el fuerte actual del canal.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>ESTADO DEL PROYECTO</b></div><p><strong>PRÓXIMA ETAPA:</strong> posible regreso en 2027.</p><p><strong>FRECUENCIA:</strong> sin calendario definido.</p><p><strong>ENFOQUE:</strong> por renovar junto con el creador.</p><p class="comic-panel-caption">El expediente podrá actualizarse cuando Pato confirme sus nuevos formatos, ritmo de publicación y prioridades editoriales.</p></section>';
 const futurePage=page(4,'UNA NUEVA ETAPA EN PREPARACIÓN',futureBody,'PROYECCIÓN');
 const commercialBody='<p class="comic-page-lead">La propuesta comercial de ORATORIS debe construirse alrededor de la comunicación de ideas, la educación y la creación de piezas audiovisuales. Los siguientes formatos son posibilidades para conversar, no servicios contratados ni campañas realizadas.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS POTENCIALES</b></div><div class="comic-format-list"><span>Videos educativos o explicativos</span><span>Presentación de herramientas y plataformas digitales</span><span>Integraciones de producto dentro de contenidos pertinentes</span><span>Contenido divulgativo patrocinado, sujeto a criterio editorial</span><span>Colaboraciones audiovisuales con otros integrantes</span></div></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>ENCAJE DE MARCA</b></div><p>Proyectos de tecnología, educación, software, herramientas digitales y divulgación podrían tener afinidad con las líneas ya exploradas por el canal.</p><p class="comic-panel-caption">La temática gamer podría abrir oportunidades adicionales en el futuro, una vez que esa línea exista y esté desarrollada.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>CONTACTO Y PRESENCIA</b></div><p><a href="'+safe(hero.youtube)+'" target="_blank" rel="noopener">YOUTUBE · @PATOTEEXPLICA ↗</a></p><p><a href="'+safe(hero.instagram)+'" target="_blank" rel="noopener">INSTAGRAM · @PATOTEEXPLICA ↗</a></p><p><a href="'+safe(hero.cafecito)+'" target="_blank" rel="noopener">CAFECITO · PATOSANTO ↗</a></p><p class="comic-panel-caption">Contacto comercial directo y condiciones de colaboración pendientes de confirmar con Pato.</p></section>';
 const commercialPage=page(5,'CONOCIMIENTO QUE PUEDE CONECTAR CON MARCAS',commercialBody,'COLABORACIONES');
 return [cover,identityPage,statsPage,archivePage,futurePage,commercialPage];
}

function renderRosterComicPages(hero,index,channelStats,sullyChannel){
 const safe=v=>escapeStatsHtml(v||'');
 const identity=hero.codename||'IDENTIDAD EN ARCHIVO';
 const role=hero.characterRole||hero.rank||'INTEGRANTE DE LA LEGIÓN';
 const areas=Array.isArray(hero.areas)?hero.areas:[];
 const voiceStyle=({MORIARTYS:'voice-moriartys',ROD3R1K:'voice-rod3r1k',LADYMORIARTY:'voice-lady',ARDIPII:'voice-ardipii',AKUMA:'voice-akuma','DAVE — NEXUS':'voice-nexus','PATO — ORATORIS':'voice-oratoris',HABITOS:'voice-habitos'})[hero.name]||'voice-default';
 const page=(chapter,title,body,foot)=>'<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO '+chapter+'</b><span>'+foot+'</span></header><div class="comic-page-title"><small>EXPEDIENTE '+safe(hero.name)+' · PÁGINA 0'+chapter+'</small><h2>'+title+'</h2></div>'+(hero.voice?'<aside class="hero-voice '+voiceStyle+'"><span>VOZ DEL HÉROE</span><p>“'+safe(hero.voice)+'”</p></aside>':'')+body+'<footer class="comic-page-footer"><span>'+safe(hero.name)+' · ARCHIVO INDIVIDUAL</span><b>0'+chapter+' / 04</b></footer></article>';
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+safe(hero.cardNumber||'S/N')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EXPEDIENTE<br>CLASIFICADO</span><img class="comic-cover-art" src="'+safe(hero.img)+'" alt="Carta oficial de '+safe(hero.name)+'"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>'+safe(hero.name)+'</h2><b>'+safe(hero.series||'01')+'</b></div><p class="comic-cover-subtitle">'+safe(identity)+' · '+safe(role)+'</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · PERFIL DEL HÉROE</b></div><p>'+safe(hero.bio||'Presentación individual pendiente de confirmación.')+'</p><p class="comic-panel-caption">Expediente individual. Los datos no disponibles se identifican como pendientes de verificación.</p></section>'+(hero.voice?'<aside class="hero-voice '+voiceStyle+'"><span>SU VOZ EN LA LEGIÓN</span><p>“'+safe(hero.voice)+'”</p></aside>':'')+'<footer class="comic-cover-footer"><span>'+areas.map(safe).join(' · ')+'</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const statsBody='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>ACTIVIDAD Y ALCANCE</b></div><p class="comic-panel-caption">Las métricas se muestran según la disponibilidad de fuentes para este canal. Las ventanas, fechas y fuentes se conservan en cada bloque; los datos ausentes no se estiman.</p>'+renderStatsDashboard(hero,channelStats,sullyChannel)+'</section>';
 const stats=page('01','EL PODER DE LA AUDIENCIA',statsBody,'LA COMUNIDAD');
 const powerBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>CAPACIDADES REGISTRADAS</b></div><h3>'+safe(identity)+'</h3><p>'+safe(hero.powers||hero.powerSet||'Descripción de habilidades pendiente de confirmar con el integrante.')+'</p><p class="comic-panel-caption">Los elementos narrativos de la carta identifican al personaje dentro de la Legión; no representan certificaciones ni métricas de rendimiento.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>ESPECIALIDADES Y UNIVERSOS</b></div><div class="comic-format-list">'+(areas.length?areas.map(v=>'<span>'+safe(v)+'</span>').join(''):'<span>Especialidades pendientes de confirmar</span>')+'</div></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>BITÁCORA DE MISIONES</b></div>'+renderMissionArchive(hero)+'</section>';
 const missions=page('02','TRAYECTORIA Y MISIONES',powerBody,'LAS MISIONES');
 const profile=hero.mediaProfile||{};
 const formats=profile.formats||areas;
 const opportunities=profile.opportunities||[];
 const commercialBody='<div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>CONTENIDO Y FORMATOS</b></div><p>'+safe(profile.editorial||'La propuesta editorial se construye a partir de las áreas y contenidos públicos del creador.')+'</p><div class="comic-format-list">'+(formats.length?formats.map(v=>'<span>'+safe(v)+'</span>').join(''):'<span>Formatos por confirmar</span>')+'</div></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>OPORTUNIDADES DE COLABORACIÓN</b></div>'+(opportunities.length?'<ul class="profile-detail-list">'+opportunities.map(v=>'<li>'+safe(v)+'</li>').join('')+'</ul>':'<p>Se pueden evaluar presentaciones de producto, pruebas de videojuegos, integraciones y acciones con comunidad, siempre sujetas a conversación y aprobación del creador.</p>')+'<p class="comic-panel-caption">'+safe(profile.disclaimer||'Propuestas potenciales; no implican campañas contratadas ni alianzas vigentes.')+'</p></section></div><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS COLABORACIONES</span><h3>HAGAMOS QUE TU MARCA FORME PARTE DE LA HISTORIA.</h3><p>Contacto y propuestas comerciales:</p>'+(profile.contact?'<a href="mailto:'+safe(profile.contact)+'">'+safe(profile.contact)+'</a>':'<p>Canal de contacto pendiente de confirmar con el creador.</p>')+'</section>';
 const commercial=page('03','EL UNIVERSO COMERCIAL',commercialBody,'COLABORACIONES');
 return [cover,stats,missions,commercial];
}

function renderRod3r1kComicPages(hero){
 const games=[
  ['Fortnite',28,'28,9%',596,'26,5%',18,51],
  ['Just Chatting',24,'25,1%',509,'22,6%',16,50],
  ['Alien: Isolation',9,'10,1%',295,'13,1%',34,48],
  ["Clive Barker's Hellraiser: Revival",8,'8,8%',257,'11,4%',24,66],
  ['Rogue Company',8,'8,8%',185,'8,3%',19,48],
  ['Luto',7,'7,2%',173,'7,7%',27,46],
  ['Counter-Strike',3,'3,6%',99,'4,4%',26,41],
  ['Among Us',2,'2,6%',18,'0,8%',7,11],
  ['Barfender',2,'2,3%',50,'2,2%',19,37],
  ['Dead by Daylight',2,'2,1%',48,'2,2%',24,33],
  ['Marvel Rivals',0,'0,5%',17,'0,8%',34,39]
 ];
 const streams=[
  ['05 nov 2026','3 h 49 min',72,19,52,0],
  ['04 nov 2026','4 h 04 min',69,17,38,3],
  ['03 nov 2026','3 h 18 min',69,21,46,2],
  ['02 nov 2026','3 h 35 min',93,26,51,-1],
  ['31 oct 2026','7 h 49 min',117,15,35,2],
  ['29 oct 2026','3 h 35 min',50,14,25,1],
  ['28 oct 2026','4 h 06 min',82,20,44,3],
  ['27 oct 2026','3 h 21 min',56,17,44,4],
  ['26 oct 2026','4 h 06 min',94,23,47,5],
  ['24 oct 2026','5 h 05 min',142,28,55,3]
 ];
 const clips=[
  ['Spicy Piliable Poultry Corgi Derp','SpicyPiliablePoultryCorgiDerp-flAxKL1oWuPkWDWA','Momentos divertidos y espontáneos'],
  ['Hilarious Ironic Soybean Chocolate Rain','HilariousIronicSoybeanChocolateRain','Una escena destacada del canal'],
  ['Cooperative Popular Flamingo','CooperativePopularFlamingoM4xHeh-3bJjuJyiLiZOEEaC','Partidas y complicidad en directo']
 ];
 const esc=escapeStatsHtml;
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EXPEDIENTE INDIVIDUAL · N.º '+esc(hero.cardNumber||'008')+'</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EL EXPEDIENTE<br>DEL FUERTE</span><img class="comic-cover-art" src="'+esc(hero.img)+'" alt="Carta oficial de ROD3R1K"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>ROD3R1K</h2><b>008</b></div><p class="comic-cover-subtitle">EL FUERTE · INGENIERO SÓNICO</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · BIOGRAFÍA DEL CREADOR</b></div><p>Bienvenidos al canal. Me llamo Roderik, mejor conocido como «ElKrakenaso». Encontrarás momentos divertidos y épicos. ¡Acompañame en las partidas y divertite!</p></section><aside class="hero-voice voice-rod3r1k"><span>SU LEMA EN LA LEGIÓN</span><p>«¡Que se escuche hasta el último rincón! Si vamos a jugar, que cada partida deje una historia.»</p></aside><footer class="comic-cover-footer"><span>GAMING · EVENTOS · COMUNIDAD</span><b>¡ABRIR EXPEDIENTE!</b></footer></div></article>';
 const identityPage='<article class="comic-book-sheet comic-interior-page rod3r1k-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 01</b><span>EL PERSONAJE</span></header><div class="comic-page-title"><small>EXPEDIENTE ROD3R1K · PÁGINA 02</small><h2>EL FUERTE: UNA HISTORIA DE EQUIPO</h2></div><p class="comic-page-lead">Antes de las estadísticas y los clips está la persona detrás del personaje: Roderik, conocido como «ElKrakenaso», y una forma de jugar donde la energía, el espectáculo y el espíritu de equipo son parte de cada misión.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD EN LA LEGIÓN</b></div><h3>EL FUERTE</h3><p>Fundador de las primeras misiones. Su presencia aporta intensidad, humor y empuje a las aventuras compartidas: convierte una partida en un acontecimiento y al equipo en parte de la historia.</p></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>SELLO DEL PERSONAJE</b></div><h3>INGENIERO SÓNICO</h3><p>Una identidad narrativa construida alrededor de la energía, el espectáculo y la fuerza del grupo.</p><p class="comic-panel-caption">El nombre, el rol y las capacidades pertenecen al universo creativo de Legión Multiversal; no son credenciales ni indicadores de rendimiento.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>SU LEMA EN LA LEGIÓN</b></div><blockquote>«¡Que se escuche hasta el último rincón! Si vamos a jugar, que cada partida deje una historia.»</blockquote></section><footer class="comic-page-footer"><span>EL PERSONAJE DETRÁS DE CADA MISIÓN</span><b>02 / 06</b></footer></article>';
 const totalHours=(2568/60).toFixed(1).replace('.',',')+' h';
 const stats='<article class="comic-book-sheet comic-interior-page rod3r1k-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 02</b><span>LA COMUNIDAD</span></header><div class="comic-page-title"><small>EXPEDIENTE ROD3R1K · PÁGINA 03</small><h2>EL PODER DE LA AUDIENCIA</h2></div><p class="comic-page-lead">Actividad reciente registrada en las diez transmisiones compartidas, del 24 de octubre al 5 de noviembre de 2026. Los resultados describen esta muestra, no el historial completo del canal.</p><div class="comic-metric-grid"><article class="comic-metric"><span>HORAS EN DIRECTO</span><strong>'+totalHours+'</strong><small>10 transmisiones · suma de duraciones</small></article><article class="comic-metric"><span>HORAS VISTAS</span><strong>844</strong><small>Acumulado de la muestra</small></article><article class="comic-metric"><span>PICO DE ESPECTADORES</span><strong>55</strong><small>Máximo de estas 10 transmisiones</small></article><article class="comic-metric"><span>SEGUIDORES NETOS</span><strong>+22</strong><small>Suma reportada en la muestra</small></article><article class="comic-metric"><span>MEDIA PONDERADA</span><strong>19,8</strong><small>Estimación ponderada por duración de cada directo</small></article><article class="comic-metric"><span>TRANSMISIONES</span><strong>10</strong><small>24 oct – 5 nov 2026</small></article></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>02</span><b>ÚLTIMAS TRANSMISIONES</b></div><p class="comic-panel-caption">Valores por directo: horas vistas, espectadores promedio y pico, y seguidores ganados. El orden es cronológico inverso.</p><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Fecha</th><th>Duración</th><th>Horas vistas</th><th>Media</th><th>Pico</th><th>Seguidores</th></tr></thead><tbody>'+streams.map(x=>'<tr><td>'+x[0]+'</td><td>'+x[1]+'</td><td>'+x[2]+'</td><td>'+x[3]+'</td><td>'+x[4]+'</td><td>'+(x[5]>0?'+':'')+x[5]+'</td></tr>').join('')+'</tbody></table></div></section><p class="comic-panel-caption">Fuente: tabla de transmisiones compartida para este expediente. El promedio ponderado se calcula a partir de la duración y los espectadores promedio de cada sesión; no equivale a un promedio histórico de Twitch.</p><footer class="comic-page-footer"><span>LA COMUNIDAD ES PARTE DE LA HISTORIA</span><b>03 / 06</b></footer></article>';
 const maxHours=Math.max(...games.map(g=>g[1]));
 const gameRows=games.map(g=>'<tr><td>'+g[0]+'</td><td>'+g[1]+' h <small>('+g[2]+')</small></td><td>'+g[3]+' h <small>('+g[4]+')</small></td><td>'+g[5]+'</td><td>'+g[6]+'</td></tr>').join('');
 const gamesPage='<article class="comic-book-sheet comic-interior-page rod3r1k-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 03</b><span>LAS MISIONES</span></header><div class="comic-page-title"><small>EXPEDIENTE ROD3R1K · PÁGINA 04</small><h2>UN HÉROE, MUCHOS UNIVERSOS</h2></div><p class="comic-page-lead">De la acción competitiva a los juegos de terror y las charlas en directo: un recorrido variado por los mundos que forman parte del canal.</p><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>JUEGOS Y RENDIMIENTO</b></div><p class="comic-panel-caption">Horas de emisión y horas vistas con participación porcentual, espectadores promedio y pico. Se conserva el redondeo de la fuente.</p><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Juego</th><th>Emisión</th><th>Horas vistas</th><th>Media</th><th>Pico</th></tr></thead><tbody>'+gameRows+'</tbody></table></div></section><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>MAYOR AUDIENCIA MEDIA</b></div>'+games.slice().sort((a,b)=>b[5]-a[5]).slice(0,5).map(g=>'<div class="comic-chart-row"><span>'+g[0]+'</span><div class="comic-chart-track"><i style="width:'+Math.round(g[5]/34*100)+'%"></i></div><b>'+g[5]+'</b></div>').join('')+'</section><section class="comic-panel"><div class="comic-panel-heading"><span>03</span><b>MAYOR PICO REGISTRADO</b></div>'+games.slice().sort((a,b)=>b[6]-a[6]).slice(0,5).map(g=>'<div class="comic-chart-row"><span>'+g[0]+'</span><div class="comic-chart-track"><i style="width:'+Math.round(g[6]/66*100)+'%"></i></div><b>'+g[6]+'</b></div>').join('')+'</section></div><p class="comic-panel-caption">Nota: el valor de 0 h para Marvel Rivals se conserva tal como aparece en la tabla original, aunque registra 0,5% del tiempo de emisión; puede deberse al redondeo.</p><footer class="comic-page-footer"><span>CADA DIRECTO, UNA NUEVA MISIÓN</span><b>04 / 06</b></footer></article>';
 const clipCards=clips.map((c,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>ESCENA DESTACADA</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+encodeURIComponent(c[1])+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Clip de ROD3R1K" loading="lazy" allowfullscreen></iframe></div><h3>'+c[0]+'</h3><p>'+c[2]+'</p><a href="https://clips.twitch.tv/'+encodeURIComponent(c[1])+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>').join('');
 const clipsPage='<article class="comic-book-sheet comic-interior-page rod3r1k-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 04</b><span>EL ESPECTÁCULO</span></header><div class="comic-page-title"><small>EXPEDIENTE ROD3R1K · PÁGINA 05</small><h2>MOMENTOS QUE HACEN HISTORIA</h2></div><p class="comic-page-lead">Una selección de clips para conocer el humor, la energía y los momentos épicos que aparecen en sus partidas.</p><div class="comic-clips-grid">'+clipCards+'</div><footer class="comic-page-footer"><span>CONTINUARÁ…</span><b>05 / 06</b></footer></article>';
 const commercialPage='<article class="comic-book-sheet comic-interior-page rod3r1k-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 05</b><span>COLABORACIONES</span></header><div class="comic-page-title"><small>EXPEDIENTE ROD3R1K · PÁGINA 06</small><h2>UNA ALIANZA CON FUERZA PROPIA</h2></div><p class="comic-page-lead">Una propuesta comercial construida desde su identidad: gaming, entretenimiento, energía en directo y experiencias compartidas con la comunidad.</p><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>FORMATOS DE COLABORACIÓN</b></div><div class="comic-format-list"><span>Presentación y prueba de videojuegos</span><span>Integraciones naturales durante directos</span><span>Retos y dinámicas con la comunidad</span><span>Contenido de gaming y entretenimiento</span><span>Clips y piezas audiovisuales</span></div></section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>VALOR QUE APORTA</b></div><p>Una presencia expresiva y enérgica, con afinidad por experiencias competitivas, terror, acción y juegos compartidos. La propuesta permite integrar marcas de manera orgánica en partidas y contenidos.</p><p class="comic-panel-caption">Las propuestas son posibilidades a conversar; no representan campañas ni alianzas confirmadas.</p></section></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>SU LUGAR EN LA LEGIÓN</b></div><p>Integrante de la primera etapa junto a Demian. Su recorrido está ligado a las partidas fundacionales y al impulso de encuentros y experiencias compartidas.</p></section><section class="comic-final-cta"><span>PRÓXIMO NÚMERO · NUEVAS COLABORACIONES</span><h3>HAGAMOS QUE TU MARCA FORME PARTE DE LA HISTORIA.</h3><p>Contacto y propuestas comerciales:</p><a href="mailto:losmoriartys@gmail.com">losmoriartys@gmail.com</a></section><footer class="comic-page-footer"><span>EL SIGUIENTE CAPÍTULO PUEDE SER CON TU MARCA</span><b>06 / 06</b></footer></article>';
 return [cover,identityPage,stats,gamesPage,clipsPage,commercialPage];
}

function renderMoriartysComicPages(hero){
 const games=[
  {name:'Minecraft',air:'3 h',avg:34,followers:7,perHour:2},
  {name:'Marvel Rivals',air:'2 h',avg:33,followers:3,perHour:2},
  {name:'Supercar Collection Together',air:'2 h',avg:31,followers:null,perHour:null},
  {name:'Fortnite',air:'4 h',avg:27,followers:5,perHour:1},
  {name:'Enshrouded',air:'4 h',avg:26,followers:5,perHour:1}
 ];
 const clips=[
  {title:'Música del Rincón del Nerd hecha por Demi',id:'AgileAssiduousConsoleCeilingCat-N-95sSpINtTMo3wj',note:'Creatividad y sello propio del canal'},
  {title:'Ari modo tóxica',id:'DelightfulSneakyMonkeyBleedPurple-gDdjWpKPkU5irwbo',note:'Humor y complicidad en directo'},
  {title:'El Demi casi muere del susto',id:'GiantUninterestedTardigradeBrokeBack-PLdKJCgbad8xhKp-',note:'Reacciones espontáneas y entretenimiento'}
 ];
 const geography=[
  ['México','31%','31'],['Argentina','23%','23'],['Colombia','8%','8'],['Perú','7%','7'],['Chile','7%','7'],['Estados Unidos','5%','5'],['Uruguay','4%','4'],['Ecuador','3%','3'],['España','3%','3'],['Bolivia','2%','2'],['República Dominicana','1%','1'],['Costa Rica','1%','1'],['Venezuela','1%','1'],['Nicaragua','1%','1'],['Panamá','<1%','1']
 ];
 const maxAvg=Math.max(...games.map(g=>g.avg));
 const cover='<article class="comic-book-sheet comic-cover-sheet"><header class="comic-cover-masthead"><b>LEGIÓN MULTIVERSAL</b><span>EDICIÓN ESPECIAL · N.º 001</span><span>MEDIA KIT</span></header><div class="comic-cover-art-frame"><span class="comic-cover-burst">EL EXPEDIENTE<br>DEL HÉROE</span><img class="comic-cover-art" src="'+escapeStatsHtml(hero.img)+'" alt="Carta de superhéroe de MORIARTY"></div><div class="comic-cover-copy"><div class="comic-cover-titleline"><span>PROTAGONISTA</span><h2>MORIARTY</h2><b>001</b></div><p class="comic-cover-subtitle">CREADOR DE LEGIÓN MULTIVERSAL</p><section class="comic-panel comic-cover-bio"><div class="comic-panel-heading"><span>01</span><b>IDENTIDAD SECRETA · BIOGRAFÍA DEL CANAL</b></div><p>Bienvenido al videoclub 📼 Somos Demi y Ari - Los Moriartys. Pareja gamer y orgullosos nerds. Acá no hay pro-players, hay partidas que salen mal y terminan mejor. Simuladores de tienda, coop caótico, pelis y cómics. LUN/MIE 20HS | VIE 21HS ARG</p><p class="comic-panel-caption">Horario habitual declarado por los creadores · canal compartido.</p></section><section class="comic-epic-code"><span>CÓDIGO DE CREADOR · EPIC GAMES</span><strong>LosMoriartys</strong><p>Apoyá al canal usando nuestro código de creador en Epic Games.</p></section><footer class="comic-cover-footer"><span>UNA HISTORIA DE JUEGOS, HUMOR Y CULTURA GEEK</span><b>¡COMIENZA LA AVENTURA!</b></footer></div></article>';
 const metrics=[['Seguidores','1.145','TOTAL DEL CANAL'],['Media de espectadores','26','CCV · ÚLTIMOS 30 DÍAS'],['Pico de espectadores','101','MÁXIMO HISTÓRICO · 7 OCT 2026'],['Horas vistas','860 h','ÚLTIMOS 30 DÍAS'],['Nuevos seguidores','+49','ÚLTIMOS 30 DÍAS'],['Horas emitidas','32 h 15 min','ÚLTIMOS 30 DÍAS']];
 const metricsPage='<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 01</b><span>LA COMUNIDAD</span></header><div class="comic-page-title"><small>EXPEDIENTE MORIARTY · PÁGINA 02</small><h2>EL PODER DE LA AUDIENCIA</h2></div><section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>01</span><b>SEÑALES DE ACTIVIDAD</b></div><p class="comic-panel-caption">Métricas del canal compartido Los Moriartys (Demi + Ari), no métricas personales de MORIARTY. Rendimiento de los últimos 30 días consultado el 5 nov 2026 en <a href="https://streamscharts.com/channels/losmoriartys" target="_blank" rel="noopener">Streams Charts ↗</a>.</p><div class="comic-metric-grid">'+metrics.map((v,i)=>'<article class="comic-metric comic-metric-v'+(i+1)+'"><span>'+v[0]+'</span><strong>'+v[1]+'</strong><small>'+v[2]+'</small></article>').join('')+'</div></section><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>ALCANCE INTERNACIONAL</b></div><h3>2.695 VISTAS</h3><p class="comic-panel-caption">Informe aportado: 2.695 vistas. Período no especificado; son vistas, no espectadores únicos. Se mantiene como referencia histórica hasta recibir una actualización verificable.</p><div class="comic-geo-grid">'+geography.map(v=>'<div class="comic-geo-row"><span>'+v[0]+'</span><div class="comic-geo-track"><i style="width:'+v[2]+'%"></i></div><b>'+v[1]+'</b></div>').join('')+'</div></section><aside class="comic-speech-bubble"><span>¿QUIÉN ESTÁ DEL OTRO LADO?</span><p>Por observación directa del creador, la comunidad parece concentrarse principalmente entre los <b>25 y 40 años</b>. Es una estimación cualitativa, no una medición demográfica oficial ni un dato de analítica de Twitch.</p></aside></div><footer class="comic-page-footer"><span>LA COMUNIDAD ES PARTE DE LA HISTORIA</span><b>02 / 04</b></footer></article>';
 let gameCharts='<section class="comic-panel"><div class="comic-panel-heading"><span>01</span><b>QUIÉN ACOMPAÑA CADA AVENTURA</b></div><h3>AUDIENCIA MEDIA POR JUEGO</h3>';
 games.slice().sort((a,b)=>b.avg-a.avg).forEach(g=>gameCharts+='<div class="comic-chart-row"><span>'+g.name+'</span><div class="comic-chart-track"><i style="width:'+Math.round(g.avg/maxAvg*100)+'%"></i></div><b>'+g.avg+'</b></div>');
 gameCharts+='</section><section class="comic-panel"><div class="comic-panel-heading"><span>02</span><b>NUEVOS ALIADOS</b></div><h3>SEGUIDORES POR HORA EMITIDA</h3>';
 games.filter(g=>g.perHour!==null).slice().sort((a,b)=>b.perHour-a.perHour||b.followers-a.followers).forEach(g=>gameCharts+='<div class="comic-chart-row"><span>'+g.name+'</span><div class="comic-chart-track growth"><i style="width:'+Math.round(g.perHour/2*100)+'%"></i></div><b>'+g.perHour+'/h</b></div>');
 gameCharts+='</section>';
 let table='<section class="comic-panel comic-panel-wide"><div class="comic-panel-heading"><span>03</span><b>REGISTRO DE MISIONES</b></div><div class="stats-table-wrap"><table class="comic-games-table"><thead><tr><th>Juego</th><th>Horas emitidas</th><th>Media espectadores</th><th>Seguidores ganados</th><th>Por hora</th></tr></thead><tbody>';
 games.forEach(g=>table+='<tr><td>'+g.name+'</td><td>'+g.air+'</td><td>'+g.avg+'</td><td>'+(g.followers===null?'—':'+'+g.followers)+'</td><td>'+(g.perHour===null?'—':g.perHour+'/h')+'</td></tr>');
 table+='</tbody></table></div></section>';
 const gamesPage='<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 02</b><span>LAS MISIONES</span></header><div class="comic-page-title"><small>EXPEDIENTE MORIARTY · PÁGINA 03</small><h2>UN HÉROE, MUCHOS UNIVERSOS</h2></div><p class="comic-page-lead">Cada juego abre una historia distinta: construcción, acción, aventura, simulación y caos cooperativo. La variedad permite conectar con comunidades y propuestas diferentes. Las cifras por juego son una selección aportada por el creador; su período exacto no está identificado y no debe confundirse con las métricas generales de los últimos 30 días.</p><div class="comic-game-layout">'+gameCharts+'</div>'+table+'<aside class="comic-impact-box"><b>LECTURA PARA MARCAS</b><p>Minecraft presenta la mayor media de espectadores de esta selección (34), seguido de Marvel Rivals (33) y Supercar Collection Together (31). Minecraft y Marvel Rivals registran el mayor ritmo de captación disponible: 2 seguidores por hora emitida.</p></aside><footer class="comic-page-footer"><span>CADA DIRECTO, UNA NUEVA MISIÓN</span><b>03 / 04</b></footer></article>';
 const clipsPanel=clips.map((c,i)=>'<article class="comic-panel comic-clip-card"><div class="comic-panel-heading"><span>0'+(i+1)+'</span><b>ESCENA DESTACADA</b></div><div class="comic-clip-preview"><iframe src="https://clips.twitch.tv/embed?clip='+c.id+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=false" title="Previsualización: '+escapeStatsHtml(c.title)+'" loading="lazy" allowfullscreen></iframe></div><h3>'+c.title+'</h3><p>'+c.note+'</p><a href="https://clips.twitch.tv/'+c.id+'" target="_blank" rel="noopener">VER CLIP COMPLETO ↗</a></article>').join('');
 const clipsPage='<article class="comic-book-sheet comic-interior-page"><header class="comic-interior-header"><span>LEGIÓN MULTIVERSAL</span><b>CAPÍTULO 03</b><span>EL ESPECTÁCULO</span></header><div class="comic-page-title"><small>EXPEDIENTE MORIARTY · PÁGINA 04</small><h2>ASÍ SE VIVE EL CANAL</h2></div><p class="comic-page-lead">La personalidad también cuenta una historia. Estos momentos muestran el humor, la complicidad y las reacciones que forman parte de la experiencia.</p><div class="comic-clips-grid">'+clipsPanel+'</div><div class="comic-page-split"><section class="comic-panel"><div class="comic-panel-heading"><span>04</span><b>FORMATOS DE COLABORACIÓN</b></div><div class="comic-format-list"><span>Presentación y prueba de videojuegos</span><span>Integraciones naturales en directo</span><span>Retos y dinámicas participativas</span><span>Contenido cooperativo</span><span>Clips y piezas destacadas</span><span>Activaciones con otros creadores</span></div></section><section class="comic-panel comic-partner-panel"><div class="comic-panel-heading"><span>05</span><b>ALIANZAS Y CONEXIONES</b></div><p><b>Partners:</b> Enshrouded · Cinderia.</p><p><b>Plataformas de acceso a juegos:</b> Lurkit y Keymailer.</p></section></div><section class="comic-final-cta"><span>¿PREPARADOS PARA EL PRÓXIMO NÚMERO?</span><h3>HAGAMOS QUE TU MARCA FORME PARTE DE LA HISTORIA.</h3><p>Presentaciones de producto, propuestas comerciales y colaboraciones:</p><a href="mailto:losmoriartys@gmail.com">losmoriartys@gmail.com</a></section><footer class="comic-page-footer"><span>CONTINUARÁ…</span><b>04 / 04</b></footer></article>';
 return [cover,metricsPage,gamesPage,clipsPage];
}
document.getElementById('comic-page-prev')?.addEventListener('click',()=>switchModalTab((window.currentModalPage||0)-1));
document.getElementById('comic-page-next')?.addEventListener('click',()=>switchModalTab((window.currentModalPage||0)+1));
function openHeroModal(index) {
    const hero = heroesData[index];
    if (!hero) return;
    const modal=document.getElementById('hero-modal');
    const modalContent=modal.querySelector('.modal-content');
    const isMoriartys=hero.name==='MORIARTYS';
    const isLady=hero.name==='LADYMORIARTY';
    document.getElementById('modal-hero-title').innerText = 'MEDIA KIT · ' + hero.name;
    document.getElementById('modal-tab-navigation').hidden=true;
    document.getElementById('modal-comic-navigation').hidden=false;
    modalContent.classList.add('comic-mode');
    let pages;
    if(isMoriartys){
        pages=renderMoriartysComicPages(hero);
    }else if(isLady){
        pages=renderLadyMoriartyComicPages(hero,findSullyChannel(hero));
    }else if(hero.name==='ROD3R1K'){
        pages=renderRod3r1kComicPages(hero);
    }else if(hero.name==='HABITOS'){
        pages=renderHabitosComicPages(hero,findSullyChannel(hero));
    }else if(hero.name==='AKUMA'){
        pages=renderAkumaComicPages(hero,findSullyChannel(hero));
    }else if(hero.name==='ARDIPII'){
        pages=renderArdipiiComicPages(hero,findSullyChannel(hero));
    }else if(hero.name==='DAVE — NEXUS'){
        pages=renderDaveNexusComicPages(hero,findSullyChannel(hero));
    }else if(hero.name==='PATO — ORATORIS'){
        pages=renderPatoOratorisComicPages(hero);
    }else{
        const channelStats=findChannelStats(hero);
        const sullyChannel=findSullyChannel(hero);
        pages=renderRosterComicPages(hero,index,channelStats,sullyChannel);
    }
    document.getElementById('modal-profile-text').innerHTML=pages[0];
    document.getElementById('modal-stats-text').innerHTML=pages[1];
    document.getElementById('modal-log-text').innerHTML=pages[2];
    document.getElementById('modal-extra-text').innerHTML=pages[3];
    const fifth=document.getElementById('modal-lady-page-5');
    const sixth=document.getElementById('modal-lady-page-6');
    if(fifth)fifth.innerHTML=pages[4]||'';
    if(sixth)sixth.innerHTML=pages[5]||'';
    window.currentComicTotal=pages.length;
    document.getElementById('modal-twitch-btn').href = hero.youtube || hero.twitch || "#";
    document.getElementById('modal-twitch-btn').textContent = hero.youtube ? "VISITAR CANAL DE YOUTUBE" : "VISITAR CANAL";
    window.lastModalTrigger = document.activeElement;
    window.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    switchModalTab(0, true);
    updateComicPageControls(true);
    modal.querySelector('.close-modal-btn')?.focus();
}
        function closeModal() {
            const modal = document.getElementById('hero-modal');
            if (!modal || !modal.classList.contains('active')) return;
            modal.classList.remove('active');
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

        function switchModalTab(tabIndex, silent = false) {
            const isComic=document.querySelector('.modal-content')?.classList.contains('comic-mode');
            const maxPage=isComic?(window.currentComicTotal||4):3;
            const previousIndex=window.currentModalPage??0;
            tabIndex=Math.max(0,Math.min(maxPage-1,Number(tabIndex)||0));
            for(let t=0;t<6;t++){
                const pane=document.getElementById(`modal-pane-${t}`);
                const btn=document.querySelectorAll('.modal-tab-btn')[t];
                if(pane)pane.classList.toggle('active',t===tabIndex);
                if(btn)btn.classList.toggle('active',t===tabIndex);
            }
            window.currentModalPage=tabIndex;
            if(!silent&&previousIndex!==tabIndex)playPageTurnCue();
            if(isComic&&!silent&&previousIndex!==tabIndex){
                const activePane=document.getElementById(`modal-pane-${tabIndex}`);
                if(activePane){activePane.classList.remove('comic-page-arrival');void activePane.offsetWidth;activePane.classList.add('comic-page-arrival');}
            }
            if(isComic)updateComicPageControls(true);
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

        function switchChapter(chapterNum) {
            const panel=document.getElementById(`chapter-${chapterNum}`);
            if(!panel)return;
            const current=document.querySelector('.chapter-panel.active');
            if(current===panel)return;
            const transition=document.getElementById('chapter-transition');
            const chapterName=(document.querySelector(`.nav-btn[data-chapter="${chapterNum}"]`)||{}).textContent||'NUEVO EXPEDIENTE';
            if(transition){
                transition.setAttribute('data-title',chapterName.trim());
                transition.classList.remove('play');
                if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
                    void transition.offsetWidth;
                    transition.classList.add('play');
                }
            }
            document.querySelectorAll('.chapter-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active',Number(b.dataset.chapter)===Number(chapterNum)));
            panel.classList.add('active');
            playChapterCue();
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth' });
        }

        const rosterContainer = document.getElementById('roster-container');
        if (rosterContainer) rosterContainer.innerHTML = '<p class="roster-loading">CARGANDO EXPEDIENTES DE LA LEGIÓN…</p>';

        window.onload = async function() {
        try {
            await loadRosterData();
            renderRoster();
            restoreHeroProfileFromHash();
        } catch (error) {
            console.error('No se pudo inicializar el roster:', error);
            if (rosterContainer) rosterContainer.innerHTML = '<p class="roster-load-error">No se pudieron cargar los expedientes. Volvé a intentarlo más tarde.</p>';
        }
        await Promise.all([
            loadSullyGnomeData(),
            loadTwitchMetricsData(),
            loadInstituteStats(),
            loadPartnerMetrics(),
            loadCreatorRecords(),
            loadPlatformStatsData()
        ]);
        };
