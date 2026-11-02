/* Dados 3D con Three.js. El resultado se decide primero con azar criptográfico y la animación termina
   exactamente en esa cara: nunca hay diferencia entre lo que se ve y lo que se anota. */
(function (P) {
  const azar = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % n) + 1; };
  P.azar = azar;

  const HAY_WEBGL = (() => {
    try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  })();
  P.hayWebGL = HAY_WEBGL;

  const TAMANO = { 4: 1.05, 6: 0.86, 8: 0.98, 10: 1, 12: 0.98, 20: 1.06, 100: 1 };
  const PALETA = { cuerpo: 0x6E0F0C, canto: 0xE9C877, tinta: '#FFF3D6' };

  /* ---------- Geometría: cada dado es un poliedro con caras agrupadas por normal ---------- */
  function poligonoBase(lados) {
    const T = window.THREE;
    if (lados === 4) return new T.TetrahedronGeometry(1);
    if (lados === 6) return new T.BoxGeometry(1.25, 1.25, 1.25);
    if (lados === 8) return new T.OctahedronGeometry(1);
    if (lados === 12) return new T.DodecahedronGeometry(1);
    if (lados === 20) return new T.IcosahedronGeometry(1);
    // d10: trapezoedro pentagonal. La altura h deja las cometas planas.
    const c = Math.cos(Math.PI / 5), h = (1 - c) / (1 + c), v = [];
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5; v.push(new T.Vector3(Math.cos(a), (i % 2 ? 1 : -1) * h, Math.sin(a))); }
    v.push(new T.Vector3(0, 1, 0), new T.Vector3(0, -1, 0));
    return new T.ConvexGeometry(v);
  }

  function carasDe(geo) {
    const T = window.THREE;
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position, grupos = new Map();
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3(), ab = new T.Vector3(), ac = new T.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
      if (n.lengthSq() < 1e-9) continue;
      n.normalize();
      const k = [n.x, n.y, n.z].map((x) => x.toFixed(2)).join();
      if (!grupos.has(k)) grupos.set(k, { normal: n.clone(), puntos: [] });
      grupos.get(k).puntos.push(a.clone(), b.clone(), c.clone());
    }
    return [...grupos.values()].map((f) => {
      const unicos = [];
      f.puntos.forEach((q) => { if (!unicos.some((u) => u.distanceToSquared(q) < 1e-5)) unicos.push(q); });
      const centro = unicos.reduce((s, q) => s.add(q), new T.Vector3()).divideScalar(unicos.length);
      return { normal: f.normal, centro, vertices: unicos, distancia: centro.dot(f.normal) };
    });
  }

  // Reparte los números para que caras opuestas sumen lados + 1 cuando existe cara opuesta
  function numerar(caras, lados) {
    const T = window.THREE;
    if (lados === 4) return caras;
    const orden = [...caras].sort((x, y) => y.normal.y - x.normal.y || y.normal.x - x.normal.x);
    const libres = new Set(orden);
    let bajo = 1, alto = lados;
    orden.forEach((f) => {
      if (!libres.has(f)) return;
      const opuesta = [...libres].find((g) => g !== f && g.normal.dot(f.normal) < -0.98);
      libres.delete(f); f.valor = alto--;
      if (opuesta) { libres.delete(opuesta); opuesta.valor = bajo++; }
    });
    return caras;
  }

  const cacheTextura = new Map();
  function texturaNumero(texto) {
    if (cacheTextura.has(texto)) return cacheTextura.get(texto);
    const T = window.THREE, s = 256, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const x = cv.getContext('2d');
    const largo = String(texto).length;
    x.font = `700 ${largo > 2 ? 104 : largo > 1 ? 124 : 150}px "Cinzel","Times New Roman",serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 8; x.shadowOffsetY = 3;
    x.fillStyle = PALETA.tinta;
    x.fillText(texto, s / 2, s / 2 + 8);
    if (texto === '6' || texto === '9') { x.fillRect(s / 2 - 36, s / 2 + 74, 72, 8); }
    const t = new T.CanvasTexture(cv);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    cacheTextura.set(texto, t);
    return t;
  }

  const moldes = new Map();
  function molde(lados, variante) {
    const clave = lados + (variante || '');
    if (moldes.has(clave)) return moldes.get(clave);
    const T = window.THREE;
    const geoBase = poligonoBase(lados === 100 ? 10 : lados);
    const geo = geoBase.index ? geoBase.toNonIndexed() : geoBase;
    geo.computeVertexNormals();
    const caras = numerar(carasDe(geo), lados === 100 ? 10 : lados);
    const pl = new T.Vector3(), plana = geo.clone();
    // Sombreado plano: cada triángulo usa su propia normal
    const pos = plana.attributes.position, nor = new Float32Array(pos.count * 3);
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      pl.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      for (let k = 0; k < 3; k++) { nor[(i + k) * 3] = pl.x; nor[(i + k) * 3 + 1] = pl.y; nor[(i + k) * 3 + 2] = pl.z; }
    }
    plana.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    const m = { geo: plana, aristas: new T.EdgesGeometry(plana, 12), caras, radio: Math.max(...caras.flatMap((f) => f.vertices.map((v) => v.length()))) };
    moldes.set(clave, m);
    return m;
  }

  function etiqueta(lados, valor, variante) {
    if (variante === 'decenas') return valor === 10 ? '00' : String(valor * 10);
    if (lados === 10 || lados === 100) return valor === 10 ? '0' : String(valor);
    return String(valor);
  }

  // Orientación de la etiqueta en una cara: su «arriba» apunta al vértice más alejado (o al polo en d10)
  function arribaDe(f, lados) {
    const T = window.THREE;
    let punto = f.vertices.reduce((m, v) => (v.distanceTo(f.centro) > m.distanceTo(f.centro) ? v : m), f.vertices[0]);
    if (lados === 6) { // en el cubo se apunta al centro de una arista para que el número quede recto
      const vecino = f.vertices.slice(1).reduce((m, v) => (v.distanceTo(f.vertices[0]) < m.distanceTo(f.vertices[0]) ? v : m), f.vertices[1]);
      punto = f.vertices[0].clone().add(vecino).multiplyScalar(0.5);
    }
    const hacia = new T.Vector3().subVectors(punto, f.centro);
    return hacia.sub(f.normal.clone().multiplyScalar(hacia.dot(f.normal))).normalize();
  }

  function crearDado(lados, variante, opciones = {}) {
    const T = window.THREE;
    const m = molde(lados, variante);
    const grupo = new T.Group();
    const material = new T.MeshPhysicalMaterial({ color: opciones.color ?? PALETA.cuerpo, roughness: 0.46, metalness: 0.06, clearcoat: 0.45, clearcoatRoughness: 0.34 });
    const cuerpo = new T.Mesh(m.geo, material);
    cuerpo.castShadow = true;
    grupo.add(cuerpo);
    grupo.add(new T.LineSegments(m.aristas, new T.LineBasicMaterial({ color: PALETA.canto, transparent: true, opacity: 0.9 })));

    const escalaLabel = { 4: 0.42, 6: 0.86, 8: 0.56, 10: 0.5, 100: 0.54, 12: 0.56, 20: 0.42 }[lados];
    const anadir = (texto, pos, normal, arriba, escala) => {
      const tex = texturaNumero(texto);
      const pl = new T.Mesh(new T.PlaneGeometry(escala, escala), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      const z = normal.clone(), y = arriba.clone(), x = new T.Vector3().crossVectors(y, z).normalize();
      pl.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
      pl.position.copy(pos).add(normal.clone().multiplyScalar(0.006));
      grupo.add(pl);
    };

    if (lados === 4) {
      // d4: cada esquina muestra su número; se lee el que queda arriba
      const verts = [];
      m.caras.forEach((f) => f.vertices.forEach((v) => { if (!verts.some((u) => u.distanceToSquared(v) < 1e-5)) verts.push(v.clone()); }));
      verts.forEach((v, i) => { v.valor = i + 1; });
      m.vertices4 = verts;
      m.caras.forEach((f) => f.vertices.forEach((v) => {
        const id = verts.find((u) => u.distanceToSquared(v) < 1e-5);
        const arriba = v.clone().sub(f.centro).sub(f.normal.clone().multiplyScalar(v.clone().sub(f.centro).dot(f.normal))).normalize();
        anadir(String(id.valor), f.centro.clone().lerp(v, 0.56), f.normal, arriba, escalaLabel);
      }));
    } else {
      m.caras.forEach((f) => {
        const arriba = arribaDe(f, lados);
        anadir(etiqueta(lados, f.valor, variante), f.centro.clone().sub(arriba.clone().multiplyScalar(lados === 10 || lados === 100 ? 0.08 : 0)), f.normal, arriba, escalaLabel);
      });
    }
    grupo.scale.setScalar(TAMANO[lados] || 1);
    grupo.userData = { lados, variante, molde: m };
    return grupo;
  }

  // Cuaternión que deja la cara con «valor» hacia arriba (+Y) y su etiqueta legible desde la cámara
  function orientacionFinal(dado, valor, giroY) {
    const T = window.THREE, { lados, molde: m } = dado.userData;
    const q = new T.Quaternion();
    if (lados === 4) {
      const v = m.vertices4.find((u) => u.valor === valor).clone().normalize();
      q.setFromUnitVectors(v, new T.Vector3(0, 1, 0));
      return { q: new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), giroY).multiply(q), altura: m.caras[0].distancia * (TAMANO[4] || 1) };
    }
    const f = m.caras.find((x) => x.valor === valor);
    const arriba = arribaDe(f, lados);
    const normal = f.normal.clone();
    const derecha = new T.Vector3().crossVectors(arriba, normal).normalize();
    // Base local de la cara → base del mundo: normal a +Y, arriba del número hacia el fondo (−Z)
    const local = new T.Matrix4().makeBasis(derecha, normal, arriba.clone().negate());
    q.setFromRotationMatrix(local).invert();
    return { q: new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), giroY).multiply(q), altura: f.distancia * (TAMANO[lados] || 1) };
  }

  /* ---------- Escena ---------- */
  function montarEntorno(renderer, escena) {
    const T = window.THREE;
    const pm = new T.PMREMGenerator(renderer);
    escena.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
    escena.environmentIntensity = 0.42;
    pm.dispose();
  }

  let m3 = null; // escena de lanzamiento, se crea al primer tiro
  function preparar() {
    if (m3) return m3;
    const T = window.THREE;
    const lienzo = document.getElementById('dados-lienzo');
    const renderer = new T.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    const escena = new T.Scene();
    montarEntorno(renderer, escena);
    const camara = new T.PerspectiveCamera(32, 1, 0.1, 100);
    const luz = new T.DirectionalLight(0xfff0d8, 1.7);
    luz.position.set(-3, 9, 4); luz.castShadow = true;
    luz.shadow.mapSize.set(1024, 1024);
    Object.assign(luz.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 22 });
    luz.shadow.radius = 6; luz.shadow.bias = -0.0006;
    escena.add(luz, new T.AmbientLight(0xbfb4ff, 0.22));
    const brillo = new T.PointLight(0xffc66b, 0, 16, 1.6);
    brillo.position.set(0, 3, 0);
    escena.add(brillo);
    const suelo = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ opacity: 0.42 }));
    suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true;
    escena.add(suelo);
    m3 = { renderer, escena, camara, brillo, lienzo, dados: [], chispas: null };
    return m3;
  }
  function encuadrar(n) {
    const { renderer, camara, lienzo } = m3;
    const r = lienzo.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camara.aspect = r.width / r.height;
    const distancia = (camara.aspect < 0.8 ? 14 : 10) + Math.max(0, n - 1) * 1.1;
    if (lienzo.parentElement.classList.contains('con-camara')) {
      // Sobre la cámara se mira en diagonal, como quien tiene el teléfono en la mano frente a la mesa
      camara.position.set(0, distancia * 0.9, distancia * 0.5);
      camara.lookAt(0, 0, 0.4);
    } else {
      camara.position.set(0, distancia, distancia * 0.32);
      camara.lookAt(0, 0, distancia * 0.13); // sube los dados en pantalla para dejar sitio al resultado
    }
    camara.updateProjectionMatrix();
  }

  /* ---------- Sonido sintetizado: sin archivos externos ---------- */
  let audio = null;
  function clac(volumen) {
    if (!P.prefs || !P.prefs.sonido) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime, dur = 0.05 + Math.random() * 0.03, n = Math.floor(audio.sampleRate * dur);
      const buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const src = audio.createBufferSource(); src.buffer = buf;
      const fil = audio.createBiquadFilter(); fil.type = 'bandpass'; fil.frequency.value = 1700 + Math.random() * 1600; fil.Q.value = 1.2;
      const gan = audio.createGain(); gan.gain.value = 0.18 * volumen;
      src.connect(fil); fil.connect(gan); gan.connect(audio.destination); src.start(t);
    } catch (e) { /* el sonido es un extra */ }
  }

  const facilSalida = (t) => 1 - Math.pow(1 - t, 3);

  // Prepara los dados de un tiro dentro de cualquier escena: la normal o la de la mesa en realidad aumentada
  function crearTiro(lista, contenedor) {
    const T = window.THREE, n = lista.length;
    const columnas = Math.ceil(Math.sqrt(n * 1.6)), sep = 2.5;
    const filas = Math.ceil(n / columnas);
    return lista.map((d, i) => {
      const dado = crearDado(d.lados, d.variante);
      const c = i % columnas, f = Math.floor(i / columnas);
      const enFila = f === filas - 1 ? n - columnas * (filas - 1) : columnas;
      const destino = new T.Vector3((c - (enFila - 1) / 2) * sep + (Math.random() - 0.5) * 0.4, 0, (f - (filas - 1) / 2) * sep + (Math.random() - 0.5) * 0.3);
      const giroY = (Math.random() - 0.5) * 0.7;
      const { q, altura } = orientacionFinal(dado, d.caraFinal, giroY);
      destino.y = altura;
      const origen = new T.Vector3(-7.5 - Math.random() * 2, 3.4 + Math.random() * 1.6, 5.2 + Math.random() * 1.6);
      const eje = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      contenedor.add(dado);
      return { dado, destino, origen, q, eje, vueltas: 16 + Math.random() * 8, retraso: i * 26, dur: 1250 + Math.random() * 280, botes: [0.34, 0.6, 0.78].map((b) => b + Math.random() * 0.04), sonados: 0 };
    });
  }

  // Coloca cada dado en el instante «ahora». Devuelve cuántos siguen en el aire.
  function moverDados(dados, ahora, inicio) {
    const T = window.THREE, auxQ = new T.Quaternion();
    let vivos = 0;
    dados.forEach((d) => {
      const t = Math.min(1, Math.max(0, (ahora - inicio - d.retraso) / d.dur));
      if (t < 1) vivos++;
      const e = facilSalida(t);
      d.dado.position.lerpVectors(d.origen, d.destino, e);
      // Altura: arco inicial y tres botes que se apagan
      const [b1, b2, b3] = d.botes;
      let h;
      if (t < b1) { const u = t / b1; h = (1 - u * u) * d.origen.y * 0.95; }
      else if (t < b2) { const u = (t - b1) / (b2 - b1); h = 4 * u * (1 - u) * 1.05; }
      else if (t < b3) { const u = (t - b2) / (b3 - b2); h = 4 * u * (1 - u) * 0.34; }
      else h = 0;
      d.dado.position.y = d.destino.y + h;
      [b1, b2, b3].forEach((b, i) => { if (d.sonados === i && t >= b) { d.sonados++; clac(1 - i * 0.28); } });
      const angulo = d.vueltas * (1 - facilSalida(Math.min(1, t * 1.02))) ;
      auxQ.setFromAxisAngle(d.eje, angulo);
      d.dado.quaternion.copy(d.q).multiply(auxQ);
    });
    return vivos;
  }

  function lanzarAnimado(lista) {
    return new Promise((resolver) => {
      const { renderer, escena, camara, brillo } = preparar();
      m3.dados.forEach((d) => escena.remove(d));
      encuadrar(lista.length);
      const dados = crearTiro(lista, escena);
      m3.dados = dados.map((d) => d.dado);

      const inicio = performance.now();
      const cuadro = (ahora) => {
        const vivos = moverDados(dados, ahora, inicio);
        renderer.render(escena, camara);
        if (vivos) requestAnimationFrame(cuadro);
        else {
          if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive) navigator.vibrate(12);
          destello(lista);
          resolver();
        }
      };
      requestAnimationFrame(cuadro);

      function destello() {
        const especial = lista.length === 1 && lista[0].lados === 20 && (lista[0].valor === 20 || lista[0].valor === 1);
        const objetivo = especial ? (lista[0].valor === 20 ? 3.4 : 2.2) : 1.1;
        if (especial) brillo.color.set(lista[0].valor === 20 ? 0xffd27a : 0xff5040);
        else brillo.color.set(0xffc66b);
        const ini = performance.now();
        const pulso = (ahora) => {
          const t = Math.min(1, (ahora - ini) / 520);
          brillo.intensity = objetivo * 28 * Math.sin(t * Math.PI);
          renderer.render(escena, camara);
          if (t < 1) requestAnimationFrame(pulso);
        };
        requestAnimationFrame(pulso);
      }
    });
  }

  // Pinta los dados ya detenidos, sin animación, para quien pidió reducir el movimiento
  function mostrarQuietos(lista) {
    const T = window.THREE;
    const { renderer, escena, camara } = preparar();
    m3.dados.forEach((d) => escena.remove(d));
    encuadrar(lista.length);
    const columnas = Math.ceil(Math.sqrt(lista.length * 1.6)), sep = 2.5;
    m3.dados = lista.map((d, i) => {
      const dado = crearDado(d.lados, d.variante);
      const { q, altura } = orientacionFinal(dado, d.caraFinal, 0);
      const c = i % columnas, f = Math.floor(i / columnas);
      dado.position.set((c - (Math.min(lista.length, columnas) - 1) / 2) * sep, altura, f * sep - sep * 0.2 * Math.floor(lista.length / columnas));
      dado.quaternion.copy(q);
      escena.add(dado);
      return dado;
    });
    renderer.render(escena, camara);
    void T;
  }

  /* ---------- API ---------- */
  // pedido: [{lados, valor?}]; devuelve valores. Un d100 se muestra con dos d10 (decenas y unidades).
  function expandir(pedido) {
    const lista = [];
    pedido.forEach((p, idx) => {
      const valor = p.valor ?? azar(p.lados);
      if (p.lados === 100) {
        const dec = Math.floor((valor % 100) / 10), uni = valor % 10;
        lista.push({ lados: 100, variante: 'decenas', caraFinal: dec === 0 ? 10 : dec, valor, idx });
        lista.push({ lados: 10, caraFinal: uni === 0 ? 10 : uni, valor, idx, escondido: true });
      } else lista.push({ lados: p.lados, caraFinal: valor, valor, idx });
    });
    return lista;
  }

  P.dados3d = {
    // Colores de los próximos dados. Los números se pintan en una textura, así que hay que rehacerlas.
    colores({ cuerpo, canto, tinta }) {
      PALETA.cuerpo = parseInt(cuerpo.slice(1), 16);
      PALETA.canto = parseInt(canto.slice(1), 16);
      PALETA.tinta = tinta;
      cacheTextura.forEach((t) => t.dispose());
      cacheTextura.clear();
    },
    xr: { crearTiro, moverDados, expandir, montarEntorno },
    async lanzar(pedido, opciones = {}) {
      const lista = expandir(pedido);
      const valores = pedido.map((_, i) => lista.find((d) => d.idx === i).valor);
      const capa = document.getElementById('capa-dados');
      const quieto = opciones.instantaneo || !P.movimientoActivo();
      if (!capa.open) capa.showModal();
      capa.dataset.estado = 'girando';
      if (HAY_WEBGL) {
        await (document.fonts ? document.fonts.load('700 100px Cinzel').catch(() => null) : null);
        capa.classList.remove('sin-3d');
        if (quieto) mostrarQuietos(lista);
        else await lanzarAnimado(lista);
      } else {
        capa.classList.add('sin-3d');
      }
      capa.dataset.estado = 'listo';
      return valores;
    },
    cerrar() {
      const capa = document.getElementById('capa-dados');
      if (capa.open) capa.close();
      capa.dataset.estado = '';
    },
  };

  /* ---------- d20 de la portada: vive solo mientras se ve ---------- */
  P.dadoPortada = function (lienzo) {
    if (!HAY_WEBGL) return null;
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const escena = new T.Scene();
    montarEntorno(renderer, escena);
    const camara = new T.PerspectiveCamera(30, 1, 0.1, 50);
    camara.position.set(0, 0, 5.6);
    escena.add(new T.AmbientLight(0xffffff, 0.2));
    const clave = new T.DirectionalLight(0xfff0d8, 1.5); clave.position.set(-3, 4, 5);
    const violeta = new T.PointLight(0x8f6bff, 9, 14); violeta.position.set(4, -3, 3.5);
    const ambar = new T.PointLight(0xffb45e, 7, 14); ambar.position.set(-4, 3, 3.5);
    escena.add(clave, violeta, ambar);
    let dado = crearDado(20);
    dado.scale.setScalar(1.28);
    escena.add(dado);
    const girar = new T.Euler();
    let visible = true, activo = true, px = 0, py = 0, cx = 0, cy = 0, impulso = 0;
    const medir = () => {
      const r = lienzo.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camara.aspect = r.width / r.height; camara.updateProjectionMatrix();
    };
    medir();
    window.addEventListener('resize', medir);
    const obs = new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedir(); });
    obs.observe(lienzo);
    window.addEventListener('pointermove', (e) => {
      px = (e.clientX / window.innerWidth - 0.5) * 0.5; py = (e.clientY / window.innerHeight - 0.5) * 0.4;
    }, { passive: true });
    let t0 = performance.now(), base = 0, enCola = false;
    const pedir = () => { if (!enCola) { enCola = true; requestAnimationFrame(cuadro); } };
    function cuadro(ahora) {
      enCola = false;
      const dt = Math.min(50, ahora - t0); t0 = ahora;
      const mueve = activo && P.movimientoActivo();
      if (mueve) base += dt * 0.00032;
      impulso *= 0.94;
      base += impulso * dt * 0.001;
      cx += (px - cx) * 0.06; cy += (py - cy) * 0.06;
      girar.set(0.4 + cy + base * 0.6, base + cx, 0.2);
      dado.quaternion.setFromEuler(girar);
      renderer.render(escena, camara);
      if (visible && (mueve || impulso > 0.01)) pedir();
    }
    pedir();
    return {
      empujar() { impulso = 14; pedir(); },
      pausar(v) { activo = !v; if (!v) pedir(); },
      redibujar() { pedir(); },
      repintar() {
        escena.remove(dado);
        dado = crearDado(20);
        dado.scale.setScalar(1.28);
        escena.add(dado);
        pedir();
      },
    };
  };
})(window.PJ);
