/* Modo DM: pantallas y eventos. La lógica vive en dm.js; aquí se decide quién tira los dados y qué se muestra. */
(function (P) {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => P.esc(s);
  const CLAVE = 'tpp.dm';
  const cb = () => P.dm.combate;
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

  const inicial = () => ({ tab: 'iniciativa', campana: '', dados: 'auto', autoEnemigos: false, iaTurnos: false, combate: null, fEnc: { nivel: 1, jugadores: 4, dificultad: 'media', entorno: 'mazmorra', tipo: 'cualquiera' }, fPnj: { raza: 'cualquiera', rol: 'cualquiera' }, fObj: { rareza: 'cualquiera', tipo: 'cualquiera' }, fTra: { nivel: 1, gravedad: 'peligrosa', tipo: 'cualquiera' } });
  const D = inicial();
  const R = { pnj: null, encuentro: null, objeto: null, trampa: null, ocupado: false, nota: '' };
  let datosListos = null;

  function cargarEstado() {
    try { Object.assign(D, JSON.parse(localStorage.getItem(CLAVE)) || {}); } catch (e) { /* sin almacenamiento */ }
    if (!D.combate) D.combate = cb().crear();
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(D)); } catch (e) { /* sin almacenamiento */ }
  }
  // Los datos del SRD pesan unos 700 KB: solo se piden a quien entra al Modo DM
  function cargarDatos() {
    if (P.SRD_CRIATURAS) return Promise.resolve();
    datosListos = datosListos || new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = 'js/srd-dm.js'; s.onload = ok; s.onerror = () => { datosListos = null; mal(new Error('sin datos')); };
      document.head.append(s);
    });
    return datosListos;
  }

  /* ---------- Piezas ---------- */
  const opciones = (lista, actual) => lista.map(([v, t]) => `<option value="${esc(v)}"${String(actual) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('');
  const campo = (id, t, control) => `<div class="dm-campo"><label class="form-label" for="${id}">${esc(t)}</label>${control}</div>`;
  const numero = (id, valor, min, max, extra = '') => `<input class="form-control" type="number" id="${id}" value="${esc(valor)}" min="${min}" max="${max}" ${extra}>`;
  const dato = (k, v) => (v === null || v === undefined || v === '' ? '' : `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`);
  const parrafos = (lista) => lista.map((p) => `<p>${esc(p)}</p>`).join('');
  const botonGenerar = (accion, t) => `<button type="button" class="btn btn-primario" data-accion="${accion}"${R.ocupado ? ' disabled aria-busy="true"' : ''}>${R.ocupado ? 'Pensando…' : t}</button>`;
  const notaIA = () => (R.nota ? `<p class="estado error" role="status">${esc(R.nota)}</p>` : '');

  /* ---------- Iniciativa ---------- */
  const fichaDe = (g) => P.SRD_CRIATURAS.find((c) => c.n === g.fuente);
  const ESTADOS = () => P.SRD_ESTADOS.map((e) => Object.assign({ id: e.n }, e));
  function fichaHTML(c) {
    const lista = (t, l) => (l && l.length ? `<h5>${t}</h5>${l.map((x) => { const [n, d] = Array.isArray(x) ? x : [x.n, x.d]; return `<p>${n ? `<strong>${esc(n)}.</strong> ` : ''}${esc(d).replace(/\n/g, '<br>')}</p>`; }).join('')}` : '');
    const nombres = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
    return `<p class="ayuda">${esc(c.t)}</p><dl class="datos m-0">${dato('Clase de Armadura', c.ca + (c.cn ? ` (${c.cn})` : ''))}${dato('Puntos de golpe', `${c.pg} (${c.dg})`)}${dato('Velocidad', c.v)}${dato('Desafío', `${c.vd} (${c.px} PX)`)}</dl>
      <p class="dm-car">${c.c.map((v, i) => `<span><b>${nombres[i]}</b> ${v} (${P.signo(P.mod(v))})</span>`).join('')}</p>
      ${[['Salvaciones', c.sal], ['Habilidades', c.hab], ['Vulnerable a', c.vul], ['Resiste', c.res], ['Inmune a', c.inm], ['Sentidos', c.sen], ['Idiomas', c.idi]].filter((x) => x[1]).map(([k, v]) => `<p class="m-0"><strong>${k}:</strong> ${esc(v)}</p>`).join('')}
      ${lista('Rasgos', c.r)}${lista('Acciones', c.a)}${lista('Reacciones', c.re)}${lista('Acciones legendarias', c.l)}`;
  }
  function filaCombatiente(g, i) {
    const est = D.combate, actual = est.turno === i, caido = !cb().vivo(g) || g.pg === 0;
    const pct = g.pgMax ? Math.round((g.pg / g.pgMax) * 100) : 0;
    return `<li class="dm-fila${actual ? ' turno' : ''}${caido ? ' caido' : ''}${g.bando === 'pj' ? ' pj' : ''}"${actual ? ' aria-current="true"' : ''}>
      <span class="dm-ini" title="Iniciativa">${g.ini ?? '–'}</span>
      <div class="dm-nombre"><strong>${esc(g.nombre)}</strong><small>CA ${g.ca} · ${g.bando === 'pj' ? 'Jugador' : 'Enemigo'}${g.muerto ? ' · Muerto' : g.estable ? ' · Estable' : ''}${g.bando === 'pj' && g.pg === 0 && !g.muerto ? ` · ${g.muerte.e} éxitos, ${g.muerte.f} fallos` : ''}</small>
        ${g.estados.length ? `<span class="dm-estados">${g.estados.map((e) => `<button type="button" class="chip" data-accion="dm-quitar-estado" data-id="${g.id}" data-valor="${esc(e)}" title="${esc((P.buscar(ESTADOS(), e) || { d: [] }).d.join(' '))}" aria-label="Quitar ${esc(e)} a ${esc(g.nombre)}">${esc(e)} ×</button>`).join('')}</span>` : ''}</div>
      <div class="dm-vida"><span class="dm-pg">${g.pg}<small>/${g.pgMax}</small></span><span class="dm-barra-vida"><i style="width:${pct}%"></i></span></div>
      <div class="dm-ajuste">
        <input class="form-control" type="number" min="1" id="dm-n-${g.id}" aria-label="Cantidad de vida para ${esc(g.nombre)}" placeholder="0">
        <button type="button" class="btn btn-secundario btn-sm" data-accion="dm-danar" data-id="${g.id}" aria-label="Quitar vida a ${esc(g.nombre)}">−</button>
        <button type="button" class="btn btn-secundario btn-sm" data-accion="dm-curar" data-id="${g.id}" aria-label="Curar a ${esc(g.nombre)}">+</button>
        <select class="form-select" data-dm-estado="${g.id}" aria-label="Añadir estado a ${esc(g.nombre)}"><option value="">Estado</option>${P.SRD_ESTADOS.filter((e) => !g.estados.includes(e.n)).map((e) => `<option>${esc(e.n)}</option>`).join('')}</select>
        <button type="button" class="btn-icono" data-accion="dm-quitar" data-id="${g.id}" aria-label="Sacar a ${esc(g.nombre)} del combate">×</button>
      </div>
    </li>`;
  }
  function turnoHTML() {
    const est = D.combate, g = cb().actual(est);
    if (!g || !est.ronda) return '<p class="ayuda">Añade a los participantes y pulsa «Tirar iniciativa».</p>';
    const rivales = cb().rivales(est, g);
    const propio = cb().objetivo(est, g);
    const selector = rivales.length ? `<div class="dm-campo"><label class="form-label" for="dm-objetivo">Objetivo</label><select class="form-select" id="dm-objetivo">${rivales.map((r) => `<option value="${r.id}"${propio && r.id === propio.id ? ' selected' : ''}>${esc(r.nombre)} (CA ${r.ca}, ${r.pg} de vida)</option>`).join('')}</select></div>` : '<p class="ayuda">No quedan objetivos.</p>';
    const ataques = g.ataques.map((a, i) => `<button type="button" class="btn btn-secundario btn-sm" data-accion="dm-atacar" data-valor="${i}"${R.ocupado || !rivales.length ? ' disabled' : ''}>${esc(a.n)} ${P.signo(a.b)} · ${esc(a.dn)}</button>`).join('');
    const ficha = g.bando === 'enemigo' && fichaDe(g);
    const salvar = g.bando === 'pj' && g.pg === 0 && !g.muerto && !g.estable;
    return `<h3 class="h5">Ronda ${est.ronda}: turno de ${esc(g.nombre)}</h3>
      ${salvar ? `<button type="button" class="btn btn-primario mb-2" data-accion="dm-muerte"${R.ocupado ? ' disabled' : ''}>Tirar salvación contra muerte</button>` : `${selector}
      ${g.bando === 'enemigo' && rivales.length ? `<button type="button" class="btn btn-primario mt-2" data-accion="dm-actuar"${R.ocupado ? ' disabled aria-busy="true"' : ''}>${R.ocupado ? 'Actuando…' : 'Que actúe solo'}</button>` : ''}
      ${ataques ? `<div class="dm-ataques">${ataques}</div>` : ''}`}
      ${ficha ? `<details class="dm-ficha"><summary>Ficha completa</summary>${fichaHTML(ficha)}</details>` : ''}
      ${g.bando === 'enemigo' && ficha && ficha.a && ficha.a.some((a) => !a.dn && !/^(Multiataque|Ataque múltiple)/i.test(a.n)) ? '<p class="ayuda mt-2">Lo automático solo cubre sus ataques. Sus otras acciones están en la ficha y las aplicas tú.</p>' : ''}`;
  }
  function vistaIniciativa() {
    const est = D.combate;
    const modos = [['auto', 'Automáticos'], ['3d', 'En 3D'], ['manual', 'Los tiro yo']];
    const hayIA = P.ia.lista();
    return `<div class="dm-controles">
      <div><span class="form-label d-block">Quién lanza los dados</span><div class="segmento" role="radiogroup" aria-label="Quién lanza los dados">${modos.map(([k, t]) => `<input type="radio" class="btn-check" name="dm-dados" id="dm-dados-${k}" value="${k}"${D.dados === k ? ' checked' : ''}><label for="dm-dados-${k}">${t}</label>`).join('')}</div></div>
      <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="dm-auto"${D.autoEnemigos ? ' checked' : ''}><label class="form-check-label" for="dm-auto">Los enemigos juegan solos</label></div>
      ${hayIA ? `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="dm-ia-turnos"${D.iaTurnos ? ' checked' : ''}><label class="form-check-label" for="dm-ia-turnos">Gemini elige y narra sus turnos</label></div>` : ''}
    </div>
    <div class="d-flex flex-wrap gap-2 mt-3">
      <button type="button" class="btn btn-primario" data-accion="dm-iniciativa"${R.ocupado || !est.gente.length || est.ronda ? ' disabled' : ''}>Tirar iniciativa</button>
      <button type="button" class="btn btn-primario" data-accion="dm-siguiente"${R.ocupado || !est.ronda ? ' disabled' : ''}>Siguiente turno</button>
      <button type="button" class="btn btn-secundario" data-accion="dm-reiniciar">Nueva pelea</button>
    </div>
    ${notaIA()}
    <div class="row g-3 mt-1">
      <div class="col-lg-7">
        ${est.gente.length ? `<ol class="dm-lista">${est.gente.map(filaCombatiente).join('')}</ol>` : '<p class="ayuda">Todavía no hay nadie en la pelea.</p>'}
      </div>
      <div class="col-lg-5">
        <section class="detalle dm-turno" aria-live="polite">${turnoHTML()}</section>
        <section class="bloque"><h3>Registro</h3>${est.registro.length ? `<ol class="dm-registro" role="log">${est.registro.slice(0, 40).map((x) => `<li>${esc(x.t)}</li>`).join('')}</ol>` : '<p class="ayuda">Aquí aparece todo lo que pasa.</p>'}</section>
      </div>
    </div>
    <div class="bloque"><h3>Añadir a la pelea</h3>
      <div class="dm-form">
        ${campo('dm-busca', 'Criatura', `<input class="form-control" id="dm-busca" list="dm-criaturas" placeholder="Escribe para buscar" autocomplete="off"><datalist id="dm-criaturas">${P.SRD_CRIATURAS.map((c) => `<option value="${esc(c.n)}">Desafío ${esc(c.vd)}</option>`).join('')}</datalist>`)}
        ${campo('dm-cuantas', 'Cuántas', numero('dm-cuantas', 1, 1, 12))}
        <button type="button" class="btn btn-secundario" data-accion="dm-anadir">Añadir</button>
      </div>
      <div class="dm-form mt-2">
        ${campo('dm-pj', 'Personaje guardado', `<select class="form-select" id="dm-pj"><option value="">Elegir</option>${P.guardados.lista().map((p) => `<option value="${p.id}">${esc(p.nombre || 'Sin nombre')}${p.sub ? ' · ' + esc(p.sub) : ''}</option>`).join('')}</select>`)}
        <button type="button" class="btn btn-secundario" data-accion="dm-anadir-pj">Añadir</button>
      </div>
      <details class="mt-2"><summary>Añadir a un jugador a mano</summary>
        <div class="dm-form mt-2">
          ${campo('dm-m-nombre', 'Nombre', '<input class="form-control" id="dm-m-nombre" maxlength="40" autocomplete="off">')}
          ${campo('dm-m-ca', 'CA', numero('dm-m-ca', 14, 1, 40))}
          ${campo('dm-m-pg', 'Vida', numero('dm-m-pg', 10, 1, 999))}
          ${campo('dm-m-ini', 'Iniciativa', numero('dm-m-ini', 0, -5, 15))}
          <button type="button" class="btn btn-secundario" data-accion="dm-anadir-mano">Añadir</button>
        </div>
      </details>
    </div>
`;
  }

  /* ---------- Encuentros ---------- */
  function vistaEncuentros() {
    const f = D.fEnc, e = R.encuentro;
    const tipos = [['cualquiera', 'Según el lugar'], ...[...new Set(P.SRD_CRIATURAS.map(P.dm.tipoDe))].sort().map((t) => [t, t === 'Muerto' ? 'Muerto viviente' : t])];
    return `<div class="dm-form">
      ${campo('enc-nivel', 'Nivel del grupo', numero('enc-nivel', f.nivel, 1, 20, 'data-f="fEnc.nivel"'))}
      ${campo('enc-jug', 'Jugadores', numero('enc-jug', f.jugadores, 1, 10, 'data-f="fEnc.jugadores"'))}
      ${campo('enc-dif', 'Dificultad', `<select class="form-select" id="enc-dif" data-f="fEnc.dificultad">${opciones(Object.entries(P.DIFICULTADES).map(([k, v]) => [k, v[0]]), f.dificultad)}</select>`)}
      ${campo('enc-ent', 'Lugar', `<select class="form-select" id="enc-ent" data-f="fEnc.entorno">${opciones(Object.entries(P.ENTORNOS).map(([k, v]) => [k, v.nombre]), f.entorno)}</select>`)}
      ${campo('enc-tipo', 'Criaturas', `<select class="form-select" id="enc-tipo" data-f="fEnc.tipo">${opciones(tipos, f.tipo)}</select>`)}
    </div>
    <div class="mt-3">${botonGenerar('dm-gen-encuentro', 'Crear encuentro')}</div>${notaIA()}
    ${e ? `<section class="detalle mt-3" aria-live="polite"><h3 class="h5">Encuentro ${esc(P.DIFICULTADES[e.opciones.dificultad][0].toLowerCase())}</h3>
      <p><strong>Escena:</strong> ${esc(e.escena)}</p>${e.tactica ? `<p><strong>Cómo pelean:</strong> ${esc(e.tactica)}</p>` : ''}<p><strong>Giro:</strong> ${esc(e.giro)}</p>
      <div class="tabla"><table><thead><tr><th>Criatura</th><th>Cuántas</th><th>CA</th><th>Vida</th><th>Desafío</th></tr></thead><tbody>${e.grupo.map((g) => `<tr><td>${esc(g.n)}</td><td>${g.q}</td><td>${g.ca}</td><td>${g.pg}</td><td>${esc(g.vd)}</td></tr>`).join('')}</tbody></table></div>
      <p class="ayuda mt-2">Vale ${e.px} PX en total para el grupo. Presupuesto de este combate: ${e.tope} PX${e.ajustado > e.px ? `; al ser varios enemigos pesa como ${e.ajustado} PX` : ''}.</p>
      <button type="button" class="btn btn-primario" data-accion="dm-llevar">Llevar a la iniciativa</button></section>` : ''}`;
  }

  /* ---------- PNJ ---------- */
  function vistaPnj() {
    const f = D.fPnj, p = R.pnj;
    return `<div class="dm-form">
      ${campo('pnj-raza', 'Raza', `<select class="form-select" id="pnj-raza" data-f="fPnj.raza">${opciones([['cualquiera', 'Cualquiera'], ...P.RAZAS.map((r) => [r.id, r.nombre])], f.raza)}</select>`)}
      ${campo('pnj-rol', 'Dónde lo encuentran', `<select class="form-select" id="pnj-rol" data-f="fPnj.rol">${opciones(P.ROLES_PNJ, f.rol)}</select>`)}
    </div>
    <div class="mt-3">${botonGenerar('dm-gen-pnj', 'Crear PNJ')}</div>${notaIA()}
    ${p ? `<section class="detalle mt-3" aria-live="polite"><div class="detalle-cab"><span class="sello">${P.ico('corona')}</span><div><h3>${esc(p.nombre)}</h3><p class="ayuda m-0">${esc(p.raza)}. ${esc(p.oficio)}</p></div></div>
      <dl class="dm-dl">${dato('Apariencia', p.apariencia)}${dato('Personalidad', p.personalidad)}${dato('En qué cree', p.ideal)}${dato('Su defecto', p.defecto)}${dato('Cómo habla', p.voz)}${dato('Qué quiere', p.quiere)}${dato('Su secreto', p.secreto)}</dl></section>` : ''}`;
  }

  /* ---------- Objetos mágicos ---------- */
  function vistaObjetos() {
    const f = D.fObj, o = R.objeto;
    return `<div class="dm-form">
      ${campo('obj-rar', 'Rareza', `<select class="form-select" id="obj-rar" data-f="fObj.rareza">${opciones(P.RAREZAS, f.rareza)}</select>`)}
      ${campo('obj-tipo', 'Tipo', `<select class="form-select" id="obj-tipo" data-f="fObj.tipo">${opciones(P.TIPOS_OBJETO, f.tipo)}</select>`)}
    </div>
    <div class="mt-3">${botonGenerar('dm-gen-objeto', 'Sacar objeto mágico')}</div>${notaIA()}
    ${o ? `<section class="detalle mt-3" aria-live="polite"><div class="detalle-cab"><span class="sello">${P.ico('pocion')}</span><div><h3>${esc(o.n)}</h3><p class="ayuda m-0">${esc(o.t)}</p></div></div>
      ${o.exacto === false ? '<p class="duda">No hay objetos con esa combinación. Este es otro al azar.</p>' : ''}
      <p><strong>Su historia:</strong> ${esc(o.historia)}</p><h4 class="h6">Texto oficial</h4>${parrafos(o.d)}</section>` : ''}`;
  }

  /* ---------- Trampas ---------- */
  function fichaTrampa(t) {
    const prueba = t.salvacion ? `Salvación de ${t.salvacion.car}, CD ${t.salvacion.cd}` : `Ataque ${P.signo(t.ataque)}`;
    return `<dl class="datos m-0">${dato('Para detectarla', 'Percepción o Investigación, CD ' + t.detectar)}${dato('Para desactivarla', 'CD ' + t.desactivar)}${dato('Efecto', prueba)}${dato('Daño', `${t.dano} ${t.tipoDano}${t.mitad ? ', mitad si supera la salvación' : ''}`)}</dl>`;
  }
  function vistaTrampas() {
    const f = D.fTra, t = R.trampa;
    return `<div class="dm-form">
      ${campo('tra-nivel', 'Nivel del grupo', numero('tra-nivel', f.nivel, 1, 20, 'data-f="fTra.nivel"'))}
      ${campo('tra-gra', 'Gravedad', `<select class="form-select" id="tra-gra" data-f="fTra.gravedad">${opciones(Object.entries(P.GRAVEDAD).map(([k, v]) => [k, v.nombre]), f.gravedad)}</select>`)}
      ${campo('tra-tipo', 'Tipo', `<select class="form-select" id="tra-tipo" data-f="fTra.tipo">${opciones([['cualquiera', 'Cualquiera'], ['mecánica', 'Mecánica'], ['mágica', 'Mágica']], f.tipo)}</select>`)}
    </div>
    <div class="mt-3">${botonGenerar('dm-gen-trampa', 'Crear trampa al azar')}</div>${notaIA()}
    ${t ? `<section class="detalle mt-3" aria-live="polite"><h3 class="h5">${esc(t.nombre)}</h3><p class="ayuda">Trampa ${esc(t.tipo)}, ${esc(t.gravedad.toLowerCase())}</p>
      <p><strong>Qué pasa:</strong> ${esc(t.descripcion)}</p><p><strong>Se activa al</strong> ${esc(t.disparador)}.</p><p><strong>Pista:</strong> ${esc(t.pista)}.</p><p><strong>Cómo desactivarla:</strong> ${esc(t.comoDesactivar)}.</p>
      ${fichaTrampa(t)}<button type="button" class="btn btn-secundario mt-3" data-accion="dm-trampa-dano">Tirar daño (${esc(t.dano)})</button></section>` : ''}
    <div class="bloque"><h3>Trampas del SRD</h3><p class="ayuda">Descripción oficial y datos, listos para colocar en tu mazmorra.</p>
      <div class="dm-catalogo">${P.SRD_TRAMPAS.map((x) => `<details><summary>${esc(x.n)} <small>${esc(x.t)}</small></summary><dl class="datos">${dato('Detectar, CD', x.detectar)}${dato('Desactivar, CD', x.desactivar)}${dato('Salvación, CD', x.salvacion)}${dato('Daño', x.dano)}</dl>${parrafos(x.d)}</details>`).join('')}</div></div>`;
  }

  /* ---------- Pantalla ---------- */
  const PESTANAS = [['iniciativa', 'Iniciativa', vistaIniciativa], ['encuentros', 'Encuentros', vistaEncuentros], ['pnj', 'PNJ', vistaPnj], ['objetos', 'Objetos mágicos', vistaObjetos], ['trampas', 'Trampas', vistaTrampas]];
  function pintar() {
    const cont = $('dm');
    if (!cont || !P.SRD_CRIATURAS) return;
    const activo = document.activeElement && document.activeElement.id;
    const hayIA = P.ia.lista(), vista = PESTANAS.find((p) => p[0] === D.tab) || PESTANAS[0];
    cont.innerHTML = `<h1 class="titulo-paso" tabindex="-1">Modo DM</h1>
      <p class="sub">Tu mesa de dirección: crea lo que necesites al momento y lleva el combate sin perderte.</p>
      <div class="dm-barra"><div class="segmento" role="radiogroup" aria-label="Herramienta">${PESTANAS.map(([k, t]) => `<input type="radio" class="btn-check" name="dm-tab" id="dm-tab-${k}" value="${k}"${D.tab === k ? ' checked' : ''}><label for="dm-tab-${k}">${t}</label>`).join('')}</div>
        <span class="insignia${hayIA ? ' ia' : ''}">${hayIA ? 'Con Gemini' : 'Sin IA'}</span></div>
      <details class="dm-campana"><summary>Tu campaña y la IA</summary>
        <p class="ayuda mt-2">Todo funciona sin IA. Si activas Gemini en «Pedir cambios», usará esto para adaptar lo que crea. Nunca cambia los números de las reglas.</p>
        <label class="form-label" for="dm-campana">Cuenta tu campaña en pocas frases</label>
        <textarea class="form-control" id="dm-campana" rows="2" maxlength="500" placeholder="Por ejemplo: una ciudad portuaria dominada por piratas, tono oscuro">${esc(D.campana)}</textarea>
      </details>
      <div class="mt-3" id="dm-panel">${vista[2]()}</div>`;
    if (activo) { const el = $(activo); if (el && cont.contains(el)) el.focus({ preventScroll: true }); }
    guardar();
  }

  /* ---------- Dados ---------- */
  // Abre un cuadro para escribir lo que salió en la mesa. Devuelve el número, o null si se cancela.
  function pedirValor(titulo, detalle, min, max) {
    const d = $('dm-pedir'), i = $('dm-pedir-valor');
    $('dm-pedir-titulo').textContent = titulo;
    $('dm-pedir-ayuda').textContent = detalle;
    i.min = min; i.max = max; i.value = '';
    d.showModal();
    i.focus();
    return new Promise((ok) => {
      const fin = () => { d.removeEventListener('close', fin); const v = parseInt(i.value, 10); ok(d.returnValue === 'ok' && !Number.isNaN(v) ? Math.min(max, Math.max(min, v)) : null); };
      d.addEventListener('close', fin);
    });
  }
  // Devuelve los valores de los dados, venga de donde venga la tirada. Con «Los tiro yo» es un solo total.
  async function tirar(dados, suma, titulo) {
    if (D.dados === 'manual') {
      const max = dados.reduce((s, l) => s + l, 0);
      const v = await pedirValor(titulo, `Escribe lo que sacaste en ${dados.length > 1 ? dados.length + ' dados' : 'el dado'}, sin sumar bonos.`, dados.length, max);
      return v === null ? dados.map((l) => P.azar(l)) : [v];
    }
    if (D.dados === '3d') {
      const r = await P.tirar({ dados, suma, titulo });
      await pausa(P.movimientoActivo() ? 1100 : 300);
      return r.valores;
    }
    return dados.map((l) => P.azar(l));
  }
  const sumar = (l) => l.reduce((a, b) => a + b, 0);
  const cerrarDados = () => { if (D.dados === '3d') P.dados3d.cerrar(); };

  /* ---------- Combate ---------- */
  async function atacar(g, ataque, objetivo) {
    const est = D.combate;
    const [d20] = await tirar([20], ataque.b, `${g.nombre}: ${ataque.n}`);
    const r = cb().resolver(ataque.b, objetivo.ca, d20);
    if (!r.impacta) { cb().anotar(est, `${g.nombre} ataca a ${objetivo.nombre} con ${ataque.n}: ${r.pifia ? 'saca 1 y falla' : `${r.total} no alcanza CA ${objetivo.ca}`}.`); return; }
    let total = 0;
    const partes = [];
    for (const p of [{ dn: ataque.dn, ti: ataque.ti }, ...(ataque.ex || [])]) {
      const d = P.dm.partirDano(p.dn), n = r.critico ? d.n * 2 : d.n;
      const valores = n ? await tirar(Array(n).fill(d.lados), d.bono, `Daño: ${ataque.n}`) : [];
      const t = Math.max(0, sumar(valores) + d.bono);
      total += t; partes.push(`${t} ${p.ti}`);
    }
    cb().anotar(est, `${g.nombre} ${r.critico ? '¡hace un crítico!' : 'acierta'} a ${objetivo.nombre} con ${ataque.n} (${r.total}): ${partes.join(' y ')}.`);
    cb().danar(est, objetivo.id, total);
  }
  // Plan del turno. Con Gemini, elige el objetivo y lo narra; si falla, sigue la lógica local.
  async function planear(g) {
    const est = D.combate, local = { objetivo: cb().objetivo(est, g), narracion: '' };
    if (!(P.ia.lista() && D.iaTurnos)) return local;
    try { return await P.ia.dm('turno', { est, g, campana: D.campana }); } catch (e) { cb().anotar(est, 'Gemini no respondió: este turno sigue sin IA.'); return local; }
  }
  async function actuar(g) {
    const est = D.combate;
    const plan = await planear(g);
    if (!plan.objetivo) return;
    if (plan.narracion) cb().anotar(est, plan.narracion);
    for (const ataque of cb().golpes(g)) {
      // Si ya cayó, sigue con otro: no se desperdician ataques
      const objetivo = cb().vivo(plan.objetivo) && plan.objetivo.pg > 0 ? plan.objetivo : cb().objetivo(est, g);
      if (!objetivo) break;
      await atacar(g, ataque, objetivo);
    }
  }
  const terminado = (est) => !['pj', 'enemigo'].every((b) => est.gente.some((g) => g.bando === b && cb().vivo(g) && g.pg > 0));
  async function ocupado(fn) {
    if (R.ocupado) return;
    R.ocupado = true; pintar();
    try { await fn(); } finally { R.ocupado = false; cerrarDados(); pintar(); }
  }
  // Avanza un turno. Con enemigos automáticos sigue sola hasta que le toque a un jugador.
  async function avanzar() {
    const est = D.combate;
    for (let vueltas = 0; vueltas < est.gente.length + 1; vueltas++) {
      const g = cb().siguiente(est);
      if (!g) return;
      if (!(D.autoEnemigos && g.bando === 'enemigo' && !terminado(est))) return;
      pintar();
      await actuar(g);
      if (terminado(est)) { cb().anotar(est, 'La pelea terminó.'); return; }
    }
  }
  async function primerTurno() {
    const est = D.combate, g = cb().actual(est);
    if (D.autoEnemigos && g && g.bando === 'enemigo' && !terminado(est)) { await actuar(g); await avanzar(); }
  }
  async function tirarIniciativa() {
    const est = D.combate, gente = est.gente;
    if (D.dados === 'manual') {
      for (const g of gente) {
        // Los jugadores dicen su tirada; los enemigos los tira la app
        const v = g.bando === 'pj' ? await pedirValor(`Iniciativa de ${g.nombre}`, `Escribe su d20 sin sumar el bono (${P.signo(g.iniBono)}).`, 1, 20) : null;
        cb().fijarIniciativa(est, g.id, v ?? P.azar(20));
      }
    } else {
      const valores = await tirar(gente.map(() => 20), 0, 'Iniciativa');
      gente.forEach((g, i) => cb().fijarIniciativa(est, g.id, valores[i]));
    }
    cb().ordenar(est);
    await primerTurno();
  }

  /* ---------- Generadores: sin IA siempre; con Gemini, solo si responde algo válido ---------- */
  async function generar(clave, local, conIA) {
    if (R.ocupado) return;
    R.nota = ''; R.ocupado = P.ia.lista(); pintar();
    let r = local();
    if (P.ia.lista()) {
      try { r = await conIA(r); } catch (e) { R.nota = e.message + ' Lo hice sin IA.'; }
    }
    R[clave] = r; R.ocupado = false;
    pintar();
  }

  // Quien entra con la pelea empezada tira su iniciativa y ocupa su lugar sin mover el turno
  function colocarNuevos() {
    const est = D.combate;
    if (!est.ronda) return;
    est.gente.filter((g) => g.ini === null).forEach((g) => { cb().fijarIniciativa(est, g.id, P.azar(20)); cb().anotar(est, `${g.nombre} entra en la pelea con iniciativa ${g.ini}.`); });
    cb().colocar(est);
  }

  const acciones = {
    'dm-gen-pnj'() { generar('pnj', () => P.dm.pnj(D.fPnj), (l) => P.ia.dm('pnj', { filtros: D.fPnj, local: l, campana: D.campana })); },
    'dm-gen-encuentro'() {
      const f = D.fEnc;
      generar('encuentro', () => P.dm.encuentro(f), () => P.ia.dm('encuentro', { opciones: [P.dm.encuentro(f), P.dm.encuentro(f), P.dm.encuentro(f)], campana: D.campana }));
    },
    'dm-gen-objeto'() {
      const f = D.fObj;
      generar('objeto', () => P.dm.objeto(f), () => P.ia.dm('objeto', { opciones: [P.dm.objeto(f), P.dm.objeto(f), P.dm.objeto(f), P.dm.objeto(f)], campana: D.campana }));
    },
    'dm-gen-trampa'() { generar('trampa', () => P.dm.trampa(D.fTra), (l) => P.ia.dm('trampa', { trampa: l, campana: D.campana })); },
    async 'dm-trampa-dano'() {
      const t = R.trampa, d = P.dm.partirDano(t.dano);
      const valores = await tirar(Array(d.n).fill(d.lados), 0, 'Daño: ' + t.nombre);
      cerrarDados();
      P.avisar(`${t.nombre}: ${sumar(valores)} de daño ${t.tipoDano}.`);
    },
    'dm-llevar'() {
      R.encuentro.grupo.forEach((g) => cb().agregarCriatura(D.combate, P.SRD_CRIATURAS.find((c) => c.n === g.n), g.q));
      colocarNuevos();
      D.tab = 'iniciativa'; pintar();
      P.avisar('Encuentro añadido a la iniciativa.');
    },
    'dm-anadir'() {
      const c = P.SRD_CRIATURAS.find((x) => x.n.toLowerCase() === $('dm-busca').value.trim().toLowerCase());
      if (!c) { P.avisar('No encontré esa criatura. Elígela de la lista.'); return; }
      cb().agregarCriatura(D.combate, c, Math.min(12, Math.max(1, +$('dm-cuantas').value || 1)));
      colocarNuevos(); pintar();
    },
    'dm-anadir-pj'() {
      const id = $('dm-pj').value, e = id && P.guardados.abrir(id);
      if (!e) { P.avisar('Elige un personaje guardado.'); return; }
      cb().agregarPJ(D.combate, cb().desdePersonaje(Object.assign(P.pjVacio(), e.pj)));
      colocarNuevos(); pintar();
    },
    'dm-anadir-mano'() {
      const nombre = $('dm-m-nombre').value.trim();
      if (!nombre) { P.avisar('Escribe el nombre del jugador.'); return; }
      const pg = Math.max(1, +$('dm-m-pg').value || 1);
      cb().agregarPJ(D.combate, { fuente: nombre, nombre, ca: +$('dm-m-ca').value || 10, pg, pgMax: pg, iniBono: +$('dm-m-ini').value || 0 });
      colocarNuevos(); pintar();
    },
    'dm-iniciativa'() { ocupado(tirarIniciativa); },
    'dm-siguiente'() { ocupado(avanzar); },
    'dm-reiniciar'() { D.combate = cb().crear(); pintar(); },
    'dm-actuar'() { const g = cb().actual(D.combate); if (g) ocupado(() => actuar(g)); },
    'dm-atacar'(e, b) {
      const g = cb().actual(D.combate), obj = D.combate.gente.find((x) => x.id === $('dm-objetivo').value);
      if (g && obj) ocupado(() => atacar(g, g.ataques[+b.dataset.valor], obj));
    },
    'dm-muerte'() {
      const g = cb().actual(D.combate);
      ocupado(async () => { const [d] = await tirar([20], 0, 'Salvación contra muerte de ' + g.nombre); cb().salvacionMuerte(D.combate, g.id, d); });
    },
    'dm-danar'(e, b) { const n = +$('dm-n-' + b.dataset.id).value || 0; if (n > 0) { cb().danar(D.combate, b.dataset.id, n); pintar(); } },
    'dm-curar'(e, b) { const n = +$('dm-n-' + b.dataset.id).value || 0; if (n > 0) { cb().curar(D.combate, b.dataset.id, n); pintar(); } },
    'dm-quitar'(e, b) { cb().quitar(D.combate, b.dataset.id); pintar(); },
    'dm-quitar-estado'(e, b) { const g = D.combate.gente.find((x) => x.id === b.dataset.id); g.estados = g.estados.filter((s) => s !== b.dataset.valor); pintar(); },
  };

  function prepararEventos() {
    const cont = $('dm');
    cont.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'dm-tab') { D.tab = t.value; R.nota = ''; pintar(); return; }
      if (t.name === 'dm-dados') { D.dados = t.value; guardar(); return; }
      if (t.id === 'dm-auto') { D.autoEnemigos = t.checked; guardar(); return; }
      if (t.id === 'dm-ia-turnos') { D.iaTurnos = t.checked; guardar(); return; }
      if (t.dataset.f) {
        const [grupo, k] = t.dataset.f.split('.');
        D[grupo][k] = t.type === 'number' ? Math.min(+t.max, Math.max(+t.min, +t.value || +t.min)) : t.value;
        guardar(); return;
      }
      if (t.dataset.dmEstado && t.value) {
        const g = D.combate.gente.find((x) => x.id === t.dataset.dmEstado);
        g.estados.push(t.value); pintar();
      }
    });
    cont.addEventListener('input', (e) => { if (e.target.id === 'dm-campana') { D.campana = e.target.value; guardar(); } });
  }

  let preparado = false;
  P.dmVista = {
    acciones,
    async abrir() {
      const cont = $('dm');
      if (!preparado) { preparado = true; prepararEventos(); }
      if (!P.SRD_CRIATURAS) cont.innerHTML = '<p class="estado" role="status">Cargando las criaturas y los objetos…</p>';
      try {
        await cargarDatos();
        cargarEstado();
        pintar();
        const h = cont.querySelector('h1');
        if (h) h.focus({ preventScroll: true });
      } catch (e) { cont.innerHTML = '<p class="estado error" role="status">No se pudieron cargar los datos. Revisa tu conexión y vuelve a entrar.</p>'; }
    },
    pintar,
  };
})(window.PJ);
