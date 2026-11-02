// Pruebas del motor de reglas y del intérprete. Ejecutar: node pruebas/motor.prueba.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
global.window = {};
['datos.js', 'motor.js', 'interprete.js'].forEach((f) => {
  const ruta = path.join(__dirname, '..', 'js', f);
  if (fs.existsSync(ruta)) (0, eval)(fs.readFileSync(ruta, 'utf8'));
});
const P = window.PJ;
let n = 0;
const prueba = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };

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
}
console.log(`\n${n} pruebas correctas`);
