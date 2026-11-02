// Pruebas del motor de reglas y del intérprete. Ejecutar: node pruebas/motor.prueba.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
global.window = {};
['datos.js', 'motor.js', 'guardados.js', 'interprete.js', 'elegir.js', 'ia.js', 'srd-conjuros.js', 'srd-dm.js', 'dm.js'].forEach((f) => {
  const ruta = path.join(__dirname, '..', 'js', f);
  if (fs.existsSync(ruta)) (0, eval)(fs.readFileSync(ruta, 'utf8'));
});
const P = window.PJ;
let n = 0;
let cola = Promise.resolve();
// Las pruebas asíncronas van en fila: varias simulan fetch y se pisarían
const prueba = (nombre, fn) => {
  const listo = () => { n++; console.log('✓', nombre); };
  if (fn.constructor.name === 'AsyncFunction') { cola = cola.then(fn).then(listo); return; }
  fn(); listo();
};

prueba('datos completos', () => {
  assert.equal(P.RAZAS.length, 9);
  assert.equal(P.CLASES.length, 12);
  assert.equal(P.HABILIDADES.length, 18);
  assert.equal(P.TRASFONDOS.length, 13);
  P.CLASES.forEach((c) => {
    assert.equal(Object.values(c.reparto).sort((a, b) => b - a).join(), '15,14,13,12,10,8', c.id);
    if (c.hab !== 'todas') assert.ok(c.hab.length >= c.nHab, c.id);
    c.equipo.forEach((g) => g.op.forEach((o) => {
      (o.armas || []).forEach((a) => assert.ok(P.ARMAS[a], a));
      if (o.armadura) assert.ok(P.ARMADURAS[o.armadura], o.armadura);
      (o.elige || []).forEach(([l, d]) => assert.ok(P.armasDe(l).some((a) => a.id === d), c.id + ' ' + d));
    }));
    assert.ok(P.resolverEquipo(c, P.pjVacio()).armas.length > 0, c.id);
    assert.equal(c.progreso.length, 4, c.id);
    if (c.magia && !c.magia.desdeNivel) {
      const t = P.CONJUROS.filter((s) => s.nivel === 0 && s.clases.includes(c.id)).length;
      const k = P.CONJUROS.filter((s) => s.nivel === 1 && s.clases.includes(c.id)).length;
      assert.ok(t >= c.magia.trucos, c.id + ' trucos ' + t);
      assert.ok(k >= (c.magia.conocidos || 6), c.id + ' conjuros ' + k);
    }
  });
  assert.equal(P.PX.length, 20);
  Object.values(P.ESPACIOS).forEach((t) => assert.equal(t.length, 20));
});

prueba('gustos y firmas apuntan a datos que existen', () => {
  Object.entries(P.GUSTOS).forEach(([id, g]) => {
    assert.ok(g.etiqueta, id);
    g.rutas.forEach((r) => {
      const c = P.buscar(P.CLASES, r.clase);
      assert.ok(c, r.clase);
      if (r.opcion) assert.ok(P.buscar(c.opcion.lista, r.opcion), id + ' ' + r.opcion);
    });
    g.razas.forEach(([raza, sub]) => {
      const r = P.buscar(P.RAZAS, raza);
      assert.ok(r, raza);
      if (sub) assert.ok(P.buscar(r.subrazas, sub), id + ' ' + sub);
    });
    g.trasfondos.forEach((t) => assert.ok(P.buscar(P.TRASFONDOS, t), t));
    (g.hab || []).forEach((h) => assert.ok(P.buscar(P.HABILIDADES, h), h));
    (g.conjuros || []).forEach((s) => assert.ok(P.buscar(P.CONJUROS, s), s));
  });
  Object.values(P.GUSTO_OPCION).forEach((g) => assert.ok(P.GUSTOS[g], g));
  P.CLASES.forEach((c) => {
    const f = P.FIRMA[c.id];
    f.hab.forEach((h) => assert.ok(c.hab === 'todas' || c.hab.includes(h), c.id + ' ' + h));
    (f.magia || []).forEach((s) => assert.ok(P.buscar(P.CONJUROS, s).clases.includes(c.id), c.id + ' ' + s));
  });
});

prueba('habilidades con su característica', () => {
  assert.equal(P.nombreHab('animales'), 'Trato con Animales (SAB)');
  assert.equal(P.nombreHab('arcano'), 'Conocimiento Arcano (INT)');
});

prueba('tiros repetidos: cada uno se puede colocar', () => {
  const tiros = [11, 11, 11, 14, 9, 7];
  let base = P.pjVacio().base;
  assert.equal(P.opcionesPuntuacion(tiros, base, 'fue').filter((o) => o.valor === 11).length, 3);
  ['fue', 'des', 'con'].forEach((k) => { base = P.asignarPuntuacion(base, k, 11); });
  assert.deepEqual([base.fue, base.des, base.con], [11, 11, 11], 'los tres 11 quedan repartidos');
  const ops = P.opcionesPuntuacion(tiros, base, 'int');
  assert.equal(ops.filter((o) => o.valor === 11 && o.de).length, 3, 'los tres 11 aparecen como usados');
  assert.equal(ops.filter((o) => !o.de).length, 3, 'quedan los otros tres tiros');
  assert.equal(ops.length, 6, 'nunca desaparece un tiro');
  base = P.asignarPuntuacion(base, 'int', 14);
  base = P.asignarPuntuacion(base, 'fue', 14, 'int');
  assert.equal(base.fue, 14); assert.equal(base.int, 11, 'elegir uno ya usado los intercambia');
  base = P.asignarPuntuacion(base, 'des', null);
  assert.equal(base.des, null); assert.equal(base.fue, 14, 'quitar uno no toca a los demás');
});

prueba('elegir por mí: reparto', () => {
  const orden = (o) => Object.values(o).sort((a, b) => b - a).join();
  const pj = P.pjVacio(); pj.razaId = 'humano'; pj.claseId = 'barbaro';
  assert.equal(P.elegir.reparto(pj, [15, 14, 13, 12, 10, 8]).base.fue, 15);
  const tiros = [11, 11, 11, 16, 9, 7];
  const r = P.elegir.reparto(pj, tiros);
  assert.equal(orden(r.base), '16,11,11,11,9,7', 'usa los seis tiros, repetidos incluidos');
  assert.equal(r.base.fue, 16); assert.ok(r.por.length > 0);
  // +2 DES de elfo: con un 13 ya llega a 15, así que el 14 rinde más en Constitución
  const elfa = P.pjVacio(); elfa.razaId = 'elfo'; elfa.subrazaId = 'alto'; elfa.claseId = 'mago';
  const b = P.elegir.reparto(elfa, [15, 14, 13, 12, 10, 8]).base;
  assert.equal(b.int, 15); assert.equal(b.con, 14); assert.equal(b.des, 13);
  const arquero = P.pjVacio(); arquero.razaId = 'humano'; arquero.claseId = 'guerrero'; arquero.opcionId = 'arqueria';
  assert.equal(P.elegir.reparto(arquero, [15, 14, 13, 12, 10, 8]).base.des, 15, 'un arquero prioriza Destreza');
  const lista = P.pjVacio(); lista.razaId = 'humano'; lista.claseId = 'barbaro'; lista.prioridades = ['car'];
  assert.ok(P.elegir.reparto(lista, [15, 14, 13, 12, 10, 8]).base.car >= 14, 'respeta lo que pediste subir');
  const conMalla = P.pjVacio(); conMalla.razaId = 'humano'; conMalla.claseId = 'guerrero'; conMalla.kitId = 'escudo';
  assert.ok(P.elegir.reparto(conMalla, [13, 8, 8, 8, 8, 8]).base.fue >= 12, 'cuida la Fuerza que pide la armadura pesada');
});

prueba('elegir por mí: el número más alto va siempre a lo que define la clase', () => {
  const clave = { barbaro: 'fue', bardo: 'car', brujo: 'car', clerigo: 'sab', druida: 'sab', explorador: 'des', guerrero: 'fue', hechicero: 'car', mago: 'int', monje: 'des', paladin: 'fue', picaro: 'des' };
  const tiro = () => { const d = [1, 2, 3, 4].map(() => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b); return d[1] + d[2] + d[3]; };
  const tiradas = [[15, 14, 13, 12, 10, 8], [11, 11, 11, 11, 11, 11]].concat(Array.from({ length: 20 }, () => Array.from({ length: 6 }, tiro)));
  P.CLASES.forEach((cl) => P.RAZAS.forEach((r) => (r.subrazas || [{ id: null }]).forEach((s) => tiradas.forEach((valores) => {
    const pj = P.pjVacio(); pj.razaId = r.id; pj.subrazaId = s.id; pj.claseId = cl.id;
    const { base } = P.elegir.reparto(pj, valores);
    assert.equal(base[clave[cl.id]], Math.max(...valores), cl.id + ' ' + r.id);
    assert.equal(Object.values(base).sort((a, b) => a - b).join(), valores.slice().sort((a, b) => a - b).join(), cl.id);
    const orden = valores.slice().sort((a, b) => b - a);
    assert.equal(base[Object.keys(cl.reparto).sort((a, b) => cl.reparto[b] - cl.reparto[a])[1]], orden[1], 'la segunda más importante lleva el segundo número');
  }))));
  const semiorco = P.pjVacio(); semiorco.razaId = 'semiorco'; semiorco.claseId = 'barbaro';
  const b = P.elegir.reparto(semiorco, [15, 14, 13, 12, 10, 8]).base;
  assert.equal(b.fue, 15); assert.equal(b.con, 14);
});

prueba('equipo: opciones reales de cada clase', () => {
  const guerrero = P.brenna();
  assert.deepEqual(P.calcular(guerrero).kit.armas, ['espada-larga', 'ballesta-ligera'], 'sin elegir, las primeras opciones');
  guerrero.equipoElegido = { armas: 'b', 'armas.0': 'guja', 'armas.1': 'pico-guerra', lejos: 'b' };
  let c = P.calcular(guerrero);
  assert.deepEqual(c.kit.armas, ['guja', 'pico-guerra', 'hacha-mano']);
  assert.equal(c.escudo, false); assert.equal(c.ca.valor, 17, 'sin escudo pierde 2');
  assert.ok(c.ataques.some((a) => a.nombre === 'Guja' && a.dado === '1d10'));
  assert.ok(c.equipo.includes('2 hachas de mano') && !c.equipo.includes('Hacha de mano'), 'no lista dos veces lo mismo');
  guerrero.equipoElegido = { 'armas.0': 'alabarda' };
  assert.deepEqual(P.calcular(guerrero).kit.armas, ['espada-larga', 'ballesta-ligera'], 'con escudo no admite un arma a dos manos');
  guerrero.equipoElegido = { 'armas.0': 'inventada' };
  assert.equal(P.calcular(guerrero).kit.armas[0], 'espada-larga', 'un arma inventada no entra');

  const clerigo = P.pjVacio(); clerigo.claseId = 'clerigo';
  const armaduras = () => P.opcionesEquipo(P.buscar(P.CLASES, 'clerigo'), clerigo).find((g) => g.id === 'armadura').op.map((o) => o.id);
  assert.deepEqual(armaduras(), ['a', 'b'], 'sin dominio no hay cota de malla');
  clerigo.opcionId = 'vida'; assert.deepEqual(armaduras(), ['a', 'b', 'c']);
  clerigo.equipoElegido = { armadura: 'c' }; assert.equal(P.calcular(clerigo).armadura.nombre, 'Cota de malla');
  clerigo.opcionId = 'luz'; assert.equal(P.calcular(clerigo).armadura.nombre, 'Cota de escamas', 'cambiar de dominio retira lo que ya no permite');

  const brujo = P.pjVacio(); brujo.claseId = 'brujo'; brujo.equipoElegido = { 'fijo.0': 'lanza' };
  assert.ok(P.calcular(brujo).kit.armas.includes('lanza'), 'también se elige en la parte fija');
  P.CLASES.forEach((cl) => P.ranurasEquipo(cl, P.pjVacio()).forEach((r) => assert.ok(P.armasDe(r.lista).length > 3, r.clave)));
});

prueba('equipo: partidas y enlaces antiguos siguen funcionando', () => {
  const g = P.pjVacio(); g.claseId = 'guerrero'; g.kitId = 'arco';
  assert.equal(P.calcular(g).armadura.nombre, 'Armadura de cuero');
  assert.equal(P.calcular(g).kit.armas[0], 'arco-largo');
  const p = P.pjVacio(); p.claseId = 'paladin'; p.kitId = 'grande';
  assert.ok(P.calcular(p).kit.armas.includes('mandoble'));
  const viejo = P.aPaquete(P.brenna()).slice(0, 27);
  assert.deepEqual(P.dePaquete(viejo).equipoElegido, {}, 'un QR anterior no trae elecciones');
  const pj = P.brenna(); pj.equipoElegido = { armas: 'b' };
  assert.deepEqual(P.dePaquete(JSON.parse(JSON.stringify(P.aPaquete(pj)))).equipoElegido, { armas: 'b' }, 'el QR nuevo sí');
});

prueba('elegir por mí: equipo según las puntuaciones', () => {
  const pj = (clase, base, extra) => Object.assign(P.pjVacio(), { razaId: 'humano', claseId: clase, base }, extra);
  const fuerte = pj('guerrero', { fue: 16, con: 14, des: 12, sab: 12, car: 10, int: 8 });
  assert.equal(P.calcular(Object.assign({}, fuerte, P.elegir.equipo(fuerte))).armadura.nombre, 'Cota de malla');
  const debil = pj('guerrero', { fue: 8, con: 14, des: 16, sab: 12, car: 10, int: 12 });
  const e = P.elegir.equipo(debil);
  assert.equal(P.calcular(Object.assign({}, debil, e)).armadura.nombre, 'Armadura de cuero', 'sin Fuerza no carga la cota de malla');
  assert.ok(e.por.length > 0);
  const arquero = pj('guerrero', { fue: 12, con: 14, des: 16, sab: 12, car: 10, int: 8 }, { concepto: 'quiero disparar con arco' });
  assert.ok(P.calcular(Object.assign({}, arquero, P.elegir.equipo(arquero))).kit.armas.some((a) => P.ARMAS[a].distancia));
  P.CLASES.forEach((cl) => {
    const x = pj(cl.id, Object.assign({}, cl.reparto));
    const r = P.elegir.equipo(x);
    assert.ok(P.calcular(Object.assign({}, x, r)).kit.armas.length > 0, cl.id);
    assert.ok(P.elegir.validar.equipo({ elecciones: P.opcionesEquipo(cl, x).map((g) => ({ grupo: g.id, opcion: g.op[0].id })), armas: [], por: 'x' }, x), cl.id);
  });
  const v = pj('guerrero', { fue: 15, con: 14, des: 13, sab: 12, car: 10, int: 8 });
  assert.equal(P.elegir.validar.equipo({ elecciones: [{ grupo: 'armadura', opcion: 'z' }], armas: [] }, v), null, 'opción inventada');
  const bien = P.elegir.validar.equipo({ elecciones: [{ grupo: 'armadura', opcion: 'a' }, { grupo: 'armas', opcion: 'a' }, { grupo: 'lejos', opcion: 'a' }, { grupo: 'paquete', opcion: 'b' }], armas: [{ ranura: 'armas.0', arma: 'mandoble' }, { ranura: 'armas.0', arma: 'mangual' }], por: 'x' }, v);
  assert.equal(bien.equipoElegido['armas.0'], 'mangual', 'descarta el arma a dos manos con escudo y acepta la válida');
});

prueba('elegir por mí: habilidades y conjuros según el contexto', () => {
  const pj = P.pjVacio(); pj.razaId = 'elfo'; pj.subrazaId = 'bosque'; pj.claseId = 'clerigo'; pj.concepto = 'me gusta curar a mis amigos';
  pj.base = P.sugerirReparto(P.buscar(P.CLASES, 'clerigo'));
  const h = P.elegir.habilidades(pj);
  assert.equal(h.habClase.length, 2); assert.ok(h.habClase.includes('medicina'));
  const m = P.elegir.magia(pj);
  assert.equal(m.trucos.length, 3); assert.ok(m.conjuros.includes('curar'));
  assert.ok(m.trucos.includes('llama-sagrada'), 'siempre lleva un truco de ataque');

  const r = P.pjVacio(); r.razaId = 'humano'; r.claseId = 'picaro'; r.trasfondoId = 'criminal'; r.base = P.sugerirReparto(P.buscar(P.CLASES, 'picaro'));
  const hr = P.elegir.habilidades(r);
  assert.equal(hr.habClase.length, 4); assert.equal(hr.pericia.length, 2);
  assert.ok(!hr.habClase.includes('sigilo') && !hr.habClase.includes('engano'), 'no repite lo que da el trasfondo');
  assert.equal(P.calcular(Object.assign({}, r, { habClase: hr.habClase })).repetidas.length, 0);

  const e = P.pjVacio(); e.razaId = 'semiorco'; e.claseId = 'bardo'; e.habRaza = [];
  assert.ok(!P.elegir.habilidades(e).habClase.includes('intimidacion'), 'no elige lo que ya da la raza');

  P.CLASES.filter((c) => c.magia && !c.magia.desdeNivel).forEach((c) => {
    const x = P.pjVacio(); x.razaId = 'humano'; x.claseId = c.id; x.base = P.sugerirReparto(c);
    const v = P.elegir.magia(x), per = P.calcular(x).magia.permitidos;
    assert.equal(v.trucos.length, per.trucos, c.id); assert.equal(v.conjuros.length, per.conjuros, c.id);
    assert.equal(new Set(v.conjuros).size, v.conjuros.length, c.id);
    assert.equal(P.pendientes(Object.assign({}, x, v), 'equipo').length, 0, c.id);
  });
});

prueba('elegir por mí: lo inválido de la IA se rechaza', () => {
  const pj = P.pjVacio(); pj.razaId = 'humano'; pj.claseId = 'clerigo';
  const v = P.elegir.validar, tiros = [11, 11, 11, 14, 9, 7];
  assert.ok(v.reparto({ fue: 11, des: 11, con: 11, int: 9, sab: 14, car: 7, por: 'x' }, pj, tiros));
  assert.equal(v.reparto({ fue: 11, des: 11, con: 11, int: 14, sab: 9, car: 7 }, pj, tiros), null, 'lo más alto debe ir a lo que define la clase');
  assert.equal(v.reparto({ fue: 11, des: 11, con: 11, int: 9, sab: 18, car: 7 }, pj, tiros), null, 'número inventado');
  assert.equal(v.reparto({ fue: 14, des: 11, con: 11, int: 9, sab: 14, car: 7 }, pj, tiros), null, 'número usado de más');
  assert.ok(v.habilidades({ habilidades: ['medicina', 'religion'] }, pj));
  assert.equal(v.habilidades({ habilidades: ['medicina', 'sigilo'] }, pj), null, 'habilidad fuera de su clase');
  assert.equal(v.habilidades({ habilidades: ['medicina'] }, pj), null, 'faltan habilidades');
  pj.base = P.sugerirReparto(P.buscar(P.CLASES, 'clerigo'));
  assert.equal(v.magia({ trucos: ['guia', 'luz', 'proyectil'], conjuros: ['curar'] }, pj), null, 'conjuro de otra clase');
  assert.equal(v.sugerir({ texto: '   ' }, pj, 'nombre'), null);
  assert.equal(v.sugerir({ texto: 'x'.repeat(90) }, pj, 'nombre').texto.length, 40);
});

prueba('Gemini: pide con esquema y su respuesta pasa por la validación', async () => {
  const llamadas = [];
  let respuesta = {};
  global.fetch = async (url, op) => { llamadas.push(JSON.parse(op.body)); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(respuesta) }] } }] }) }; };
  const pj = P.pjVacio(); pj.razaId = 'humano'; pj.claseId = 'clerigo'; pj.concepto = 'me gusta curar';
  const tiros = [11, 11, 11, 14, 9, 7];
  respuesta = { fue: 11, des: 9, con: 11, int: 7, sab: 14, car: 11, por: 'Para curar mejor.' };
  assert.equal((await P.ia.elegir('reparto', pj, tiros)).base.sab, 14);
  assert.ok(llamadas[0].contents[0].parts[0].text.includes('11, 11, 11'), 'envía todos los tiros');
  assert.ok(llamadas[0].systemInstruction.parts[0].text.includes('me gusta curar'), 'envía lo que contó');
  respuesta = { fue: 7, des: 9, con: 11, int: 11, sab: 20, car: 11, por: 'x' };
  await assert.rejects(() => P.ia.elegir('reparto', pj, tiros), /no cumple/);
  respuesta = { respuesta: 'Quieres curar.', cambios: [{ tipo: 'clase', valor: 'nigromante' }], recomendaciones: [{ id: 'clerigo', opcion: 'vida', por: 'Cura más.' }, { id: 'inventada', por: 'x' }], razas: [{ id: 'enano', subraza: 'colinas', por: 'Aguanta.' }], trasfondos: [{ id: 'ermitano', por: 'Medicina.' }, { id: 'nada', por: 'x' }], pregunta: '¿Con fe?', dudas: [] };
  const r = await P.ia.interpretar('me gusta curar', P.pjVacio());
  assert.equal(r.cambios.length, 0); assert.equal(r.recomendaciones.length, 1);
  assert.deepEqual(r.recomendaciones[0].cambios.map((c) => c.tipo + ':' + c.valor), ['clase:clerigo', 'opcion:vida']);
  assert.equal(r.razas[0].nombre, 'Enano de las colinas'); assert.equal(r.trasfondos.length, 1); assert.equal(r.pregunta, '¿Con fe?');
  delete global.fetch;
});

prueba('Brenna: números de la guía', () => {
  const c = P.calcular(P.brenna());
  assert.equal(c.caract.fue.total, 17); assert.equal(c.caract.fue.mod, 3);
  assert.equal(c.caract.con.total, 16); assert.equal(c.caract.con.mod, 3);
  assert.equal(c.caract.int.mod, -1); assert.equal(c.comp, 2);
  assert.equal(c.salvaciones.fue.bono, 5); assert.equal(c.salvaciones.con.bono, 5); assert.equal(c.salvaciones.int.bono, -1);
  const h = (id) => c.habilidades.find((x) => x.id === id).bono;
  assert.equal(h('atletismo'), 5); assert.equal(h('percepcion'), 3); assert.equal(h('perspicacia'), 3); assert.equal(h('intimidacion'), 2); assert.equal(h('sigilo'), 1);
  assert.equal(c.percepcionPasiva, 13); assert.equal(c.pgMax, 13); assert.equal(c.ca.valor, 19);
  assert.equal(c.iniciativa, 1); assert.equal(c.velocidad, 25); assert.equal(c.dadosGolpe, '1d10');
  assert.equal(c.ataques[0].nombre, 'Espada larga'); assert.equal(c.ataques[0].acierta, 5); assert.equal(c.ataques[0].bonoDano, 3);
  assert.equal(c.oro, 10); assert.equal(c.magia, null);
});

prueba('subir de nivel: vida, competencia y mejora', () => {
  const pj = P.brenna();
  pj.nivel = 2; pj.ganadosPG = [6];
  assert.equal(P.calcular(pj).pgMax, 22);
  assert.equal(P.calcular(pj).dadosGolpe, '2d10');
  pj.nivel = 5; pj.ganadosPG = [6, 6, 6, 6];
  assert.equal(P.calcular(pj).comp, 3);
  assert.equal(P.calcular(pj).pgMax, 13 + 9 * 4);
  pj.mejoras = [{ con: 2 }];
  const c = P.calcular(pj);
  assert.equal(c.caract.con.total, 18);
  assert.equal(c.pgMax, 14 + 10 * 4, 'CON sube con efecto retroactivo');
  pj.mejoras = [{ fue: 2 }, { fue: 2 }];
  assert.equal(P.calcular(pj).caract.fue.total, 20, 'tope de 20');
});

prueba('CA sin armadura y armadura media', () => {
  const pj = P.pjVacio();
  pj.razaId = 'humano'; pj.claseId = 'barbaro'; pj.base = P.sugerirReparto(P.buscar(P.CLASES, 'barbaro'));
  let c = P.calcular(pj);
  assert.equal(c.ca.valor, 14, 'bárbaro: 10 + DES 14 (+2) + CON 15 (+2)');
  pj.claseId = 'monje'; pj.base = P.sugerirReparto(P.buscar(P.CLASES, 'monje'));
  c = P.calcular(pj);
  assert.equal(c.caract.des.total, 16); assert.equal(c.caract.sab.total, 15);
  assert.equal(c.ca.valor, 10 + 3 + 2);
  assert.equal(c.ataques[0].nombre, 'Golpe sin armas');
  pj.claseId = 'clerigo'; pj.base = P.sugerirReparto(P.buscar(P.CLASES, 'clerigo')); pj.base.des = 16;
  c = P.calcular(pj);
  assert.equal(c.ca.valor, 14 + 2 + 2, 'escamas limita DES a +2 y suma escudo');
});

prueba('estilos de combate y armas sutiles', () => {
  const pj = P.brenna(); pj.opcionId = 'duelo';
  let c = P.calcular(pj);
  assert.equal(c.ca.valor, 18); assert.equal(c.ataques[0].bonoDano, 5);
  pj.kitId = 'arco'; pj.opcionId = 'arqueria';
  c = P.calcular(pj);
  assert.equal(c.ataques[0].nombre, 'Arco largo'); assert.equal(c.ataques[0].acierta, 1 + 2 + 2);
  const p2 = P.pjVacio(); p2.razaId = 'humano'; p2.claseId = 'picaro'; p2.base = P.sugerirReparto(P.buscar(P.CLASES, 'picaro'));
  c = P.calcular(p2);
  assert.equal(c.ataques[0].nombre, 'Estoque'); assert.equal(c.ataques[0].acierta, 3 + 2); assert.equal(c.ataques[0].bonoDano, 3);
});

prueba('magia, pericia, enano de las colinas y linaje dracónico', () => {
  const m = P.pjVacio(); m.razaId = 'gnomo'; m.subrazaId = 'rocas'; m.claseId = 'mago'; m.base = P.sugerirReparto(P.buscar(P.CLASES, 'mago')); m.trucos = ['descarga-fuego'];
  let c = P.calcular(m);
  assert.equal(c.caract.int.total, 17); assert.equal(c.magia.cd, 8 + 2 + 3); assert.equal(c.magia.ataque, 5); assert.deepEqual(c.magia.espacios, [2]);
  assert.ok(c.ataques.some((a) => a.nombre === 'Descarga de fuego' && a.acierta === 5));
  const r = P.pjVacio(); r.razaId = 'humano'; r.claseId = 'picaro'; r.base = P.sugerirReparto(P.buscar(P.CLASES, 'picaro')); r.habClase = ['sigilo']; r.pericia = ['sigilo'];
  assert.equal(P.calcular(r).habilidades.find((h) => h.id === 'sigilo').bono, 3 + 2 + 2);
  const e = P.brenna(); e.subrazaId = 'colinas';
  assert.equal(P.calcular(e).pgMax, 10 + 3 + 1);
  const h = P.pjVacio(); h.razaId = 'humano'; h.claseId = 'hechicero'; h.opcionId = 'draconico'; h.base = P.sugerirReparto(P.buscar(P.CLASES, 'hechicero'));
  c = P.calcular(h);
  assert.equal(c.ca.valor, 13 + 2); assert.equal(c.pgMax, 6 + 2 + 1);
  const pal = P.pjVacio(); pal.razaId = 'humano'; pal.claseId = 'paladin'; pal.base = P.sugerirReparto(P.buscar(P.CLASES, 'paladin'));
  assert.equal(P.calcular(pal).magia, null, 'el paladín no tiene magia en nivel 1');
  pal.nivel = 2; pal.ganadosPG = [6];
  assert.deepEqual(P.calcular(pal).magia.espacios, [2]);
});

prueba('habilidades repetidas y pendientes', () => {
  const pj = P.brenna(); pj.habClase = ['atletismo', 'percepcion'];
  assert.equal(P.calcular(pj).faltanPorRepetidas, 1);
  assert.equal(P.pendientes(pj, 'trasfondo').length, 1);
  pj.habExtra = ['sigilo'];
  assert.equal(P.pendientes(pj, 'trasfondo').length, 0);
  assert.equal(P.calcular(pj).habilidades.find((h) => h.id === 'sigilo').comp, true);
  assert.equal(P.pendientes(P.pjVacio(), 'raza').length, 1);
  assert.equal(P.pendientes(P.brenna(), 'clase').length, 0);
});

prueba('armadura pesada sin fuerza frena, salvo a enanos', () => {
  const pj = P.brenna(); pj.razaId = 'humano'; pj.subrazaId = null; pj.base.fue = 10;
  const c = P.calcular(pj);
  assert.equal(c.velocidad, 20); assert.equal(c.avisos.length, 1);
});

prueba('todas las medidas van en pies', () => {
  P.RAZAS.forEach((r) => [r].concat(r.subrazas || []).forEach((x) => assert.ok(!x.velocidad || x.velocidad % 5 === 0, x.id)));
  assert.equal(P.ARMAS['arco-largo'].distancia, '150/600 ft');
  const textos = JSON.stringify([P.ARMAS, P.RAZAS, P.SRD_CONJUROS, P.SRD_CRIATURAS, P.SRD_OBJETOS, P.SRD_TRAMPAS, P.SRD_ESTADOS]);
  const metrico = textos.match(/.{30}(\d\s?(?:m|cm|km)(?![a-záéíóúñ])|(?<![a-záéíóúñ])metros?\b).{10}/g);
  assert.equal(metrico, null, String(metrico));
  assert.equal(P.SRD_CRIATURAS.find((c) => c.n === 'Goblin').v, '30 ft');
});

prueba('paquete del QR: ida y vuelta', () => {
  const pj = P.brenna();
  const vuelta = P.dePaquete(JSON.parse(JSON.stringify(P.aPaquete(pj))));
  assert.deepEqual(P.calcular(vuelta).ca, P.calcular(pj).ca);
  assert.equal(vuelta.nombre, pj.nombre); assert.equal(vuelta.base.fue, 15);
});

prueba('datos del SRD: conjuros completos y sin restos del PDF', () => {
  const sucio = /Prohibida la reventa|Documento de referencia|o fotocopiar|[a-záéíóúñ]- [a-záéíóúñ]/;
  P.CONJUROS.forEach((s) => {
    const o = P.SRD_CONJUROS[s.id];
    assert.ok(o, 'falta ' + s.nombre);
    assert.equal(o.nombre, s.nombre);
    ['tipo', 'tiempo', 'alcance', 'componentes', 'duracion'].forEach((k) => assert.ok(o[k], s.nombre + ' ' + k));
    assert.ok(/nivel 1|truco/.test(o.tipo), s.nombre);
    assert.equal(/truco/.test(o.tipo), s.nivel === 0, s.nombre + ': no coincide el nivel');
    assert.ok(o.texto.length > 0);
    o.texto.forEach((p) => { assert.ok(!sucio.test(p), s.nombre + ': ' + p); assert.ok(/[.:)]$/.test(p) || /^•/.test(p), s.nombre + ' termina raro: ' + p.slice(-30)); });
  });
  assert.ok(P.SRD_CONJUROS.proyectil.texto[0].startsWith('Creas tres dardos brillantes de fuerza mágica'));
  assert.ok(P.SRD_CONJUROS.proyectil.texto[1].startsWith('A niveles superiores.'));
  assert.ok(P.SRD_CONJUROS.prestidigitacion.texto.some((p) => p.includes('1 ft³')), 'conserva los superíndices');
});

prueba('datos del SRD: criaturas, objetos, trampas y estados', () => {
  assert.ok(P.SRD_CRIATURAS.length >= 310); assert.ok(P.SRD_OBJETOS.length >= 230);
  assert.equal(P.SRD_TRAMPAS.length, 8); assert.equal(P.SRD_ESTADOS.length, 14);
  const nombres = new Set();
  P.SRD_CRIATURAS.forEach((c) => {
    nombres.add(c.n);
    assert.ok(c.ca > 0 && c.ca < 30, c.n); assert.ok(c.pg > 0, c.n); assert.equal(c.c.length, 6, c.n);
    assert.ok(c.c.every((x) => x >= 1 && x <= 30), c.n); assert.ok(/^(\d+|1\/[248])$/.test(c.vd), c.n + ' ' + c.vd);
    (c.a || []).filter((a) => a.dn).forEach((a) => {
      assert.ok(Number.isInteger(a.b), c.n + ' ' + a.n);
      const d = P.dm.partirDano(a.dn);
      assert.ok(d.n > 0 || d.bono > 0, c.n + ' ' + a.n + ' ' + a.dn);
    });
    (c.m || []).filter((m) => m.a).forEach((m) => assert.ok(c.a.some((a) => a.n === m.a), c.n + ' multiataque ' + m.a));
  });
  assert.ok(nombres.size > 300);
  const g = P.SRD_CRIATURAS.find((c) => c.n === 'Goblin');
  assert.equal(g.ca, 15); assert.equal(g.pg, 7); assert.equal(g.vd, '1/4'); assert.equal(g.px, 50);
  assert.deepEqual(g.a[0].dn, '1d6+2'); assert.equal(g.a[0].b, 4); assert.equal(g.a[0].ti, 'cortante');
  const d = P.SRD_CRIATURAS.find((c) => c.n === 'Dragón rojo adulto');
  assert.deepEqual(d.m, [{ q: 1, a: 'Mordisco' }, { q: 2, a: 'Garra' }]);
  assert.equal(d.a.find((a) => a.n === 'Mordisco').ex[0].ti, 'fuego', 'lee el daño adicional');
  P.SRD_OBJETOS.forEach((o) => { assert.ok(o.n && o.t && o.d.length, o.n); assert.ok(['común', 'infrecuente', 'rara', 'muy rara', 'legendaria', 'varía', 'variable'].includes(o.r), o.n + ' ' + o.r); });
  P.SRD_ESTADOS.forEach((e) => assert.ok(e.d.length > 0, e.n));
  assert.ok(P.ATRIBUCION.includes('legalcode.es'));
});

prueba('personajes guardados: crear, abrir, migrar y eliminar', () => {
  const memoria = new Map();
  global.localStorage = { getItem: (k) => (memoria.has(k) ? memoria.get(k) : null), setItem: (k, v) => memoria.set(k, v), removeItem: (k) => memoria.delete(k) };
  const antiguo = P.brenna();
  delete antiguo.equipoElegido; delete antiguo.retrato;
  memoria.set('tpp.estado', JSON.stringify({ pj: antiguo, paso: 'equipo', tut: { i: 2 } }));
  const r = P.guardados.iniciar();
  assert.equal(r.estado.pj.nombre, 'Brenna Puñohierro'); assert.equal(r.estado.paso, 'equipo');
  assert.deepEqual(r.estado.pj.equipoElegido, {}, 'completa los campos nuevos');
  assert.equal(memoria.has('tpp.estado'), false, 'la clave antigua desaparece');
  const otro = Object.assign(P.pjVacio(), { nombre: 'Lyra', razaId: 'elfo', claseId: 'mago' });
  assert.ok(P.guardados.guardar('b', { pj: otro, paso: 'clase' }));
  assert.equal(P.guardados.lista().length, 2);
  assert.equal(P.guardados.lista().find((x) => x.id === 'b').sub, 'Elfo · Mago');
  assert.equal(P.guardados.iniciar().id, 'b', 'el último guardado queda abierto');
  P.guardados.guardar('b', { pj: Object.assign(otro, { nombre: 'Lyra II' }), paso: 'hoja' });
  assert.equal(P.guardados.lista().length, 2, 'guardar otra vez no duplica');
  assert.equal(P.guardados.abrir('b').pj.nombre, 'Lyra II');
  P.guardados.eliminar('b');
  assert.equal(P.guardados.lista().length, 1); assert.equal(P.guardados.abrir('b'), null);
  assert.equal(P.guardados.iniciar(), null, 'si se borró el abierto, no abre otro por su cuenta');
  global.localStorage.setItem = () => { throw new Error('sin espacio'); };
  assert.equal(P.guardados.guardar('c', { pj: otro, paso: 'clase' }), false, 'avisa si no cabe');
  delete global.localStorage;
});

prueba('modo DM: PNJ, objetos y trampas', () => {
  for (let i = 0; i < 200; i++) {
    const n = P.dm.pnj();
    Object.entries(n).forEach(([k, v]) => assert.ok(v && !/undefined/.test(v), k));
  }
  assert.equal(P.dm.pnj({ raza: 'enano' }).raza, 'Enano');
  assert.ok(P.NOMBRES.enano.includes(P.dm.pnj({ raza: 'enano' }).nombre));
  for (let i = 0; i < 60; i++) {
    const o = P.dm.objeto({ rareza: 'rara', tipo: 'Anillo' });
    assert.equal(o.r, 'rara'); assert.ok(o.t.startsWith('Anillo')); assert.ok(o.historia.length > 10); assert.equal(o.exacto, true);
  }
  assert.equal(P.dm.objeto({ rareza: 'común', tipo: 'Vara' }).exacto, false, 'avisa si la combinación no existe');
  for (const [g, nivel, dano] of [['contratiempo', 1, '1d10'], ['peligrosa', 5, '4d10'], ['mortal', 11, '18d10'], ['mortal', 20, '24d10']]) {
    for (let i = 0; i < 40; i++) {
      const x = P.dm.trampa({ nivel, gravedad: g }), tabla = P.GRAVEDAD[g];
      assert.equal(x.dano, dano, 'daño de la tabla oficial');
      if (x.salvacion) { assert.ok(x.salvacion.cd >= tabla.cd[0] && x.salvacion.cd <= tabla.cd[1]); assert.equal(x.ataque, null); } else assert.ok(x.ataque >= tabla.ataque[0] && x.ataque <= tabla.ataque[1]);
      assert.ok(x.disparador && x.pista && x.descripcion && x.comoDesactivar);
    }
  }
  assert.equal(P.dm.trampa({ tipo: 'mágica' }).tipo, 'mágica');
});

prueba('modo DM: encuentros dentro del presupuesto', () => {
  assert.equal(P.dm.presupuesto(1, 4, 'media'), 200); assert.equal(P.dm.presupuesto(5, 4, 'media'), 1800);
  assert.equal(P.dm.presupuesto(1, 2, 'media'), 100, 'escala con los jugadores');
  assert.equal(P.dm.presupuesto(5, 4, 'facil'), 900);
  Object.keys(P.ENTORNOS).forEach((entorno) => Object.keys(P.DIFICULTADES).forEach((dificultad) => {
    for (const nivel of [1, 3, 5, 10, 15, 20]) {
      for (let i = 0; i < 12; i++) {
        const e = P.dm.encuentro({ nivel, jugadores: 4, dificultad, entorno });
        assert.ok(e.grupo.length > 0 && e.escena && e.giro);
        assert.ok(e.px <= e.tope, `${entorno} ${dificultad} ${nivel}: ${e.px} > ${e.tope}`);
        e.grupo.forEach((g) => { assert.ok(g.q >= 1 && g.q <= 8); assert.ok(P.dm.valorVd(g.vd) <= nivel + 4); assert.ok(P.SRD_CRIATURAS.some((c) => c.n === g.n)); });
      }
    }
  }));
  const dragones = P.dm.encuentro({ nivel: 15, dificultad: 'mortal', tipo: 'Dragón' });
  assert.ok(dragones.grupo.every((g) => g.t.startsWith('Dragón')));
});

prueba('modo DM: iniciativa, turnos y daño', () => {
  const cb = P.dm.combate, est = cb.crear();
  const goblin = P.SRD_CRIATURAS.find((c) => c.n === 'Goblin');
  cb.agregarCriatura(est, goblin, 2);
  cb.agregarPJ(est, cb.desdePersonaje(P.brenna()));
  assert.deepEqual(est.gente.map((g) => g.nombre), ['Goblin 1', 'Goblin 2', 'Brenna Puñohierro']);
  cb.agregarCriatura(est, goblin, 1);
  assert.equal(est.gente[3].nombre, 'Goblin 3', 'sigue la numeración');
  const [g1, g2, br, g3] = est.gente;
  assert.equal(br.ca, 19); assert.equal(br.pg, 13); assert.equal(br.iniBono, 1);
  assert.equal(br.ataques[0].n, 'Espada larga'); assert.equal(br.ataques[0].dn, '1d8+3');
  [[g1, 5], [g2, 15], [br, 12], [g3, 1]].forEach(([g, d]) => cb.fijarIniciativa(est, g.id, d));
  assert.equal(g2.ini, 17); assert.equal(br.ini, 13);
  cb.ordenar(est);
  assert.deepEqual(est.gente.map((g) => g.nombre), ['Goblin 2', 'Brenna Puñohierro', 'Goblin 1', 'Goblin 3']);
  assert.equal(est.ronda, 1); assert.equal(cb.actual(est).nombre, 'Goblin 2');
  cb.danar(est, g1.id, 99);
  assert.equal(g1.pg, 0); assert.ok(!cb.vivo(g1));
  assert.equal(cb.siguiente(est).nombre, 'Brenna Puñohierro');
  assert.equal(cb.siguiente(est).nombre, 'Goblin 3', 'salta a los derrotados');
  assert.equal(cb.siguiente(est).nombre, 'Goblin 2'); assert.equal(est.ronda, 2);
  assert.equal(cb.objetivo(est, g2).nombre, 'Brenna Puñohierro');
  assert.equal(cb.objetivo(est, br).pg, 7, 'elige un rival en pie');
  cb.danar(est, g2.id, 3);
  assert.equal(cb.objetivo(est, br).nombre, 'Goblin 2', 'prefiere al más herido');
  cb.quitar(est, g3.id);
  assert.equal(cb.actual(est).nombre, 'Goblin 2', 'sacar a otro no mueve el turno');
  assert.ok(est.registro.length > 0);
  const nuevo = (cb.agregarCriatura(est, goblin, 1), est.gente[est.gente.length - 1]);
  cb.fijarIniciativa(est, nuevo.id, 20); cb.colocar(est);
  assert.equal(est.gente[0], nuevo, 'quien entra ocupa su lugar por iniciativa');
  assert.equal(cb.actual(est).nombre, 'Goblin 2', 'y no mueve el turno de nadie');
  assert.deepEqual(P.dm.partirDano('2d6+4'), { n: 2, lados: 6, bono: 4 });
  assert.deepEqual(P.dm.partirDano('1d6-1'), { n: 1, lados: 6, bono: -1 });
  assert.deepEqual(P.dm.partirDano('5'), { n: 0, lados: 0, bono: 5 });
  assert.equal(cb.resolver(4, 15, 11).impacta, true, 'iguala la CA');
  assert.equal(cb.resolver(4, 15, 10).impacta, false);
  assert.equal(cb.resolver(30, 15, 1).impacta, false, 'un 1 falla siempre');
  const c = cb.resolver(-5, 30, 20);
  assert.ok(c.impacta && c.critico, 'un 20 acierta siempre');
});

prueba('modo DM: ataque múltiple y salvaciones contra muerte', () => {
  const cb = P.dm.combate, est = cb.crear();
  cb.agregarCriatura(est, P.SRD_CRIATURAS.find((c) => c.n === 'Dragón rojo adulto'), 1);
  assert.deepEqual(cb.golpes(est.gente[0]).map((a) => a.n), ['Mordisco', 'Garra', 'Garra']);
  cb.agregarCriatura(est, P.SRD_CRIATURAS.find((c) => c.n === 'Ogro'), 1);
  assert.equal(cb.golpes(est.gente[1]).length, 1);
  cb.agregarPJ(est, { nombre: 'Ana', ca: 12, pg: 10, pgMax: 10, iniBono: 0 });
  const a = est.gente[2];
  cb.danar(est, a.id, 50);
  assert.equal(a.pg, 0); assert.ok(a.estados.includes('Inconsciente')); assert.ok(cb.vivo(a), 'a 0 de vida sigue en la lista');
  assert.equal(cb.salvacionMuerte(est, a.id, 12), 'sigue'); assert.equal(a.muerte.e, 1);
  assert.equal(cb.salvacionMuerte(est, a.id, 5), 'sigue'); assert.equal(a.muerte.f, 1);
  assert.equal(cb.salvacionMuerte(est, a.id, 1), 'muere', 'un 1 cuenta como dos fallos');
  assert.ok(a.muerto); assert.ok(!cb.vivo(a));
  const est2 = cb.crear();
  cb.agregarPJ(est2, { nombre: 'Bo', ca: 12, pg: 5, pgMax: 10, iniBono: 0 });
  const b = est2.gente[0];
  cb.danar(est2, b.id, 5);
  assert.equal(cb.salvacionMuerte(est2, b.id, 20), 'despierta');
  assert.equal(b.pg, 1); assert.ok(!b.estados.includes('Inconsciente'));
  cb.danar(est2, b.id, 1);
  ['sigue', 'sigue', 'estable'].forEach((r) => assert.equal(cb.salvacionMuerte(est2, b.id, 15), r));
  assert.ok(b.estable);
  const est3 = cb.crear();
  cb.agregarPJ(est3, { nombre: 'Cy', ca: 12, pg: 1, pgMax: 10, iniBono: 0 });
  const y = est3.gente[0];
  cb.danar(est3, y.id, 1); [1, 1, 1].forEach((n) => cb.danar(est3, y.id, n));
  assert.ok(y.muerto, 'recibir daño a 0 suma fallos');
  cb.curar(est2, b.id, 4);
  assert.equal(b.pg, 4); assert.deepEqual(b.muerte, { e: 0, f: 0 });
  assert.equal(cb.curar(est2, b.id, 99), 10, 'no pasa de su vida máxima');
});

prueba('modo DM: lo que proponga la IA no cambia las reglas', async () => {
  const v = P.dm.validarIA, cb = P.dm.combate;
  const e = [P.dm.encuentro({ nivel: 3 }), P.dm.encuentro({ nivel: 3 })];
  assert.equal(v.encuentro({ opcion: 7 }, e), null, 'opción inexistente');
  const elegido = v.encuentro({ opcion: 1, escena: 'Una cripta', tactica: 'Rodean', giro: 'Un rehén' }, e);
  assert.deepEqual(elegido.grupo, e[1].grupo); assert.equal(elegido.escena, 'Una cripta');
  const t = P.dm.trampa({ nivel: 5, gravedad: 'mortal' });
  const tr = v.trampa({ descripcion: 'Silba el aire', pista: 'Huele a azufre', dano: '1d4', salvacion: { cd: 1 } }, t);
  assert.equal(tr.dano, t.dano, 'no acepta otro daño'); assert.deepEqual(tr.salvacion, t.salvacion); assert.equal(tr.descripcion, 'Silba el aire');
  assert.equal(v.trampa({ descripcion: ' ' }, t), null);
  const o = [P.dm.objeto(), P.dm.objeto()];
  const ob = v.objeto({ opcion: 0, historia: 'Lo forjó un herrero ciego', d: ['inventado'] }, o);
  assert.deepEqual(ob.d, o[0].d, 'no reescribe el texto oficial');
  assert.equal(v.objeto({ opcion: 9 }, o), null);
  assert.equal(v.pnj({ nombre: 'Ana' }), null, 'un PNJ incompleto no sirve');
  assert.ok(v.pnj({ nombre: 'Ana', apariencia: 'Alta', personalidad: 'Seria' }));
  const est = cb.crear();
  cb.agregarCriatura(est, P.SRD_CRIATURAS.find((c) => c.n === 'Goblin'), 1);
  cb.agregarPJ(est, { nombre: 'Ana', ca: 12, pg: 8, pgMax: 8, iniBono: 0 });
  const [g, a] = est.gente;
  assert.equal(v.turno({ objetivo: 'inventado' }, est, g), null);
  assert.equal(v.turno({ objetivo: g.id }, est, g), null, 'no puede atacarse a sí mismo');
  assert.equal(v.turno({ objetivo: a.id, narracion: 'Salta' }, est, g).objetivo, a);
  let cuerpo = null;
  global.fetch = async (u, op) => { cuerpo = JSON.parse(op.body); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ objetivo: a.id, narracion: 'Salta con su cimitarra.' }) }] } }] }) }; };
  const r = await P.ia.dm('turno', { est, g, campana: 'Piratas y niebla' });
  assert.equal(r.objetivo, a); assert.ok(cuerpo.systemInstruction.parts[0].text.includes('Piratas y niebla'));
  global.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"objetivo":"x","narracion":"y"}' }] } }] }) });
  await assert.rejects(() => P.ia.dm('turno', { est, g }), /no cumple/);
  delete global.fetch;
});

if (P.interpretar) {
  const pj = () => P.pjVacio();
  const tipos = (r) => r.cambios.map((c) => c.tipo + ':' + c.valor);
  prueba('intérprete: raza, clase y nombre explícitos', () => {
    const r = P.interpretar('Quiero ser una elfa del bosque maga que se llame Lyra', pj());
    assert.deepEqual(tipos(r).sort(), ['clase:mago', 'nombre:Lyra', 'raza:elfo', 'subraza:bosque']);
  });
  prueba('intérprete: gustos dan recomendaciones', () => {
    const r = P.interpretar('quiero ser sigiloso y disparar con arco desde lejos', pj());
    assert.equal(r.cambios.length, 0);
    assert.equal(r.recomendaciones[0].id, 'explorador');
  });
  prueba('intérprete: negación', () => {
    const r = P.interpretar('no quiero magia, solo pegar fuerte y aguantar', pj());
    assert.ok(!r.recomendaciones.some((x) => P.buscar(P.CLASES, x.id).tags.includes('magia')));
    assert.ok(['guerrero', 'barbaro'].includes(r.recomendaciones[0].id));
    const r2 = P.interpretar('no quiero ser mago', pj());
    assert.ok(!r2.cambios.some((c) => c.tipo === 'clase'));
  });
  prueba('intérprete: cambios sobre un personaje', () => {
    const r = P.interpretar('cambia mi clase a paladín y sube mi carisma', P.brenna());
    assert.ok(tipos(r).includes('clase:paladin'));
    assert.ok(tipos(r).includes('prioridad:car'));
  });
  prueba('intérprete: trasfondo, palabras con acento y sinónimos', () => {
    assert.ok(tipos(P.interpretar('fui marinero y soy un dragón bárbaro', pj())).includes('trasfondo:marinero'));
    assert.ok(tipos(P.interpretar('un hobbit ladrón', pj())).includes('raza:mediano'));
    assert.ok(tipos(P.interpretar('un hobbit ladrón', pj())).includes('clase:picaro'));
    assert.ok(tipos(P.interpretar('quiero un medio orco', pj())).includes('raza:semiorco'));
    assert.ok(tipos(P.interpretar('quiero un medio orco', pj())).every((t) => t !== 'raza:orco'));
  });
  prueba('intérprete: texto sin sentido no inventa nada', () => {
    const r = P.interpretar('asdf qwer', pj());
    assert.equal(r.cambios.length, 0); assert.equal(r.recomendaciones.length, 0); assert.ok(r.dudas.length > 0);
  });
  prueba('intérprete: «me gusta curar» da a elegir, no decide', () => {
    ['me gusta curar', 'me gusta sanar a la gente', 'quiero ayudar a mis amigos', 'soy medico', 'cuido a los heridos', 'quiero ser sanadora'].forEach((t) => {
      const r = P.interpretar(t, pj());
      assert.equal(r.cambios.length, 0, t);
      assert.deepEqual(r.recomendaciones.map((x) => x.id), ['clerigo', 'druida', 'bardo', 'paladin'], t);
      assert.equal(r.pregunta, '¿Cómo te imaginas curando?', t);
      assert.ok(r.razas.length >= 3 && r.trasfondos.length >= 2, t);
    });
    const r = P.interpretar('me gusta curar', pj());
    assert.equal(r.respuesta, 'Entendí que te gusta curar al grupo.');
    assert.deepEqual(r.recomendaciones[0].cambios.map((c) => c.tipo + ':' + c.valor), ['clase:clerigo', 'opcion:vida']);
    assert.notEqual(r.recomendaciones[0].por, r.recomendaciones[1].por, 'cada camino explica lo suyo');
    assert.ok(r.trasfondos[0].por.includes('(SAB)'), 'los trasfondos muestran la característica');
  });
  prueba('intérprete: varios gustos priorizan lo que cumple más', () => {
    const r = P.interpretar('me gusta la magia y curar a los demás', pj());
    assert.equal(r.cambios.length, 0);
    assert.deepEqual(r.recomendaciones.slice(0, 3).map((x) => x.id), ['clerigo', 'druida', 'bardo']);
    assert.ok(r.recomendaciones[0].por.includes('También encaja con'));
    assert.ok(r.recomendaciones.length >= 5, 'sigue ofreciendo otros caminos');
    assert.ok(P.interpretar('quiero magia oscura y un pacto', pj()).recomendaciones.filter((x) => x.id === 'brujo').length === 3, 'tres patrones distintos');
  });
  prueba('intérprete: un gusto no es elegir una clase ni una raza', () => {
    assert.equal(P.interpretar('me gusta la música', pj()).cambios.length, 0);
    assert.equal(P.interpretar('me gusta la música', pj()).recomendaciones[0].id, 'bardo');
    assert.equal(P.interpretar('quiero matar dragones', pj()).cambios.length, 0);
    assert.equal(P.interpretar('quiero matar a un dragon', pj()).cambios.length, 0);
    assert.deepEqual(tipos(P.interpretar('un artista marcial', pj())), ['clase:monje']);
    assert.ok(!P.leerGustos('se llama Pedro').gustos.includes('fuego'));
    assert.ok(!P.interpretar('una elfa que se llama Pedro', pj()).respuesta.includes('fuego'));
    assert.ok(tipos(P.interpretar('soy un cura', pj())).includes('clase:clerigo'));
  });
  prueba('intérprete: la negación termina con la frase', () => {
    const r = P.leerGustos('no quiero magia, solo pegar fuerte');
    assert.deepEqual(r, { gustos: ['pegar'], evitar: ['magia'] });
    assert.deepEqual(P.leerGustos('no quiero magia pero si curar').gustos, ['curar']);
    assert.deepEqual(P.leerGustos('¡nada de magia! quiero pegar').gustos, ['pegar']);
    assert.ok(P.interpretar('quiero curar pero sin magia', pj()).recomendaciones.every((x) => x.id === 'paladin'));
  });
  prueba('intérprete: la clase dicha define su opción', () => {
    assert.deepEqual(tipos(P.interpretar('un clérigo que cure', pj())).sort(), ['clase:clerigo', 'opcion:vida']);
    const r = P.interpretar('un guerrero que dispare con arco', pj());
    assert.ok(tipos(r).includes('opcion:arqueria'));
    assert.equal(r.cambios[r.cambios.length - 1].tipo, 'opcion', 'se aplica después de la clase');
    assert.equal(r.cambios[r.cambios.length - 1].texto, 'Tu estilo de combate: Arquería');
  });
  prueba('intérprete: sugiere lo que aún no has elegido', () => {
    const r = P.interpretar('un enano', pj());
    assert.ok(r.recomendaciones.map((x) => x.id).includes('guerrero'), 'clases que le van a la raza');
    assert.equal(r.razas.length, 0, 'ya dijo su raza');
    const m = P.interpretar('quiero ser mago', pj());
    assert.ok(m.razas.length > 0 && m.trasfondos.length > 0);
    assert.equal(P.interpretar('me gusta curar', P.brenna()).razas.length, 0, 'ya tiene raza');
    assert.equal(P.interpretar('me gusta curar', P.brenna()).trasfondos.length, 0, 'ya tiene trasfondo');
    P.EJEMPLOS_TEXTO.forEach((t) => assert.ok(P.interpretar(t, pj()).dudas.length === 0, t));
    const conRaza = pj(); conRaza.razaId = 'enano';
    const raro = P.interpretar('asdf qwer', conRaza);
    assert.equal(raro.recomendaciones.length, 0); assert.ok(raro.dudas.length > 0, 'sin entender no ofrece clases');
  });
}
cola.then(() => console.log(`\n${n} pruebas correctas`)).catch((e) => { console.error(e); process.exitCode = 1; });
