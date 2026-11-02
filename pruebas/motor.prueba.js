// Pruebas del motor de reglas y del intérprete. Ejecutar: node pruebas/motor.prueba.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
global.window = {};
['datos.js', 'motor.js', 'interprete.js', 'elegir.js', 'ia.js'].forEach((f) => {
  const ruta = path.join(__dirname, '..', 'js', f);
  if (fs.existsSync(ruta)) (0, eval)(fs.readFileSync(ruta, 'utf8'));
});
const P = window.PJ;
let n = 0;
const pendientes = [];
const prueba = (nombre, fn) => {
  const r = fn();
  if (r && r.then) { pendientes.push(r.then(() => { n++; console.log('✓', nombre); })); return; }
  n++; console.log('✓', nombre);
};

prueba('datos completos', () => {
  assert.equal(P.RAZAS.length, 9);
  assert.equal(P.CLASES.length, 12);
  assert.equal(P.HABILIDADES.length, 18);
  assert.equal(P.TRASFONDOS.length, 13);
  P.CLASES.forEach((c) => {
    assert.equal(Object.values(c.reparto).sort((a, b) => b - a).join(), '15,14,13,12,10,8', c.id);
    if (c.hab !== 'todas') assert.ok(c.hab.length >= c.nHab, c.id);
    c.kits.forEach((k) => k.armas.forEach((a) => assert.ok(P.ARMAS[a], a)));
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
  assert.ok(v.reparto({ fue: 11, des: 11, con: 11, int: 14, sab: 9, car: 7, por: 'x' }, pj, tiros));
  assert.equal(v.reparto({ fue: 18, des: 11, con: 11, int: 14, sab: 9, car: 7 }, pj, tiros), null, 'número inventado');
  assert.equal(v.reparto({ fue: 14, des: 14, con: 11, int: 11, sab: 9, car: 7 }, pj, tiros), null, 'número usado de más');
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
  respuesta = { fue: 11, des: 9, con: 14, int: 7, sab: 11, car: 11, por: 'Para curar mejor.' };
  assert.equal((await P.ia.elegir('reparto', pj, tiros)).base.con, 14);
  assert.ok(llamadas[0].contents[0].parts[0].text.includes('11, 11, 11'), 'envía todos los tiros');
  assert.ok(llamadas[0].systemInstruction.parts[0].text.includes('me gusta curar'), 'envía lo que contó');
  respuesta = { fue: 20, des: 9, con: 14, int: 7, sab: 11, car: 11, por: 'x' };
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
  assert.equal(c.iniciativa, 1); assert.equal(c.velocidad, 7.5); assert.equal(c.dadosGolpe, '1d10');
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
  assert.equal(c.velocidad, 6); assert.equal(c.avisos.length, 1);
});

prueba('paquete del QR: ida y vuelta', () => {
  const pj = P.brenna();
  const vuelta = P.dePaquete(JSON.parse(JSON.stringify(P.aPaquete(pj))));
  assert.deepEqual(P.calcular(vuelta).ca, P.calcular(pj).ca);
  assert.equal(vuelta.nombre, pj.nombre); assert.equal(vuelta.base.fue, 15);
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
Promise.all(pendientes).then(() => console.log(`\n${n} pruebas correctas`)).catch((e) => { console.error(e); process.exitCode = 1; });
