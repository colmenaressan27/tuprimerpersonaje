/* Pantallas del recorrido guiado: cada paso sabe qué decir y qué pintar. La lógica vive en app.js. */
(function (P) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ico = (id, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 512 512" aria-hidden="true"><path d="${P.ICONOS[id] || ''}"/></svg>`;
  P.esc = esc; P.ico = ico;

  const FORMA_DADO = {
    4: '50,8 94,86 6,86', 6: '12,12 88,12 88,88 12,88', 8: '50,5 92,50 50,95 8,50', 10: '50,5 93,44 50,95 7,44', 12: '50,4 92,34 76,88 24,88 8,34', 20: '50,4 90,27 90,73 50,96 10,73 10,27', 100: '50,5 93,44 50,95 7,44',
  };
  P.icoDado = (l) => `<svg class="dado-ic" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${FORMA_DADO[l]}"/></svg>`;

  function opcion({ name, value, checked, icono, t, s, extra = '', color, tipo = 'radio', disabled }) {
    const id = `${name}-${value}`;
    return `<label class="opcion" for="${id}"${color ? ` style="--c:${color}"` : ''}>
      <input type="${tipo}" id="${id}" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}>
      <span class="marca-ok" aria-hidden="true">✓</span>
      ${icono ? `<span class="opcion-ico">${ico(icono)}</span>` : ''}
      <span class="opcion-t">${esc(t)}</span>
      ${s ? `<span class="opcion-s">${esc(s)}</span>` : ''}${extra}
    </label>`;
  }

  function casillas(name, lista, elegidos, max, opts = {}) {
    const llenas = elegidos.length >= max;
    return `<div class="casillas" data-max="${max}">${lista.map((h) => {
      const on = elegidos.includes(h.id);
      const fija = opts.fijas && opts.fijas.includes(h.id);
      return `<label class="casilla" for="${name}-${h.id}"><input type="checkbox" id="${name}-${h.id}" name="${name}" value="${h.id}"${on || fija ? ' checked' : ''}${(llenas && !on) || fija ? ' disabled' : ''}><span>${esc(h.nombre)}${h.car ? ` <span class="car-hab">(${h.car.toUpperCase()})</span>` : ''}${h.ej ? `<small>${esc(h.ej)}</small>` : ''}${fija ? '<small>Ya la tienes</small>' : ''}</span></label>`;
    }).join('')}</div>`;
  }

  const REACCION = {
    humano: 'Un humano. Fácil de manejar y bueno en todo: gran elección para empezar.',
    elfo: 'Un elfo. Verás en la oscuridad y la magia casi no te afecta. Ahora elige tu subraza.',
    enano: 'Un enano. Duro como la piedra y muy difícil de derribar. Ahora elige tu subraza.',
    mediano: 'Un mediano. Pequeño, valiente y con una suerte que da envidia. Ahora elige tu subraza.',
    draconido: 'Un dracónido. Sangre de dragón y un aliento que nadie olvida.',
    gnomo: 'Un gnomo. Mente brillante y energía infinita. Ahora elige tu subraza.',
    semielfo: 'Un semielfo. Lo mejor de dos mundos. Elige dos características y dos habilidades.',
    semiorco: 'Un semiorco. Fuerte y muy difícil de tumbar: caer a 0 no es el final.',
    tiflin: 'Un tiflin. Cuernos, cola y mucha presencia. Y resistes el fuego.',
    barbaro: 'Bárbaro: entras en furia y lo aguantas todo. Muy fácil de jugar.',
    bardo: 'Bardo: magia, música y siempre algo que decir. Tiene muchas opciones.',
    brujo: 'Brujo: un pacto te dio poder. Pocos conjuros, pero muy fiables.',
    clerigo: 'Clérigo: tu fe cura al grupo y castiga a tus enemigos.',
    druida: 'Druida: la naturaleza te da magia y, desde nivel 2, formas de animal.',
    explorador: 'Explorador: rastreas, sobrevives y aciertas desde lejos.',
    guerrero: 'Guerrero: la clase más directa. Armas, armadura y a la carga.',
    hechicero: 'Hechicero: la magia te corre por las venas. Poca vida y mucho poder.',
    mago: 'Mago: tu libro es tu mayor arma. Poca vida, pero muchas soluciones.',
    monje: 'Monje: tus puños y tu velocidad bastan.',
    paladin: 'Paladín: un juramento te guía. Pegas fuerte y curas con las manos.',
    picaro: 'Pícaro: sigilo, trampas y un golpe por sorpresa que duele mucho.',
  };

  /* ---------- Aprender a tirar ---------- */
  const MISIONES = [
    { t: 'Tu primer tiro', d: 'El d20 es un dado de 20 caras y es el más importante del juego. Tócalo para lanzarlo.', boton: 'Lanzar el d20', dados: [20], suma: 0 },
    { t: 'Suma tu bono', d: 'Quieres saltar un foso. Tu bono de Atletismo es +5 y el DM pone dificultad 15. Si tu total llega a 15, lo logras.', boton: 'Lanzar d20 + 5', dados: [20], suma: 5, cd: 15, titulo: 'Saltar el foso' },
    { t: 'Ventaja', d: 'Si la situación te favorece, tienes ventaja: lanzas dos d20 y usas el mayor. Con desventaja, usas el menor.', boton: 'Lanzar con ventaja', dados: [20, 20], suma: 0, modo: 'ventaja', titulo: 'Tirada con ventaja' },
    { t: 'Haz daño', d: 'Tu ataque acertó. Ahora tiras el daño de tu espada: 1d8+3 significa un dado de 8 caras y sumar 3.', boton: 'Lanzar 1d8 + 3', dados: [8], suma: 3, titulo: 'Daño de la espada' },
  ];
  P.MISIONES = MISIONES;

  function vistaAprende(E) {
    const i = E.tut.i, m = MISIONES[i], r = E.tut.res;
    const barras = MISIONES.map((_, k) => `<li class="${k <= i ? 'on' : ''}"></li>`).join('');
    if (i >= MISIONES.length) {
      return `<h1 class="titulo-paso" tabindex="-1">¡Ya sabes tirar!</h1>
      <div class="mision"><h3>Lo esencial en una línea</h3><p>Dices qué quieres hacer, el DM pide una tirada, lanzas d20 + tu bono y comparas con la dificultad.</p>
      <dl class="dialogo">
        <div><dt>DM</dt><dd>La puerta está cerrada. Escuchas pasos al otro lado. ¿Qué haces?</dd></div>
        <div><dt>Tú</dt><dd>Pego la oreja a la puerta.</dd></div>
        <div><dt>DM</dt><dd>Tira Percepción.</dd></div>
        <div><dt>Tú</dt><dd>Saqué 14 y tengo +3. Son 17.</dd></div>
        <div><dt>DM</dt><dd>Cuentas dos guardias. No saben que estás ahí.</dd></div>
      </dl>
      <button type="button" class="btn btn-secundario mt-3" data-accion="repetir-tut">Repetir la práctica</button></div>`;
    }
    let eq = '';
    if (r) {
      const partes = r.valores.length > 1 && r.modo ? `<span class="ficha">${r.valores[0]}</span><span>y</span><span class="ficha">${r.valores[1]}</span><span>→ usas</span><span class="ficha">${r.usado}</span>` : `<span class="ficha">${r.usado}</span>${m.suma ? `<span>+</span><span class="ficha">${m.suma}</span>` : ''}`;
      eq = `<div class="ecuacion">${partes}${m.suma ? `<span>=</span><span class="ficha res">${r.total}</span>` : ''}</div>
      ${m.cd ? `<p><strong>${r.total >= m.cd ? '¡Lo lograste! ' + r.total + ' alcanza la dificultad ' + m.cd + '.' : 'Esta vez no. ' + r.total + ' no llega a ' + m.cd + '. En el juego, tu historia sigue igual.'}</strong></p>` : ''}
      <button type="button" class="btn btn-primario" data-accion="mision-sig">${i === MISIONES.length - 1 ? 'Terminar la práctica' : 'Siguiente práctica'}</button>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Aprende a tirar los dados</h1>
    <p class="sub">Cuatro prácticas rápidas. Si ya sabes, sigue al próximo paso.</p>
    <div class="mision"><p class="ojillo">Práctica ${i + 1} de ${MISIONES.length}</p><h3>${m.t}</h3><p>${m.d}</p>
      <div class="d-flex flex-wrap gap-2 ${r ? 'mb-3' : ''}"><button type="button" class="btn ${r ? 'btn-secundario' : 'btn-primario'}" data-accion="mision-tirar">${r ? 'Lanzar otra vez' : m.boton}</button></div>
      ${eq}
      <ul class="pasitos" aria-hidden="true">${barras}</ul>
    </div>`;
  }

  function guiaAprende(E) {
    if (E.tut.i >= MISIONES.length) return 'Muy bien. Eso es casi todo lo que necesitas para jugar. Sigamos con tu personaje.';
    if (E.tut.res) return 'Eso es. En el juego siempre es así: lanzas, sumas y comparas.';
    return ['Hola, soy tu guía. Primero vamos a practicar lo más importante: lanzar los dados.', 'Ahora sumemos un bono. Casi todas las tiradas funcionan así.', 'Esta regla la usarás mucho: ventaja y desventaja.', 'Última práctica: el daño.'][E.tut.i];
  }

  /* ---------- Imagina ---------- */
  const vistaImagina = () => `<h1 class="titulo-paso" tabindex="-1">¿Qué personaje imaginas?</h1>
    <p class="sub">Escríbelo con tus palabras, aunque solo sea lo que te gusta hacer. Te muestro varias opciones y tú decides. Si prefieres elegir paso a paso, pulsa Siguiente.</p>
    <div id="ancla-asistente"></div>`;

  /* ---------- Raza ---------- */
  function vistaRaza(E) {
    const { pj } = E, c = P.calcular(pj), r = c.raza;
    let det = '';
    if (r) {
      const bonos = Object.entries(r.bonos).map(([k, v]) => P.signo(v) + ' ' + k.toUpperCase()).join(', ') + (r.eligeCar ? ' y +1 a otras dos' : '');
      det = `<section class="detalle" id="detalle" aria-labelledby="t-det">
        <div class="detalle-cab"><span class="sello">${ico(r.icono)}</span><div><h3 id="t-det">${r.nombre}</h3><p class="ayuda m-0">${esc(r.frase)}</p></div></div>
        <dl class="datos"><div><dt>Bonos</dt><dd>${bonos}</dd></div><div><dt>Velocidad</dt><dd>${r.velocidad} ft</dd></div><div><dt>Idiomas</dt><dd>${r.idiomas.join(', ')}</dd></div><div><dt>Buena para</dt><dd>${r.buenas}</dd></div></dl>
        <ul class="talentos">${r.rasgos.map((x) => `<li><strong>${esc(x.n)}:</strong> ${esc(x.d)}</li>`).join('')}</ul>
        ${r.subrazas ? `<div class="bloque"><h3>Elige tu subraza</h3><div class="opciones anchas" role="radiogroup" aria-label="Subraza">${r.subrazas.map((s) => opcion({ name: 'subraza', value: s.id, checked: pj.subrazaId === s.id, t: s.nombre, s: s.frase })).join('')}</div></div>` : ''}
        ${r.eligeCar ? `<div class="bloque"><h3>Elige dos características para tu +1</h3>${casillas('eligeCar', P.CARACT.filter((a) => !r.bonos[a.id]).map((a) => ({ id: a.id, nombre: a.nombre, ej: a.palabra })), pj.eligeCar, r.eligeCar)}</div>` : ''}
        ${r.eligeHabilidades ? `<div class="bloque"><h3>Elige ${r.eligeHabilidades} habilidades</h3>${casillas('habRaza', P.HABILIDADES, pj.habRaza, r.eligeHabilidades)}</div>` : ''}
      </section>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Elige tu raza</h1>
    <p class="sub">Es lo que eres de nacimiento. Te da bonos y talentos. No hay elección incorrecta.</p>
    <div class="opciones" role="radiogroup" aria-label="Raza">${P.RAZAS.map((x) => opcion({ name: 'raza', value: x.id, checked: pj.razaId === x.id, icono: x.icono, t: x.nombre, s: x.frase })).join('')}</div>${det}`;
  }
  const guiaRaza = (E) => {
    const c = P.calcular(E.pj);
    if (!c.raza) return 'Tu raza es lo que eres de nacimiento. Elige la que más te llame la atención, no hay elección incorrecta.';
    return P.pendientes(E.pj, 'raza').length ? REACCION[c.raza.id] : (REACCION[c.raza.id].replace(/ Ahora elige tu subraza\.| Elige dos características y dos habilidades\./, '') + ' Cuando quieras, sigue al próximo paso.');
  };

  /* ---------- Clase ---------- */
  const FILTROS = [['todas', 'Ver todas'], ['pegar', 'Pegar fuerte'], ['aguantar', 'Aguantar golpes'], ['magia', 'Usar magia'], ['curar', 'Curar al grupo'], ['sombras', 'Moverme en las sombras'], ['hablar', 'Hablar y convencer']];
  const DIF = ['', 'Fácil', 'Media', 'Compleja'];
  const difHTML = (n) => `<span class="dif">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}<span>${DIF[n]}</span></span>`;

  function vistaClase(E) {
    const { pj, ui } = E, c = P.calcular(pj), cl = c.clase;
    const f = ui.filtro || 'todas';
    let det = '';
    if (cl) {
      const lista = (cl.hab === 'todas' ? P.HABILIDADES : P.HABILIDADES.filter((h) => cl.hab.includes(h.id)));
      const hechas = new Set([...(c.raza && c.raza.habilidades || []), ...(pj.habRaza || [])]);
      det = `<section class="detalle" id="detalle" aria-labelledby="t-det" style="--c:${cl.color}">
        <div class="detalle-cab"><span class="sello">${ico(cl.icono)}</span><div><h3 id="t-det">${cl.nombre}</h3><p class="ayuda m-0">${esc(cl.frase)}</p></div></div>
        <dl class="datos"><div><dt>Dado de golpe</dt><dd>d${cl.d}</dd></div><div><dt>Lo más importante</dt><dd>${cl.clave}</dd></div><div><dt>Salvaciones</dt><dd>${cl.salv.map((s) => s.toUpperCase()).join(' y ')}</dd></div><div><dt>Armaduras</dt><dd>${cl.armadura}</dd></div></dl>
        <ul class="talentos">${cl.rasgos.map((x) => `<li><strong>${esc(x.n)}:</strong> ${esc(x.d)}</li>`).join('')}${cl.magia ? `<li><strong>Magia:</strong> ${cl.magia.desdeNivel ? 'Empiezas a usarla en nivel ' + cl.magia.desdeNivel + '.' : 'Eliges tus conjuros en el paso de equipo.'}</li>` : ''}</ul>
        <div class="bloque"><h3>Elige ${cl.nHab} habilidades <span class="ayuda" id="cuenta-hab">(${pj.habClase.length} de ${cl.nHab})</span></h3>
          ${casillas('habClase', lista.filter((h) => !hechas.has(h.id)).concat(lista.filter((h) => hechas.has(h.id))), pj.habClase, cl.nHab, { fijas: [...hechas] })}
          <button type="button" class="btn btn-secundario mt-2" data-accion="auto-hab">Elegir por mí</button></div>
        ${cl.opcion ? `<div class="bloque"><h3>${esc(cl.opcion.titulo)}</h3><p class="ayuda">${esc(cl.opcion.ayuda)}</p><div class="opciones anchas" role="radiogroup" aria-label="${esc(cl.opcion.titulo)}">${cl.opcion.lista.map((o) => opcion({ name: 'opcionId', value: o.id, checked: pj.opcionId === o.id, t: o.nombre, s: o.d })).join('')}</div></div>` : ''}
        ${cl.pericia ? `<div class="bloque"><h3>Elige ${cl.pericia} habilidades para tu pericia</h3><p class="ayuda">En estas sumas tu competencia dos veces.</p>${pj.habClase.length ? casillas('pericia', P.HABILIDADES.filter((h) => pj.habClase.includes(h.id)), pj.pericia, cl.pericia) : '<p class="ayuda">Primero elige tus habilidades.</p>'}</div>` : ''}
      </section>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Elige tu clase</h1>
    <p class="sub">Es tu profesión de aventurero y define cómo juegas. ¿Qué te gustaría hacer en la mesa?</p>
    <div class="chips" role="group" aria-label="Filtrar clases">${FILTROS.map(([k, t]) => `<button type="button" class="chip" data-accion="filtro" data-valor="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div>
    <p class="visually-hidden" role="status" id="cuenta-clases"></p>
    <div class="opciones mt-3" role="radiogroup" aria-label="Clase">${P.CLASES.filter((x) => f === 'todas' || x.tags.includes(f)).map((x) => opcion({ name: 'clase', value: x.id, checked: pj.claseId === x.id, icono: x.icono, t: x.nombre, s: x.frase, color: x.color, extra: difHTML(x.dif) })).join('')}</div>${det}`;
  }
  const guiaClase = (E) => {
    const c = P.calcular(E.pj);
    if (!c.clase) return 'Tu clase es lo que sabes hacer. Si es tu primera vez, las marcadas como fáciles te dejan disfrutar la historia sin aprender tantas reglas.';
    const f = P.pendientes(E.pj, 'clase');
    return REACCION[c.clase.id] + (f.length ? ' ' + f[0] : ' ¡Listo! Sigue cuando quieras.');
  };

  /* ---------- Puntuaciones ---------- */
  const MATRIZ = [15, 14, 13, 12, 10, 8];
  const COSTO = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  P.MATRIZ = MATRIZ; P.COSTO = COSTO;
  P.gastoCompra = (base) => Object.values(base).reduce((s, v) => s + (COSTO[v] ?? 0), 0);
  P.valoresPJ = (pj) => (pj.metodo === 'dados' ? pj.tiradas.map((t) => t.s) : MATRIZ);

  function vistaPuntuaciones(E) {
    const { pj } = E, c = P.calcular(pj), m = pj.metodo;
    const valores = P.valoresPJ(pj);
    const fila = (a) => {
      const v = c.caract[a.id];
      let control;
      if (m === 'compra') {
        control = `<div class="contador"><button type="button" class="btn-icono" data-accion="compra" data-car="${a.id}" data-delta="-1" aria-label="Bajar ${a.nombre}"${(pj.base[a.id] ?? 8) <= 8 ? ' disabled' : ''}>−</button><output aria-label="${a.nombre}">${pj.base[a.id] ?? 8}</output><button type="button" class="btn-icono" data-accion="compra" data-car="${a.id}" data-delta="1" aria-label="Subir ${a.nombre}"${(pj.base[a.id] ?? 8) >= 15 ? ' disabled' : ''}>+</button></div>`;
      } else {
        // Un renglón por tiro, aunque se repita. Si otra característica ya lo usa, elegirlo las intercambia.
        const ops = ['<option value="">Elegir</option>'].concat(P.opcionesPuntuacion(valores, pj.base, a.id).map((o) => {
          const otra = o.de && o.de !== a.id;
          return `<option value="${o.valor}"${o.de === a.id ? ' selected' : ''}${otra ? ` data-de="${o.de}"` : ''}>${o.valor}${otra ? ' · en ' + o.de.toUpperCase() : ''}</option>`;
        }));
        control = `<select class="form-select" id="base-${a.id}" data-car="${a.id}" aria-label="Puntuación de ${a.nombre}"${m === 'dados' && pj.tiradas.length < 6 ? ' disabled' : ''}>${ops.join('')}</select>`;
      }
      return `<div class="fila-car">
        <span class="ico">${ico(a.id)}</span>
        <div><strong>${a.nombre}</strong><small>${a.palabra}${v.total !== null ? ' · Total ' + v.total : ''}</small></div>
        <div class="control">${control}</div>
        <span class="bono">${v.bono ? P.signo(v.bono) : ''}</span>
        <span class="mod${E.ui.popCar === a.id ? ' pop' : ''}" aria-label="Modificador de ${a.nombre}">${v.mod === null ? '–' : P.signo(v.mod)}</span>
      </div>`;
    };
    let cuerpo = '';
    if (m === 'matriz') cuerpo = '<p>Tienes seis números: <strong>15, 14, 13, 12, 10 y 8</strong>. Pon el más alto en lo más importante de tu clase.</p>';
    if (m === 'dados') {
      const hechas = pj.tiradas.length;
      cuerpo = `<p>Lanzas cuatro d6, quitas el más bajo y sumas los otros tres. Lo haces seis veces.${hechas >= 6 ? ' Coloca cada tiro en una característica. Si un número salió varias veces, puedes usarlo esas mismas veces.' : ''}</p>
      <div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-primario" data-accion="tirar-4d6"${hechas >= 6 ? ' disabled' : ''}>${hechas >= 6 ? 'Ya tienes tus seis tiradas' : 'Lanzar 4d6 (' + (hechas + 1) + ' de 6)'}</button>${hechas ? '<button type="button" class="btn btn-secundario" data-accion="reiniciar-tiradas">Volver a empezar</button>' : ''}</div>
      <div class="tiradas-lista">${pj.tiradas.map((t) => { const min = t.d.indexOf(Math.min(...t.d)); return `<div class="tirada">${t.d.map((x, i) => (i === min ? `<s>${x}</s>` : `<span>${x}</span>`)).join(' ')}<b>${t.s}</b></div>`; }).join('')}</div>`;
    }
    if (m === 'compra') {
      const usados = P.gastoCompra(Object.fromEntries(P.CARACT.map((a) => [a.id, pj.base[a.id] ?? 8])));
      cuerpo = `<p>Todas empiezan en 8 y tienes 27 puntos para subirlas, hasta 15. Subir a 14 y 15 cuesta 2 puntos cada uno.</p><p><strong>Te quedan ${27 - usados} de 27 puntos.</strong></p>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Reparte tus puntuaciones</h1>
    <p class="sub">Aquí decides en qué es bueno tu personaje. El modificador es lo que sumarás a los dados.</p>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <div class="segmento" role="radiogroup" aria-label="Método">
        ${[['matriz', 'Números fijos'], ['dados', 'Lanzar dados'], ['compra', 'Comprar puntos']].map(([k, t]) => `<input type="radio" class="btn-check" name="metodo" id="metodo-${k}" value="${k}"${m === k ? ' checked' : ''}><label for="metodo-${k}">${t}</label>`).join('')}
      </div>
      ${valores.length === 6 && c.clase ? '<button type="button" class="btn btn-secundario" data-accion="auto-reparto">Repartir por mí</button>' : ''}
    </div>
    <div class="mt-3">${cuerpo}</div>
    <div class="cabeza-car" aria-hidden="true"><span></span><span>Característica</span><span>Puntuación</span><span>Raza</span><span>Mod.</span></div>
    <div class="filas-car">${P.CARACT.map(fila).join('')}</div>`;
  }
  const guiaPuntuaciones = (E) => {
    const c = P.calcular(E.pj);
    if (c.hayPuntuaciones) return 'Listo. Fíjate en la columna Mod.: ese es el número que sumarás a tus dados.';
    if (E.pj.metodo === 'dados' && E.pj.tiradas.length < 6) return 'Lanza tus seis tiradas. Después las colocas tú o pulsas «Repartir por mí».';
    return c.clase ? `Para ${c.clase.nombre}, lo más importante es ${c.clase.clave}. Lo más fácil es pulsar «Repartir por mí» y luego ajustar lo que quieras.` : 'Reparte un número por característica. Un 10 es lo normal en una persona común.';
  };

  /* ---------- Trasfondo ---------- */
  function vistaTrasfondo(E) {
    const { pj } = E, c = P.calcular(pj), t = c.trasfondo;
    let det = '';
    if (t) {
      const nombreH = P.nombreHab;
      const repetidas = c.repetidas;
      const tienen = new Set(c.habilidades.filter((h) => h.comp).map((h) => h.id));
      det = `<section class="detalle" id="detalle" aria-labelledby="t-det">
        <div class="detalle-cab"><span class="sello">${ico(t.icono)}</span><div><h3 id="t-det">${t.nombre}</h3><p class="ayuda m-0">${esc(t.antes)}</p></div></div>
        <dl class="datos"><div><dt>Habilidades</dt><dd>${t.hab.map(nombreH).join(', ')}</dd></div><div><dt>Además</dt><dd>${esc(t.extra)}</dd></div><div><dt>Empiezas con</dt><dd>${t.oro} monedas de oro</dd></div></dl>
        ${repetidas.length ? `<div class="bloque"><h3>Habilidad repetida</h3><p>Ya tenías ${repetidas.map(nombreH).join(' y ')}. Elige ${repetidas.length === 1 ? 'otra' : 'otras ' + repetidas.length} para no desperdiciarla.</p>
        ${casillas('habExtra', P.HABILIDADES.filter((h) => !tienen.has(h.id) || pj.habExtra.includes(h.id)), pj.habExtra, repetidas.length)}</div>` : ''}
      </section>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Elige tu trasfondo</h1>
    <p class="sub">Es a qué te dedicabas antes de ser aventurero. Te da dos habilidades, equipo y un detalle para tu historia.</p>
    <div class="opciones" role="radiogroup" aria-label="Trasfondo">${P.TRASFONDOS.map((x) => opcion({ name: 'trasfondo', value: x.id, checked: pj.trasfondoId === x.id, icono: x.icono, t: x.nombre, s: x.antes })).join('')}</div>${det}`;
  }
  const guiaTrasfondo = (E) => {
    const c = P.calcular(E.pj);
    if (!c.trasfondo) return '¿Qué hacías antes de la aventura? Elige lo que le dé más historia a tu personaje.';
    return c.faltanPorRepetidas ? 'Tu trasfondo te da una habilidad que ya tenías. Elige otra para no desperdiciarla.' : 'Muy bien. Eso le da historia a tu personaje y dos habilidades nuevas.';
  };

  /* ---------- Equipo y magia ---------- */
  function vistaEquipo(E) {
    const { pj } = E, c = P.calcular(pj);
    if (!c.clase) return `<h1 class="titulo-paso" tabindex="-1">Tu equipo</h1><p class="sub">Primero elige una clase para ver tu equipo.</p>`;
    const arma = (a) => `${a.nombre}: ${a.dado} ${a.tipo}`;
    const detalleOpcion = (o) => [o.armadura ? `Defensa base ${P.ARMADURAS[o.armadura].base}` : '', o.escudo ? '+2 a tu defensa' : '', ...(o.armas || []).map((id) => arma(P.ARMAS[id]))].filter(Boolean).join(' · ');
    const ranuras = P.ranurasEquipo(c.clase, pj, c.kit.elegido);
    const etiquetaRanura = (r) => {
      if (r.clave.startsWith('fijo.')) return r.titulo;
      const hermanas = ranuras.filter((x) => x.clave.split('.')[0] === r.clave.split('.')[0]);
      return hermanas.length > 1 ? 'Elige tu arma ' + (hermanas.indexOf(r) + 1) : 'Elige tu arma';
    };
    const selector = (r) => `<div class="mt-2"><label class="form-label" for="ranura-${r.clave.replace('.', '-')}">${esc(etiquetaRanura(r))}</label><select class="form-select" id="ranura-${r.clave.replace('.', '-')}" data-ranura="${r.clave}">${P.armasDe(r.lista).map((a) => `<option value="${a.id}"${(pj.equipoElegido[r.clave] || r.defecto) === a.id ? ' selected' : ''}>${esc(arma(a))}${a.dosManos ? ' · a dos manos' : ''}</option>`).join('')}</select></div>`;
    const grupos = P.opcionesEquipo(c.clase, pj).map((g) => {
      const actual = P.opcionElegida(g, c.kit.elegido);
      return `<div class="bloque"><h3>${esc(g.t)}</h3><div class="opciones anchas" role="radiogroup" aria-label="${esc(g.t)}">${g.op.map((o) => opcion({ name: 'equipo-' + g.id, value: o.id, checked: actual.id === o.id, t: o.t, s: detalleOpcion(o) })).join('')}</div>${ranuras.filter((r) => r.clave.startsWith(g.id + '.')).map(selector).join('')}</div>`;
    }).join('');
    const fijas = ranuras.filter((r) => r.clave.startsWith('fijo.'));
    const kits = `<div class="d-flex flex-wrap gap-2 mt-2"><button type="button" class="btn btn-secundario" data-accion="auto-equipo">Elegir por mí</button></div>${grupos}${fijas.length ? `<div class="bloque">${fijas.map(selector).join('')}</div>` : ''}`;
    const ataques = c.ataques.length ? `<div class="tabla"><table><thead><tr><th>Ataque</th><th>Acertar</th><th>Daño</th></tr></thead><tbody>${c.ataques.map((a) => `<tr><td>${esc(a.nombre)}</td><td>${a.salvacion ? 'CD ' + a.cd : 'd20 ' + P.signo(a.acierta)}</td><td>${a.dado}${a.bonoDano ? ' ' + P.signo(a.bonoDano) : ''} ${esc(a.tipo)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="ayuda">Reparte tus puntuaciones para ver tus ataques.</p>';
    let magia = '';
    if (c.magia) {
      const lista = (n) => P.CONJUROS.filter((s) => s.nivel === n && s.clases.includes(c.clase.id)).map((s) => ({ id: s.id, nombre: s.nombre, ej: s.d }));
      const p = c.magia.permitidos;
      magia = `<div class="bloque"><h3>Tus trucos <span class="ayuda">(${pj.trucos.length} de ${p.trucos})</span></h3><p class="ayuda">Se lanzan sin límite.</p>${casillas('trucos', lista(0), pj.trucos, p.trucos)}</div>
      <div class="bloque"><h3>Tus conjuros <span class="ayuda">(${pj.conjuros.length} de ${p.conjuros})</span></h3><p class="ayuda">Cada uno gasta un espacio de conjuro. Tienes ${c.magia.espacios[0] || 0}. Vuelven al descansar.</p>${casillas('conjuros', lista(1), pj.conjuros, p.conjuros)}
      <button type="button" class="btn btn-secundario mt-2" data-accion="auto-magia">Elegir por mí</button></div>`;
    }
    return `<h1 class="titulo-paso" tabindex="-1">Tu equipo${c.magia ? ' y tu magia' : ''}</h1>
    <p class="sub">Tu clase te deja elegir tu equipo inicial. Tu armadura decide tu defensa y tu arma, el daño que haces.</p>
    ${kits}
    <div class="detalle"><dl class="datos m-0"><div><dt>Defensa (CA)</dt><dd>${c.ca.valor ?? '–'}</dd></div><div><dt>Cómo se calcula</dt><dd>${esc(c.ca.detalle || 'Reparte tus puntuaciones')}</dd></div><div><dt>Llevas</dt><dd>${esc(c.equipo.slice(0, 5).join(', '))}</dd></div></dl>
    ${c.avisos.map((a) => `<p class="duda mt-2 mb-0">${esc(a)}</p>`).join('')}</div>
    <div class="bloque"><h3>Tus ataques</h3>${ataques}</div>${magia}`;
  };
  const guiaEquipo = (E) => {
    const c = P.calcular(E.pj);
    if (!c.clase) return 'Vuelve al paso de clase para ver tu equipo.';
    return c.magia ? 'Elige tus armas y tu armadura. La CA es lo que un enemigo debe sacar para golpearte. Luego elige tus trucos y conjuros: si dudas, pulsa «Elegir por mí».' : 'Elige tus armas y tu armadura. La CA es lo que un enemigo debe sacar para golpearte y tus ataques ya están calculados.';
  };

  /* ---------- Personalidad ---------- */
  function vistaPersonalidad(E) {
    const { pj } = E;
    const texto = (k, t, ej) => `<div class="col-md-6"><label class="form-label" for="c-${k}">${t}</label><div class="input-group"><textarea class="form-control" id="c-${k}" data-campo="${k}" rows="2" maxlength="120" placeholder="${esc(ej)}">${esc(pj[k])}</textarea><button type="button" class="btn btn-secundario" data-accion="sugerir" data-valor="${k}" aria-label="Sugerir ${t.toLowerCase()}">Sugerir</button></div></div>`;
    return `<h1 class="titulo-paso" tabindex="-1">Dale personalidad</h1>
    <p class="sub">Tu personaje ya tiene números. Ahora dale una persona. Con una frase para cada punto basta.</p>
    <div class="row g-3">
      <div class="col-md-7"><label class="form-label" for="c-nombre">Nombre del personaje</label><div class="input-group"><input class="form-control" id="c-nombre" data-campo="nombre" maxlength="40" value="${esc(pj.nombre)}" autocomplete="off"><button type="button" class="btn btn-secundario" data-accion="sugerir" data-valor="nombre">Sugerir</button></div></div>
      <div class="col-md-5"><label class="form-label" for="c-jugador">Tu nombre (opcional)</label><input class="form-control" id="c-jugador" data-campo="jugador" maxlength="30" value="${esc(pj.jugador)}" autocomplete="off"></div>
      <div class="col-12"><div class="retrato-campo">
        <div class="retrato-vista">${pj.retrato ? `<img src="${pj.retrato}" alt="Imagen de tu personaje">` : ico('pluma')}</div>
        <div class="retrato-datos"><label class="form-label" for="c-retrato">Imagen de tu personaje (opcional)</label>
          <p class="ayuda">Si subes una, sale en tu hoja en vez del recuadro para dibujar. Se queda solo en este dispositivo y no viaja en el QR.</p>
          <input class="form-control" type="file" id="c-retrato" accept="image/*">
          ${pj.retrato ? '<button type="button" class="btn btn-secundario btn-sm mt-2" data-accion="quitar-retrato">Quitar imagen</button>' : ''}</div>
      </div></div>
      ${texto('rasgo', 'Cómo me comporto', 'Hablo poco y nunca retrocedo.')}
      ${texto('ideal', 'En qué creo', 'Proteger a los míos.')}
      ${texto('vinculo', 'Qué o a quién protejo', 'Busco a mi hermano perdido.')}
      ${texto('defecto', 'Qué me mete en problemas', 'Soy terco y me cuesta pedir ayuda.')}
    </div>
    <div class="bloque"><h3>Alineamiento</h3><p class="ayuda">Resume su actitud. Si dudas, elige Neutral bueno. Antes de elegir uno malvado, habla con tu DM.</p>
      <div class="opciones" role="radiogroup" aria-label="Alineamiento">${P.ALINEAMIENTOS.map((a) => opcion({ name: 'alineamiento', value: a.nombre, checked: pj.alineamiento === a.nombre, t: a.nombre, s: a.d })).join('')}</div></div>`;
  }
  const guiaPersonalidad = (E) => (E.pj.nombre.trim() ? `Encantado de conocerte, ${E.pj.nombre.trim()}. Si te falta inspiración, usa los botones «Sugerir».` : 'Solo falta lo más divertido: quién es tu personaje. Empieza por el nombre.');

  /* ---------- Hoja ---------- */
  function vistaHoja(E) {
    const { pj } = E, c = P.calcular(pj);
    return `<h1 class="titulo-paso" tabindex="-1">${esc(pj.nombre || 'Tu personaje')} está listo</h1>
    <p class="sub">${esc([c.nombreRaza, c.clase && c.clase.nombre, 'Nivel ' + c.nivel].filter(Boolean).join(' · '))}. Descarga tu hoja y prueba tus tiradas.</p>
    <div id="componente-hoja"></div>`;
  }
  const guiaHoja = () => '¡Lo lograste! Tu hoja está lista. Toca cualquier habilidad para lanzarla y descárgala cuando quieras.';

  P.PASOS = [
    { id: 'aprende', corto: 'Dados', vista: vistaAprende, guia: guiaAprende },
    { id: 'imagina', corto: 'Imagina', vista: vistaImagina, guia: () => 'Cuéntame qué personaje imaginas. Puede ser tan simple como «me gusta curar». Te muestro varios caminos y tú decides.' },
    { id: 'raza', corto: 'Raza', vista: vistaRaza, guia: guiaRaza },
    { id: 'clase', corto: 'Clase', vista: vistaClase, guia: guiaClase },
    { id: 'puntuaciones', corto: 'Puntos', vista: vistaPuntuaciones, guia: guiaPuntuaciones },
    { id: 'trasfondo', corto: 'Trasfondo', vista: vistaTrasfondo, guia: guiaTrasfondo },
    { id: 'equipo', corto: 'Equipo', vista: vistaEquipo, guia: guiaEquipo },
    { id: 'personalidad', corto: 'Historia', vista: vistaPersonalidad, guia: guiaPersonalidad },
    { id: 'hoja', corto: 'Tu hoja', vista: vistaHoja, guia: guiaHoja },
  ];

  /* ---------- Guía de consulta ---------- */
  P.guiaHTML = () => `
    <section class="guia-sec"><h3>Cómo se juega</h3><p>El DM describe qué pasa, tú dices qué haces y, si el resultado es dudoso, lanzas un dado.</p>
      <p><strong>La regla más importante:</strong> d20 + tu bono. Si igualas o superas el número objetivo, lo logras.</p></section>
    <section class="guia-sec"><h3>Tiradas</h3><div class="tabla"><table><thead><tr><th>Quieres</th><th>Tiras</th><th>Debes alcanzar</th></tr></thead><tbody>
      <tr><td>Hacer algo difícil</td><td>d20 + habilidad</td><td>Dificultad (CD)</td></tr><tr><td>Golpear</td><td>d20 + ataque</td><td>CA del enemigo</td></tr><tr><td>Resistir un peligro</td><td>d20 + salvación</td><td>Dificultad (CD)</td></tr></tbody></table></div>
      <p class="mt-2">Dificultad: fácil 10, media 15, difícil 20, muy difícil 25. En un ataque, sacar 20 acierta siempre y tiras el doble de dados de daño. Sacar 1 falla siempre.</p></section>
    <section class="guia-sec"><h3>Cómo funciona el combate</h3>
      <p>El combate se juega por rondas. Una ronda son unos 6 segundos dentro del juego: todos actúan una vez, por turnos.</p>
      <ol>
        <li><strong>Sorpresa.</strong> El DM decide si alguien no vio venir la pelea. Quien está sorprendido no actúa en la primera ronda.</li>
        <li><strong>Iniciativa.</strong> Todos tiran d20 + su modificador de Destreza. Se actúa de mayor a menor y ese orden se mantiene toda la pelea.</li>
        <li><strong>Turnos.</strong> Cuando llega tu número, haces tu turno. Después sigue el siguiente de la lista.</li>
        <li><strong>Fin.</strong> La pelea sigue hasta que un bando cae, huye o se rinde.</li>
      </ol></section>
    <section class="guia-sec"><h3>Qué puedes hacer en tu turno</h3>
      <div class="tabla"><table><thead><tr><th>Tienes</th><th>Sirve para</th></tr></thead><tbody>
        <tr><td>Movimiento</td><td>Caminar hasta tu velocidad, que va en pies (ft): 5 ft son una casilla del tablero. Puedes repartirlo antes y después de tu acción.</td></tr>
        <tr><td>Una acción</td><td>Lo principal de tu turno: atacar, lanzar un conjuro, correr y más.</td></tr>
        <tr><td>Acción adicional</td><td>Solo si un rasgo o conjuro te la da. No todos tienen una.</td></tr>
        <tr><td>Una reacción</td><td>Algo que haces fuera de tu turno cuando pasa algo, una vez por ronda.</td></tr>
        <tr><td>Interactuar</td><td>Un gesto rápido gratis, como desenvainar o abrir una puerta.</td></tr>
      </tbody></table></div></section>
    <section class="guia-sec"><h3>Acciones de combate</h3>
      <div class="tabla"><table><thead><tr><th>Acción</th><th>Qué hace</th></tr></thead><tbody>
        <tr><td>Atacar</td><td>Un ataque con un arma o sin ella.</td></tr>
        <tr><td>Lanzar un conjuro</td><td>Usas un conjuro que tarde una acción.</td></tr>
        <tr><td>Correr</td><td>Te mueves el doble en este turno.</td></tr>
        <tr><td>Destrabarse</td><td>Tu movimiento no provoca ataques de oportunidad este turno.</td></tr>
        <tr><td>Esquivar</td><td>Hasta tu próximo turno te atacan con desventaja y tus salvaciones de Destreza van con ventaja.</td></tr>
        <tr><td>Ayudar</td><td>Un aliado tiene ventaja en su próxima prueba o en su próximo ataque.</td></tr>
        <tr><td>Esconderse</td><td>Tiras Destreza (Sigilo) para que no te vean.</td></tr>
        <tr><td>Preparar</td><td>Dejas lista una acción para cuando pase algo concreto.</td></tr>
        <tr><td>Buscar</td><td>Dedicas el turno a encontrar algo.</td></tr>
        <tr><td>Usar un objeto</td><td>Usas algo que requiere más que un gesto rápido.</td></tr>
      </tbody></table></div></section>
    <section class="guia-sec"><h3>Cómo se resuelve un ataque</h3>
      <ol>
        <li>Tira d20 + tu bono de ataque.</li>
        <li>Si igualas o superas la CA del objetivo, aciertas.</li>
        <li>Tira el dado de daño y suma tu modificador. Esos puntos se restan de su vida.</li>
      </ol>
      <p>Si sacas 20 en el dado, es un crítico: aciertas siempre y tiras el doble de dados de daño. Si sacas 1, fallas siempre.</p>
      <p>Atacas con desventaja si disparas teniendo un enemigo a tu lado o si el objetivo está más lejos del alcance normal del arma. Si alguien sale de tu alcance sin destrabarse, puedes usar tu reacción para hacerle un ataque de oportunidad.</p>
      <p><strong>Cobertura:</strong> un obstáculo protege al objetivo. Media cobertura da +2 a su CA y tres cuartos de cobertura, +5. Con cobertura total no se le puede apuntar.</p></section>
    <section class="guia-sec"><h3>Si llegas a 0 de vida</h3>
      <p>Caes inconsciente. Al empezar cada turno tiras un d20 sin sumar nada: con 10 o más anotas un éxito y con menos, un fallo.</p>
      <p>Con 3 éxitos te estabilizas. Con 3 fallos, mueres. Si sacas 20 recuperas 1 punto de vida y despiertas; si sacas 1, cuenta como dos fallos. Recibir daño estando a 0 suma un fallo. Cualquier curación te levanta.</p>
      <p>Un aliado puede estabilizarte con una acción y una prueba de Sabiduría (Medicina) con dificultad 10.</p></section>
    <section class="guia-sec"><h3>Un turno de ejemplo</h3>
      <dl class="dialogo">
        <div><dt>DM</dt><dd>Es tu turno. El goblin está a 20 pies.</dd></div>
        <div><dt>Tú</dt><dd>Corro hasta él y le ataco con mi espada.</dd></div>
        <div><dt>DM</dt><dd>Tira para atacar.</dd></div>
        <div><dt>Tú</dt><dd>Saqué 12 y tengo +5. Son 17.</dd></div>
        <div><dt>DM</dt><dd>Su CA es 15, le das. Tira el daño.</dd></div>
        <div><dt>Tú</dt><dd>1d8 + 3 me da 8.</dd></div>
        <div><dt>DM</dt><dd>El goblin cae. Sigue el siguiente turno.</dd></div>
      </dl></section>
    <section class="guia-sec"><h3>Si tu mesa usa la hoja clásica</h3><p>Esta es su forma, con cada casilla en español y en inglés.</p>
      <div class="esquema-hoja" role="img" aria-label="Esquema de la hoja clásica: arriba los datos del personaje, a la izquierda características y habilidades, al centro defensa, vida y ataques, y a la derecha personalidad y rasgos.">
        <div class="ancho"><b>Datos</b> Name, Class &amp; Level, Race, Background</div>
        <div><b>Características</b> Strength…Charisma</div><div><b>CA, iniciativa, velocidad</b> Armor Class, Initiative, Speed</div><div><b>Personalidad</b> Traits, Ideals, Bonds, Flaws</div>
        <div><b>Habilidades</b> Skills, Saving Throws</div><div><b>Vida</b> Hit Points, Hit Dice, Death Saves</div><div><b>Rasgos</b> Features &amp; Traits</div>
        <div><b>Idiomas</b> Proficiencies &amp; Languages</div><div><b>Ataques</b> Attacks &amp; Spellcasting</div><div><b>Equipo</b> Equipment</div>
      </div></section>
    <section class="guia-sec"><h3>Dado de golpe por clase</h3><div class="tabla"><table><thead><tr><th>Dado</th><th>Número fijo</th><th>Clases</th></tr></thead><tbody>
      ${[6, 8, 10, 12].map((d) => `<tr><td>d${d}</td><td>${P.DADO_FIJO[d]}</td><td>${P.CLASES.filter((c) => c.d === d).map((c) => c.nombre).join(', ')}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="guia-sec"><h3>Experiencia por nivel</h3><div class="tabla"><table><thead><tr><th>Nivel</th><th>PX</th><th>Competencia</th></tr></thead><tbody>
      ${P.PX.slice(0, 10).map((px, i) => `<tr><td>${i + 1}</td><td>${px.toLocaleString('es')}</td><td>${P.signo(P.competencia(i + 1))}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="guia-sec"><h3>Descansar</h3><p><strong>Corto (1 hora):</strong> gastas dados de golpe para curarte. <strong>Largo (8 horas):</strong> recuperas toda tu vida, tus espacios de conjuro y la mitad de tus dados de golpe.</p></section>
    <section class="guia-sec"><h3>Glosario</h3><div class="tabla"><table><thead><tr><th>Español</th><th>Inglés</th><th>Qué es</th></tr></thead><tbody>
      ${P.GLOSARIO.map((g) => `<tr><td>${esc(g[0])}</td><td>${esc(g[1])}</td><td>${esc(g[2])}</td></tr>`).join('')}</tbody></table></div></section>`;
})(window.PJ);
