(() => {
  "use strict";
  const home = document.getElementById("chapter-0");
  if (!home || document.getElementById("home-editorial-acts")) return;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const list = (value) => Array.isArray(value) ? value : [];
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
  const dateLabel = (value) => {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleDateString("es-AR", {
      day:"2-digit",month:"short",year:"numeric",timeZone:"America/Argentina/Buenos_Aires"
    });
  };
  const style = document.createElement("style");
  style.id = "home-editorial-responsive-styles";
  style.textContent = [
    "#chapter-0 .executive-hero-actions{min-width:0}",
    "header .primary-navigation{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:1 1 0;width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden;align-items:start;gap:clamp(3px,.5vw,7px)}",
    "header .primary-navigation .nav-act{display:flex;width:100%;max-width:100%;box-sizing:border-box;min-width:0;overflow:hidden;flex-direction:column;gap:4px;padding:0 clamp(4px,.55vw,8px);border-left:1px solid rgba(255,255,255,.18)}",
    "header .primary-navigation .nav-act:first-child{padding-left:0;border-left:0}",
    "header .primary-navigation .nav-act-label{display:block;color:#a9bacd;font:700 .6rem Special Elite,monospace;letter-spacing:.13em;white-space:nowrap}",
    "header .primary-navigation .nav-act.is-active-act .nav-act-label{color:#e5c578}",
    "header .primary-navigation .nav-act-items{display:flex;flex-wrap:wrap;align-items:center;gap:clamp(3px,.4vw,6px);min-width:0}",
    "header .primary-navigation .nav-act .nav-btn{min-width:0;max-width:100%;padding:7px clamp(4px,.55vw,8px);font-size:clamp(.66rem,.78vw,.82rem);white-space:nowrap}",
    "@media(max-width:1100px) and (min-width:901px){header .primary-navigation{gap:2px}header .primary-navigation .nav-act{padding:0 4px}header .primary-navigation .nav-act-items{gap:3px}header .primary-navigation .nav-act .nav-btn{padding:6px 5px;font-size:.64rem}}",
    "@media(max-width:900px){header .primary-navigation{display:flex;flex:0 1 100%;max-width:100%;box-sizing:border-box;flex-wrap:nowrap;width:100%;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding-inline:7px}header .primary-navigation .nav-act{flex:0 0 min(86vw,340px);width:min(86vw,340px);max-width:min(86vw,340px);padding:0 7px;scroll-snap-align:start}header .primary-navigation .nav-act-items{flex-wrap:wrap;width:auto;min-width:0}header .primary-navigation .nav-act .nav-btn{flex:0 1 auto;width:auto!important;max-width:100%;padding:7px 9px;font-size:.72rem}}",
    "#chapter-0 .lm-editorial-acts{display:grid;gap:clamp(22px,3.5vw,40px);margin:clamp(24px,4vw,46px) 0}",
    "#chapter-0 .lm-indicator-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:clamp(12px,2vw,18px);border:1px solid rgba(107,206,232,.3);border-left:4px solid #63d9e8;background:linear-gradient(120deg,#0c1e2ef2,#101424f2)}",
    "#chapter-0 .lm-indicator{min-width:0;padding:8px 10px;border-right:1px solid rgba(153,190,220,.18)}",
    "#chapter-0 .lm-indicator:last-of-type{border:0}",
    "#chapter-0 .lm-indicator strong{display:block;color:#f8f8fb;font:clamp(1.8rem,3vw,2.6rem)/.95 Bangers,cursive}",
    "#chapter-0 .lm-indicator span{display:block;margin-top:6px;color:#a9c7d8;font-size:.72rem;font-weight:800;letter-spacing:.07em;line-height:1.3;text-transform:uppercase}",
    "#chapter-0 .lm-indicator-update{grid-column:1/-1;color:#8fa7ba;font-size:.7rem;line-height:1.4}",
    "#chapter-0 .lm-act{min-width:0;overflow:hidden;border:1px solid rgba(143,178,213,.23);background:linear-gradient(145deg,#0f1827,#080d18);box-shadow:6px 7px 0 #0006}",
    "#chapter-0 .lm-act-banner{position:relative;isolation:isolate;display:flex;min-height:154px;flex-direction:column;justify-content:center;overflow:hidden;padding:clamp(20px,4vw,34px);border-bottom:1px solid #ffffff20}",
    "#chapter-0 .lm-act-banner:before{position:absolute;z-index:-2;inset:0;content:\"\";opacity:.85}",
    "#chapter-0 .lm-act-banner:after{position:absolute;z-index:-1;inset:0;content:\"\";background:linear-gradient(90deg,#060b15f2,#060b15a8 62%,#060b1540)}",
    "#chapter-0 .lm-act-kicker{color:#b3e8f0;font:.72rem Special Elite,cursive;letter-spacing:.16em}",
    "#chapter-0 .lm-act-banner h3{margin:7px 0 5px;color:#fff;font:clamp(2.2rem,5vw,3.5rem)/.95 Bangers,cursive;text-shadow:3px 3px 0 #05080e}",
    "#chapter-0 .lm-act-banner p{max-width:66ch;color:#d4dfeb;font-size:.94rem;line-height:1.5}",
    "#chapter-0 .lm-act-one .lm-act-banner:before{background:radial-gradient(circle at 84% 50%,transparent 0 56px,#60d9e8bb 57px 59px,transparent 60px),radial-gradient(circle at 84% 50%,transparent 0 88px,#a99bff70 89px 91px,transparent 92px),radial-gradient(#74cde74d .8px,transparent .9px);background-size:auto,auto,16px 16px}",
    "#chapter-0 .lm-act-two .lm-act-banner{min-height:174px}",
    "#chapter-0 .lm-act-two .lm-act-banner:before{background:repeating-linear-gradient(0deg,transparent 0 24px,#ebc47826 25px 27px),linear-gradient(110deg,#251e20,#443622 52%,#161d2c);clip-path:polygon(0 0,100% 0,100% 72%,86% 72%,86% 80%,68% 80%,68% 88%,46% 88%,46% 100%,0 100%)}",
    "#chapter-0 .lm-act-two .lm-act-kicker{color:#f3d8a6}#chapter-0 .lm-act-two .lm-act-banner h3{color:#f6e8ca}#chapter-0 .lm-act-two .lm-act-banner svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.76}#chapter-0 .lm-act-two .lm-act-banner>*:not(svg){position:relative;z-index:1}",
    "#chapter-0 .lm-act-three .lm-act-banner:before{background:radial-gradient(circle at 80% 50%,#644b9c47,transparent 40%),linear-gradient(135deg,#121a31,#151323 60%,#0c1820)}",
    "#chapter-0 .lm-act-three .lm-act-kicker{color:#d1c2ff}",
    "#chapter-0 .lm-act-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:clamp(12px,2vw,18px)}",
    "#chapter-0 .lm-act-link{display:flex;min-width:0;min-height:100px;flex-direction:column;justify-content:space-between;gap:10px;padding:13px;border:1px solid #7fbada40;border-top:3px solid var(--act-color,#63d9e8);background:#131f31b8;color:#f2f6fa;text-align:left;text-decoration:none;transition:transform .18s ease,border-color .18s ease}",
    "#chapter-0 .lm-act-link:hover{transform:translateY(-2px);border-color:#65d5e9}",
    "#chapter-0 .lm-act-link:focus-visible,#chapter-0 .lm-roster-card:focus-visible,#chapter-0 .lm-log-action:focus-visible{outline:3px solid #fff;outline-offset:3px}",
    "#chapter-0 .lm-act-link span{color:#83cddc;font:.66rem Special Elite,cursive;letter-spacing:.1em}",
    "#chapter-0 .lm-act-link strong{color:#f3f5f9;font:1.2rem Bangers,cursive;letter-spacing:.03em}",
    "#chapter-0 .lm-act-link small{color:#a8b8ca;font-size:.76rem;line-height:1.4}",
    "#chapter-0 .lm-act-two .lm-act-link{--act-color:#d9b879}#chapter-0 .lm-act-three .lm-act-link{--act-color:#a99bff}",
    "#chapter-0 .lm-portrait-area,#chapter-0 .lm-log-area{padding:0 clamp(12px,2vw,18px) 18px}",
    "#chapter-0 .lm-subheading{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px 14px;margin:0 0 12px}",
    "#chapter-0 .lm-subheading h4{color:#eff6fb;font:1.42rem Bangers,cursive;letter-spacing:.05em}",
    "#chapter-0 .lm-subheading p{color:#96aabd;font-size:.76rem}",
    "#chapter-0 .lm-roster-rail{display:grid;grid-auto-columns:minmax(112px,1fr);grid-auto-flow:column;gap:9px;overflow-x:auto;padding:3px 2px 12px;scroll-snap-type:x mandatory;scrollbar-color:#597b9b #ffffff0d}",
    "#chapter-0 .lm-roster-card{display:flex;min-width:0;flex-direction:column;overflow:hidden;scroll-snap-align:start;border:1px solid color-mix(in srgb,var(--creator-color,#6bd4e8) 55%,transparent);border-bottom:4px solid var(--creator-color,#6bd4e8);background:linear-gradient(160deg,#182539,#090e1a);color:#f4f7fb;text-decoration:none}",
    "#chapter-0 .lm-roster-card img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:center 24%;background:#0b1321}",
    "#chapter-0 .lm-roster-card-copy{display:grid;gap:4px;padding:9px 8px 10px}",
    "#chapter-0 .lm-roster-card strong{color:#f6f7fb;font:1.02rem Bangers,cursive;letter-spacing:.03em;line-height:1.1}",
    "#chapter-0 .lm-roster-card small{color:#aebed1;font-size:.6rem;font-weight:800;letter-spacing:.06em;line-height:1.3}",
    "#chapter-0 .lm-log-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}",
    "#chapter-0 .lm-log-card{display:flex;min-width:0;flex-direction:column;gap:8px;padding:13px;border:1px solid #dfbe7e47;background:linear-gradient(145deg,#30261f73,#0e131ee6)}",
    "#chapter-0 .lm-log-code{color:#e7c88d;font:.68rem Special Elite,cursive;letter-spacing:.1em}",
    "#chapter-0 .lm-log-card h4{color:#f7eddb;font:1.2rem Bangers,cursive}",
    "#chapter-0 .lm-log-card p{color:#b8c4d1;font-size:.8rem;line-height:1.45}",
    "#chapter-0 .lm-log-card footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid #dfbe7e29;color:#d4c09b;font-size:.68rem}",
    "#chapter-0 .lm-log-action{width:max-content;max-width:100%;padding:7px 10px;border:1px solid #e1c28966;background:#251f1acc;color:#f4dfb7;font:.8rem Bangers,cursive;text-decoration:none}",
    "#chapter-0 .lm-recruitment-scene{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.48fr);gap:18px;align-items:center;padding:0 18px 20px}",
    "#chapter-0 .lm-recruitment-note{color:#c5cfdd;font-size:.88rem;line-height:1.6}",
    "#chapter-0 .lm-recruitment-art{width:100%;max-width:330px;justify-self:end;filter:drop-shadow(0 12px 15px #0006)}",
    "#chapter-0 .lm-act-annex{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin:0 18px 18px;padding:12px 14px;border:1px dashed #a99bff60;color:#b9c7d8;font-size:.8rem}",
    "#chapter-0 .lm-act-annex a{color:#cbbfff;font-weight:800;text-underline-offset:4px}",
    "#chapter-0 .lm-nav-brand-primary{border-color:#e5c477!important;background:linear-gradient(135deg,#f5dfaa,#d5ae61)!important;color:#1c2130!important;box-shadow:3px 3px 0 #000,0 0 14px #dcb66930!important}",
    "@media(max-width:900px){#chapter-0 .lm-indicator-strip{grid-template-columns:repeat(2,minmax(0,1fr))}#chapter-0 .lm-indicator:nth-of-type(2){border:0}#chapter-0 .lm-act-links,#chapter-0 .lm-log-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:640px){#chapter-0 .executive-hero{min-height:0!important;padding:6px 12px 8px!important}#chapter-0 .executive-hero-copy{width:100%;max-width:none;min-width:0;min-height:0!important;justify-content:flex-start!important;gap:0!important}#chapter-0 .executive-hero h2{max-width:16ch;margin:0 0 3px!important;font-size:clamp(1.72rem,8vw,2.3rem)!important;line-height:.96!important}#chapter-0 .executive-lead{max-width:100%;margin:0 0 3px!important;font-size:.82rem!important;line-height:1.25!important}#chapter-0 .executive-hero-actions{display:flex!important;width:100%;flex-direction:column!important;align-items:stretch!important;gap:4px!important;margin-top:0!important}#chapter-0 .executive-hero-actions .executive-button{display:flex;width:100%!important;min-width:0!important;min-height:38px;justify-content:center;padding:5px 8px!important;white-space:normal!important;text-align:center;line-height:1.08;font-size:.82rem!important}#chapter-0 .executive-hero-actions .executive-button span{flex:0 0 auto}#chapter-0 .lm-indicator-strip{gap:6px;padding:9px}#chapter-0 .lm-indicator{padding:6px}#chapter-0 .lm-indicator strong{font-size:1.9rem}#chapter-0 .lm-indicator span{font-size:.64rem}#chapter-0 .lm-act-banner{min-height:148px;padding:20px 16px}#chapter-0 .lm-act-banner p{font-size:.86rem}#chapter-0 .lm-act-links,#chapter-0 .lm-log-grid{grid-template-columns:1fr;gap:8px;padding:12px}#chapter-0 .lm-act-link{min-height:76px}#chapter-0 .lm-roster-rail{grid-auto-columns:116px}#chapter-0 .lm-recruitment-scene{grid-template-columns:1fr}#chapter-0 .lm-recruitment-art{width:min(100%,280px);justify-self:center}#chapter-0 .lm-act-annex{align-items:flex-start;flex-direction:column}}",
    "@media(prefers-reduced-motion:reduce){#chapter-0 .lm-act-link{transition:none!important}#chapter-0 .lm-act-link:hover{transform:none}}",
    "@media print{#chapter-0 .lm-act-link{break-inside:avoid}}"
  ].join("");
  document.head.appendChild(style);

  if (!document.getElementById("home-visual-refresh-styles")) {
    const visualStylesheet = document.createElement("link");
    visualStylesheet.id = "home-visual-refresh-styles";
    visualStylesheet.rel = "stylesheet";
    visualStylesheet.href = "./home-visual-refresh.css?v=20261127-visual-pass-1";
    visualStylesheet.addEventListener("load", () => {
      visualStylesheet.dataset.loaded = "true";
    }, { once: true });
    visualStylesheet.addEventListener("error", () => {
      visualStylesheet.dataset.failed = "true";
    }, { once: true });
    document.head.appendChild(visualStylesheet);
  }

  const actTwoSvg = '<svg aria-hidden="true" viewBox="0 0 900 190" preserveAspectRatio="none"><path d="M0 164H210V142H390V116H570V82H750V44H900" fill="none" stroke="#e6c27e" stroke-width="2" opacity=".65"/><path d="M0 178H210V156H390V130H570V96H750V58H900" fill="none" stroke="#f5e4c3" stroke-width="1" opacity=".42"/></svg>';
  const actThreeSvg = '<svg class="lm-recruitment-art" aria-hidden="true" viewBox="0 0 360 190"><g fill="none" stroke="#a99bff" stroke-width="2" opacity=".48"><path d="M48 18 72 4h28l24 14v28l-24 14H72L48 46zM128 18l24-14h28l24 14v28l-24 14h-28l-24-14zM208 18l24-14h28l24 14v28l-24 14h-28l-24-14zM288 18l24-14h28v56h-28l-24-14z"/></g><g fill="#6e67a4" stroke="#d0c7ff" stroke-width="2" opacity=".82"><circle cx="78" cy="91" r="16"/><path d="M45 154q2-35 33-35t34 35v11H45z"/><circle cx="158" cy="91" r="16"/><path d="M125 154q2-35 33-35t34 35v11h-67z"/><circle cx="238" cy="91" r="16"/><path d="M205 154q2-35 33-35t34 35v11h-67z"/><circle cx="318" cy="91" r="16"/><path d="M285 154q2-35 33-35t34 35v11h-67z"/></g></svg>';

  const markup = [
    '<section class="lm-editorial-acts" id="home-editorial-acts" aria-label="Recorrido editorial de Legión Multiversal">',
    '<section class="lm-indicator-strip" id="lm-home-indicators" aria-label="Indicadores del proyecto">',
    '<div class="lm-indicator"><strong data-indicator="profiles">—</strong><span>Expedientes del roster</span></div>',
    '<div class="lm-indicator"><strong data-indicator="sessions">—</strong><span>Sesiones en Bitácora</span></div>',
    '<div class="lm-indicator"><strong data-indicator="games">—</strong><span>Juegos catalogados</span></div>',
    '<div class="lm-indicator"><strong data-indicator="pov">—</strong><span>POV documentados</span></div>',
    '<p class="lm-indicator-update" data-indicator-updated role="status" aria-live="polite">Los indicadores se completan desde los registros canónicos del proyecto.</p></section>',
    '<section class="lm-act lm-act-one" aria-labelledby="lm-act-one-title"><div class="lm-act-banner">',
    '<span class="lm-act-kicker">ACTO I · IDENTIDAD</span><h3 id="lm-act-one-title">QUIÉNES SOMOS</h3>',
    '<p>Una historia compartida, ocho identidades y una misma decisión: conservar lo que nos hace distintos mientras construimos algo en común.</p></div>',
    '<div class="lm-act-links">',
    '<a class="lm-act-link" href="#chapter-1" data-open-chapter="1"><span>01 · EL COMIENZO</span><strong>ORIGEN</strong><small>De las primeras partidas a la idea de una Legión.</small></a>',
    '<a class="lm-act-link" href="#chapter-11" data-open-chapter="11"><span>02 · LO QUE NOS UNE</span><strong>VALORES</strong><small>La forma de jugar, crear y convivir que elegimos sostener.</small></a>',
    '<a class="lm-act-link" href="#chapter-2" data-open-chapter="2"><span>03 · LAS IDENTIDADES</span><strong>ROSTER</strong><small>Conocé a cada integrante y abrí su expediente individual.</small></a></div>',
    '<div class="lm-portrait-area"><div class="lm-subheading"><h4>LOS OCHO EXPEDIENTES</h4><p>Retratos oficiales · color de identidad · acceso directo al perfil</p></div>',
    '<div class="lm-roster-rail" id="lm-roster-rail" aria-label="Retratos de los ocho perfiles">Cargando identidades desde el registro oficial…</div></div></section>',
    '<section class="lm-act lm-act-two" aria-labelledby="lm-act-two-title"><div class="lm-act-banner">',
    '<span class="lm-act-kicker">ACTO II · EN ACCIÓN</span><h3 id="lm-act-two-title">LO QUE HACEMOS</h3>',
    '<p>La actividad toma forma en directos, partidas compartidas, registros audiovisuales y datos con fecha y fuente. La escalera es un recurso editorial, no una clasificación ni una métrica.</p>',
    actTwoSvg + '</div><div class="lm-act-links">',
    '<a class="lm-act-link" href="#chapter-3" data-open-chapter="3"><span>04 · DATOS Y CONTEXTO</span><strong>ESTADÍSTICAS</strong><small>Indicadores por canal, plataforma, fuente y período.</small></a>',
    '<a class="lm-act-link" href="#chapter-10" data-open-chapter="10"><span>05 · ENCUENTRO EN DIRECTO</span><strong>EN VIVO</strong><small>Consultá el estado de transmisión capturado por el colector.</small></a>',
    '<a class="lm-act-link" href="#chapter-12" data-open-chapter="12"><span>06 · ARCHIVO COMPARTIDO</span><strong>COLABORACIONES Y BITÁCORA</strong><small>Juegos, sesiones, POV y experiencias documentadas.</small></a></div>',
    '<div class="lm-log-area"><div class="lm-subheading"><h4>ÚLTIMAS ENTRADAS DE BITÁCORA</h4><p>Sesiones registradas · enlaces originales por canal</p></div>',
    '<div class="lm-log-grid" id="lm-session-log">Consultando el registro maestro de sesiones…</div></div></section>',
    '<section class="lm-act lm-act-three" aria-labelledby="lm-act-three-title"><div class="lm-act-banner">',
    '<span class="lm-act-kicker">ACTO III · FUTURO Y COMUNIDAD</span><h3 id="lm-act-three-title">LO QUE PODEMOS CONSTRUIR</h3>',
    '<p>La Legión crece cuando aparecen nuevas ideas, vínculos y personas. Las siluetas representan posibilidades abiertas; no indican cupos ni vacantes predeterminadas.</p></div>',
    '<div class="lm-act-links">',
    '<a class="lm-act-link" href="#chapter-9" data-open-chapter="9"><span>07 · PARTICIPAR</span><strong>COMUNIDAD</strong><small>Actividades, encuentros y propuestas para quienes nos acompañan.</small></a>',
    '<a class="lm-act-link" href="#chapter-8" data-open-chapter="8"><span>08 · CONECTAR</span><strong>ALIANZAS</strong><small>Credenciales, vínculos confirmados y oportunidades por conversar.</small></a>',
    '<a class="lm-act-link" href="#chapter-6" data-open-chapter="6"><span>09 · SUMAR UNA VOZ</span><strong>RECLUTAMIENTO</strong><small>Conocé el proceso y presentá una propuesta de incorporación.</small></a></div>',
    '<div class="lm-recruitment-scene"><p class="lm-recruitment-note">No buscamos personajes intercambiables ni completar una cantidad fija. Cada incorporación se conversa desde la identidad, la afinidad y el aporte que puede hacer a la comunidad.</p>',
    actThreeSvg + '</div><div class="lm-act-annex"><span>ARCHIVO COMPLEMENTARIO · MAPA DE CONEXIONES</span><a href="#chapter-13" data-open-chapter="13">EXPLORAR EL MAPA MULTIVERSAL →</a></div></section>',
    '</section>'
  ].join("");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup;
  const editorial = wrapper.firstElementChild;
  const anchor = $(".home-live-strip", home) || $(".executive-hero", home) || home.firstElementChild;
  anchor.insertAdjacentElement("afterend", editorial);

  [".executive-directory", ".executive-community", ".executive-offers"].forEach((selector) => {
    const section = $(selector, home);
    if (section) section.hidden = true;
  });

  const primaryNavigation = $("header .primary-navigation");
  if (primaryNavigation && !primaryNavigation.querySelector(".nav-act")) {
    const chapterButton = (number) => primaryNavigation.querySelector('[data-chapter="' + number + '"]');
    const brandButton = primaryNavigation.querySelector('a[href="./marcas/"], a[href="marcas/"]');
    const acts = [
      { key:"identity", label:"I · IDENTIDAD", aria:"Acto I: Identidad", controls:[chapterButton("1"),chapterButton("11"),chapterButton("2")] },
      { key:"action", label:"II · EN ACCIÓN", aria:"Acto II: En acción", controls:[chapterButton("3"),chapterButton("12"),chapterButton("10")] },
      { key:"future", label:"III · FUTURO Y COMUNIDAD", aria:"Acto III: Futuro y comunidad", controls:[chapterButton("9"),chapterButton("8"),brandButton,chapterButton("6")] }
    ];
    acts.forEach((act) => {
      const group = document.createElement("div");
      group.className = "nav-act nav-act-" + act.key;
      group.dataset.act = act.key;
      group.setAttribute("role","group");
      group.setAttribute("aria-label",act.aria);
      const label = document.createElement("span");
      label.className = "nav-act-label";
      label.textContent = act.label;
      const items = document.createElement("div");
      items.className = "nav-act-items";
      act.controls.filter(Boolean).forEach((control) => items.appendChild(control));
      group.append(label,items);
      primaryNavigation.appendChild(group);
    });
    const syncActiveAct = () => {
      let activeAct = null;
      primaryNavigation.querySelectorAll(".nav-act").forEach((group) => {
        const isActive = Boolean(group.querySelector(".nav-btn.active"));
        group.classList.toggle("is-active-act",isActive);
        if (isActive) activeAct = group;
      });
      let targetLeft = 0;
      if (activeAct && window.innerWidth <= 900) {
        const navBounds = primaryNavigation.getBoundingClientRect();
        const actBounds = activeAct.getBoundingClientRect();
        targetLeft = Math.max(0, primaryNavigation.scrollLeft + actBounds.left - navBounds.left);
      }
      primaryNavigation.scrollLeft = targetLeft;
    };
    primaryNavigation.querySelectorAll(".nav-btn").forEach((button) => {
      const observer = new MutationObserver(syncActiveAct);
      observer.observe(button,{attributes:true,attributeFilter:["class"]});
    });
    primaryNavigation.addEventListener("click",syncActiveAct);
    window.addEventListener("resize",syncActiveAct,{passive:true});
    syncActiveAct();
  }

  const brandLink = $('header .primary-navigation a[href="./marcas/"], header .primary-navigation a[href="marcas/"]');
  if (brandLink) brandLink.classList.add("lm-nav-brand-primary");

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-chapter]");
    if (!trigger) return;
    const chapter = Number(trigger.getAttribute("data-open-chapter"));
    const switcher = window.switchChapter || window.openChapter;
    if (Number.isInteger(chapter) && typeof switcher === "function") {
      event.preventDefault();
      switcher(chapter);
    }
  });

  const loadJson = (path) => fetch(path, { cache:"no-store" }).then((response) => {
    if (!response.ok) throw new Error("No se pudo cargar " + path);
    return response.json();
  });

  Promise.all([
    loadJson("./data/roster.json"),
    loadJson("./data/creator-colors.json"),
    loadJson("./data/games.json"),
    loadJson("./creator-metrics.json"),
    loadJson("./data.json")
  ]).then(([rosterData, colorData, gamesData, metricData, activityData]) => {
    const heroes = list(rosterData.heroes);
    const games = list(gamesData.juegos);
    const sessions = games.flatMap((game) => list(game.sesiones).map((session) => ({ game, session })));
    const bits = new Set(sessions.map((entry) => entry.session.bit).filter(Boolean));
    const povCount = sessions.reduce((count, entry) => count + list(entry.session.pov).length, 0);

    $('[data-indicator="profiles"]', editorial).textContent = heroes.length.toLocaleString("es-AR");
    $('[data-indicator="sessions"]', editorial).textContent = bits.size.toLocaleString("es-AR");
    $('[data-indicator="games"]', editorial).textContent = games.length.toLocaleString("es-AR");
    $('[data-indicator="pov"]', editorial).textContent = povCount.toLocaleString("es-AR");

    const sourceDates = [metricData.generated_at, activityData.updated_at]
      .map((value) => Date.parse(value || "")).filter(Number.isFinite);
    const latest = sourceDates.length ? new Date(Math.max.apply(null, sourceDates)) : null;
    $('[data-indicator-updated]', editorial).textContent = latest
      ? "Última actualización de fuentes: " + latest.toLocaleString("es-AR", {
          day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",
          timeZone:"America/Argentina/Buenos_Aires"
        }) + " · Métricas públicas y catálogo; no equivale a analítica privada."
      : "Actualización de fuentes: no disponible en esta captura.";

    const colorMap = colorData.creators || {};
    const rail = $("#lm-roster-rail", editorial);
    const cards = heroes.map((hero) => {
      const identity = hero.identity_scope === "shared_project" ? "PROYECTO COMPARTIDO" : "EXPEDIENTE INDIVIDUAL";
      const platforms = list(hero.platforms).map((platform) => platform.toUpperCase()).join(" · ") || "PLATAFORMA NO REGISTRADA";
      const color = colorMap[hero.id] || {};
      const slug = hero.slug || hero.id;
      return '<a class="lm-roster-card" href="#roster/' + encodeURIComponent(slug) +
        '" style="--creator-color:' + esc(color.color || "#6bd4e8") +
        '" aria-label="Abrir expediente de ' + esc(hero.display_name || hero.name) + '">' +
        '<img src="' + esc(hero.portrait) + '" alt="Retrato oficial de ' + esc(hero.display_name || hero.name) +
        '" loading="lazy" decoding="async"><span class="lm-roster-card-copy"><strong>' +
        esc(hero.display_name || hero.name) + '</strong><small>' + identity + '</small><small>' +
        esc(platforms) + '</small></span></a>';
    });
    rail.innerHTML = cards.join("");

    const names = Object.fromEntries(heroes.map((hero) => [hero.id, hero.display_name || hero.name]));
    const latestEntries = sessions
      .filter((entry) => entry.session.bit && entry.game.id !== "barfender")
      .sort((a, b) => String(b.session.fecha || "").localeCompare(String(a.session.fecha || "")))
      .slice(0, 3);
    const logHost = $("#lm-session-log", editorial);
    logHost.innerHTML = latestEntries.map(({ game, session }) => {
      const participants = list(session.participantes).map((id) => names[id]).filter(Boolean);
      const povs = list(session.pov);
      const firstPov = povs.find((entry) => entry && entry.url);
      const participantText = participants.length ? participants.join(" · ") : "Participantes no consignados";
      const action = firstPov
        ? '<a class="lm-log-action" href="' + esc(firstPov.url) + '" target="_blank" rel="noopener noreferrer">ABRIR POV ↗</a>'
        : '<a class="lm-log-action" href="#chapter-12" data-open-chapter="12">VER EXPEDIENTE</a>';
      return '<article class="lm-log-card"><span class="lm-log-code">' + esc(session.bit) + ' · ' +
        esc(dateLabel(session.fecha)) + '</span><h4>' + esc(game.nombre) + '</h4><p>' +
        esc(participantText) + '</p><footer><span>' + povs.length + ' POV registrado(s)</span>' +
        action + '</footer></article>';
    }).join("") || '<p>No hay sesiones publicables en la captura actual.</p>';
  }).catch(() => {
    $('[data-indicator-updated]', editorial).textContent = "Los registros automáticos no están disponibles ahora; no se muestran cifras estimadas.";
    ["profiles","sessions","games","pov"].forEach((key) => {
      const node = $('[data-indicator="' + key + '"]', editorial);
      if (node) node.textContent = "—";
    });
    $("#lm-roster-rail", editorial).textContent = "No se pudo cargar el registro de identidades.";
    $("#lm-session-log", editorial).textContent = "No se pudo consultar la Bitácora en este momento.";
  });
})();