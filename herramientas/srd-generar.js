/* Genera los archivos de datos del SRD 5.1 en español a partir de las líneas del PDF.
   Paso 2 de 2. Uso: node herramientas/srd-generar.js lineas.json js
   Los textos no se reescriben: solo se unen los renglones cortados por el maquetado del PDF. */
const fs = require('fs');
const path = require('path');
const [rutaLineas, destino] = process.argv.slice(2);
global.window = {};
(0, eval)(fs.readFileSync(path.join(destino, 'datos.js'), 'utf8'));
const P = window.PJ;

const crudas = JSON.parse(fs.readFileSync(rutaLineas, 'utf8'));
const filtradas = crudas.filter((l) => !(l.h <= 8.5 && /^(Prohibida la reventa|o fotocopiar)/.test(l.s)) && !/^Documento de referencia del sistema 5\.1\. \d+$/.test(l.s));
// Los superíndices vienen como renglón aparte: «0,03 m» + «3» es «0,03 m³»
const L = [];
filtradas.forEach((l, k) => {
  if (l.h < 8 && /^[23]$/.test(l.s)) {
    const sig = filtradas[k + 1], marca = l.s === '3' ? '³' : '²';
    if (sig) sig.s = sig.s.replace(/(\d)\s*m(?=[^a-záéíóúñ]|[a-z])/, '$1 m' + marca + ' ').replace(/ ([.,])/g, '$1').replace(/\s+/g, ' ').trim();
    return;
  }
  L.push(l);
});

// Margen izquierdo real de cada columna de cada página
const margen = new Map();
L.forEach((l) => { const k = l.p + '-' + l.c; if (l.h >= 9.5 && l.h <= 10.5 && (!margen.has(k) || l.x < margen.get(k))) margen.set(k, l.x); });
const sangria = (l) => l.x - (margen.get(l.p + '-' + l.c) ?? l.x) > 5;
const fuente = (l) => (l.t[0] ? l.t[0].f : '');
const negrita = (l) => /Bold/.test(fuente(l));
const cursiva = (l) => /Italic/.test(fuente(l)) && !/Bold/.test(fuente(l));
const titulo = (l) => l.h >= 10.8;

function unir(a, b) {
  if (!a) return b;
  // Palabra partida al final del renglón: «herra-» + «mientas»
  if (/[a-záéíóúüñ]-$/.test(a) && /^[a-záéíóúüñ]/.test(b)) return a.slice(0, -1) + b;
  return a + ' ' + b;
}
const limpiar = (s) => s.replace(/\s+/g, ' ').replace(/ ([,.;:])/g, '$1').trim();

// Agrupa renglones en párrafos: empieza uno nuevo una línea con sangría, una viñeta o un título en negrita y cursiva
function parrafos(lineas) {
  const res = [];
  lineas.forEach((l, i) => {
    const vineta = /^[•·]/.test(l.s), actual = res[res.length - 1] || '';
    // Una viñeta sigue en sus renglones colgantes y termina al volver al margen. Con sangría y seguido del margen es un párrafo normal.
    const enVineta = /^[•·]/.test(actual), sig = lineas[i + 1];
    const parrafoNormal = sangria(l) && /[.:]$/.test(actual) && sig && !sangria(sig) && !/^[•·]/.test(sig.s);
    const nuevo = i === 0 || vineta || negrita(l) || (enVineta ? !sangria(l) || parrafoNormal : sangria(l));
    if (nuevo) res.push(l.s); else res[res.length - 1] = unir(actual, l.s);
  });
  return res.map(limpiar);
}

/* ---------- Conjuros ---------- */
function conjuros() {
  const salida = {}, faltan = [];
  P.CONJUROS.forEach((s) => {
    const i = L.findIndex((l, k) => l.s === s.nombre && l.h >= 11 && l.h < 13 && /^Tiempo de lanzamiento/.test((L[k + 2] || {}).s || ''));
    if (i < 0) { faltan.push(s.nombre); return; }
    const tipo = L[i + 1].s;
    const lleva = (clave, ini) => {
      let k = ini, v = L[k].s.replace(new RegExp('^' + clave + ':\\s*'), '');
      k++;
      while (!negrita(L[k]) && !titulo(L[k]) && !/^(Tiempo de lanzamiento|Alcance|Componentes|Duración):/.test(L[k].s) && clave !== 'Duración') { v = unir(v, L[k].s); k++; }
      return [limpiar(v), k];
    };
    let k = i + 2;
    const [tiempo, k1] = lleva('Tiempo de lanzamiento', k);
    const [alcance, k2] = lleva('Alcance', k1);
    const [componentes, k3] = lleva('Componentes', k2);
    const [duracion, k4] = lleva('Duración', k3);
    k = k4;
    const cuerpo = [];
    while (L[k] && !titulo(L[k])) cuerpo.push(L[k++]);
    salida[s.id] = { nombre: s.nombre, tipo, tiempo, alcance, componentes, duracion, texto: parrafos(cuerpo) };
  });
  return { salida, faltan };
}

/* ---------- Listas de conjuros por clase: comprueba que el catálogo de la app coincida ---------- */
function revisarListas() {
  const clases = { bardo: 'bardo', brujo: 'brujo', clerigo: 'clérigo', druida: 'druida', hechicero: 'hechicero', mago: 'mago' };
  const avisos = [];
  Object.entries(clases).forEach(([id, n]) => {
    const i = L.findIndex((l) => l.s === 'Conjuros de ' + n && l.h >= 11);
    if (i < 0) { avisos.push('sin lista: ' + n); return; }
    const nombres = new Set();
    let nivel = null;
    for (let k = i + 1; k < L.length; k++) {
      const s = L[k].s;
      if (/^Trucos/.test(s)) nivel = 0;
      else if (/^Nivel 1/.test(s)) nivel = 1;
      else if (/^Nivel 2/.test(s)) break;
      else if (nivel !== null) nombres.add(s);
    }
    P.CONJUROS.filter((c) => c.clases.includes(id)).forEach((c) => { if (!nombres.has(c.nombre)) avisos.push(`${c.nombre} no está en la lista de ${n}`); });
    P.CONJUROS.filter((c) => !c.clases.includes(id) && nombres.has(c.nombre)).forEach((c) => avisos.push(`${c.nombre} sí está en la lista de ${n} y la app no lo tiene`));
  });
  return avisos;
}

/* ---------- Criaturas ---------- */
const NUMERO = { un: 1, una: 1, uno: 1, otro: 1, otra: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8 };
const dado = (s) => s.replace(/\s+/g, '').replace('−', '-');

function ataque(nombre, texto) {
  const a = { n: nombre, d: texto };
  const b = texto.match(/\+(\d+) a impactar/);
  if (!b || !/Ataque/.test(texto.slice(0, 60))) return a;
  a.b = +b[1];
  a.dist = /a distancia/.test(texto.slice(0, 70));
  const al = texto.match(/alcance ([\d,/]+ m)/);
  if (al) a.al = al[1];
  const imp = texto.match(/Impacto:\s*(\d+)(?:\s*\(([^)]+)\))?\s*de daño\s+(?:de\s+)?([a-záéíóúñ]+)/i);
  if (imp) {
    a.dn = imp[2] ? dado(imp[2]) : imp[1];
    a.ti = imp[3];
    const extras = [...texto.slice(imp.index + imp[0].length).matchAll(/m[aá]s\s+(\d+)(?:\s*\(([^)]+)\))?\s*de daño\s+(?:de\s+)?([a-záéíóúñ]+)/gi)];
    if (extras.length) a.ex = extras.map((x) => ({ dn: x[2] ? dado(x[2]) : x[1], ti: x[3] }));
  }
  return a;
}

// «realiza tres ataques: uno con su mordisco y dos con sus garras»
function multiataque(texto, acciones) {
  const q = texto.match(/(?:realiza|hace|efect[uú]a|lleva a cabo)\s+(un|una|dos|tres|cuatro|cinco|seis|siete|ocho)\s+ataques?\b(.*)$/i);
  if (!q) return null;
  const total = NUMERO[q[1].toLowerCase()];
  const armas = acciones.filter((a) => a.dn);
  const sing = (s) => s.toLowerCase().replace(/\(.*\)/, '').trim().replace(/s$/, '');
  const buscar = (s) => { const x = sing(s); return armas.find((a) => sing(a.n) === x) || armas.find((a) => sing(a.n).includes(x) || x.includes(sing(a.n))); };
  const resto = q[2].split(/[.;]/)[0];
  const solo = resto.match(/^\s+(?:con|de)\s+(?:su|sus|la|el)\s+([a-záéíóúñ ]+)/i);
  if (solo && buscar(solo[1])) return [{ q: total, a: buscar(solo[1]).n }];
  const res = [];
  resto.replace(/^[:\s]+/, '').split(/,| y /).map((s) => s.trim()).filter(Boolean).forEach((p) => {
    const m = p.match(/^(uno|una|otro|otra|dos|tres|cuatro)\s+(?:ataques?\s+)?(?:con|de)\s+(?:su|sus|la|el|las|los)?\s*(.+)$/i);
    if (m && buscar(m[2])) res.push({ q: NUMERO[m[1].toLowerCase()], a: buscar(m[2]).n });
  });
  return res.reduce((s, x) => s + x.q, 0) === total ? res : [{ q: total }];
}

function criaturas() {
  const res = [], malas = [];
  const inicios = [];
  L.forEach((l, k) => { if (/^Clase de Armadura:/.test(l.s)) inicios.push(k); });
  inicios.forEach((k, idx) => {
    let a = k - 1;
    while (a >= 0 && !negrita(L[a])) a--;
    const nombre = limpiar(L[a].s);
    const tipo = limpiar(L.slice(a + 1, k).map((l) => l.s).join(' '));
    const finBloque = (() => {
      const sig = inicios[idx + 1] ?? L.length;
      let f = sig - 1;
      // Retrocede hasta el título de la siguiente criatura
      while (f > k && !negrita(L[f])) f--;
      for (let z = k + 1; z < sig; z++) if (L[z].h >= 13) return z; // título de sección o de familia
      return f;
    })();
    const c = { n: nombre, t: tipo };
    const campos = {};
    let z = k, stats = null;
    const claves = /^(Clase de Armadura|Puntos de golpe|Velocidad|Tiradas de salvación|Habilidades|Vulnerabilidad a daño|Resistencia a daño|Inmunidad a daño|Inmunidad a estados|Sentidos|Idiomas|Desafío):\s*(.*)$/;
    let actual = null;
    for (; z < finBloque; z++) {
      const l = L[z];
      if (/^FUE DES CON INT SAB CAR/.test(l.s)) { stats = L[z + 1].s; z++; actual = null; continue; }
      const m = l.s.match(claves);
      if (m) { actual = m[1]; campos[actual] = m[2]; if (actual === 'Desafío' && !/\)/.test(m[2]) === false) { z++; break; } continue; }
      if (actual === 'Desafío') break;
      if (actual) campos[actual] = unir(campos[actual], l.s);
    }
    const ca = (campos['Clase de Armadura'] || '').match(/^(\d+)(?:\s*\((.*)\))?/);
    const pg = (campos['Puntos de golpe'] || '').match(/^(\d+)(?:\s*\(([^)]+)\))?/);
    const vd = (campos['Desafío'] || '').match(/^([\d/]+)\s*\(([\d.\s]+)\s*PX\)/);
    const nums = stats ? [...stats.matchAll(/(\d+)\s*\(/g)].map((m) => +m[1]) : [];
    if (!ca || !pg || !vd || nums.length !== 6) { malas.push(`${nombre} [ca:${!!ca} pg:${!!pg} vd:${!!vd} car:${nums.length}]`); return; }
    Object.assign(c, { ca: +ca[1], pg: +pg[1], dg: pg[2] ? dado(pg[2]) : '', v: limpiar(campos.Velocidad || ''), c: nums, vd: vd[1], px: +vd[2].replace(/\D/g, '') });
    if (ca[2]) c.cn = ca[2];
    [['Tiradas de salvación', 'sal'], ['Habilidades', 'hab'], ['Vulnerabilidad a daño', 'vul'], ['Resistencia a daño', 'res'], ['Inmunidad a daño', 'inm'], ['Inmunidad a estados', 'est'], ['Sentidos', 'sen'], ['Idiomas', 'idi']].forEach(([x, y]) => { if (campos[x]) c[y] = limpiar(campos[x]); });

    // Rasgos, acciones, reacciones y acciones legendarias
    const secciones = { r: [], a: [], re: [], l: [] };
    let sec = 'r', grupo = [];
    const cerrar = () => {
      if (!grupo.length) return;
      const lead = (() => { const r = []; for (const z of grupo[0].t) { if (!/Bold/.test(z.f)) break; r.push(z.s); } return r.join('').trim(); })();
      parrafos(grupo).forEach((p, i) => {
        if (i === 0 && lead) secciones[sec].push([limpiar(lead).replace(/\.$/, ''), limpiar(p.slice(lead.trim().length))]);
        else if (secciones[sec].length) secciones[sec][secciones[sec].length - 1][1] += '\n' + p;
        else secciones[sec].push(['', p]);
      });
      grupo = [];
    };
    for (; z < finBloque; z++) {
      const l = L[z];
      if (titulo(l) && l.h < 13) {
        if (/^Acciones legendarias/i.test(l.s)) { cerrar(); sec = 'l'; continue; }
        if (/^Acciones/i.test(l.s)) { cerrar(); sec = 'a'; continue; }
        if (/^Reacci/i.test(l.s)) { cerrar(); sec = 're'; continue; }
        cerrar(); break; // título que ya no pertenece a la criatura
      }
      if (negrita(l)) cerrar();
      grupo.push(l);
    }
    cerrar();
    if (secciones.r.length) c.r = secciones.r;
    const acciones = secciones.a.map(([n, d]) => ataque(n, d));
    if (acciones.length) c.a = acciones;
    const mu = acciones.find((x) => /^(Multiataque|Ataque múltiple)/i.test(x.n));
    if (mu) { const m = multiataque(mu.d, acciones); if (m) c.m = m; }
    if (secciones.re.length) c.re = secciones.re;
    if (secciones.l.length) c.l = secciones.l;
    res.push(c);
  });
  return { res, malas };
}

/* ---------- Objetos mágicos ---------- */
function objetos() {
  const res = [];
  const tipoRe = /^(Anillo|Arma|Armadura|Bastón|Cetro|Objeto maravilloso|Pergamino|Poción|Vara|Varita)\b/;
  L.forEach((l, k) => {
    if (!(l.h >= 11 && l.h < 13) || !L[k + 1] || !tipoRe.test(L[k + 1].s) || !cursiva(L[k + 1])) return;
    let z = k + 1, cab = '';
    while (cursiva(L[z])) { cab = unir(cab, L[z].s); z++; }
    const rar = cab.match(/(muy rar[oa]|legendari[oa]|infrecuente|rar[oa]|común|varía|variable)/i);
    const cuerpo = [];
    while (L[z] && !titulo(L[z])) cuerpo.push(L[z++]);
    res.push({ n: limpiar(l.s), t: limpiar(cab), r: rar ? rar[1].toLowerCase().replace(/rar[oa]$/, 'rara').replace(/legendari[oa]/, 'legendaria') : 'varía', s: /sintoniz/i.test(cab) ? 1 : 0, d: parrafos(cuerpo) });
  });
  return res;
}

/* ---------- Trampas ---------- */
function trampas() {
  const ini = L.findIndex((l) => l.s === 'Trampas de ejemplo');
  const res = [];
  for (let k = ini + 1; k < L.length; k++) {
    const l = L[k];
    if (l.h >= 13) break;
    if (l.h >= 11 && L[k + 1] && /^Trampa /.test(L[k + 1].s)) {
      let z = k + 2;
      const cuerpo = [];
      while (L[z] && !titulo(L[z])) cuerpo.push(L[z++]);
      const d = parrafos(cuerpo), texto = d.join(' ');
      const cds = (re) => { const m = texto.match(re); return m ? +m[1] : null; };
      res.push({ n: limpiar(l.s), t: L[k + 1].s, d, detectar: cds(/\((?:Percepción|Investigación)\)[^.]*?CD (\d+)/), desactivar: cds(/(?:desactivar|inutilizar|bloquear|atascar)[^.]*?CD (\d+)/i) || cds(/herramientas de ladrón[^.]*?CD (\d+)/i), salvacion: cds(/salvación de [A-Za-záéíóú]+ (?:con|de) CD (\d+)/), ataque: cds(/\+(\d+) a impactar/), dano: (texto.match(/\((\d+d\d+(?: ?\+ ?\d+)?)\) de daño/) || [])[1] || null });
      k = z - 1;
    }
  }
  return res;
}

/* ---------- Estados ---------- */
function estados() {
  const ini = L.findIndex((l) => l.s === 'Estados' && l.h >= 13);
  const res = [];
  const nombres = ['Agarrado', 'Apresado', 'Asustado', 'Aturdido', 'Cegado', 'Derribado', 'Ensordecido', 'Envenenado', 'Hechizado', 'Incapacitado', 'Inconsciente', 'Invisible', 'Paralizado', 'Petrificado'];
  nombres.forEach((n) => {
    const i = L.findIndex((l, k) => k > ini && l.s === n && l.h >= 10.8);
    if (i < 0) return;
    let z = i + 1;
    const cuerpo = [];
    while (L[z] && !titulo(L[z])) cuerpo.push(L[z++]);
    res.push({ n, d: parrafos(cuerpo) });
  });
  return res;
}

/* ---------- Escritura ---------- */
const CABECERA = `/* ${P.ATRIBUCION}\n   Archivo generado desde el PDF oficial en español: no editar a mano. */\n`;
const escribir = (archivo, cuerpo) => { const r = path.join(destino, archivo); fs.writeFileSync(r, CABECERA + cuerpo + '\n'); console.log(archivo, Math.round(fs.statSync(r).size / 1024) + ' KB'); };

const { salida: co, faltan } = conjuros();
const { res: cr, malas } = criaturas();
const ob = objetos(), tr = trampas(), es = estados();
escribir('srd-conjuros.js', 'window.PJ.SRD_CONJUROS = ' + JSON.stringify(co) + ';');
escribir('srd-dm.js', 'window.PJ.SRD_CRIATURAS = ' + JSON.stringify(cr) + ';\nwindow.PJ.SRD_OBJETOS = ' + JSON.stringify(ob) + ';\nwindow.PJ.SRD_TRAMPAS = ' + JSON.stringify(tr) + ';\nwindow.PJ.SRD_ESTADOS = ' + JSON.stringify(es) + ';');

console.log('\nconjuros', Object.keys(co).length, 'faltan:', faltan.join(', ') || 'ninguno');
console.log('listas:', revisarListas().join(' · ') || 'coinciden');
const conAtaque = cr.filter((c) => (c.a || []).some((a) => a.dn));
const sinAcc = cr.filter((c) => !c.a);
console.log('criaturas', cr.length, '· con ataque automatizable', conAtaque.length, '· sin acciones', sinAcc.length, sinAcc.slice(0, 8).map((c) => c.n).join(', '));
console.log('no leídas:', malas.length, malas.slice(0, 12).join(' | '));
const conMulti = cr.filter((c) => c.m);
console.log('multiataque', conMulti.length, 'detallado', conMulti.filter((c) => c.m[0].a).length);
const multiSin = cr.filter((c) => (c.a || []).some((a) => /^(Multiataque|Ataque múltiple)/i.test(a.n)) && !c.m);
console.log('multiataque sin leer', multiSin.length, multiSin.slice(0, 5).map((c) => c.n + ': ' + c.a.find((a) => /^(Multi|Ataque m)/i.test(a.n)).d.slice(0, 70)).join(' | '));
console.log('objetos', ob.length, Object.entries(ob.reduce((m, o) => { m[o.r] = (m[o.r] || 0) + 1; return m; }, {})).map((x) => x.join(':')).join(' '));
console.log('trampas', tr.length, tr.map((t) => `${t.n}[det ${t.detectar} des ${t.desactivar} sal ${t.salvacion} atq ${t.ataque} dñ ${t.dano}]`).join(' · '));
console.log('estados', es.length);
