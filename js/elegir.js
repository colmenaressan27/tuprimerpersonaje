/* «Elegir por mí»: la mejor opción según la clase, la raza, el trasfondo y lo que imaginaste. Sin DOM, se prueba con Node.
   La IA opcional (ia.js) elige entre estas mismas opciones y su respuesta se valida aquí. */
(function (P) {
  const IDS = P.CARACT.map((a) => a.id);
  const PESOS = [12, 8, 6, 4, 2, 1]; // de la característica más importante de la clase a la menos importante
  const nombreCar = (k) => P.buscar(P.CARACT, k).nombre;

  // Gustos que orientan la elección y cuánto pesan: lo escrito manda, luego la opción de clase y al final la clase
  function contexto(pj) {
    const pesos = new Map();
    const sumar = (g, p) => { if (P.GUSTOS[g]) pesos.set(g, Math.max(pesos.get(g) || 0, p)); };
    const clase = P.buscar(P.CLASES, pj.claseId);
    if (clase) clase.tags.forEach((g) => sumar(g, 0.5));
    sumar(P.GUSTO_OPCION[pj.opcionId], 2);
    const escritos = P.leerGustos(pj.concepto).gustos;
    escritos.forEach((g) => sumar(g, 3));
    return { pesos: [...pesos.entries()], escritos };
  }
  const motivo = (escritos, lista) => {
    const hit = escritos.filter((g) => lista(P.GUSTOS[g]));
    return hit.length ? P.GUSTOS[hit[0]].etiqueta : '';
  };

  /* ---------- Reparto de puntuaciones ---------- */
  function pesosReparto(pj, ctx) {
    const cl = P.buscar(P.CLASES, pj.claseId);
    const orden = Object.keys(cl.reparto).sort((a, b) => cl.reparto[b] - cl.reparto[a]);
    const p = Object.fromEntries(orden.map((k, i) => [k, PESOS[i]]));
    // Un guerrero con arco vive de la Destreza, no de la Fuerza
    const arma = P.ARMAS[P.resolverEquipo(cl, pj).armas[0]];
    if (cl.id === 'guerrero' && (pj.opcionId === 'arqueria' || (arma && arma.distancia) || ctx.escritos.includes('distancia'))) [p.fue, p.des] = [p.des, p.fue];
    ctx.pesos.forEach(([g, peso]) => (P.GUSTOS[g].car || []).forEach((k) => { p[k] += peso / 2; }));
    (pj.prioridades || []).forEach((k) => { p[k] += 8; });
    return p;
  }

  // Todas las formas distintas de repartir los números: los repetidos no generan copias
  function permutaciones(valores) {
    if (valores.length < 2) return [valores];
    const res = [];
    [...new Set(valores)].forEach((v) => {
      const resto = valores.slice();
      resto.splice(resto.indexOf(v), 1);
      permutaciones(resto).forEach((p) => res.push([v].concat(p)));
    });
    return res;
  }

  // Las dos características de las que más vive el personaje, de la más a la menos importante
  const principales = (pj) => {
    const pesos = pesosReparto(pj, contexto(pj));
    return IDS.slice().sort((a, b) => pesos[b] - pesos[a]).slice(0, 2);
  };

  function repartoLocal(pj, valores) {
    const ctx = contexto(pj), pesos = pesosReparto(pj, ctx);
    const c = P.calcular(pj);
    // Lo más alto va siempre a lo que define la clase. Solo los otros cuatro números se ajustan a los bonos de raza.
    const orden = valores.slice().sort((a, b) => b - a);
    const [primera, segunda] = principales(pj);
    const resto = IDS.filter((k) => k !== primera && k !== segunda);
    const puntaje = (base) => {
      let s = 0;
      IDS.forEach((k) => {
        const total = Math.min(20, base[k] + c.caract[k].bono + c.caract[k].mejora);
        s += pesos[k] * (P.mod(total) + total * 0.01);
      });
      const frena = c.armadura && c.armadura.fue && !(c.raza && c.raza.sinFrenoArmadura) && base.fue + c.caract.fue.bono + c.caract.fue.mejora < c.armadura.fue;
      return frena ? s - 3 : s;
    };
    let mejor = null, nota = -Infinity;
    permutaciones(orden.slice(2)).forEach((v) => {
      const base = Object.assign({ [primera]: orden[0], [segunda]: orden[1] }, Object.fromEntries(resto.map((k, i) => [k, v[i]])));
      const n = puntaje(base);
      if (n > nota) { nota = n; mejor = base; }
    });
    const extra = motivo(ctx.escritos, (g) => g.car && g.car.some((k) => k === primera || k === segunda));
    return { base: mejor, por: `Tu ${orden[0]} va a ${nombreCar(primera)} y tu ${orden[1]} a ${nombreCar(segunda)}: es lo que más necesita tu clase${extra ? ' y encaja con ' + extra : ''}. El resto aprovecha tus bonos de raza.` };
  }

  /* ---------- Habilidades ---------- */
  function opcionesHab(pj) {
    const c = P.calcular(pj), cl = c.clase;
    const fijas = new Set([...(c.raza && c.raza.habilidades || []), ...(pj.habRaza || [])]);
    const lista = (cl.hab === 'todas' ? P.HABILIDADES.map((h) => h.id) : cl.hab).filter((h) => !fijas.has(h));
    // Si el trasfondo ya la da, elegirla sería desperdiciarla, salvo que no queden suficientes
    const sinFondo = lista.filter((h) => !(c.trasfondo && c.trasfondo.hab.includes(h)));
    return { lista: sinFondo.length >= cl.nHab ? sinFondo : lista, n: cl.nHab, nPericia: cl.pericia || 0 };
  }

  function habilidadesLocal(pj) {
    const ctx = contexto(pj), c = P.calcular(pj), cl = c.clase, firma = P.FIRMA[cl.id].hab;
    const { lista, n, nPericia } = opcionesHab(pj);
    const modDe = (k) => (c.caract[k].mod === null ? P.mod(cl.reparto[k]) : c.caract[k].mod);
    const puntos = (id) => {
      const i = firma.indexOf(id);
      let p = modDe(P.buscar(P.HABILIDADES, id).car) + (i < 0 ? 0 : (firma.length - i) * 0.5);
      ctx.pesos.forEach(([g, peso]) => { if ((P.GUSTOS[g].hab || []).includes(id)) p += peso; });
      return p;
    };
    const orden = lista.slice().sort((a, b) => puntos(b) - puntos(a));
    const habClase = orden.slice(0, n);
    const extra = motivo(ctx.escritos, (g) => (g.hab || []).some((h) => habClase.includes(h)));
    return { habClase, pericia: habClase.slice(0, nPericia), por: `Elegí ${P.unir(habClase.map(P.nombreHab))}: ${extra ? 'encajan con ' + extra + ' y con tu clase' : 'son las que mejor aprovechan tu clase y tus puntuaciones'}.` };
  }

  /* ---------- Trucos y conjuros ---------- */
  function opcionesMagia(pj) {
    const c = P.calcular(pj), id = c.clase.id;
    const de = (n) => P.CONJUROS.filter((s) => s.nivel === n && s.clases.includes(id));
    return { trucos: de(0), conjuros: de(1), nTrucos: c.magia.permitidos.trucos, nConjuros: c.magia.permitidos.conjuros };
  }

  function magiaLocal(pj) {
    const ctx = contexto(pj), firma = P.FIRMA[pj.claseId].magia;
    const { trucos, conjuros, nTrucos, nConjuros } = opcionesMagia(pj);
    const puntos = (s, ya) => {
      const i = firma.indexOf(s.id);
      let p = i < 0 ? 0 : ((firma.length - i) / firma.length) * 2;
      ctx.pesos.forEach(([g, peso]) => { if ((P.GUSTOS[g].conjuros || []).includes(s.id)) p += peso; });
      // Un truco de ataque es casi obligatorio; el segundo ya aporta menos que algo distinto
      if (s.ataque) p += ya.some((x) => x.ataque) ? -1 : 3;
      return p;
    };
    const tomar = (lista, n) => {
      const res = [], resto = lista.slice();
      while (res.length < n && resto.length) {
        resto.sort((a, b) => puntos(b, res) - puntos(a, res));
        res.push(resto.shift());
      }
      return res;
    };
    const t = tomar(trucos, nTrucos), k = tomar(conjuros, nConjuros);
    const extra = motivo(ctx.escritos, (g) => (g.conjuros || []).some((s) => t.concat(k).some((x) => x.id === s)));
    return { trucos: t.map((s) => s.id), conjuros: k.map((s) => s.id), por: `Elegí ${P.unir(k.map((s) => s.nombre))} y un truco de ataque si tu clase lo tiene${extra ? ': encajan con ' + extra : ''}.` };
  }

  /* ---------- Equipo ---------- */
  const promedio = (dado) => { const m = dado.match(/(\d+)d(\d+)/); return (+m[1] * (+m[2] + 1)) / 2; };

  // Prueba cada combinación de opciones y se queda con la que mejor combina defensa y daño para este personaje
  function equipoLocal(pj) {
    const ctx = contexto(pj), cl = P.buscar(P.CLASES, pj.claseId);
    const conBase = P.calcular(pj).hayPuntuaciones ? pj : Object.assign({}, pj, { base: Object.assign({}, cl.reparto) });
    const c0 = P.calcular(conBase);
    const quiere = (g) => ((ctx.pesos.find(([x]) => x === g) || [])[1] || 0);
    const modDe = (k) => c0.caract[k].mod;
    const valorArma = (a) => promedio(a.dado) + (a.distancia ? modDe('des') : a.sutil ? Math.max(modDe('fue'), modDe('des')) : modDe('fue')) * 2 + (a.distancia ? quiere('distancia') * 2 : 0);
    const rellenar = (e) => {
      P.ranurasEquipo(cl, pj, e).forEach((r) => {
        const usadas = Object.values(e);
        e[r.clave] = P.armasDe(r.lista).filter((a) => !usadas.includes(a.id)).sort((x, y) => valorArma(y) - valorArma(x))[0].id;
      });
      return e;
    };
    let combos = [{}];
    P.opcionesEquipo(cl, pj).forEach((g) => { combos = combos.flatMap((e) => g.op.map((o) => Object.assign({}, e, { [g.id]: o.id }))); });
    const puntaje = (e) => {
      const c = P.calcular(Object.assign({}, conBase, { kitId: null, equipoElegido: e }));
      const armas = c.ataques.filter((a) => P.ARMAS[a.id]);
      const mejor = Math.max(0, ...armas.map((a) => promedio(a.dado) + a.bonoDano + a.acierta / 2));
      const lejos = armas.some((a) => P.ARMAS[a.id].distancia || P.ARMAS[a.id].lanzar);
      const ruidosa = c.armadura && c.armadura.fue ? quiere('sombras') * 2 : 0; // la armadura pesada delata al sigiloso
      return (c.ca.valor || 10) * (2 + quiere('aguantar') / 2) + mejor * 1.5 + (lejos ? 2 : 0) - c.avisos.length * 5 - ruidosa;
    };
    let mejor = null, nota = -Infinity;
    combos.map(rellenar).forEach((e) => { const n = puntaje(e); if (n > nota) { nota = n; mejor = e; } });
    const c = P.calcular(Object.assign({}, conBase, { kitId: null, equipoElegido: mejor }));
    const armas = c.kit.armas.map((id) => P.ARMAS[id].nombre);
    const extra = motivo(ctx.escritos, (g) => g.car && g.car.some((k) => k === 'des' || k === 'fue' || k === 'con'));
    return { equipoElegido: mejor, por: `Elegí ${P.unir(armas)}${c.armadura ? ' y ' + c.armadura.nombre.toLowerCase() : ''}: es lo que mejor combina defensa y daño con tus puntuaciones${extra ? ' y encaja con ' + extra : ''}.` };
  }

  /* ---------- Validación de lo que proponga la IA: si no cumple, devuelve null ---------- */
  const validar = {
    reparto(r, pj, valores) {
      const base = Object.fromEntries(IDS.map((k) => [k, Number(r[k])]));
      const orden = (l) => l.slice().sort((a, b) => a - b).join();
      if (orden(IDS.map((k) => base[k])) !== orden(valores)) return null;
      // Gemini tampoco puede dejar sin el número más alto a lo que define la clase
      return base[principales(pj)[0]] === Math.max(...valores) ? { base, por: String(r.por || '').slice(0, 240) } : null;
    },
    habilidades(r, pj) {
      const { lista, n, nPericia } = opcionesHab(pj);
      const habClase = [...new Set(r.habilidades || [])].filter((h) => lista.includes(h));
      if (habClase.length !== n) return null;
      const pedidas = [...new Set(r.pericia || [])].filter((h) => habClase.includes(h));
      const pericia = pedidas.concat(habClase.filter((h) => !pedidas.includes(h))).slice(0, nPericia);
      return { habClase, pericia, por: String(r.por || '').slice(0, 240) };
    },
    magia(r, pj) {
      const { trucos, conjuros, nTrucos, nConjuros } = opcionesMagia(pj);
      const filtrar = (ids, lista) => [...new Set(ids || [])].filter((id) => lista.some((s) => s.id === id));
      const t = filtrar(r.trucos, trucos), k = filtrar(r.conjuros, conjuros);
      return t.length === nTrucos && k.length === nConjuros ? { trucos: t, conjuros: k, por: String(r.por || '').slice(0, 240) } : null;
    },
    equipo(r, pj) {
      const cl = P.buscar(P.CLASES, pj.claseId), grupos = P.opcionesEquipo(cl, pj), e = {};
      (r.elecciones || []).forEach((x) => { const g = grupos.find((y) => y.id === x.grupo); if (g && g.op.some((o) => o.id === x.opcion)) e[g.id] = x.opcion; });
      if (grupos.some((g) => !e[g.id])) return null;
      const ranuras = P.ranurasEquipo(cl, pj, e);
      (r.armas || []).forEach((x) => { const s = ranuras.find((y) => y.clave === x.ranura); if (s && P.armasDe(s.lista).some((a) => a.id === x.arma)) e[s.clave] = x.arma; });
      return { equipoElegido: e, por: String(r.por || '').slice(0, 240) };
    },
    sugerir(r, pj, campo) {
      const texto = String(r.texto || '').trim().slice(0, campo === 'nombre' ? 40 : 120);
      return texto ? { texto, por: String(r.por || '').slice(0, 240) } : null;
    },
  };

  P.elegir = { reparto: repartoLocal, habilidades: habilidadesLocal, magia: magiaLocal, equipo: equipoLocal, opcionesHab, opcionesMagia, principales, validar };
})(window.PJ);
