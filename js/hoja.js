/* Hoja de personaje dibujada en lienzo. La misma función sirve para la pantalla, el JPEG y el PDF. */
(function (P) {
  const W = 1700, H = 2200, M = 84;
  P.HOJA_W = W; P.HOJA_H = H;

  const TEMAS = {
    noche: { a: '#2C2042', b: '#0C0814', tarjeta: 'rgba(255,255,255,.06)', borde: 'rgba(233,200,124,.42)', texto: '#F8F1E2', tenue: '#C9BEAC', oro: '#EBCB82', linea: 'rgba(233,200,124,.24)', sello: '#FFF8E8', grano: 'rgba(255,255,255,.045)', anillos: 0.11 },
    pergamino: { a: '#FCF6E8', b: '#EADDC0', tarjeta: 'rgba(255,255,255,.66)', borde: 'rgba(120,86,22,.55)', texto: '#2A2016', tenue: '#5C4D39', oro: '#7A5812', linea: 'rgba(120,86,22,.3)', sello: '#FFFAEE', grano: 'rgba(90,60,20,.05)', anillos: 0.1 },
  };
  const familia = { disp: 'Almendra, Georgia, serif', grab: 'Cinzel, "Times New Roman", serif', txt: '"Figtree Variable", "Segoe UI", system-ui, sans-serif' };

  function azarSemilla(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mezclar(hex, otro, t) { const a = rgb(hex), b = rgb(otro); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

  function escribir(d, s, x, y, o = {}) {
    if (s === null || s === undefined || s === '') return 0;
    s = String(s);
    const { ctx } = d;
    let p = o.p || 28;
    const fam = familia[o.f || 'txt'], b = o.b || (o.f === 'txt' || !o.f ? 500 : 700);
    ctx.font = `${b} ${p}px ${fam}`;
    if (o.max) { const w = ctx.measureText(s).width; if (w > o.max) { p = Math.max(o.min || 14, Math.floor((p * o.max) / w)); ctx.font = `${b} ${p}px ${fam}`; } }
    ctx.textAlign = o.a || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = o.c || d.t.texto;
    if (o.esp !== undefined && 'letterSpacing' in ctx) ctx.letterSpacing = o.esp + 'px';
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const ancho = ctx.measureText(s).width;
    if (d.reg) d.reg.push({ s, x: o.a === 'center' ? x - ancho / 2 : o.a === 'right' ? x - ancho : x, y, p, pag: d.pag });
    return ancho;
  }

  function lineas(d, s, ancho, o) {
    const { ctx } = d;
    ctx.font = `${o.b || 500} ${o.p}px ${familia[o.f || 'txt']}`;
    const res = [];
    String(s).split('\n').forEach((parrafo) => {
      let actual = '';
      parrafo.split(/\s+/).forEach((w) => {
        const prueba = actual ? actual + ' ' + w : w;
        if (ctx.measureText(prueba).width > ancho && actual) { res.push(actual); actual = w; } else actual = prueba;
      });
      if (actual) res.push(actual);
    });
    return res;
  }

  function parrafo(d, s, x, y, ancho, lh, o = {}) {
    let ls = lineas(d, s, ancho, o);
    if (o.maxLineas && ls.length > o.maxLineas) {
      ls = ls.slice(0, o.maxLineas);
      ls[ls.length - 1] = ls[ls.length - 1].replace(/\s*\S*$/, '') + '…';
    }
    ls.forEach((l, i) => escribir(d, l, x, y + i * lh, o));
    return ls.length * lh;
  }

  function icono(d, id, x, y, tam, color) {
    const ruta = P.ICONOS[id];
    if (!ruta) return;
    const { ctx } = d;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(tam / 512, tam / 512);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(ruta));
    ctx.restore();
  }

  function gema(ctx, x, y, w, h, c = 22) {
    ctx.beginPath();
    ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath();
  }

  function tarjeta(d, x, y, w, h, o = {}) {
    const { ctx, t } = d;
    gema(ctx, x, y, w, h, o.c ?? 18);
    ctx.fillStyle = t.tarjeta; ctx.fill();
    ctx.lineWidth = o.lw || 2; ctx.strokeStyle = t.borde; ctx.stroke();
  }

  function fondo(d) {
    const { ctx, t, acento } = d;
    const g = ctx.createRadialGradient(W / 2, 260, 120, W / 2, 760, 1650);
    g.addColorStop(0, t.a); g.addColorStop(1, t.b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const h = ctx.createRadialGradient(262, 244, 40, 262, 244, 900);
    h.addColorStop(0, acento + (d.oscuro ? '55' : '33')); h.addColorStop(1, acento + '00');
    ctx.fillStyle = h; ctx.fillRect(0, 0, W, H);

    // Círculo arcano detrás del blasón
    ctx.save();
    ctx.globalAlpha = t.anillos; ctx.strokeStyle = t.oro; ctx.translate(262, 244);
    [420, 520, 640].forEach((r, i) => {
      ctx.lineWidth = i === 1 ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    });
    for (let i = 0; i < 72; i++) {
      ctx.rotate((Math.PI * 2) / 72);
      ctx.beginPath(); ctx.moveTo(0, -520); ctx.lineTo(0, i % 6 ? -536 : -560); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();

    const r = azarSemilla(20);
    ctx.fillStyle = t.grano;
    for (let i = 0; i < 2600; i++) ctx.fillRect(r() * W, r() * H, 2, 2);
  }

  function marco(d) {
    const { ctx, t } = d;
    const a = 34, b = 48;
    ctx.strokeStyle = t.oro; ctx.lineWidth = 3;
    gema(ctx, a, a, W - 2 * a, H - 2 * a, 40); ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
    gema(ctx, b, b, W - 2 * b, H - 2 * b, 34); ctx.stroke();
    ctx.globalAlpha = 1;
    // Esquinas con rombo y filigrana
    [[a + 12, a + 12, 1, 1], [W - a - 12, a + 12, -1, 1], [a + 12, H - a - 12, 1, -1], [W - a - 12, H - a - 12, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
      ctx.fillStyle = t.oro;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(28, 14); ctx.lineTo(14, 28); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = t.oro; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(34, 14); ctx.bezierCurveTo(70, 14, 86, 2, 120, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 34); ctx.bezierCurveTo(14, 70, 2, 86, 10, 120); ctx.stroke();
      ctx.restore();
    });
  }

  function blason(d, cx, cy, r, c) {
    const { ctx, t, acento } = d;
    ctx.save();
    // Halo y anillos
    const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.35);
    halo.addColorStop(0, acento + '66'); halo.addColorStop(1, acento + '00');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2); ctx.fill();
    const disco = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    disco.addColorStop(0, mezclar(acento, '#FFFFFF', 0.18)); disco.addColorStop(0.55, acento); disco.addColorStop(1, mezclar(acento, '#000000', 0.5));
    ctx.fillStyle = disco; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = t.oro; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = r * 0.012; ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2, r1 = r * 1.06, r2 = r * (i % 5 ? 1.1 : 1.15);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.lineWidth = r * 0.016; ctx.stroke();
    }
    const tam = r * 1.2;
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = r * 0.1; ctx.shadowOffsetY = r * 0.03;
    icono(d, c.clase ? c.clase.icono : 'd20', cx - tam / 2, cy - tam / 2, tam, t.sello);
    ctx.restore();
    if (c.raza) {
      const rr = r * 0.36, bx = cx + r * 0.74, by = cy + r * 0.74;
      ctx.fillStyle = d.oscuro ? '#17101F' : '#FBF4E2';
      ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = t.oro; ctx.lineWidth = r * 0.03; ctx.stroke();
      icono(d, c.raza.icono, bx - rr * 0.72, by - rr * 0.72, rr * 1.44, t.oro);
    }
  }

  function filete(d, x1, x2, y) {
    const { ctx, t } = d;
    const c = (x1 + x2) / 2;
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, t.oro); g.addColorStop(0.6, t.oro); g.addColorStop(1, t.linea);
    ctx.strokeStyle = g; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.fillStyle = t.oro;
    ctx.beginPath(); ctx.moveTo(c - 12, y); ctx.lineTo(c, y - 10); ctx.lineTo(c + 12, y); ctx.lineTo(c, y + 10); ctx.closePath(); ctx.fill();
  }

  function titulo(d, s, x, y, ancho) {
    escribir(d, s.toUpperCase(), x, y, { f: 'grab', p: 30, c: d.t.oro, esp: 1.5 });
    const { ctx, t } = d;
    ctx.strokeStyle = t.linea; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x + ancho, y + 14); ctx.stroke();
  }

  function punto(d, x, y, lleno, doble) {
    const { ctx, t, acentoTexto } = d;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.lineWidth = 2.2; ctx.strokeStyle = lleno ? acentoTexto : t.tenue;
    if (lleno) { ctx.fillStyle = acentoTexto; ctx.fill(); }
    ctx.stroke();
    if (doble) { ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = acentoTexto; ctx.stroke(); }
  }

  function renglones(d, x, y, ancho, n, lh) {
    const { ctx, t } = d;
    ctx.strokeStyle = t.linea; ctx.lineWidth = 1.5;
    for (let i = 1; i <= n; i++) { ctx.beginPath(); ctx.moveTo(x, y + i * lh); ctx.lineTo(x + ancho, y + i * lh); ctx.stroke(); }
  }

  /* ---------- Página 1 ---------- */
  function pagina1(d, pj, c) {
    const { t, ctx } = d;
    fondo(d); marco(d);
    blason(d, 262, 244, 150, c);

    const xN = 462, anchoN = W - M - xN;
    if (pj.nombre) escribir(d, pj.nombre, xN, 188, { f: 'disp', p: 112, max: anchoN, min: 54 });
    else { escribir(d, 'Nombre del personaje', xN, 168, { p: 30, c: t.tenue }); renglones(d, xN, 120, anchoN, 1, 66); }
    const sub = [c.nombreRaza, c.clase && c.clase.nombre, pj.claseId || pj.razaId ? 'Nivel ' + c.nivel : ''].filter(Boolean).join('  ·  ');
    if (sub) escribir(d, sub, xN, 252, { p: 42, b: 600, c: t.tenue, max: anchoN });
    filete(d, xN, W - M, 286);

    const meta = [['Trasfondo', c.trasfondo && c.trasfondo.nombre], ['Alineamiento', pj.alineamiento], ['Jugador', pj.jugador], ['Experiencia', pj.nombre || pj.px ? (pj.px || 0) + ' PX' : '']];
    const mw = (anchoN - 3 * 16) / 4;
    meta.forEach(([k, v], i) => {
      const x = xN + i * (mw + 16);
      escribir(d, k.toUpperCase(), x, 332, { f: 'grab', p: 19, c: t.oro, esp: 0.8 });
      if (v) escribir(d, v, x, 372, { p: 31, b: 600, max: mw - 4 });
      else renglones(d, x, 330, mw - 4, 1, 44);
    });

    // Gemas de características
    const gy = 424, gh = 238, sep = 18, gw = (W - 2 * M - 5 * sep) / 6;
    P.CARACT.forEach((a, i) => {
      const x = M + i * (gw + sep), v = c.caract[a.id];
      gema(ctx, x, gy, gw, gh, 28);
      const g = ctx.createLinearGradient(0, gy, 0, gy + gh);
      g.addColorStop(0, d.acento + (d.oscuro ? '4D' : '38')); g.addColorStop(0.55, d.acento + '0A');
      ctx.fillStyle = t.tarjeta; ctx.fill();
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = t.borde; ctx.stroke();
      icono(d, a.id, x + 18, gy + 16, 40, t.oro);
      escribir(d, a.abrev, x + gw - 18, gy + 50, { f: 'grab', p: 32, c: t.oro, a: 'right', esp: 1 });
      if (v.mod !== null) escribir(d, P.signo(v.mod), x + gw / 2, gy + 152, { f: 'grab', p: 94, a: 'center' });
      else { ctx.strokeStyle = t.linea; ctx.lineWidth = 2; gema(ctx, x + gw / 2 - 52, gy + 74, 104, 84, 12); ctx.stroke(); }
      escribir(d, 'Puntuación', x + 26, gy + 208, { p: 21, c: t.tenue });
      if (v.total !== null) escribir(d, v.total, x + gw - 26, gy + 211, { f: 'grab', p: 34, a: 'right' });
      else { ctx.strokeStyle = t.tenue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + gw - 72, gy + 214); ctx.lineTo(x + gw - 24, gy + 214); ctx.stroke(); }
    });

    // Vitales
    const vy = 680, vh = 148;
    const vit = [
      ['ca', 'Defensa (CA)', c.ca.valor], ['pg', 'Vida máxima', c.pgMax], ['iniciativa', 'Iniciativa', c.hayPuntuaciones ? P.signo(c.iniciativa) : ''],
      ['velocidad', 'Velocidad', c.velocidad ? String(c.velocidad).replace('.', ',') + ' m' : ''], ['competencia', 'Competencia', pj.razaId || pj.claseId ? P.signo(c.comp) : ''], ['percepcion', 'Perc. pasiva', c.hayPuntuaciones ? c.percepcionPasiva : ''],
    ];
    vit.forEach(([id, k, v], i) => {
      const x = M + i * (gw + sep);
      tarjeta(d, x, vy, gw, vh);
      icono(d, id, x + 16, vy + 16, 34, d.acentoTexto);
      escribir(d, k, x + 58, vy + 42, { p: 23, b: 600, c: t.tenue, max: gw - 70 });
      if (v !== null && v !== undefined && v !== '') escribir(d, v, x + gw / 2, vy + 122, { f: 'grab', p: String(v).length > 4 ? 46 : 62, a: 'center' });
    });

    // Columna izquierda
    const yIzq = 870, xI = M, wI = 740;
    titulo(d, 'Salvaciones', xI, yIzq, wI);
    P.CARACT.forEach((a, i) => {
      const col = i % 2, x = xI + col * (wI / 2 + 8), y = yIzq + 52 + Math.floor(i / 2) * 44;
      const s = c.salvaciones[a.id];
      punto(d, x + 12, y - 9, s.comp);
      escribir(d, a.nombre, x + 36, y, { p: 27, b: s.comp ? 700 : 500 });
      if (c.hayPuntuaciones) escribir(d, P.signo(s.bono), x + wI / 2 - 16, y, { f: 'grab', p: 28, a: 'right', c: s.comp ? t.texto : t.tenue });
    });
    const yH = yIzq + 200;
    titulo(d, 'Habilidades', xI, yH, wI);
    c.habilidades.forEach((h, i) => {
      const y = yH + 52 + i * 41.5;
      punto(d, xI + 12, y - 9, h.comp, h.pericia);
      const w = escribir(d, h.nombre, xI + 36, y, { p: 27, b: h.comp ? 700 : 500 });
      escribir(d, h.car.toUpperCase(), xI + 36 + w + 14, y, { f: 'grab', p: 17, c: t.tenue, b: 600 });
      if (c.hayPuntuaciones) escribir(d, P.signo(h.bono), xI + wI - 8, y, { f: 'grab', p: 28, a: 'right', c: h.comp ? t.texto : t.tenue });
      ctx.strokeStyle = t.linea; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xI + 36, y + 11); ctx.lineTo(xI + wI, y + 11); ctx.stroke();
    });

    // Columna derecha
    const xD = xI + wI + 36, wD = W - M - xD;
    titulo(d, 'Mis ataques', xD, yIzq, wD);
    const cA = [xD, xD + wD * 0.5, xD + wD * 0.68];
    [['Arma o truco', cA[0]], ['Acertar', cA[1]], ['Daño', cA[2]]].forEach(([s, x]) => escribir(d, s, x, yIzq + 44, { p: 21, b: 600, c: t.tenue }));
    const ataques = c.ataques.slice(0, 5);
    for (let i = 0; i < 5; i++) {
      const y = yIzq + 86 + i * 58, a = ataques[i];
      if (a) {
        escribir(d, a.nombre, cA[0], y, { p: 28, b: 700, max: wD * 0.48 });
        if (a.notas) escribir(d, a.notas, cA[0], y + 22, { p: 18, c: t.tenue, max: wD * 0.48 });
        escribir(d, a.salvacion ? 'CD ' + a.cd : 'd20 ' + P.signo(a.acierta), cA[1], y, { f: 'grab', p: 27 });
        escribir(d, a.dado + (a.bonoDano ? ' ' + P.signo(a.bonoDano).replace('+', '+ ').replace('−', '− ') : ''), cA[2], y, { f: 'grab', p: 27 });
        escribir(d, a.tipo, cA[2], y + 22, { p: 18, c: t.tenue });
      }
      ctx.strokeStyle = t.linea; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xD, y + 32); ctx.lineTo(xD + wD, y + 32); ctx.stroke();
    }

    const yR = yIzq + 412;
    titulo(d, 'Lo que sé hacer', xD, yR, wD);
    const yLimite = 1760;
    let y = yR + 50;
    const lista = c.rasgos;
    const p = lista.length > 7 ? 24 : 26, lh = p + 8;
    if (!lista.length) renglones(d, xD, yR + 30, wD, 8, 44);
    lista.forEach((r) => {
      const texto = r.n + ': ' + r.d;
      const ls = lineas(d, texto, wD - 10, { p });
      if (y + (ls.length - 1) * lh > yLimite) return;
      const anchoN2 = (() => { ctx.font = `800 ${p}px ${familia.txt}`; return ctx.measureText(r.n + ':').width; })();
      ls.forEach((l, i) => {
        if (i === 0) {
          escribir(d, r.n + ':', xD, y, { p, b: 800 });
          escribir(d, l.slice(r.n.length + 1).trimStart(), xD + anchoN2 + 8, y, { p, c: t.texto, max: wD - anchoN2 - 12 });
        } else escribir(d, l, xD, y + i * lh, { p, c: t.texto });
      });
      y += ls.length * lh + 8;
    });

    // Dados de golpe y muerte
    const yM = 1778;
    tarjeta(d, xD, yM, wD, 118);
    escribir(d, 'Dados de golpe', xD + 22, yM + 42, { p: 23, b: 600, c: t.tenue });
    escribir(d, c.dadosGolpe, xD + 22, yM + 92, { f: 'grab', p: 40 });
    const xSm = xD + 262;
    escribir(d, 'Si llegas a 0 de vida', xSm, yM + 42, { p: 23, b: 600, c: t.tenue });
    escribir(d, 'Éxitos', xSm, yM + 90, { p: 24 });
    escribir(d, 'Fallos', xSm + 250, yM + 90, { p: 24 });
    [0, 1, 2].forEach((i) => { punto(d, xSm + 102 + i * 36, yM + 82, false); punto(d, xSm + 346 + i * 36, yM + 82, false); });

    // Chuleta
    const yC = 1924, hC = 172, wC = (W - 2 * M - 3 * sep) / 4;
    const tips = [
      ['Quiero hacer algo', 'Dilo en voz alta. Si el DM lo pide, tira d20 + el número de esa habilidad.'],
      ['Quiero atacar', 'Tira d20 + Acertar. Si alcanzas la CA del enemigo, tira el Daño.'],
      ['En mi turno', 'Me muevo y hago una acción: atacar, lanzar un conjuro, esconderme o ayudar.'],
      ['Ventaja y desventaja', 'Tira dos d20. Con ventaja usa el mayor y con desventaja el menor.'],
    ];
    tips.forEach(([a, b], i) => {
      const x = M + i * (wC + sep);
      tarjeta(d, x, yC, wC, hC);
      escribir(d, a, x + 18, yC + 40, { f: 'disp', p: 30, c: t.oro, max: wC - 30 });
      parrafo(d, b, x + 18, yC + 76, wC - 34, 29, { p: 22, maxLineas: 4 });
    });
    escribir(d, 'Tu Primer Personaje · Reglas del SRD 5.1 (CC BY 4.0) · Iconos de game-icons.net (CC BY 3.0)', W / 2, H - 62, { p: 17, a: 'center', c: t.tenue });
  }

  /* ---------- Página 2 ---------- */
  function pagina2(d, pj, c) {
    const { t, ctx } = d;
    fondo(d); marco(d);
    blason(d, 190, 176, 92, c);
    escribir(d, pj.nombre || 'Mi historia', 330, 172, { f: 'disp', p: 86, max: W - M - 330, min: 44 });
    escribir(d, 'Historia, mochila y magia', 330, 226, { p: 34, b: 600, c: t.tenue });
    filete(d, 330, W - M, 256);

    // Retrato e historia
    const y1 = 304, hR = 560, wR = 600;
    ctx.setLineDash([12, 10]); ctx.strokeStyle = t.borde; ctx.lineWidth = 2;
    gema(ctx, M, y1, wR, hR, 18); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.globalAlpha = 0.09;
    icono(d, c.clase ? c.clase.icono : 'd20', M + wR / 2 - 190, y1 + hR / 2 - 190, 380, t.oro);
    ctx.restore();
    escribir(d, 'DIBUJA A TU PERSONAJE', M + wR / 2, y1 + hR - 26, { f: 'grab', p: 22, a: 'center', c: t.tenue });

    const xH = M + wR + 18, wH = (W - M - xH - 18) / 2, hH = (hR - 18) / 2;
    [['Cómo me comporto', pj.rasgo], ['En qué creo', pj.ideal], ['Qué o a quién protejo', pj.vinculo], ['Qué me mete en problemas', pj.defecto]].forEach(([k, v], i) => {
      const x = xH + (i % 2) * (wH + 18), y = y1 + Math.floor(i / 2) * (hH + 18);
      tarjeta(d, x, y, wH, hH);
      escribir(d, k, x + 20, y + 46, { f: 'disp', p: 31, c: t.oro, max: wH - 36 });
      if (v) parrafo(d, v, x + 20, y + 92, wH - 40, 37, { p: 28, maxLineas: 5 });
      else renglones(d, x + 20, y + 62, wH - 40, 4, 46);
    });

    // Mochila e idiomas
    const y2 = 900, wM = 790;
    titulo(d, 'Mi mochila', M, y2, wM);
    const eq = c.equipo;
    if (eq.length) {
      const mitad = Math.ceil(eq.length / 2);
      eq.slice(0, 16).forEach((e, i) => {
        const col = i < mitad ? 0 : 1, fila = col ? i - mitad : i;
        const x = M + col * (wM / 2 + 6), y = y2 + 50 + fila * 36;
        ctx.fillStyle = t.oro; ctx.beginPath(); ctx.arc(x + 8, y - 8, 4.5, 0, Math.PI * 2); ctx.fill();
        escribir(d, e, x + 24, y, { p: 24, max: wM / 2 - 34 });
      });
    } else renglones(d, M, y2 + 22, wM, 7, 42);
    const yMon = y2 + 322;
    [['Oro (po)', c.oro || ''], ['Plata (pp)', ''], ['Cobre (pc)', '']].forEach(([k, v], i) => {
      const w = (wM - 2 * 14) / 3, x = M + i * (w + 14);
      tarjeta(d, x, yMon, w, 92, { c: 14 });
      escribir(d, k, x + 16, yMon + 34, { p: 21, b: 600, c: t.tenue });
      if (v !== '') escribir(d, v, x + w - 18, yMon + 72, { f: 'grab', p: 40, a: 'right' });
    });

    const xO = M + wM + 36, wO = W - M - xO;
    titulo(d, 'Idiomas y competencias', xO, y2, wO);
    let yO = y2 + 50;
    const dato = (k, v) => {
      escribir(d, k, xO, yO, { p: 22, b: 700, c: t.oro });
      yO += 32;
      yO += parrafo(d, v || '', xO, yO, wO - 6, 31, { p: 25, maxLineas: 3 }) + 12;
    };
    if (c.raza || c.clase || c.trasfondo) {
      if (c.idiomas.length) dato('Idiomas', c.idiomas.join(', '));
      if (c.clase) dato('Armaduras', c.clase.armadura);
      if (c.trasfondo) dato('De tu trasfondo', c.trasfondo.extra);
    } else renglones(d, xO, y2 + 22, wO, 8, 42);

    // Magia o notas
    const y3 = 1346, hM = H - 92 - y3;
    tarjeta(d, M, y3, W - 2 * M, hM, { c: 24, lw: 2.5 });
    const xI = M + 26, wI = W - 2 * M - 52;
    if (c.magia || (!c.clase)) {
      icono(d, 'libro', xI, y3 + 22, 54, t.oro);
      escribir(d, 'Mi magia', xI + 70, y3 + 66, { f: 'disp', p: 56 });
      const m = c.magia;
      const stats = [['Se basa en', m ? P.buscar(P.CARACT, m.car).nombre : ''], ['Dificultad (CD)', m ? m.cd : ''], ['Ataque de conjuro', m ? 'd20 ' + P.signo(m.ataque) : '']];
      stats.forEach(([k, v], i) => {
        const w = 290, x = W - M - 26 - (3 - i) * (w + 12) + 12;
        escribir(d, k, x, y3 + 44, { p: 21, b: 600, c: t.tenue });
        if (v !== '') escribir(d, v, x, y3 + 84, { f: 'grab', p: 32, max: w - 10 });
        else renglones(d, x, y3 + 46, w - 20, 1, 40);
      });

      const yE = y3 + 122;
      escribir(d, 'Espacios de conjuro', xI, yE, { p: 23, b: 700, c: t.oro });
      const filas = m ? m.espacios : [4, 3, 3];
      let xE = xI + 266, algun = false;
      filas.forEach((n, i) => {
        if (!n) return;
        algun = true;
        escribir(d, 'Nivel ' + (i + 1), xE, yE, { p: 23, b: 600 });
        xE += 92;
        for (let j = 0; j < n; j++) { punto(d, xE + j * 34, yE - 8, false); }
        xE += n * 34 + 26;
      });
      if (!algun) escribir(d, 'Sin espacios en este nivel', xE, yE, { p: 23, c: t.tenue });

      const yL = yE + 48, wCol = (wI - 28) / 2;
      const col = (tit, lista, x, n) => {
        escribir(d, tit, x, yL, { p: 23, b: 700, c: t.oro });
        if (!lista.length) { renglones(d, x, yL + 2, wCol, n, 44); return; }
        let yy = yL + 42;
        const pp = lista.length > 5 ? 22 : 24, lh2 = pp + 7;
        lista.forEach((s) => {
          if (yy > y3 + hM - 34) return;
          const w = escribir(d, s.nombre + ':', x, yy, { p: pp, b: 800 });
          const ls = lineas(d, s.d, wCol - w - 12, { p: pp });
          escribir(d, ls[0], x + w + 8, yy, { p: pp });
          let usadas = 1;
          if (ls.length > 1) { escribir(d, ls.slice(1).join(' '), x, yy + lh2, { p: pp, max: wCol }); usadas = 2; }
          yy += usadas * lh2 + 8;
        });
      };
      col('Trucos: sin límite', m ? m.trucos : [], xI, 8);
      col('Conjuros: gastan un espacio', m ? m.conjuros : [], xI + wCol + 28, 8);
    } else {
      icono(d, 'pluma', xI, y3 + 22, 54, t.oro);
      escribir(d, 'Notas de aventura', xI + 70, y3 + 66, { f: 'disp', p: 56 });
      if (pj.notas) parrafo(d, pj.notas, xI, y3 + 130, wI, 40, { p: 28, maxLineas: 14 });
      else renglones(d, xI, y3 + 86, wI, 13, 48);
    }
    escribir(d, 'Tu Primer Personaje · Reglas del SRD 5.1 (CC BY 4.0) · Iconos de game-icons.net (CC BY 3.0)', W / 2, H - 62, { p: 17, a: 'center', c: t.tenue });
  }

  P.hoja = {
    // Dibuja una página en un lienzo ya dimensionado; devuelve el registro de textos para la capa del PDF
    dibujar(lienzo, pj, opciones = {}) {
      const c = P.calcular(pj);
      const ctx = lienzo.getContext('2d');
      const tema = opciones.tema || 'noche';
      const color = c.clase ? c.clase.color : '#C59A4A';
      const oscuro = tema === 'noche';
      const d = { ctx, t: TEMAS[tema], acento: color, acentoTexto: oscuro ? mezclar(color, '#FFFFFF', 0.12) : mezclar(color, '#000000', 0.42), oscuro, reg: opciones.registro || null, pag: opciones.pagina || 1 };
      const escala = lienzo.width / W;
      ctx.save();
      ctx.setTransform(escala, 0, 0, escala, opciones.dy || 0, 0);
      ctx.imageSmoothingQuality = 'high';
      if ((opciones.pagina || 1) === 1) pagina1(d, pj, c); else pagina2(d, pj, c);
      ctx.restore();
      return d.reg;
    },
    lienzo(pj, opciones = {}) {
      const escala = opciones.escala || 1.5;
      const cv = document.createElement('canvas');
      cv.width = Math.round(W * escala); cv.height = Math.round(H * escala);
      P.hoja.dibujar(cv, pj, opciones);
      return cv;
    },
    listas() { return document.fonts ? Promise.all(['700 40px Almendra', '700 40px Cinzel', '500 30px "Figtree Variable"', '800 30px "Figtree Variable"'].map((f) => document.fonts.load(f, 'áñ'))) : Promise.resolve(); },
  };
})(window.PJ);
