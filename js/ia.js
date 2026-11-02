/* Conexión opcional con Gemini, directa desde el navegador con la clave de cada persona.
   Principio: la IA entiende, el código decide. Gemini solo propone cambios; todo pasa por P.validarCambios. */
(function (P) {
  const BASE = 'https://generativelanguage.googleapis.com/v1beta';
  const CLAVE_LOCAL = 'tpp.ia';
  P.MODELOS_GEMINI = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

  const cfg = { clave: '', modelo: P.MODELOS_GEMINI[0], recordar: false, usar: false };

  function cargar() {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null');
      if (g && g.clave) Object.assign(cfg, g, { recordar: true, usar: true });
    } catch (e) { /* sin almacenamiento */ }
  }
  function guardar() {
    try {
      if (cfg.recordar && cfg.clave) localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ clave: cfg.clave, modelo: cfg.modelo }));
      else localStorage.removeItem(CLAVE_LOCAL);
    } catch (e) { /* sin almacenamiento */ }
  }

  function explicar(estado, detalle) {
    if (estado === 400 && /api.?key/i.test(detalle)) return 'La clave no es válida. Revísala y prueba de nuevo.';
    if (estado === 401 || estado === 403) return 'La clave no es válida o no tiene permiso para este modelo.';
    if (estado === 404) return 'Ese modelo no está disponible en tu cuenta. Pulsa «Probar conexión» y elige otro.';
    if (estado === 429) return 'Se agotó el límite de uso de tu clave. Espera un momento o usa el modo sin IA.';
    if (estado >= 500) return 'Gemini no está disponible ahora. Intenta de nuevo en un momento.';
    return detalle ? detalle.slice(0, 160) : 'Gemini no respondió.';
  }

  async function pedir(url, opciones = {}) {
    let r;
    const ctl = new AbortController();
    const reloj = setTimeout(() => ctl.abort(), 30000);
    try {
      r = await fetch(url, Object.assign({}, opciones, { signal: ctl.signal, headers: Object.assign({ 'x-goog-api-key': cfg.clave }, opciones.headers || {}) }));
    } catch (e) {
      if (window.claude) throw new Error('Gemini no funciona dentro de esta vista previa. Publica el sitio para usarlo.');
      throw new Error(e.name === 'AbortError' ? 'Gemini tardó demasiado en responder.' : 'No se pudo conectar con Gemini. Revisa tu conexión a internet.');
    } finally { clearTimeout(reloj); }
    if (!r.ok) {
      let detalle = '';
      try { detalle = ((await r.json()).error || {}).message || ''; } catch (e) { /* sin detalle */ }
      throw new Error(explicar(r.status, detalle));
    }
    return r.json();
  }

  const ESQUEMA = {
    type: 'OBJECT',
    properties: {
      respuesta: { type: 'STRING' },
      cambios: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tipo: { type: 'STRING', enum: ['raza', 'subraza', 'clase', 'opcion', 'trasfondo', 'nombre', 'prioridad', 'rasgo', 'ideal', 'vinculo', 'defecto'] }, valor: { type: 'STRING' } }, required: ['tipo', 'valor'] } },
      recomendaciones: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, opcion: { type: 'STRING' }, por: { type: 'STRING' } }, required: ['id', 'por'] } },
      razas: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, subraza: { type: 'STRING' }, por: { type: 'STRING' } }, required: ['id', 'por'] } },
      trasfondos: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, por: { type: 'STRING' } }, required: ['id', 'por'] } },
      pregunta: { type: 'STRING' },
      dudas: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['respuesta', 'cambios', 'recomendaciones', 'razas', 'trasfondos', 'pregunta', 'dudas'],
  };

  const catalogoClases = () => P.CLASES.map((x) => `- ${x.id}: ${x.frase} Sirve para: ${x.tags.join(', ')}. Dificultad ${x.dif} de 3.${x.opcion ? ' Opciones (' + x.opcion.titulo + '): ' + x.opcion.lista.map((o) => o.id + ' = ' + o.d).join(' ') : ''}`).join('\n');
  const catalogoRazas = () => P.RAZAS.map((r) => `- ${r.id}: ${r.frase}${r.subrazas ? ' Subrazas: ' + r.subrazas.map((s) => s.id + ' = ' + s.frase).join(' ') : ''}`).join('\n');
  const catalogoFondos = () => P.TRASFONDOS.map((t) => `- ${t.id}: ${t.antes}. Da ${t.hab.map(P.nombreHab).join(' y ')}.`).join('\n');

  function ficha(pj) {
    const c = P.calcular(pj);
    const op = c.clase && c.clase.opcion && pj.opcionId ? P.buscar(c.clase.opcion.lista, pj.opcionId) : null;
    return JSON.stringify({ raza: c.nombreRaza || null, clase: c.clase ? c.clase.nombre : null, loMasImportanteDeSuClase: c.clase ? c.clase.clave : null, opcionDeClase: op ? op.nombre : null, trasfondo: c.trasfondo ? c.trasfondo.nombre : null, equipo: c.kit ? c.kit.nombre : null, nombre: pj.nombre || null, puntuaciones: c.hayPuntuaciones ? Object.fromEntries(P.CARACT.map((a) => [a.id, c.caract[a.id].total])) : null, comoSeComporta: pj.rasgo || null, enQueCree: pj.ideal || null, queProtege: pj.vinculo || null, loQueHaContado: pj.concepto || null });
  }

  function sistema(pj) {
    return [
      'Ayudas a personas que nunca jugaron a crear su personaje de D&D 5.ª edición (reglas de 2014). Responde siempre en español, con frases cortas y amables.',
      'Entiende la intención aunque use otras palabras: «médico», «sanador» o «cuidar a mis amigos» significa que quiere curar. Tu trabajo es darle opciones para elegir, no decidir por la persona.',
      'Usa solo los identificadores de estos catálogos.',
      'Clases:\n' + catalogoClases(),
      'Razas:\n' + catalogoRazas(),
      'Trasfondos:\n' + catalogoFondos(),
      'En cambios usa: raza, subraza, clase, opcion (la opción de su clase), trasfondo, prioridad (fue, des, con, int, sab o car, la característica que quiere subir) y nombre, rasgo, ideal, vinculo, defecto (texto libre corto, solo si lo pide).',
      'Agrega un cambio de raza, clase o trasfondo solo si lo elige de forma explícita, como «soy elfa» o «quiero ser mago». «Me gusta curar» es un gusto, no una elección.',
      'Si describe gustos sin elegir clase, da entre 3 y 6 recomendaciones que sean caminos distintos, de la que más encaja a la que menos. Cada una lleva el id de la clase, la opcion si ayuda a definir el camino, y una razón corta que le hable de lo que escribió.',
      'Si aún no tiene raza o trasfondo, da hasta 4 razas (con subraza si aplica) y hasta 4 trasfondos con una razón corta. Si ya los tiene, deja esas listas vacías.',
      'En pregunta, escribe una sola pregunta corta que ayude a afinar la idea, o déjala vacía si ya está clara.',
      'Si algo no existe en los catálogos, no lo inventes: explícalo en dudas.',
      'En respuesta, confirma en una frase lo que entendiste.',
      'Personaje actual: ' + ficha(pj),
    ].join('\n');
  }

  /* Pedidos de «Elegir por mí»: siempre se responde con identificadores y una razón corta para mostrar a la persona */
  const lista = (type, valores) => ({ type: 'ARRAY', items: valores ? { type, enum: valores } : { type } });
  const CAMPOS_SUGERIR = { nombre: 'un nombre para el personaje, propio de su raza, de máximo 40 caracteres', rasgo: 'cómo se comporta, en una frase en primera persona', ideal: 'en qué cree, en una frase en primera persona', vinculo: 'qué o a quién protege, en una frase en primera persona', defecto: 'qué le mete en problemas, en una frase en primera persona' };
  const PEDIDOS = {
    reparto: (pj, valores) => ({
      instruccion: `Reparte estos seis números entre las seis características: ${valores.join(', ')}. Usa cada número exactamente una vez, también los repetidos. Ten en cuenta su clase, sus bonos de raza y lo que ha contado.`,
      esquema: { type: 'OBJECT', properties: Object.assign(Object.fromEntries(P.CARACT.map((a) => [a.id, { type: 'INTEGER' }])), { por: { type: 'STRING' } }), required: P.CARACT.map((a) => a.id).concat('por') },
    }),
    habilidades: (pj) => {
      const o = P.elegir.opcionesHab(pj);
      return {
        instruccion: `Elige exactamente ${o.n} habilidades de esta lista: ${o.lista.map((h) => h + ' = ' + P.nombreHab(h)).join(', ')}.${o.nPericia ? ` Además, marca ${o.nPericia} de las elegidas en pericia, donde sumará el doble de competencia.` : ''}`,
        esquema: { type: 'OBJECT', properties: { habilidades: lista('STRING', o.lista), pericia: lista('STRING', o.lista), por: { type: 'STRING' } }, required: ['habilidades', 'pericia', 'por'] },
      };
    },
    magia: (pj) => {
      const o = P.elegir.opcionesMagia(pj);
      const de = (l) => l.map((s) => s.id + ' = ' + s.nombre + ': ' + s.d).join('\n');
      return {
        instruccion: `Elige exactamente ${o.nTrucos} trucos y ${o.nConjuros} conjuros de nivel 1 que sean útiles y variados para una persona principiante.\nTrucos:\n${de(o.trucos)}\nConjuros:\n${de(o.conjuros)}`,
        esquema: { type: 'OBJECT', properties: { trucos: lista('STRING', o.trucos.map((s) => s.id)), conjuros: lista('STRING', o.conjuros.map((s) => s.id)), por: { type: 'STRING' } }, required: ['trucos', 'conjuros', 'por'] },
      };
    },
    sugerir: (pj, campo) => ({
      instruccion: `Propón ${CAMPOS_SUGERIR[campo]}. Debe encajar con lo que ya sabes del personaje y no repetir lo que ya tiene. Si es una frase, usa máximo 120 caracteres.`,
      esquema: { type: 'OBJECT', properties: { texto: { type: 'STRING' }, por: { type: 'STRING' } }, required: ['texto', 'por'] },
      temperatura: 0.9,
    }),
  };

  // Una sola puerta a Gemini: pide JSON según el esquema y devuelve el objeto ya leído
  async function generar(instrucciones, texto, esquema, temperatura) {
    const cuerpo = {
      systemInstruction: { parts: [{ text: instrucciones }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
      generationConfig: { temperature: temperatura, responseMimeType: 'application/json', responseSchema: esquema },
    };
    const j = await pedir(BASE + '/models/' + encodeURIComponent(cfg.modelo) + ':generateContent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const cand = (j.candidates || [])[0];
    const crudo = cand && cand.content && (cand.content.parts || []).map((p) => p.text || '').join('');
    if (!crudo) throw new Error('Gemini no devolvió una respuesta. Prueba con otras palabras.');
    try { return JSON.parse(crudo); } catch (e) { throw new Error('Gemini respondió en un formato inesperado.'); }
  }

  P.ia = {
    cfg,
    cargar,
    guardar,
    lista: () => cfg.usar && !!cfg.clave,
    async probar() {
      const j = await pedir(BASE + '/models?pageSize=200');
      return (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /flash/i.test(m.name) && !/image|tts|live|audio/i.test(m.name))
        .map((m) => m.name.replace(/^models\//, ''));
    },
    async interpretar(texto, pj) {
      const datos = await generar(sistema(pj), texto, ESQUEMA, 0.4);
      const { cambios, dudas } = P.validarCambios(datos.cambios, pj);
      const razon = (r) => String(r.por || '').slice(0, 180);
      const recomendaciones = (datos.recomendaciones || []).filter((r) => P.buscar(P.CLASES, r.id)).map((r) => P.tarjetaClase(r.id, r.opcion, razon(r))).slice(0, 6);
      const razas = (datos.razas || []).filter((r) => P.buscar(P.RAZAS, r.id)).map((r) => P.tarjetaRaza(r.id, r.subraza, razon(r))).slice(0, 4);
      const trasfondos = (datos.trasfondos || []).filter((r) => P.buscar(P.TRASFONDOS, r.id)).map((r) => P.tarjetaFondo(r.id, razon(r))).slice(0, 4);
      return { cambios, recomendaciones, razas, trasfondos, dudas: (datos.dudas || []).map(String).concat(dudas), respuesta: String(datos.respuesta || '').slice(0, 240), pregunta: String(datos.pregunta || '').slice(0, 160), ia: true };
    },
    // Pide a Gemini la mejor opción. Si propone algo fuera de las reglas se rechaza y la app usa la elección local.
    async elegir(tipo, pj, extra) {
      const p = PEDIDOS[tipo](pj, extra);
      const datos = await generar(['Ayudas a una persona principiante a elegir la mejor opción para su personaje de D&D 5.ª edición (reglas de 2014). Responde en español.', 'Decide según su clase, su raza, su trasfondo y lo que ha contado. En por, explícale en una frase corta por qué.', 'Personaje: ' + ficha(pj)].join('\n'), p.instruccion, p.esquema, p.temperatura || 0.3);
      const r = P.elegir.validar[tipo](datos, pj, extra);
      if (!r) throw new Error('Gemini propuso algo que no cumple las reglas.');
      return r;
    },
  };
})(window.PJ);
