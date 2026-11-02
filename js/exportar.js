/* Descargas: JPEG, PDF y QR. El QR guarda el personaje dentro del enlace, sin servidor. */
(function (P) {
  const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const deB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

  async function comprimir(bytes) {
    const cs = new CompressionStream('deflate-raw');
    const w = cs.writable.getWriter(); w.write(bytes); w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  }
  async function descomprimir(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const w = ds.writable.getWriter(); w.write(bytes); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }

  // «z» = comprimido, «r» = crudo. Solo usa letras, números, - y _ para que sobreviva en cualquier enlace.
  P.codificar = async function (pj) {
    const texto = new TextEncoder().encode(JSON.stringify(P.aPaquete(pj)));
    if (window.CompressionStream) {
      try { return 'z' + b64url(await comprimir(texto)); } catch (e) { /* cae al modo sin comprimir */ }
    }
    return 'r' + b64url(texto);
  };
  P.decodificar = async function (token) {
    const crudo = deB64url(token.slice(1));
    const bytes = token[0] === 'z' ? await descomprimir(crudo) : crudo;
    return P.dePaquete(JSON.parse(new TextDecoder().decode(bytes)));
  };

  const esWeb = () => /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname) && !window.claude;
  P.baseEnlace = (propia) => {
    if (propia) return propia.replace(/#.*$/, '');
    return esWeb() ? location.origin + location.pathname : '';
  };
  P.sitioPublicado = esWeb;

  // Baja la carga si el enlace no cabe en un QR que un teléfono lea bien
  P.enlaceQR = async function (pj, base) {
    let copia = pj, recorte = false;
    let enlace = base + '#pj.' + await P.codificar(copia);
    if (enlace.length > 1300) {
      copia = Object.assign({}, pj, { notas: '', rasgo: pj.rasgo.slice(0, 70), ideal: pj.ideal.slice(0, 70), vinculo: pj.vinculo.slice(0, 70), defecto: pj.defecto.slice(0, 70) });
      recorte = true;
      enlace = base + '#pj.' + await P.codificar(copia);
    }
    return { enlace, recorte };
  };

  P.dibujarQR = function (lienzo, texto) {
    const qr = window.qrcode(0, texto.length < 900 ? 'M' : 'L');
    qr.addData(texto, 'Byte');
    qr.make();
    const n = qr.getModuleCount(), borde = 4, tam = Math.max(4, Math.floor(640 / (n + 2 * borde)));
    lienzo.width = lienzo.height = (n + 2 * borde) * tam;
    const x = lienzo.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, lienzo.width, lienzo.height);
    x.fillStyle = '#17101F';
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (qr.isDark(f, c)) x.fillRect((c + borde) * tam, (f + borde) * tam, tam, tam);
    return n;
  };

  P.nombreArchivo = (pj, ext) => 'hoja-' + (P.normalizar(pj.nombre || 'personaje').replace(/\s+/g, '-').replace(/[^a-z0-9ñ-]/g, '') || 'personaje') + '.' + ext;

  // En un sitio normal basta un enlace de descarga; dentro del visor de Claude se usa su función de descargas
  P.guardarArchivo = async function (blob, nombre) {
    if (window.claude && window.claude.use) {
      const d = await window.claude.use('downloads');
      if (d) return d.save({ filename: nombre, data: blob });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return { status: 'saved' };
  };

  const aBlob = (cv, tipo, calidad) => new Promise((ok, mal) => cv.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen.'))), tipo, calidad));

  // Las dos páginas, una debajo de la otra: cómodo de leer en el celular
  P.crearJPEG = async function (pj, tema) {
    await P.hoja.listas();
    const a = P.hoja.lienzo(pj, { tema, pagina: 1, escala: 1 });
    const b = P.hoja.lienzo(pj, { tema, pagina: 2, escala: 1 });
    const hueco = 24, cv = document.createElement('canvas');
    cv.width = a.width; cv.height = a.height + b.height + hueco;
    const x = cv.getContext('2d');
    x.fillStyle = tema === 'noche' ? '#0C0814' : '#EADDC0'; x.fillRect(0, 0, cv.width, cv.height);
    x.drawImage(a, 0, 0); x.drawImage(b, 0, a.height + hueco);
    return aBlob(cv, 'image/jpeg', 0.9);
  };

  P.crearPDF = async function (pj, tema) {
    await P.hoja.listas();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    const ancho = doc.internal.pageSize.getWidth(), alto = doc.internal.pageSize.getHeight();
    const k = ancho / P.HOJA_W;
    doc.setProperties({ title: pj.nombre ? 'Hoja de ' + pj.nombre : 'Hoja de personaje', subject: 'Hoja de personaje de D&D 5.ª edición', creator: 'Tu Primer Personaje', keywords: 'D&D, personaje' });
    for (const pagina of [1, 2]) {
      if (pagina === 2) doc.addPage();
      const registro = [];
      const cv = P.hoja.lienzo(pj, { tema, pagina, escala: 1.5, registro });
      doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, ancho, alto, undefined, 'FAST');
      // Capa de texto invisible: el PDF se puede buscar, copiar y leer con un lector de pantalla
      doc.setFont('helvetica', 'normal');
      registro.forEach((r) => {
        if (r.y < 0 || r.y > P.HOJA_H) return;
        doc.setFontSize(Math.max(4, r.p * k));
        doc.text(r.s.replace(/−/g, '-'), r.x * k, r.y * k, { renderingMode: 'invisible' });
      });
    }
    return doc.output('blob');
  };
})(window.PJ);
