/* Aplicación: estado, navegación, dados, lenguaje natural, descargas y preferencias. */
(function (P) {
  document.documentElement.lang = 'es';
  const $ = (id) => document.getElementById(id);
  const raiz = document.documentElement;
  const CLAVE_PREFS = 'tpp.prefs', CLAVE_URL = 'tpp.url';
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const escribirLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento bloqueado */ } };

  P.ICONOS.ojo = P.ICONOS.sab;
  const E = { id: P.guardados.nuevoId(), pj: P.pjVacio(), paso: 'aprende', tut: { i: 0, res: null }, activos: [], ui: { filtro: 'todas' }, propuesta: null, hoja: { tema: 'noche', pagina: 1 } };
  P.E = E;

  /* ---------- Preferencias ---------- */
  P.prefs = Object.assign({ tema: 'auto', letra: 'normal', legible: false, contraste: false, movimiento: false, sonido: true, leer: false, dado: P.PALETAS_DADO[0] }, leer(CLAVE_PREFS, {}));
  const quiereMenos = matchMedia('(prefers-reduced-motion: reduce)');
  const temaOscuro = matchMedia('(prefers-color-scheme: dark)');
  P.movimientoActivo = () => !quiereMenos.matches && !P.prefs.movimiento;

  function temaResuelto() {
    if (P.prefs.tema === 'oscuro') return 'dark';
    if (P.prefs.tema === 'claro') return 'light';
    return raiz.dataset.theme || (temaOscuro.matches ? 'dark' : 'light');
  }
  function aplicarPrefs() {
    raiz.dataset.bsTheme = temaResuelto();
    raiz.dataset.letra = P.prefs.letra;
    raiz.dataset.legible = P.prefs.legible ? 'si' : 'no';
    raiz.dataset.contraste = P.prefs.contraste || matchMedia('(prefers-contrast: more)').matches ? 'alto' : 'no';
    raiz.dataset.movimiento = P.prefs.movimiento ? 'reducido' : 'normal';
    aplicarAcento();
    P.dados3d.colores(P.prefs.dado);
    if (dadoPortada) dadoPortada.repintar();
  }
  function mezclarHex(a, b, t) {
    const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = n(a), y = n(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function aplicarAcento() {
    const c = P.buscar(P.CLASES, E.pj.claseId);
    if (!c || P.prefs.contraste) { ['--acento', '--acento-texto', '--acento-suave'].forEach((v) => raiz.style.removeProperty(v)); return; }
    const oscuro = raiz.dataset.bsTheme === 'dark';
    raiz.style.setProperty('--acento', c.color);
    raiz.style.setProperty('--acento-texto', oscuro ? mezclarHex(c.color, '#FFFFFF', 0.3) : mezclarHex(c.color, '#000000', 0.5));
    raiz.style.setProperty('--acento-suave', c.color + (oscuro ? '2B' : '24'));
  }

  /* ---------- Avisos y narrador ---------- */
  P.avisar = function (texto) {
    const t = document.createElement('div');
    t.className = 'toast align-items-center'; t.setAttribute('role', 'status');
    t.innerHTML = `<div class="d-flex"><div class="toast-body">${P.esc(texto)}</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
    $('tostadas').append(t);
    const inst = new bootstrap.Toast(t, { delay: 4500 });
    t.addEventListener('hidden.bs.toast', () => t.remove());
    inst.show();
  };

  let ultimoNarrado = '';
  function decir(texto) {
    if (texto === ultimoNarrado) return;
    ultimoNarrado = texto;
    $('narrador-vivo').textContent = texto;
    const cont = $('narrador-texto');
    cont.textContent = '';
    texto.split(/(\s+)/).filter(Boolean).forEach((w, i) => {
      if (/^\s+$/.test(w)) { cont.append(' '); return; }
      const s = document.createElement('span');
      s.textContent = w; s.style.setProperty('--i', i / 2);
      cont.append(s);
    });
    if (P.prefs.leer) hablar(texto);
  }
  function hablar(texto) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-419'; u.rate = 1;
    const voz = speechSynthesis.getVoices().find((v) => v.lang.startsWith('es'));
    if (voz) u.voice = voz;
    speechSynthesis.speak(u);
  }

  /* ---------- Estado ---------- */
  let reloj = null, sinEspacio = false;
  function guardar() {
    clearTimeout(reloj);
    reloj = setTimeout(guardarYa, 200);
  }
  function guardarYa() {
    clearTimeout(reloj);
    if (!hayAvance()) return;
    const bien = P.guardados.guardar(E.id, { pj: E.pj, paso: E.paso, tut: { i: E.tut.i }, activos: E.activos, hoja: E.hoja });
    if (!bien && !sinEspacio) P.avisar('No queda espacio en este dispositivo. Elimina un personaje o quita alguna imagen.');
    sinEspacio = !bien;
  }
  function hayAvance() { return !!(E.pj.razaId || E.pj.claseId || E.pj.nombre); }
  function limpiarAsistente() {
    E.propuesta = null;
    ['propuesta', 'recomendaciones', 'propuesta-respuesta'].forEach((id) => { $(id).hidden = true; });
    $('texto-asistente').value = '';
    $('estado-asistente').textContent = '';
  }
  function cargarEstado(id, e) {
    E.id = id;
    E.pj = Object.assign(P.pjVacio(), e.pj);
    E.pj.base = Object.assign(P.pjVacio().base, e.pj.base);
    E.paso = indice(e.paso) >= 0 ? e.paso : 'aprende';
    E.tut = { i: (e.tut && e.tut.i) || 0, res: null };
    E.activos = e.activos || [];
    E.hoja = Object.assign({ tema: 'noche', pagina: 1 }, e.hoja);
    limpiarAsistente(); aplicarAcento(); pintarActivos();
  }
  function cerrarPanelPersonajes() {
    const p = bootstrap.Offcanvas.getInstance($('panel-personajes'));
    if (p) p.hide();
  }
  function crearPersonaje() {
    guardarYa();
    // Quien ya hizo un personaje conoce los dados: no repite la práctica
    const yaHay = P.guardados.lista().length > 0;
    cargarEstado(P.guardados.nuevoId(), { pj: P.pjVacio(), paso: yaHay ? 'imagina' : 'aprende', tut: { i: yaHay ? P.MISIONES.length : 0 } });
    cerrarPanelPersonajes();
    return irPaso(E.paso);
  }
  function abrirPersonaje(id) {
    guardarYa();
    const e = P.guardados.abrir(id);
    if (!e) { P.avisar('No se pudo abrir ese personaje.'); pintarPersonajes(); return; }
    cargarEstado(id, e);
    P.guardados.fijarActual(id);
    cerrarPanelPersonajes();
    irPaso(E.paso);
  }
  let porEliminar = null;
  function eliminarPersonaje() {
    const id = porEliminar, nombre = (P.guardados.lista().find((p) => p.id === id) || {}).nombre;
    P.guardados.eliminar(id);
    P.avisar((nombre || 'El personaje') + ' se eliminó.');
    if (id === E.id) {
      const siguiente = P.guardados.lista()[0], e = siguiente && P.guardados.abrir(siguiente.id);
      if (e) { cargarEstado(siguiente.id, e); P.guardados.fijarActual(siguiente.id); } else cargarEstado(P.guardados.nuevoId(), { pj: P.pjVacio(), paso: 'aprende' });
      if (!$('vista-crear').hidden) irPaso(E.paso);
    }
    pintarPersonajes(); pintarContinuar();
  }
  function pintarPersonajes() {
    guardarYa();
    const lista = P.guardados.lista();
    $('lista-personajes').innerHTML = lista.length ? lista.map((p) => {
      const nombre = P.esc(p.nombre || 'Sin nombre');
      return `<li class="ficha-pj${p.id === E.id ? ' actual' : ''}"><span class="blason"${p.color ? ` style="color:${p.color}"` : ''}>${p.mini ? `<img src="${p.mini}" alt="">` : P.ico(p.icono)}</span><div><strong>${nombre}</strong><small>${P.esc(p.sub || 'Aún sin definir')}${p.id === E.id ? ' · Abierto ahora' : ''}</small></div><div class="ficha-botones"><button type="button" class="btn btn-secundario btn-sm" data-accion="abrir-pj" data-valor="${p.id}" aria-label="Abrir a ${nombre}">Abrir</button><button type="button" class="btn btn-secundario btn-sm" data-accion="eliminar-pj" data-valor="${p.id}" aria-label="Eliminar a ${nombre}">Eliminar</button></div></li>`;
    }).join('') : '<li class="ayuda">Todavía no tienes personajes guardados.</li>';
  }

  /* ---------- Imagen del personaje ---------- */
  function reducir(img, max, calidad) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    const x = cv.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, cv.width, cv.height); // el JPEG no tiene transparencia
    x.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', calidad);
  }
  async function cargarRetrato(archivo) {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { P.avisar('Elige un archivo de imagen.'); return; }
    const url = URL.createObjectURL(archivo), img = new Image();
    try {
      img.src = url;
      await img.decode();
      E.pj.retrato = reducir(img, 800, 0.8); E.pj.retratoMini = reducir(img, 96, 0.7);
      refrescar();
      P.avisar('Imagen guardada en este dispositivo.');
    } catch (e) { P.avisar('No se pudo leer esa imagen. Prueba con otra.'); }
    URL.revokeObjectURL(url);
  }

  /* ---------- Vista viva ---------- */
  function vivoHTML() {
    const c = P.calcular(E.pj), pj = E.pj;
    const sub = [c.nombreRaza, c.clase && c.clase.nombre].filter(Boolean).join(' · ') || 'Aún sin definir';
    return `<div class="vivo-cab"><span class="blason">${pj.retratoMini ? `<img src="${pj.retratoMini}" alt="">` : P.ico(c.clase ? c.clase.icono : c.raza ? c.raza.icono : 'd20')}</span>
      <div><p class="vivo-nombre">${P.esc(pj.nombre || 'Tu personaje')}</p><p class="vivo-sub">${P.esc(sub)}</p></div></div>
      <div class="gemas">${P.CARACT.map((a) => { const v = c.caract[a.id]; return `<div class="gema"><small>${a.abrev}</small><b>${v.mod === null ? '–' : P.signo(v.mod)}</b><span>${v.total ?? ''}</span></div>`; }).join('')}</div>
      <div class="vivo-stats">
        <div class="gema"><small>Defensa</small><b>${c.ca.valor ?? '–'}</b></div>
        <div class="gema"><small>Vida</small><b>${c.pgMax ?? '–'}</b></div>
        <div class="gema"><small>Veloc.</small><b>${c.velocidad ? String(c.velocidad).replace('.', ',') : '–'}</b></div>
      </div>`;
  }
  function pintarVivo() {
    const h = vivoHTML();
    $('vivo').innerHTML = h; $('vivo-movil').innerHTML = h;
    $('btn-vivo').setAttribute('aria-label', 'Ver a ' + (E.pj.nombre.trim() || 'mi personaje'));
  }

  /* ---------- Navegación ---------- */
  const indice = (id) => P.PASOS.findIndex((p) => p.id === id);
  function pintarRiel() {
    const i = indice(E.paso), total = P.PASOS.length;
    $('riel-texto').textContent = `Paso ${i + 1} de ${total}: ${P.PASOS[i].corto}`;
    const prog = $('riel-progreso');
    prog.setAttribute('aria-valuenow', Math.round(((i + 1) / total) * 100));
    $('riel-relleno').style.setProperty('--p', (i + 1) / total);
    $('riel-pasos').innerHTML = P.PASOS.map((p, k) => `<li><button type="button" class="riel-paso${k < i ? ' hecho' : ''}" data-accion="ir-paso" data-valor="${p.id}"${k === i ? ' aria-current="step"' : ''} aria-label="Paso ${k + 1}: ${p.corto}"><span class="n">${k + 1}</span><span class="t">${p.corto}</span></button></li>`).join('');
    $('btn-atras').style.visibility = i ? 'visible' : 'hidden';
    $('btn-siguiente').textContent = E.paso === 'personalidad' ? 'Ver mi hoja' : E.paso === 'hoja' ? 'Empezar otro personaje' : E.paso === 'aprende' && E.tut.i < P.MISIONES.length ? 'Ya sé tirar, seguir' : 'Siguiente';
    $('btn-siguiente').className = 'btn ' + (E.paso === 'hoja' ? 'btn-secundario' : 'btn-primario');
    $('faltan').textContent = ''; $('faltan').className = 'faltan';
  }

  const asistente = () => $('asistente');
  function renderPaso() {
    const activo = document.activeElement && document.activeElement.id;
    $('asistente-casa').append(asistente());
    const p = P.PASOS[indice(E.paso)];
    $('paso').innerHTML = p.vista(E);
    if (E.paso === 'imagina') $('ancla-asistente').append(asistente());
    if (E.paso === 'hoja') montarHoja($('componente-hoja'), E.pj);
    E.ui.popCar = null;
    decir(p.guia(E));
    pintarVivo();
    if (activo) { const el = $(activo); if (el && el !== document.body && $('paso').contains(el)) el.focus({ preventScroll: true }); }
    guardar();
  }

  function transicion(fn, dir) {
    raiz.style.setProperty('--vt-dir', dir);
    if (!document.startViewTransition || !P.movimientoActivo()) { fn(); return Promise.resolve(); }
    return document.startViewTransition(fn).updateCallbackDone;
  }
  function mostrarVista(id) {
    ['vista-portada', 'vista-crear', 'vista-visor', 'vista-dm'].forEach((v) => { $(v).hidden = v !== id; });
    $('btn-vivo').hidden = id !== 'vista-crear';
    if (portadaViva) portadaViva.pausar(id !== 'vista-portada');
  }
  function irPaso(id, opciones = {}) {
    const dir = indice(id) >= indice(E.paso) ? 1 : -1;
    const cambiar = () => {
      mostrarVista('vista-crear');
      E.paso = id;
      renderPaso();
      pintarRiel();
    };
    return transicion(cambiar, dir).then(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const h = $('paso').querySelector('h1');
      if (h && !opciones.sinFoco) h.focus({ preventScroll: true });
      if (!opciones.sinHistoria) { try { history.pushState({ paso: id }, '', '#paso-' + id); } catch (e) { /* archivo local */ } }
    });
  }
  function siguiente() {
    if (E.paso === 'hoja') { crearPersonaje(); return; }
    const faltan = P.pendientes(E.pj, E.paso);
    if (faltan.length) { const f = $('faltan'); f.textContent = faltan[0]; f.className = 'faltan'; return; }
    irPaso(P.PASOS[indice(E.paso) + 1].id);
  }
  function refrescar() { renderPaso(); actualizarFaltan(); }
  function actualizarFaltan() {
    const f = $('faltan');
    if (!f.textContent) return;
    const faltan = P.pendientes(E.pj, E.paso);
    f.textContent = faltan[0] || '';
  }

  /* ---------- Dados ---------- */
  const historial = [];
  function apuntar(etq, total, det) {
    historial.unshift({ etq, total, det });
    $('historial').innerHTML = historial.slice(0, 8).map((h) => `<li><span>${P.esc(h.etq)}</span><strong>${h.total}</strong></li>`).join('');
  }
  P.tirar = async function (o) {
    const { dados, suma = 0, modo = 'normal', cd = null, titulo = 'Tirada' } = o;
    $('capa-resultado').innerHTML = '';
    const capa = $('capa-dados');
    capa.dataset.estado = 'girando';
    if (P.hayWebGL === false) capa.classList.add('sin-3d');
    capa.classList.toggle('con-camara', P.ra.activa);
    if (!capa.open) capa.showModal();
    if (P.ra.activa) await P.ra.encender().catch((e) => { desactivarCamara(P.ra.motivo(e)); capa.classList.remove('con-camara'); });
    const valores = await P.dados3d.lanzar(dados.map((lados) => ({ lados })));
    const usado = modo === 'ventaja' ? Math.max(...valores) : modo === 'desventaja' ? Math.min(...valores) : valores.reduce((a, b) => a + b, 0);
    const total = usado + suma;
    const natural = dados.includes(20) && !(dados.length > 1 && modo === 'normal') ? usado : null;
    let det;
    if (modo !== 'normal') det = `Sacaste ${valores.join(' y ')}. Con ${modo} usas el ${usado}.${suma ? ` ${usado} ${suma > 0 ? '+' : '−'} ${Math.abs(suma)} = ${total}` : ''}`;
    else det = `${valores.join(' + ')}${suma ? ` ${suma > 0 ? '+' : '−'} ${Math.abs(suma)}` : ''}${valores.length > 1 || suma ? ` = ${total}` : ''}`;
    let msg = '';
    if (cd !== null) msg = total >= cd ? `Alcanzas la dificultad ${cd}: ¡lo logras!` : `No alcanzas la dificultad ${cd}.`;
    if (natural === 20 && (o.ataque || cd === null)) msg = o.ataque ? '¡Crítico! Tira el doble de dados de daño.' : '¡Un 20! El mejor resultado posible.';
    if (natural === 1 && (o.ataque || cd === null)) msg = o.ataque ? 'Un 1 natural: el ataque falla.' : 'Un 1. Mala suerte, pero la historia sigue.';
    const clase = natural === 20 ? ' critico' : natural === 1 ? ' pifia' : '';
    $('capa-resultado').innerHTML = `<h2>${P.esc(titulo)}</h2><div class="res-total${clase}">${total}</div><p class="res-det">${P.esc(det)}</p>${msg ? `<p class="res-msg">${P.esc(msg)}</p>` : ''}
      <div class="res-acciones"><button type="button" class="btn btn-secundario" id="res-otra">Lanzar otra vez</button><button type="button" class="btn btn-primario" id="res-cerrar">Cerrar</button></div>`;
    $('vivo-dados').textContent = `${titulo}: ${total}. ${det}. ${msg}`;
    apuntar(titulo, total, det);
    $('res-cerrar').onclick = () => cerrarDados();
    $('res-otra').onclick = () => { P.tirar(o); };
    $('res-cerrar').focus({ preventScroll: true });
    capa.dataset.estado = 'listo';
    const r = { valores, usado, total, modo: modo !== 'normal' ? modo : null };
    if (o.alTerminar) o.alTerminar(r);
    return r;
  };
  function cerrarDados() { P.dados3d.cerrar(); }

  /* ---------- Color y realidad aumentada de los dados ---------- */
  function desactivarCamara(aviso) {
    P.ra.activa = false;
    $('ra-camara').checked = false;
    $('estado-ra').className = 'estado error'; $('estado-ra').textContent = aviso;
  }
  async function alternarCamara(activar) {
    const est = $('estado-ra');
    est.className = 'estado'; est.textContent = '';
    if (!activar) { P.ra.activa = false; return; }
    if (!P.ra.hayCamara()) { desactivarCamara('Este navegador no permite usar la cámara aquí. Abre el sitio publicado, con https.'); return; }
    try {
      await P.ra.encender(); // pide el permiso ahora, no en medio de una tirada
      P.ra.apagar();
      P.ra.activa = true;
      est.className = 'estado ok'; est.textContent = 'Listo. Tus próximos dados caerán sobre la cámara.';
    } catch (e) { desactivarCamara(P.ra.motivo(e)); }
  }
  function pintarColoresDado() {
    const d = P.prefs.dado;
    $('paletas').innerHTML = P.PALETAS_DADO.map((p) => `<button type="button" data-accion="dado-paleta" data-valor="${p.id}" aria-pressed="${d.cuerpo === p.cuerpo && d.canto === p.canto && d.tinta === p.tinta}"><i style="background:${p.cuerpo};border-color:${p.canto}"></i>${p.nombre}</button>`).join('');
    ['cuerpo', 'canto', 'tinta'].forEach((k) => { $('dado-' + k).value = d[k]; });
  }
  function cambiarColorDado(cambio) {
    P.prefs.dado = Object.assign({}, P.prefs.dado, cambio);
    pintarColoresDado(); prefsCambiadas();
  }

  /* ---------- Cambios en lenguaje natural ---------- */
  // Lleva una característica al segundo lugar (o al primero si ya era la segunda), intercambiando valores
  function subirEn(base, car) {
    const orden = P.CARACT.map((a) => a.id).sort((a, b) => base[b] - base[a]);
    const pos = orden.indexOf(car);
    if (pos === 0) return;
    const con = orden[pos === 1 ? 0 : 1];
    [base[car], base[con]] = [base[con], base[car]];
  }
  function subirPrioridad(car) {
    const pj = E.pj;
    pj.prioridades = (pj.prioridades || []).filter((c) => c !== car).concat(car);
    const cl = P.buscar(P.CLASES, pj.claseId), valores = P.valoresPJ(pj);
    if (P.CARACT.every((a) => pj.base[a.id] !== null)) subirEn(pj.base, car);
    else if (cl && valores.length === 6) pj.base = P.elegir.reparto(pj, valores).base;
  }
  function aplicarCambio(c) {
    const pj = E.pj, antes = {};
    const g = (...ks) => ks.forEach((k) => { antes[k] = JSON.parse(JSON.stringify(pj[k])); });
    if (c.tipo === 'clase' && c.valor === pj.claseId) return; // volver a elegirla no debe borrar lo ya decidido
    if (c.tipo === 'opcion') {
      const cl = P.buscar(P.CLASES, pj.claseId);
      if (!cl || !cl.opcion || !P.buscar(cl.opcion.lista, c.valor)) return;
      g('opcionId'); pj.opcionId = c.valor;
    }
    if (c.tipo === 'raza') { g('razaId', 'subrazaId', 'eligeCar', 'habRaza'); pj.razaId = c.valor; pj.subrazaId = null; pj.eligeCar = []; pj.habRaza = []; }
    if (c.tipo === 'subraza') { g('subrazaId'); pj.subrazaId = c.valor; }
    if (c.tipo === 'clase') { g('claseId', 'habClase', 'opcionId', 'pericia', 'kitId', 'equipoElegido', 'trucos', 'conjuros'); elegirClase(c.valor); }
    if (c.tipo === 'trasfondo') { g('trasfondoId', 'habExtra'); pj.trasfondoId = c.valor; pj.habExtra = []; }
    if (c.tipo === 'nombre') { g('nombre'); pj.nombre = c.valor; }
    if (c.tipo === 'prioridad') { g('base', 'prioridades'); subirPrioridad(c.valor); }
    if (['rasgo', 'ideal', 'vinculo', 'defecto'].includes(c.tipo)) { g(c.tipo); pj[c.tipo] = c.valor; }
    // Cambiar de idea reemplaza la elección anterior: Quitar debe volver a como estaba antes de ambas
    if (['raza', 'subraza', 'clase', 'opcion', 'trasfondo'].includes(c.tipo)) {
      const sustituye = (a) => a.tipo === c.tipo || (c.tipo === 'clase' && a.tipo === 'opcion') || (c.tipo === 'raza' && a.tipo === 'subraza');
      E.activos.filter(sustituye).forEach((a) => Object.assign(antes, a.antes));
      E.activos = E.activos.filter((a) => !sustituye(a));
    }
    E.activos.unshift({ texto: c.texto, tipo: c.tipo, antes, id: Date.now() + Math.random() });
  }
  function elegirClase(id) {
    const pj = E.pj;
    pj.claseId = id; pj.habClase = []; pj.opcionId = null; pj.pericia = []; pj.kitId = null; pj.equipoElegido = {}; pj.trucos = []; pj.conjuros = [];
    aplicarAcento();
  }
  function pintarActivos() {
    $('activos-vacio').hidden = E.activos.length > 0;
    $('lista-activos').innerHTML = E.activos.map((a) => `<li class="activo"><span>${P.esc(a.texto)}</span><button type="button" class="btn btn-secundario btn-sm" data-accion="quitar-activo" data-valor="${a.id}" aria-label="Quitar: ${P.esc(a.texto)}">Quitar</button></li>`).join('');
  }
  const GRUPOS_REC = [['recomendaciones', 'Clases'], ['razas', 'Razas'], ['trasfondos', 'Trasfondos']];
  function esElegida(x) {
    const pj = E.pj, actual = { clase: pj.claseId, opcion: pj.opcionId, raza: pj.razaId, subraza: pj.subrazaId, trasfondo: pj.trasfondoId };
    return x.cambios.every((c) => actual[c.tipo] === c.valor);
  }
  function pintarRecomendaciones() {
    const r = E.propuesta;
    if (!r) return;
    $('lista-recomendaciones').innerHTML = GRUPOS_REC.filter(([k]) => r[k].length).map(([k, t]) => `<h4 class="grupo-rec">${t}</h4><div class="recomendaciones">${r[k].map((x, i) => {
      const on = esElegida(x);
      return `<div class="recomendacion${on ? ' elegida' : ''}"><span class="ico"${x.color ? ` style="color:${x.color}"` : ''}>${P.ico(x.icono)}</span><div><strong>${P.esc(x.nombre)}</strong><p>${P.esc(x.por)}</p></div><button type="button" class="btn btn-secundario btn-sm" data-accion="usar-rec" data-grupo="${k}" data-valor="${i}" aria-label="Usar ${P.esc(x.nombre)}" aria-pressed="${on}">${on ? 'Elegida' : 'Usar'}</button></div>`;
    }).join('')}</div>`).join('');
  }
  function pintarPropuesta(r) {
    E.propuesta = r;
    const hay = r.cambios.length || r.dudas.length, hayRec = GRUPOS_REC.some(([k]) => r[k].length);
    $('propuesta').hidden = !hay;
    $('propuesta-respuesta').hidden = !r.respuesta;
    $('propuesta-respuesta').textContent = r.respuesta ? (r.ia ? 'Gemini: ' : '') + r.respuesta : '';
    $('lista-propuesta').innerHTML = r.cambios.map((c, i) => `<li><label class="casilla" for="prop-${i}"><input type="checkbox" id="prop-${i}" checked><span>${P.esc(c.texto)}</span></label></li>`).join('');
    $('lista-dudas').innerHTML = r.dudas.map((d) => `<li class="duda">${P.esc(d)}</li>`).join('');
    $('btn-confirmar').hidden = !r.cambios.length;
    $('recomendaciones').hidden = !hayRec;
    $('recomendaciones-pregunta').hidden = !r.pregunta;
    $('recomendaciones-pregunta').textContent = r.pregunta || '';
    pintarRecomendaciones();
    const est = $('estado-asistente');
    est.className = 'estado';
    est.textContent = r.cambios.length ? 'Revisa lo que entendí y aplícalo.' : hayRec ? 'Elige la opción que más te guste.' : '';
  }
  // Recuerda lo que la persona ha contado: orienta a Gemini y a «Elegir por mí»
  const recordar = (previo, texto) => (previo.includes(texto) ? previo : (previo ? previo + '. ' : '') + texto).slice(-300);
  async function revisar() {
    const texto = $('texto-asistente').value.trim();
    const est = $('estado-asistente');
    if (!texto) { est.className = 'estado error'; est.textContent = 'Escribe qué quieres o toca uno de los ejemplos.'; $('texto-asistente').focus(); return; }
    const btn = $('btn-revisar');
    btn.disabled = true;
    let r = null, nota = '';
    try {
      E.pj.concepto = recordar(E.pj.concepto, texto);
      guardar();
      const local = P.interpretar(texto, E.pj);
      if (P.ia.lista()) {
        est.className = 'estado'; est.textContent = 'Consultando a Gemini…';
        try {
          r = await P.ia.interpretar(texto, E.pj);
          // Si Gemini deja una lista vacía, se completa con las opciones locales
          GRUPOS_REC.forEach(([k]) => { if (!r[k].length) r[k] = local[k]; });
          r.pregunta = r.pregunta || local.pregunta;
        } catch (e) { nota = e.message + ' Lo revisé sin IA.'; }
      }
      if (!r) r = local;
      pintarPropuesta(r);
      if (nota) { est.className = 'estado error'; est.textContent = nota; }
      const visible = [$('propuesta'), $('recomendaciones')].find((s) => !s.hidden);
      if (visible) visible.scrollIntoView({ block: 'center', behavior: P.movimientoActivo() ? 'smooth' : 'auto' });
    } finally { btn.disabled = false; }
  }
  function confirmarPropuesta() {
    const r = E.propuesta;
    if (!r) return;
    const elegidos = r.cambios.filter((_, i) => $('prop-' + i).checked);
    if (!elegidos.length) { $('estado-asistente').textContent = 'Marca al menos un cambio.'; return; }
    elegidos.forEach(aplicarCambio);
    $('propuesta').hidden = true;
    $('texto-asistente').value = '';
    const est = $('estado-asistente');
    est.className = 'estado ok';
    est.textContent = elegidos.length === 1 ? 'Cambio aplicado.' : `${elegidos.length} cambios aplicados.`;
    pintarActivos(); refrescar(); pintarRecomendaciones();
  }
  function usarRecomendacion(grupo, i) {
    const x = E.propuesta && E.propuesta[grupo] && E.propuesta[grupo][i];
    if (!x) return;
    P.validarCambios(x.cambios, E.pj).cambios.forEach(aplicarCambio);
    const est = $('estado-asistente'); est.className = 'estado ok'; est.textContent = `Elegiste ${x.nombre}.`;
    pintarActivos(); refrescar(); pintarRecomendaciones();
    const b = document.querySelector(`[data-accion="usar-rec"][data-grupo="${grupo}"][data-valor="${i}"]`);
    if (b) b.focus({ preventScroll: true });
  }
  function quitarActivo(id) {
    const i = E.activos.findIndex((a) => String(a.id) === String(id));
    if (i < 0) return;
    Object.assign(E.pj, E.activos[i].antes);
    const texto = E.activos[i].texto;
    E.activos.splice(i, 1);
    aplicarAcento(); pintarActivos(); refrescar(); pintarRecomendaciones();
    $('estado-asistente').className = 'estado'; $('estado-asistente').textContent = 'Quitado: ' + texto;
  }

  /* ---------- Elegir por mí ---------- */
  // Con Gemini pide la mejor opción. Sin clave, o si falla o propone algo inválido, usa la elección local.
  async function elegirPorMi(tipo, boton, local, aplicar, extra) {
    const claseAntes = E.pj.claseId, razaAntes = E.pj.razaId;
    let r = local, nota = '';
    if (P.ia.lista()) {
      boton.disabled = true; boton.setAttribute('aria-busy', 'true');
      decir('Consultando a Gemini…');
      try { r = await P.ia.elegir(tipo, E.pj, extra); } catch (e) { nota = ' ' + e.message + ' Lo elegí sin IA.'; }
      boton.disabled = false; boton.removeAttribute('aria-busy');
      if (E.pj.claseId !== claseAntes || E.pj.razaId !== razaAntes) return; // cambió el personaje mientras esperaba
    }
    aplicar(r);
    if (r.por || nota) decir((r.por + nota).trim());
  }

  // Dictado por voz
  let dictado = null;
  function prepararVoz() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    $('btn-dictar').hidden = false;
    $('btn-dictar').addEventListener('click', () => {
      const b = $('btn-dictar');
      if (dictado) { dictado.stop(); return; }
      dictado = new SR();
      dictado.lang = 'es-CO'; dictado.interimResults = true;
      const base = $('texto-asistente').value;
      dictado.onresult = (e) => { $('texto-asistente').value = (base + ' ' + [...e.results].map((x) => x[0].transcript).join(' ')).trim(); };
      dictado.onerror = () => { $('estado-asistente').textContent = 'No se pudo usar el micrófono. Puedes escribirlo.'; };
      dictado.onend = () => { dictado = null; b.setAttribute('aria-pressed', 'false'); };
      b.setAttribute('aria-pressed', 'true');
      dictado.start();
    });
  }

  function pintarInsigniaIA() {
    const lista = P.ia.lista(), i = $('insignia-ia');
    i.textContent = lista ? 'Con Gemini' : 'Sin IA'; i.classList.toggle('ia', lista);
  }
  function prepararIA() {
    P.ia.cargar();
    const sel = $('ia-modelo'), cfg = P.ia.cfg;
    const opciones = (lista) => {
      sel.innerHTML = [...new Set([cfg.modelo, ...lista])].map((m) => `<option${m === cfg.modelo ? ' selected' : ''}>${P.esc(m)}</option>`).join('');
    };
    opciones(P.MODELOS_GEMINI);
    $('ia-clave').value = cfg.clave; $('ia-usar').checked = cfg.usar; $('ia-recordar').checked = cfg.recordar;
    const leerCfg = () => { cfg.clave = $('ia-clave').value.trim(); cfg.usar = $('ia-usar').checked; cfg.recordar = $('ia-recordar').checked; cfg.modelo = sel.value; P.ia.guardar(); pintarInsigniaIA(); };
    ['ia-clave', 'ia-usar', 'ia-recordar', 'ia-modelo'].forEach((id) => $(id).addEventListener('change', leerCfg));
    $('ia-clave').addEventListener('input', leerCfg);
    pintarInsigniaIA();
    P.ia.opcionesModelo = opciones;
  }
  async function probarIA() {
    const est = $('estado-ia'), btn = $('btn-probar-ia');
    if (!P.ia.cfg.clave) { est.className = 'estado error'; est.textContent = 'Primero escribe tu clave.'; $('ia-clave').focus(); return; }
    btn.disabled = true; est.className = 'estado'; est.textContent = 'Probando…';
    try {
      const lista = await P.ia.probar();
      if (lista.length) P.ia.opcionesModelo(lista);
      est.className = 'estado ok'; est.textContent = `Conectado. Hay ${lista.length} modelos Flash disponibles.`;
    } catch (e) { est.className = 'estado error'; est.textContent = e.message; }
    btn.disabled = false;
  }

  /* ---------- Hoja: vista, descargas y tiradas ---------- */
  let pjHoja = null;
  function pintarLienzo() {
    const c = $('hoja-lienzo');
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ancho = Math.round(Math.min(P.HOJA_W, c.parentElement.clientWidth * dpr));
    c.width = ancho; c.height = Math.round((ancho * P.HOJA_H) / P.HOJA_W);
    P.hoja.dibujar(c, pjHoja, { tema: E.hoja.tema, pagina: E.hoja.pagina });
  }
  // La hoja en blanco y negro puede tener una página más, para notas
  function pintarPaginas() {
    const lista = P.hoja.paginas(pjHoja, E.hoja.tema);
    if (!lista.includes(E.hoja.pagina)) E.hoja.pagina = 1;
    $('hoja-paginas').innerHTML = lista.map((n) => `<input type="radio" class="btn-check" name="hoja-pagina" id="hp-${n}" value="${n}"${E.hoja.pagina === n ? ' checked' : ''}><label for="hp-${n}">${n > 100 ? (lista.filter((x) => x > 100).length > 1 ? 'Conjuros ' + (n - 100) : 'Conjuros') : 'Página ' + n}</label>`).join('');
  }
  function resumenHoja(pj, c) {
    return [pj.nombre || 'Personaje sin nombre', c.nombreRaza, c.clase && c.clase.nombre, 'nivel ' + c.nivel, c.ca.valor !== null ? 'defensa ' + c.ca.valor : '', c.pgMax !== null ? 'vida ' + c.pgMax : ''].filter(Boolean).join(', ') + '. Todos los datos aparecen en los botones de tiradas.';
  }
  function montarHoja(cont, pj, opciones = {}) {
    pjHoja = pj;
    const c = P.calcular(pj);
    const compartir = !!(navigator.canShare && navigator.share);
    const rollo = (txt, bono, datos, comp) => `<button type="button" class="rollo${comp ? ' comp' : ''}" data-accion="rollo" ${datos}><span>${P.esc(txt)}</span><b>${P.signo(bono)}</b></button>`;
    const atk = c.ataques.filter((a) => !a.salvacion).map((a) => rollo(a.nombre, a.acierta, `data-tipo="ataque" data-valor="${a.id}"`, true)).join('');
    cont.innerHTML = `<div class="hoja-grid">
      <div>
        <div class="hoja-controles">
          <div class="segmento" role="radiogroup" aria-label="Estilo de la hoja">
            <input type="radio" class="btn-check" name="hoja-tema" id="ht-noche" value="noche"${E.hoja.tema === 'noche' ? ' checked' : ''}><label for="ht-noche">Noche</label>
            <input type="radio" class="btn-check" name="hoja-tema" id="ht-pergamino" value="pergamino"${E.hoja.tema === 'pergamino' ? ' checked' : ''}><label for="ht-pergamino">Pergamino</label>
            <input type="radio" class="btn-check" name="hoja-tema" id="ht-byn" value="byn"${E.hoja.tema === 'byn' ? ' checked' : ''}><label for="ht-byn">Blanco y negro</label>
          </div>
          <div class="segmento" id="hoja-paginas" role="radiogroup" aria-label="Página"></div>
        </div>
        <div class="hoja-lienzo"><canvas id="hoja-lienzo" role="img" aria-label="${P.esc(resumenHoja(pj, c))}"></canvas></div>
      </div>
      <div>
        <h3 class="h5">Descarga tu hoja</h3>
        <div class="descargas">
          <button type="button" class="descarga prim" data-accion="descargar" data-valor="pdf"><span class="ico">${P.ico('pergamino')}</span><span>PDF<small>Con el estilo que elegiste</small></span></button>
          <button type="button" class="descarga" data-accion="imprimir"><span class="ico">${P.ico('libro')}</span><span>Imprimir en blanco y negro<small>Sin fondos y con recuadros para anotar a lápiz</small></span></button>
          <button type="button" class="descarga" data-accion="descargar" data-valor="jpeg"><span class="ico">${P.ico('pluma')}</span><span>JPEG<small>Una imagen para tu galería</small></span></button>
          ${opciones.visor ? '' : `<button type="button" class="descarga" data-accion="abrir-qr"><span class="ico">${P.ico('dados')}</span><span>Código QR<small>Ábrela en tu celular</small></span></button>`}
          ${compartir ? `<button type="button" class="descarga" data-accion="compartir"><span class="ico">${P.ico('mano')}</span><span>Compartir<small>Guárdala o envíala desde tu teléfono</small></span></button>` : ''}
          <button type="button" class="descarga" data-accion="descargar" data-valor="blanco"><span class="ico">${P.ico('libro')}</span><span>Hoja en blanco<small>Para llenar a lápiz</small></span></button>
        </div>
        ${opciones.visor ? '<button type="button" class="btn btn-primario w-100 mt-3" data-accion="importar">Guardar en este dispositivo</button>' : '<button type="button" class="btn btn-primario w-100 mt-3" data-accion="abrir-nivel">Subir de nivel</button>'}
      </div>
    </div>
    <section class="bloque" aria-labelledby="t-rollos"><h3 id="t-rollos">Prueba tus tiradas</h3><p class="ayuda">Toca cualquier botón y se lanzan los dados con tu bono. Los marcados son en los que estás entrenado.</p>
      ${atk ? `<h4 class="h6 mt-3">Ataques</h4><div class="rollos">${atk}</div>` : ''}
      <h4 class="h6 mt-3">Salvaciones</h4><div class="rollos">${P.CARACT.map((a) => rollo(a.nombre, c.salvaciones[a.id].bono, `data-tipo="salvacion" data-valor="${a.id}"`, c.salvaciones[a.id].comp)).join('')}</div>
      <h4 class="h6 mt-3">Habilidades</h4><div class="rollos">${c.habilidades.map((h) => rollo(P.nombreHab(h.id), h.bono, `data-tipo="habilidad" data-valor="${h.id}"`, h.comp)).join('')}</div>
      <h4 class="h6 mt-3">Combate</h4><div class="rollos">${rollo('Iniciativa', c.iniciativa, 'data-tipo="iniciativa"', false)}</div>
    </section>`;
    pintarPaginas();
    P.hoja.listas(pj).then(() => { if ($('hoja-paginas')) pintarPaginas(); pintarLienzo(); });
  }
  function tirarRollo(b) {
    const c = P.calcular(pjHoja), t = b.dataset.tipo, v = b.dataset.valor;
    if (t === 'ataque') {
      const a = c.ataques.find((x) => x.id === v);
      P.tirar({ dados: [20], suma: a.acierta, titulo: 'Ataque: ' + a.nombre, ataque: true, alTerminar: (r) => {
        const danio = document.createElement('button');
        danio.type = 'button'; danio.className = 'btn btn-primario'; danio.textContent = 'Tirar daño';
        const m = a.dado.match(/(\d+)d(\d+)/), n = +m[1] * (r.usado === 20 ? 2 : 1), l = +m[2];
        danio.onclick = () => P.tirar({ dados: Array(n).fill(l), suma: a.bonoDano, titulo: 'Daño: ' + a.nombre });
        $('res-otra').replaceWith(danio);
      } });
    }
    if (t === 'salvacion') P.tirar({ dados: [20], suma: c.salvaciones[v].bono, titulo: 'Salvación de ' + P.buscar(P.CARACT, v).nombre });
    if (t === 'habilidad') { const h = c.habilidades.find((x) => x.id === v); P.tirar({ dados: [20], suma: h.bono, titulo: h.nombre }); }
    if (t === 'iniciativa') P.tirar({ dados: [20], suma: c.iniciativa, titulo: 'Iniciativa' });
  }

  async function descargar(tipo, boton) {
    const pj = tipo === 'blanco' ? P.pjVacio() : pjHoja;
    boton.setAttribute('aria-busy', 'true');
    try {
      let blob, nombre;
      if (tipo === 'jpeg') { blob = await P.crearJPEG(pj, E.hoja.tema); nombre = P.nombreArchivo(pj, 'jpg'); }
      else { blob = await P.crearPDF(pj, tipo === 'blanco' ? 'byn' : E.hoja.tema); nombre = tipo === 'blanco' ? 'hoja-en-blanco.pdf' : P.nombreArchivo(pj, 'pdf'); }
      await P.guardarArchivo(blob, nombre);
      P.avisar('Listo: ' + nombre);
    } catch (e) {
      if (!e || e.code !== 'declined') P.avisar('No se pudo crear el archivo. Intenta de nuevo.');
    } finally { boton.removeAttribute('aria-busy'); }
  }
  // Siempre en blanco y negro, sea cual sea el estilo que se ve en pantalla
  async function imprimir(boton) {
    boton.setAttribute('aria-busy', 'true');
    try {
      await P.hoja.listas(pjHoja);
      const imagenes = await Promise.all(P.hoja.paginas(pjHoja, 'byn').map(async (pagina) => {
        const img = new Image();
        img.alt = 'Página ' + pagina + ' de la hoja de personaje';
        img.src = P.hoja.lienzo(pjHoja, { tema: 'byn', pagina, escala: 1.5 }).toDataURL('image/png');
        await img.decode();
        return img;
      }));
      $('zona-impresion').replaceChildren(...imagenes);
      window.print();
    } catch (e) { P.avisar('No se pudo preparar la impresión. Elige Blanco y negro y descarga el PDF.'); }
    boton.removeAttribute('aria-busy');
  }
  async function compartir(boton) {
    boton.setAttribute('aria-busy', 'true');
    try {
      const blob = await P.crearPDF(pjHoja, E.hoja.tema);
      const f = new File([blob], P.nombreArchivo(pjHoja, 'pdf'), { type: 'application/pdf' });
      if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'Hoja de ' + (pjHoja.nombre || 'personaje') });
      else await P.guardarArchivo(blob, f.name);
    } catch (e) { if (e.name !== 'AbortError') P.avisar('No se pudo compartir. Usa la descarga en PDF.'); }
    boton.removeAttribute('aria-busy');
  }

  let enlaceActual = '';
  async function pintarQR() {
    const est = $('estado-qr');
    const propia = $('qr-url').value.trim();
    const base = P.baseEnlace(propia);
    $('qr-direccion').hidden = P.sitioPublicado();
    $('qr-marco').hidden = !base; $('btn-copiar').hidden = !base;
    $('qr-ayuda').hidden = !base;
    est.className = 'estado';
    est.textContent = '';
    if (!base) { est.textContent = 'Escribe la dirección y se crea el código.'; return; }
    if (propia && !/^https?:\/\//.test(propia)) { est.className = 'estado error'; est.textContent = 'La dirección debe empezar por https://'; $('qr-marco').hidden = true; return; }
    if (propia) escribirLS(CLAVE_URL, propia);
    try {
      const { enlace, recorte } = await P.enlaceQR(pjHoja, base);
      enlaceActual = enlace;
      P.dibujarQR($('qr-lienzo'), enlace);
      est.className = 'estado ok';
      est.textContent = recorte ? 'Listo. Acorté tus textos largos para que el código se pueda leer.' : 'Listo. Tu hoja va dentro del código.';
    } catch (e) { est.className = 'estado error'; est.textContent = 'Tu hoja es muy larga para un QR. Acorta tus textos o descarga el PDF.'; $('qr-marco').hidden = true; }
  }

  async function abrirVisor(token) {
    mostrarVista('vista-visor');
    try {
      const pj = await P.decodificar(token);
      const c = P.calcular(pj);
      if (!c.raza && !c.clase) throw new Error('vacío');
      $('titulo-visor').textContent = pj.nombre || 'Tu personaje';
      $('visor-estado').textContent = [c.nombreRaza, c.clase && c.clase.nombre, 'Nivel ' + c.nivel].filter(Boolean).join(' · ');
      montarHoja($('visor-hoja'), pj, { visor: true });
    } catch (e) {
      $('titulo-visor').textContent = 'No pudimos abrir esta hoja';
      $('visor-estado').textContent = 'El enlace está incompleto o dañado. Pide que te compartan el código QR de nuevo.';
    }
  }

  /* ---------- Subir de nivel ---------- */
  const N = { golpe: null, a: '', b: '' };
  function pintarNivel() {
    const pj = pjHoja, c = P.calcular(pj), cl = c.clase, cont = $('nivel-contenido');
    if (!cl) { cont.innerHTML = '<p>Primero elige una clase.</p>'; return; }
    if (c.nivel >= 20) { cont.innerHTML = '<p>Tu personaje ya está en el nivel máximo.</p>'; return; }
    const nuevo = c.nivel + 1, fijo = P.DADO_FIJO[cl.d], con = c.caract.con.mod ?? 0;
    const gana = cl.progreso[nuevo - 2] || 'Mira lo que gana tu clase en tu manual.';
    const mejora = P.nivelesDeMejora(cl.id).includes(nuevo);
    const subeComp = P.competencia(nuevo) !== c.comp;
    const pg = N.golpe === null ? null : Math.max(1, N.golpe + con);
    const ops = P.CARACT.map((a) => `<option value="${a.id}">${a.nombre} (${c.caract[a.id].total ?? '–'})</option>`).join('');
    cont.innerHTML = `<p class="estado-nivel">De nivel <strong>${c.nivel}</strong> a nivel <strong>${nuevo}</strong>. Tu grupo sube cuando el DM lo dice o al reunir ${P.PX[nuevo - 1].toLocaleString('es')} PX.</p>
      <h3 class="h5">1. Gana vida</h3><p>Lanza tu dado de golpe o usa el número fijo. Luego se suma tu modificador de Constitución (${P.signo(con)}).</p>
      <div class="d-flex flex-wrap gap-2 mb-2"><button type="button" class="btn btn-primario" data-accion="nivel-tirar">Lanzar 1d${cl.d}</button><button type="button" class="btn btn-secundario" data-accion="nivel-fijo">Usar número fijo (${fijo})</button></div>
      ${pg !== null ? `<p role="status"><strong>${N.golpe} ${con < 0 ? '−' : '+'} ${Math.abs(con)} = ${pg} de vida.</strong> Tu vida máxima pasará de ${c.pgMax} a ${c.pgMax + pg}.</p>` : ''}
      <h3 class="h5 mt-3">2. Lo que ganas</h3><p>${P.esc(gana)}${subeComp ? ` Tu competencia sube a ${P.signo(P.competencia(nuevo))}.` : ''}${cl.magia ? ' Tus espacios de conjuro se actualizan solos. Anota tus conjuros nuevos en tu manual.' : ''}</p>
      ${mejora ? `<h3 class="h5 mt-3">3. Mejora de característica</h3><p>Sumas 2 puntos: uno y uno, o los dos en la misma. Ninguna puede pasar de 20.</p><div class="row g-2"><div class="col-sm-6"><label class="form-label" for="mej-a">Primer punto</label><select class="form-select" id="mej-a"><option value="">Elegir</option>${ops}</select></div><div class="col-sm-6"><label class="form-label" for="mej-b">Segundo punto</label><select class="form-select" id="mej-b"><option value="">Elegir</option>${ops}</select></div></div>` : ''}
      <p class="estado error" id="estado-nivel" role="status"></p>
      <button type="button" class="btn btn-primario mt-2" data-accion="nivel-ok">Confirmar nivel ${nuevo}</button>`;
    if (mejora) { $('mej-a').value = N.a; $('mej-b').value = N.b; }
  }
  function confirmarNivel() {
    const pj = pjHoja, c = P.calcular(pj), est = $('estado-nivel');
    if (N.golpe === null) { est.textContent = 'Primero gana tu vida: lanza el dado o usa el número fijo.'; return; }
    const mejora = P.nivelesDeMejora(c.clase.id).includes(c.nivel + 1);
    if (mejora) {
      const a = $('mej-a').value, b = $('mej-b').value;
      if (!a || !b) { est.textContent = 'Elige tus dos puntos de mejora.'; return; }
      const m = {}; m[a] = 1; m[b] = (m[b] || 0) + 1;
      pj.mejoras.push(m);
    }
    pj.ganadosPG.push(N.golpe); pj.nivel = c.nivel + 1;
    N.golpe = null; N.a = ''; N.b = '';
    bootstrap.Modal.getInstance($('modal-nivel')).hide();
    aplicarAcento(); refrescar();
    P.avisar(`¡${pj.nombre || 'Tu personaje'} subió a nivel ${pj.nivel}!`);
  }

  /* ---------- Bolsa de dados ---------- */
  let ladosBolsa = 20;
  function prepararBolsa() {
    $('bolsa').innerHTML = [4, 6, 8, 10, 12, 20, 100].map((l) => `<button type="button" data-lados="${l}" aria-pressed="${l === 20}" aria-label="Dado de ${l} caras">${P.icoDado(l)}<span>d${l}</span></button>`).join('');
    $('bolsa').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lados]');
      if (!b) return;
      ladosBolsa = +b.dataset.lados;
      [...$('bolsa').children].forEach((x) => x.setAttribute('aria-pressed', x === b));
    });
  }
  function lanzarBolsa() {
    const cant = Math.min(10, Math.max(1, +$('bolsa-cantidad').value || 1));
    const suma = +$('bolsa-suma').value || 0;
    const modo = ladosBolsa === 20 ? document.querySelector('[name=bolsa-modo]:checked').value : 'normal';
    const dados = modo === 'normal' ? Array(cant).fill(ladosBolsa) : [20, 20];
    const inst = bootstrap.Offcanvas.getInstance($('panel-dados'));
    if (inst) inst.hide();
    P.tirar({ dados, suma, modo, titulo: `${modo === 'normal' ? cant : 2}d${ladosBolsa}${suma ? P.signo(suma) : ''}` });
  }

  /* ---------- Eventos ---------- */
  function cambiarPuntuacion(k, v, de) {
    E.pj.base = P.asignarPuntuacion(E.pj.base, k, v, de);
    E.ui.popCar = k;
  }
  const ACCIONES = {
    empezar() { if (hayAvance()) crearPersonaje(); else irPaso('aprende'); },
    continuar() { irPaso(E.paso); },
    'ir-portada'(e) { e.preventDefault(); mostrarVista('vista-portada'); pintarContinuar(); window.scrollTo(0, 0); try { history.pushState({}, '', '#inicio'); } catch (x) { /* archivo local */ } },
    'probar-dados'() { if (portadaViva) portadaViva.empujar(); P.tirar({ dados: [20], titulo: 'Tu tirada de d20' }); },
    siguiente,
    atras() { irPaso(P.PASOS[Math.max(0, indice(E.paso) - 1)].id); },
    'ir-paso'(e, b) { irPaso(b.dataset.valor); },
    'mision-tirar'() {
      const m = P.MISIONES[E.tut.i];
      P.tirar({ dados: m.dados, suma: m.suma, modo: m.modo || 'normal', cd: m.cd ?? null, titulo: m.titulo || 'Tu primer d20', alTerminar: (r) => { E.tut.res = r; refrescar(); } });
    },
    'mision-sig'() { E.tut.i += 1; E.tut.res = null; pintarRiel(); refrescar(); const h = $('paso').querySelector('h1'); if (h) h.focus(); },
    'repetir-tut'() { E.tut = { i: 0, res: null }; pintarRiel(); refrescar(); },
    filtro(e, b) { E.ui.filtro = b.dataset.valor; refrescar(); const n = document.querySelectorAll('[name=clase]').length; $('cuenta-clases').textContent = n + ' clases'; document.querySelector(`[data-accion=filtro][data-valor=${b.dataset.valor}]`).focus(); },
    'auto-hab'(e, b) {
      elegirPorMi('habilidades', b, P.elegir.habilidades(E.pj), (r) => { E.pj.habClase = r.habClase; E.pj.pericia = r.pericia; refrescar(); });
    },
    'auto-reparto'(e, b) {
      const valores = P.valoresPJ(E.pj);
      elegirPorMi('reparto', b, P.elegir.reparto(E.pj, valores), (r) => { E.pj.base = r.base; refrescar(); }, valores);
    },
    compra(e, b) {
      const k = b.dataset.car, pj = E.pj, d = +b.dataset.delta, base = Object.fromEntries(P.CARACT.map((a) => [a.id, pj.base[a.id] ?? 8]));
      const nuevo = base[k] + d;
      if (nuevo < 8 || nuevo > 15) return;
      const prueba = Object.assign({}, base, { [k]: nuevo });
      if (P.gastoCompra(prueba) > 27) { $('faltan').textContent = 'No te quedan puntos. Baja otra característica.'; return; }
      pj.base = prueba; E.ui.popCar = k; $('faltan').textContent = ''; refrescar();
    },
    'tirar-4d6'() {
      P.tirar({ dados: [6, 6, 6, 6], titulo: 'Puntuación ' + (E.pj.tiradas.length + 1) + ' de 6', alTerminar: (r) => {
        const s = r.valores.reduce((a, b) => a + b, 0) - Math.min(...r.valores);
        E.pj.tiradas.push({ d: r.valores, s });
        $('capa-resultado').querySelector('.res-total').textContent = s;
        $('capa-resultado').querySelector('.res-det').textContent = `${r.valores.join(', ')}. Quitas el ${Math.min(...r.valores)} y sumas ${s}.`;
        const otra = $('res-otra');
        if (E.pj.tiradas.length >= 6) otra.remove();
        else otra.onclick = () => { cerrarDados(); refrescar(); ACCIONES['tirar-4d6'](); };
        refrescar();
      } });
    },
    'reiniciar-tiradas'() { E.pj.tiradas = []; E.pj.base = Object.fromEntries(P.CARACT.map((a) => [a.id, null])); refrescar(); },
    'auto-equipo'(e, b) {
      elegirPorMi('equipo', b, P.elegir.equipo(E.pj), (r) => { E.pj.kitId = null; E.pj.equipoElegido = r.equipoElegido; refrescar(); });
    },
    'auto-magia'(e, b) {
      elegirPorMi('magia', b, P.elegir.magia(E.pj), (r) => { E.pj.trucos = r.trucos; E.pj.conjuros = r.conjuros; refrescar(); });
    },
    sugerir(e, b) {
      const k = b.dataset.valor;
      const lista = k === 'nombre' ? (P.NOMBRES[E.pj.razaId] || P.NOMBRES.humano) : P.PERSONALIDAD[k];
      const local = { texto: lista.filter((x) => x !== E.pj[k])[P.azar(lista.length - 1) - 1] || lista[0], por: '' };
      elegirPorMi('sugerir', b, local, (r) => {
        E.pj[k] = r.texto;
        const campo = $('c-' + k);
        if (campo) campo.value = r.texto;
        decir(P.PASOS[indice(E.paso)].guia(E)); pintarVivo(); guardar();
      }, k);
    },
    confirmar: confirmarPropuesta,
    'usar-rec'(e, b) { usarRecomendacion(b.dataset.grupo, +b.dataset.valor); },
    'quitar-activo'(e, b) { quitarActivo(b.dataset.valor); },
    'probar-ia': probarIA,
    'ver-clave'(e, b) {
      const c = $('ia-clave'), ver = c.type === 'password';
      c.type = ver ? 'text' : 'password'; b.textContent = ver ? 'Ocultar' : 'Mostrar'; b.setAttribute('aria-pressed', ver);
    },
    escuchar() { hablar(ultimoNarrado); },
    rollo(e, b) { tirarRollo(b); },
    descargar(e, b) { descargar(b.dataset.valor, b); },
    imprimir(e, b) { imprimir(b); },
    compartir(e, b) { compartir(b); },
    'abrir-qr'() { $('qr-url').value = leer(CLAVE_URL, ''); new bootstrap.Modal($('modal-qr')).show(); pintarQR(); },
    async 'copiar-enlace'() {
      try { await navigator.clipboard.writeText(enlaceActual); P.avisar('Enlace copiado.'); } catch (x) { P.avisar('No se pudo copiar. Selecciona el enlace a mano.'); }
    },
    'abrir-nivel'() { N.golpe = null; N.a = ''; N.b = ''; pintarNivel(); new bootstrap.Modal($('modal-nivel')).show(); },
    'nivel-tirar'() {
      const c = P.calcular(pjHoja);
      guardarMejora();
      P.tirar({ dados: [c.clase.d], titulo: 'Dado de golpe', alTerminar: (r) => { N.golpe = r.usado; pintarNivel(); } });
    },
    'nivel-fijo'() { guardarMejora(); N.golpe = P.DADO_FIJO[P.calcular(pjHoja).clase.d]; pintarNivel(); },
    'nivel-ok': confirmarNivel,
    importar() {
      guardarYa();
      cargarEstado(P.guardados.nuevoId(), { pj: pjHoja, paso: 'hoja', tut: { i: P.MISIONES.length } });
      guardarYa(); irPaso('hoja'); P.avisar('Guardado en este dispositivo.');
    },
    'crear-pj'() { crearPersonaje(); },
    'ir-dm'() { abrirDM(); try { history.pushState({}, '', '#dm'); } catch (x) { /* archivo local */ } },
    'abrir-pj'(e, b) { abrirPersonaje(b.dataset.valor); },
    'eliminar-pj'(e, b) {
      porEliminar = b.dataset.valor;
      const p = P.guardados.lista().find((x) => x.id === porEliminar);
      $('confirmar-texto').textContent = `Se borrará a ${(p && p.nombre) || 'este personaje'} de este dispositivo. No se puede deshacer.`;
      new bootstrap.Modal($('modal-confirmar')).show();
    },
    'eliminar-ok': eliminarPersonaje,
    'quitar-retrato'() { E.pj.retrato = ''; E.pj.retratoMini = ''; refrescar(); },
    'lanzar-bolsa': lanzarBolsa,
    'dado-paleta'(e, b) { const { cuerpo, canto, tinta } = P.buscar(P.PALETAS_DADO, b.dataset.valor); cambiarColorDado({ cuerpo, canto, tinta }); },
    async 'ra-mesa'() {
      const inst = bootstrap.Offcanvas.getInstance($('panel-dados'));
      try {
        // WebXR solo arranca dentro del toque: primero la sesión, después se cierra el panel
        await P.ra.abrirMesa(() => {
          const cant = Math.min(10, Math.max(1, +$('bolsa-cantidad').value || 1));
          return { dados: Array(cant).fill(ladosBolsa), suma: +$('bolsa-suma').value || 0 };
        });
        if (inst) inst.hide();
      } catch (e) { $('estado-ra').className = 'estado error'; $('estado-ra').textContent = 'No se pudo fijar a la mesa. Usa «Lanzar sobre la cámara».'; }
    },
  };
  Object.assign(ACCIONES, P.dmVista.acciones);
  function abrirDM() { guardarYa(); mostrarVista('vista-dm'); window.scrollTo(0, 0); P.dmVista.abrir(); }
  function guardarMejora() { if ($('mej-a')) { N.a = $('mej-a').value; N.b = $('mej-b').value; } }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (b && ACCIONES[b.dataset.accion] && !b.disabled) ACCIONES[b.dataset.accion](e, b);
  });
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .descarga');
    if (!b || !P.movimientoActivo()) return;
    const r = b.getBoundingClientRect(), t = Math.max(r.width, r.height) * 2.2;
    const o = document.createElement('span');
    o.className = 'onda'; o.style.cssText = `width:${t}px;height:${t}px;left:${e.clientX - r.left - t / 2}px;top:${e.clientY - r.top - t / 2}px`;
    b.append(o); o.addEventListener('animationend', () => o.remove());
  });

  $('paso').addEventListener('change', (e) => {
    const t = e.target, pj = E.pj, n = t.name;
    if (t.id === 'c-retrato') { cargarRetrato(t.files[0]); return; }
    if (n === 'raza') {
      pj.razaId = t.value; pj.subrazaId = null; pj.eligeCar = []; pj.habRaza = [];
      refrescar(); enfocarDetalle(); return;
    }
    if (n === 'clase') { elegirClase(t.value); refrescar(); enfocarDetalle(); return; }
    if (n === 'subraza') pj.subrazaId = t.value;
    else if (n === 'opcionId') pj.opcionId = t.value;
    else if (n === 'trasfondo') { pj.trasfondoId = t.value; pj.habExtra = []; refrescar(); enfocarDetalle(); return; }
    else if (n.startsWith('equipo-')) pj.equipoElegido = Object.assign({}, P.calcular(pj).kit.elegido, { [n.slice(7)]: t.value });
    else if (t.dataset.ranura) pj.equipoElegido = Object.assign({}, P.calcular(pj).kit.elegido, { [t.dataset.ranura]: t.value });
    else if (n === 'alineamiento') pj.alineamiento = t.value;
    else if (n === 'metodo') {
      pj.metodo = t.value;
      pj.base = Object.fromEntries(P.CARACT.map((a) => [a.id, t.value === 'compra' ? 8 : null]));
    } else if (t.dataset.car) cambiarPuntuacion(t.dataset.car, t.value === '' ? null : +t.value, t.selectedOptions[0].dataset.de);
    else if (['habClase', 'eligeCar', 'habRaza', 'pericia', 'habExtra', 'trucos', 'conjuros'].includes(n)) {
      const max = +t.closest('.casillas').dataset.max;
      const lista = pj[n];
      if (t.checked && lista.length < max) lista.push(t.value);
      else if (!t.checked) pj[n] = lista.filter((x) => x !== t.value);
      if (n === 'habClase') pj.pericia = pj.pericia.filter((x) => pj.habClase.includes(x));
    } else return;
    refrescar();
  });
  function enfocarDetalle() {
    const d = $('detalle');
    if (d) d.scrollIntoView({ behavior: P.movimientoActivo() ? 'smooth' : 'auto', block: 'nearest' });
  }
  $('paso').addEventListener('input', (e) => {
    const k = e.target.dataset.campo;
    if (!k) return;
    E.pj[k] = e.target.value;
    if (k === 'nombre') decir(P.PASOS[indice(E.paso)].guia(E));
    pintarVivo(); guardar();
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'hoja-tema') { E.hoja.tema = t.value; pintarPaginas(); pintarLienzo(); guardar(); }
    if (t.name === 'hoja-pagina') { E.hoja.pagina = +t.value; pintarLienzo(); guardar(); }
    if (t.name === 'tema') { P.prefs.tema = t.value; prefsCambiadas(); }
    if (t.name === 'letra') { P.prefs.letra = t.value; prefsCambiadas(); }
    if (t.id === 'pref-legible') { P.prefs.legible = t.checked; prefsCambiadas(); }
    if (t.id === 'pref-contraste') { P.prefs.contraste = t.checked; prefsCambiadas(); }
    if (t.id === 'pref-movimiento') { P.prefs.movimiento = t.checked; prefsCambiadas(); }
    if (t.id === 'pref-sonido') { P.prefs.sonido = t.checked; prefsCambiadas(); }
    if (t.dataset.color) cambiarColorDado({ [t.dataset.color]: t.value });
    if (t.id === 'ra-camara') alternarCamara(t.checked);
    if (t.id === 'pref-leer') { P.prefs.leer = t.checked; if (!t.checked && window.speechSynthesis) speechSynthesis.cancel(); prefsCambiadas(); }
  });
  function prefsCambiadas() { escribirLS(CLAVE_PREFS, P.prefs); aplicarPrefs(); pintarLienzo(); }
  temaOscuro.addEventListener('change', aplicarPrefs);

  function pintarPrefsUI() {
    const p = P.prefs;
    const tema = document.querySelector(`[name=tema][value=${p.tema}]`); if (tema) tema.checked = true;
    const letra = document.querySelector(`[name=letra][value=${p.letra}]`); if (letra) letra.checked = true;
    $('pref-legible').checked = p.legible; $('pref-contraste').checked = p.contraste; $('pref-movimiento').checked = p.movimiento; $('pref-sonido').checked = p.sonido; $('pref-leer').checked = p.leer;
    if (window.speechSynthesis) { $('fila-leer').hidden = false; $('btn-escuchar').hidden = false; }
  }

  function pintarContinuar() {
    const c = $('continuar');
    c.hidden = !hayAvance();
    if (hayAvance()) {
      const d = P.calcular(E.pj);
      c.innerHTML = `<button type="button" data-accion="continuar">Continuar con ${P.esc(E.pj.nombre || d.nombreRaza || d.clase?.nombre || 'tu personaje')}</button>`;
    }
  }

  /* ---------- Arranque ---------- */
  let dadoPortada = null, portadaViva = null;
  document.querySelectorAll('[data-ico]').forEach((n) => { n.innerHTML = P.ico(n.dataset.ico); });
  document.querySelector('.marca-sello').innerHTML = P.ico('d20');
  document.querySelector('.narrador-sello').innerHTML = P.ico('d20');
  $('ejemplos').innerHTML = P.EJEMPLOS_TEXTO.map((t) => `<button type="button" class="chip" data-ejemplo="${P.esc(t)}">${P.esc(t)}</button>`).join('');
  $('ejemplos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ejemplo]');
    if (b) { $('texto-asistente').value = b.dataset.ejemplo; revisar(); }
  });
  $('form-asistente').addEventListener('submit', (e) => { e.preventDefault(); revisar(); });
  $('guia-contenido').innerHTML = P.guiaHTML();
  $('qr-url').addEventListener('change', pintarQR);
  $('capa-dados').addEventListener('close', () => { $('capa-dados').dataset.estado = ''; P.ra.apagar(); });
  $('panel-dados').addEventListener('show.bs.offcanvas', () => { P.ra.hayMesa().then((si) => { $('btn-ra-mesa').hidden = !si; }); });
  $('panel-personajes').addEventListener('show.bs.offcanvas', pintarPersonajes);
  $('panel-asistente').addEventListener('show.bs.offcanvas', () => $('asistente-casa').append(asistente()));
  $('panel-asistente').addEventListener('hidden.bs.offcanvas', () => { const a = $('ancla-asistente'); if (a) a.append(asistente()); });
  $('modal-nivel').addEventListener('hidden.bs.modal', () => { N.golpe = null; });
  window.addEventListener('afterprint', () => $('zona-impresion').replaceChildren());
  let reloj2 = null;
  window.addEventListener('resize', () => { clearTimeout(reloj2); reloj2 = setTimeout(pintarLienzo, 200); });

  const previo = P.guardados.iniciar();
  if (previo) cargarEstado(previo.id, previo.estado);
  aplicarPrefs(); pintarPrefsUI(); pintarColoresDado(); prepararBolsa(); prepararVoz(); prepararIA(); pintarActivos(); pintarContinuar();
  if (P.hayWebGL) {
    // Después del primer pintado: preparar el 3D no debe frenar la entrada del texto
    const crear = () => { portadaViva = P.dadoPortada($('d20-lienzo')); dadoPortada = portadaViva; if ($('vista-portada').hidden) portadaViva.pausar(true); };
    if (window.requestIdleCallback) requestIdleCallback(crear, { timeout: 900 }); else setTimeout(crear, 300);
  } else {
    $('d20-plano').hidden = false; $('d20-plano').innerHTML = P.ico('d20');
  }

  window.addEventListener('popstate', () => enrutar());
  function enrutar() {
    const h = location.hash;
    if (h.startsWith('#pj.')) { abrirVisor(h.slice(4)); return; }
    if (h === '#dm') { abrirDM(); return; }
    if (h.startsWith('#paso-') && indice(h.slice(6)) >= 0) { irPaso(h.slice(6), { sinHistoria: true, sinFoco: true }); return; }
    mostrarVista('vista-portada'); pintarContinuar();
  }
  enrutar();
})(window.PJ);
