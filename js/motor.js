/* Motor de reglas: de las decisiones del jugador a los números de la hoja. Sin DOM, se prueba con Node. */
(function (P) {
  const IDS = ['fue', 'des', 'con', 'int', 'sab', 'car'];
  const vacioCar = (v) => Object.fromEntries(IDS.map((k) => [k, v]));

  P.pjVacio = () => ({
    v: 1, nombre: '', jugador: '', razaId: null, subrazaId: null, eligeCar: [], habRaza: [],
    claseId: null, habClase: [], opcionId: null, pericia: [], metodo: 'matriz', base: vacioCar(null), tiradas: [],
    trasfondoId: null, habExtra: [], kitId: null, trucos: [], conjuros: [],
    alineamiento: '', rasgo: '', ideal: '', vinculo: '', defecto: '', idiomas: '', notas: '',
    nivel: 1, ganadosPG: [], mejoras: [], px: 0, prioridades: [], concepto: '', equipoElegido: {}, retrato: '', retratoMini: '',
  });

  P.mod = (s) => Math.floor((s - 10) / 2);
  P.signo = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
  P.competencia = (nivel) => Math.ceil(nivel / 4) + 1;

  P.nivelesDeMejora = (claseId) => P.NIVELES_MEJORA.concat(P.MEJORAS_EXTRA[claseId] || []).sort((a, b) => a - b);

  P.sugerirReparto = (clase) => Object.assign({}, clase.reparto);

  // Un renglón por cada número disponible, repetidos incluidos, y a qué característica está asignado
  P.opcionesPuntuacion = function (valores, base, car) {
    const filas = valores.map((valor) => ({ valor, de: null }));
    [car].concat(IDS.filter((k) => k !== car)).forEach((k) => {
      const libre = filas.find((f) => f.valor === base[k] && !f.de);
      if (libre) libre.de = k;
    });
    return filas.sort((a, b) => b.valor - a.valor || Number(!!a.de) - Number(!!b.de));
  };

  // Pone un número en una característica. Si ese número estaba en otra, las dos se intercambian.
  P.asignarPuntuacion = function (base, car, valor, de) {
    const nueva = Object.assign({}, base);
    if (de && de !== car) nueva[de] = base[car];
    nueva[car] = valor;
    return nueva;
  };

  /* ---------- Equipo: de las opciones elegidas a lo que lleva el personaje ---------- */
  const elecciones = (clase, pj) => Object.assign({}, (P.KITS_ANTIGUOS[clase.id] || {})[pj.kitId], pj.equipoElegido);
  // Grupos de opciones de la clase, sin las que no permite su dominio
  P.opcionesEquipo = (clase, pj) => clase.equipo.map((g) => Object.assign({}, g, { op: g.op.filter((o) => !o.requiere || o.requiere.includes(pj.opcionId)) }));
  P.opcionElegida = (grupo, elegido) => grupo.op.find((o) => o.id === elegido[grupo.id]) || grupo.op[0];
  // Armas libres por elegir con las opciones actuales. La clave identifica cada ranura, como «armas.0».
  P.ranurasEquipo = function (clase, pj, elegido = elecciones(clase, pj)) {
    const res = [];
    const de = (o, id) => (o.elige || []).forEach(([lista, defecto], i) => res.push({ clave: id + '.' + i, lista, defecto, titulo: o.eligeT || o.t }));
    P.opcionesEquipo(clase, pj).forEach((g) => de(P.opcionElegida(g, elegido), g.id));
    de(clase.fijo, 'fijo');
    return res;
  };
  P.resolverEquipo = function (clase, pj) {
    const elegido = elecciones(clase, pj);
    const kit = { armadura: null, escudo: false, armas: [], otros: [], elegido };
    const ranuras = P.ranurasEquipo(clase, pj, elegido);
    const sumar = (o, id) => {
      if (o.armadura) kit.armadura = o.armadura;
      if (o.escudo) kit.escudo = true;
      kit.armas.push(...(o.armas || []));
      ranuras.filter((r) => r.clave.startsWith(id + '.')).forEach((r) => {
        const pedida = elegido[r.clave];
        kit.armas.push(P.armasDe(r.lista).some((a) => a.id === pedida) ? pedida : r.defecto);
      });
      kit.otros.push(...(o.otros || []));
    };
    P.opcionesEquipo(clase, pj).forEach((g) => sumar(P.opcionElegida(g, elegido), g.id));
    sumar(clase.fijo, 'fijo');
    kit.armas = [...new Set(kit.armas)];
    return kit;
  };

  // Cuántos conjuros de nivel 1 elige la clase al crearse
  P.conjurosPermitidos = (clase, modMagia, nivel = 1) => {
    if (!clase.magia || clase.magia.desdeNivel > nivel) return 0;
    if (clase.magia.prepara) return Math.max(1, modMagia + nivel);
    return clase.magia.conocidos || 0;
  };

  P.calcular = function (pj) {
    const raza = P.buscar(P.RAZAS, pj.razaId);
    const subraza = raza && raza.subrazas ? P.buscar(raza.subrazas, pj.subrazaId) : null;
    const clase = P.buscar(P.CLASES, pj.claseId);
    const trasfondo = P.buscar(P.TRASFONDOS, pj.trasfondoId);
    const nivel = Math.min(20, Math.max(1, pj.nivel || 1));
    const comp = P.competencia(nivel);
    const avisos = [];

    // Características
    const caract = {};
    IDS.forEach((k) => {
      const base = pj.base[k];
      let bono = (raza && raza.bonos[k]) || 0;
      if (subraza && subraza.bonos[k]) bono += subraza.bonos[k];
      if (raza && raza.eligeCar && (pj.eligeCar || []).includes(k)) bono += 1;
      let mejora = 0;
      (pj.mejoras || []).forEach((m) => { mejora += m[k] || 0; });
      const total = base === null || base === undefined ? null : Math.min(20, base + bono + mejora);
      caract[k] = { base, bono, mejora, total, mod: total === null ? null : P.mod(total) };
    });
    const mod = (k) => (caract[k].mod === null ? 0 : caract[k].mod);
    const hayPuntuaciones = IDS.every((k) => caract[k].total !== null);

    // Habilidades con competencia
    const propias = new Set();
    const repetidas = [];
    const sumar = (id) => { if (propias.has(id)) repetidas.push(id); propias.add(id); };
    (raza && raza.habilidades || []).forEach(sumar);
    (pj.habRaza || []).forEach(sumar);
    (pj.habClase || []).forEach(sumar);
    (trasfondo ? trasfondo.hab : []).forEach(sumar);
    (pj.habExtra || []).forEach((id) => propias.add(id));
    const faltanPorRepetidas = Math.max(0, repetidas.length - (pj.habExtra || []).length);

    const habilidades = P.HABILIDADES.map((h) => {
      const tiene = propias.has(h.id);
      const pericia = (pj.pericia || []).includes(h.id);
      return { id: h.id, nombre: h.nombre, car: h.car, comp: tiene, pericia, bono: mod(h.car) + (tiene ? comp : 0) + (pericia && tiene ? comp : 0) };
    });
    const percepcion = habilidades.find((h) => h.id === 'percepcion');

    const salvaciones = {};
    IDS.forEach((k) => {
      const tiene = !!(clase && clase.salv.includes(k));
      salvaciones[k] = { comp: tiene, bono: mod(k) + (tiene ? comp : 0) };
    });

    // Vida
    let pgMax = null;
    if (clase && caract.con.total !== null) {
      const extra = ((subraza && subraza.pgPorNivel) || 0) + (pj.opcionId === 'draconico' ? 1 : 0);
      pgMax = Math.max(1, clase.d + mod('con')) + extra;
      (pj.ganadosPG || []).forEach((g) => { pgMax += Math.max(1, g + mod('con')) + extra; });
    }

    // Equipo y CA
    const kit = clase ? P.resolverEquipo(clase, pj) : null;
    const armadura = kit && kit.armadura ? P.ARMADURAS[kit.armadura] : null;
    const escudo = !!(kit && kit.escudo);
    const ca = { valor: null, detalle: '' };
    if (clase && caract.des.total !== null) {
      const des = mod('des');
      const partes = [];
      let v;
      if (armadura) {
        const d = armadura.desMax === undefined ? des : Math.min(des, armadura.desMax);
        v = armadura.base + d;
        partes.push(armadura.nombre + ' ' + armadura.base);
        if (d) partes.push('DES ' + P.signo(d));
      } else if (clase.id === 'barbaro') {
        v = 10 + des + mod('con'); partes.push('10', 'DES ' + P.signo(des), 'CON ' + P.signo(mod('con')));
      } else if (clase.id === 'monje') {
        v = 10 + des + mod('sab'); partes.push('10', 'DES ' + P.signo(des), 'SAB ' + P.signo(mod('sab')));
      } else if (pj.opcionId === 'draconico') {
        v = 13 + des; partes.push('Piel dracónica 13', 'DES ' + P.signo(des));
      } else {
        v = 10 + des; partes.push('10', 'DES ' + P.signo(des));
      }
      if (escudo) { v += 2; partes.push('escudo +2'); }
      if (pj.opcionId === 'defensa' && armadura) { v += 1; partes.push('Defensa +1'); }
      ca.valor = v; ca.detalle = partes.join(' + ').replace(/\+ DES −/g, '− DES ').replace(/\+ CON −/g, '− CON ').replace(/\+ SAB −/g, '− SAB ');
    }

    // Velocidad
    let velocidad = raza ? ((subraza && subraza.velocidad) || raza.velocidad) : null;
    if (armadura && armadura.fue && caract.fue.total !== null && caract.fue.total < armadura.fue && !(raza && raza.sinFrenoArmadura)) {
      velocidad -= 10;
      avisos.push(armadura.nombre + ' necesita FUE ' + armadura.fue + ': caminas 10 ft menos.');
    }

    // Ataques
    const ataques = [];
    if (kit && hayPuntuaciones) {
      kit.armas.forEach((id) => {
        const a = P.ARMAS[id];
        const dist = !!a.distancia;
        const m = dist ? mod('des') : a.sutil ? Math.max(mod('fue'), mod('des')) : mod('fue');
        let acierta = m + comp;
        let dano = m;
        const notas = [];
        if (pj.opcionId === 'arqueria' && dist) { acierta += 2; notas.push('Arquería'); }
        if (pj.opcionId === 'duelo' && !dist && !a.dosManos) { dano += 2; notas.push('Duelo'); }
        if (a.distancia) notas.push(a.distancia);
        if (a.lanzar) notas.push('Se lanza ' + a.lanzar);
        if (a.nota) notas.push(a.nota);
        ataques.push({ id, nombre: a.nombre, acierta, dado: a.dado, bonoDano: dano, tipo: a.tipo, notas: notas.join(' · ') });
      });
      if (clase.id === 'monje') {
        const m = Math.max(mod('fue'), mod('des'));
        ataques.unshift({ id: 'puno', nombre: 'Golpe sin armas', acierta: m + comp, dado: '1d4', bonoDano: m, tipo: 'contundente', notas: 'Artes marciales' });
      }
    }

    // Magia
    let magia = null;
    if (clase && clase.magia && nivel >= (clase.magia.desdeNivel || 1)) {
      const m = mod(clase.magia.car);
      const fila = (P.ESPACIOS[clase.magia.tipo] || [])[nivel - 1] || [];
      const trucos = (pj.trucos || []).map((id) => P.buscar(P.CONJUROS, id)).filter(Boolean);
      const conjuros = (pj.conjuros || []).map((id) => P.buscar(P.CONJUROS, id)).filter(Boolean);
      magia = { car: clase.magia.car, cd: 8 + comp + m, ataque: comp + m, espacios: fila, trucos, conjuros, permitidos: { trucos: clase.magia.trucos || 0, conjuros: P.conjurosPermitidos(clase, m, nivel) } };
      if (hayPuntuaciones) {
        trucos.filter((t) => t.ataque).forEach((t) => {
          if (t.ataque.modo === 'ataque') ataques.push({ id: t.id, nombre: t.nombre, acierta: comp + m, dado: t.ataque.dado, bonoDano: 0, tipo: t.ataque.tipo, notas: 'Truco' });
          else ataques.push({ id: t.id, nombre: t.nombre, salvacion: t.ataque.car, cd: 8 + comp + m, dado: t.ataque.dado, bonoDano: 0, tipo: t.ataque.tipo, notas: 'El enemigo tira salvación de ' + t.ataque.car.toUpperCase() });
        });
      }
    }

    // Rasgos para la hoja
    const rasgos = [];
    (raza ? raza.rasgos : []).forEach((r) => rasgos.push({ n: r.n, d: r.d, de: 'raza' }));
    (subraza ? subraza.rasgos : []).forEach((r) => rasgos.push({ n: r.n, d: r.d, de: 'raza' }));
    (clase ? clase.rasgos : []).forEach((r) => rasgos.push({ n: r.n, d: r.d, de: 'clase' }));
    if (clase && clase.opcion && pj.opcionId) {
      const o = P.buscar(clase.opcion.lista, pj.opcionId);
      if (o) { const t = clase.opcion.titulo.replace(/^Tu /, ''); rasgos.push({ n: t.charAt(0).toUpperCase() + t.slice(1) + ': ' + o.nombre, d: o.d, de: 'clase' }); }
    }
    if (clase) clase.progreso.slice(0, nivel - 1).forEach((linea, i) => {
      if (/^Mejora de característica$/.test(linea)) return;
      rasgos.push({ n: 'Nivel ' + (i + 2), d: linea, de: 'clase' });
    });

    // Competencias, idiomas y mochila
    const idiomas = (raza ? raza.idiomas : []).concat(pj.idiomas ? [pj.idiomas] : []);
    const equipo = [];
    if (kit) {
      if (armadura) equipo.push(armadura.nombre);
      if (escudo) equipo.push('Escudo');
      // «2 hachas de mano» ya cuenta como hacha de mano: no se lista dos veces
      const base = (s) => s.toLowerCase().replace(/^\d+ /, '').replace(/s( |$)/g, '$1');
      kit.armas.forEach((id) => { const n = P.ARMAS[id].nombre; if (!kit.otros.some((o) => base(o) === base(n))) equipo.push(n); });
      equipo.push(...kit.otros);
    }
    if (trasfondo) equipo.push(...trasfondo.equipo);
    const oro = trasfondo ? trasfondo.oro : 0;

    const nombreRaza = subraza ? subraza.nombre : raza ? raza.nombre : '';

    return { raza, subraza, clase, trasfondo, kit, nivel, comp, caract, hayPuntuaciones, habilidades, salvaciones, repetidas, faltanPorRepetidas,
      percepcionPasiva: 10 + (percepcion ? percepcion.bono : 0), iniciativa: mod('des'), velocidad, pgMax, dadosGolpe: clase ? nivel + 'd' + clase.d : '', ca, ataques, magia, rasgos, idiomas, equipo, oro, avisos, nombreRaza, armadura, escudo };
  };

  // Qué falta para terminar cada paso: la app lo convierte en mensajes claros
  P.pendientes = function (pj, paso) {
    const c = P.calcular(pj), f = [];
    if (paso === 'raza') {
      if (!c.raza) f.push('Elige una raza.');
      else {
        if (c.raza.subrazas && !c.subraza) f.push('Elige una subraza.');
        if (c.raza.eligeCar && (pj.eligeCar || []).length < c.raza.eligeCar) f.push('Elige ' + c.raza.eligeCar + ' características para tu +1.');
        if (c.raza.eligeHabilidades && (pj.habRaza || []).length < c.raza.eligeHabilidades) f.push('Elige ' + c.raza.eligeHabilidades + ' habilidades.');
      }
    }
    if (paso === 'clase') {
      if (!c.clase) f.push('Elige una clase.');
      else {
        if ((pj.habClase || []).length < c.clase.nHab) f.push('Elige ' + c.clase.nHab + ' habilidades de tu clase.');
        if (c.clase.opcion && !pj.opcionId) f.push('Elige ' + c.clase.opcion.titulo.toLowerCase() + '.');
        if (c.clase.pericia && (pj.pericia || []).length < c.clase.pericia) f.push('Elige ' + c.clase.pericia + ' habilidades para tu pericia.');
      }
    }
    if (paso === 'puntuaciones' && !c.hayPuntuaciones) f.push('Reparte un número en cada característica.');
    if (paso === 'trasfondo') {
      if (!c.trasfondo) f.push('Elige un trasfondo.');
      else if (c.faltanPorRepetidas) f.push('Tienes una habilidad repetida: elige otra para reemplazarla.');
    }
    if (paso === 'equipo' && c.magia) {
      if ((pj.trucos || []).length < c.magia.permitidos.trucos) f.push('Elige ' + c.magia.permitidos.trucos + ' trucos.');
      if ((pj.conjuros || []).length < c.magia.permitidos.conjuros) f.push('Elige ' + c.magia.permitidos.conjuros + ' conjuros.');
    }
    if (paso === 'personalidad' && !pj.nombre.trim()) f.push('Escribe el nombre de tu personaje.');
    return f;
  };

  // Paquete corto para el enlace del QR: solo decisiones, los números se recalculan al abrir
  const CAMPOS = ['nombre', 'jugador', 'razaId', 'subrazaId', 'eligeCar', 'habRaza', 'claseId', 'habClase', 'opcionId', 'pericia', 'base', 'trasfondoId', 'habExtra', 'kitId', 'trucos', 'conjuros', 'alineamiento', 'rasgo', 'ideal', 'vinculo', 'defecto', 'idiomas', 'notas', 'nivel', 'ganadosPG', 'mejoras', 'px', 'equipoElegido'];
  P.aPaquete = (pj) => CAMPOS.map((k) => (k === 'base' ? IDS.map((c) => pj.base[c]) : pj[k]));
  P.dePaquete = (lista) => {
    const pj = P.pjVacio();
    CAMPOS.forEach((k, i) => {
      if (lista[i] === undefined || lista[i] === null) return;
      if (k === 'base') IDS.forEach((c, j) => { pj.base[c] = lista[i][j]; });
      else pj[k] = lista[i];
    });
    return pj;
  };

  P.brenna = () => Object.assign(P.pjVacio(), {
    nombre: 'Brenna Puñohierro', jugador: 'Ejemplo', razaId: 'enano', subrazaId: 'montanas', claseId: 'guerrero', habClase: ['percepcion', 'perspicacia'], opcionId: 'defensa', kitId: 'escudo',
    base: { fue: 15, des: 12, con: 14, int: 8, sab: 13, car: 10 }, trasfondoId: 'soldado', alineamiento: 'Legal bueno',
    rasgo: 'Hablo poco y nunca retrocedo.', ideal: 'Proteger a los míos.', vinculo: 'Busco a mi hermano, perdido en una mina.', defecto: 'Soy terca y me cuesta pedir ayuda.',
  });
})(window.PJ);
