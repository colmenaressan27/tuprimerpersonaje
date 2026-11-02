// Paso 1 de 2: convierte el PDF oficial del SRD 5.1 en líneas con posición y fuente.
// Necesita pdfjs-dist, que no forma parte del sitio: npm i pdfjs-dist (fuera de esta carpeta o sin subirlo).
// Uso: node srd-lineas.mjs SRD_CC_v5.1_ES.pdf lineas.json
import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [entrada, salida] = process.argv.slice(2);
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(entrada)), useSystemFonts: true, disableFontFace: true, fontExtraProperties: true, verbosity: 0 }).promise;
const todas = [];
for (let n = 1; n <= doc.numPages; n++) {
  const pag = await doc.getPage(n);
  const { items } = await pag.getTextContent();
  const ancho = pag.getViewport({ scale: 1 }).width;
  await pag.getOperatorList(); const fuentes = pag.commonObjs;
  const nombre = (id) => { try { return fuentes.has(id) ? fuentes.get(id).name || '' : ''; } catch (e) { return ''; } };
  const lista = items.filter((i) => i.str !== undefined && i.str !== '');
  [0, 1].forEach((col) => {
    const de = lista.filter((i) => (i.transform[4] >= ancho / 2 ? 1 : 0) === col);
    const filas = new Map();
    de.forEach((it) => {
      const y = Math.round(it.transform[5] / 2) * 2;
      if (!filas.has(y)) filas.set(y, []);
      filas.get(y).push(it);
    });
    [...filas.entries()].sort((a, b) => b[0] - a[0]).forEach(([y, l]) => {
      l.sort((a, b) => a.transform[4] - b.transform[4]);
      const s = l.map((x) => x.str).join('').replace(/\s+/g, ' ').trim();
      if (!s) return;
      const trozos = l.filter((x) => x.str.trim()).map((x) => ({ s: x.str, f: nombre(x.fontName) }));
      todas.push({ p: n, c: col, y, x: Math.round(l[0].transform[4] * 10) / 10, h: Math.round(Math.abs(l[0].transform[3]) * 10) / 10, s, t: trozos });
    });
  });
}
fs.writeFileSync(salida, JSON.stringify(todas));
console.log(todas.length + ' líneas');
