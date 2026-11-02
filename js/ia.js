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
      cambios: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tipo: { type: 'STRING', enum: ['raza', 'subraza', 'clase', 'trasfondo', 'nombre', 'prioridad', 'rasgo', 'ideal', 'vinculo', 'defecto'] }, valor: { type: 'STRING' } }, required: ['tipo', 'valor'] } },
      recomendaciones: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, por: { type: 'STRING' } }, required: ['id', 'por'] } },
      dudas: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['respuesta', 'cambios', 'recomendaciones', 'dudas'],
  };

  function sistema(pj) {
    const c = P.calcular(pj);
    return [
      'Ayudas a personas que nunca jugaron a crear su personaje de D&D 5.ª edición (reglas de 2014). Responde siempre en español, con frases cortas y amables.',
      'Traduce lo que la persona escribe a cambios concretos usando solo estos identificadores:',
      'raza: ' + P.RAZAS.map((r) => r.id).join(', '),
      'subraza: ' + P.RAZAS.filter((r) => r.subrazas).map((r) => r.id + ' → ' + r.subrazas.map((s) => s.id).join('/')).join('; '),
      'clase: ' + P.CLASES.map((x) => x.id + ' (' + x.tags.join(', ') + ')').join('; '),
      'trasfondo: ' + P.TRASFONDOS.map((t) => t.id).join(', '),
      'prioridad (característica que quiere subir): fue, des, con, int, sab, car',
      'nombre, rasgo, ideal, vinculo, defecto: texto libre corto, solo si la persona lo pide o pide ideas.',
      'Si la persona describe gustos sin elegir una clase, no agregues un cambio de clase: da hasta 3 recomendaciones con el id de la clase y una razón corta.',
      'Si algo es ambiguo o no existe, no lo inventes: escribe la pregunta en dudas.',
      'En respuesta, confirma en una frase lo que entendiste.',
      'Personaje actual: ' + JSON.stringify({ raza: c.nombreRaza || null, clase: c.clase ? c.clase.nombre : null, trasfondo: c.trasfondo ? c.trasfondo.nombre : null, nombre: pj.nombre || null }),
    ].join('\n');
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
      const cuerpo = {
        systemInstruction: { parts: [{ text: sistema(pj) }] },
        contents: [{ role: 'user', parts: [{ text: texto }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json', responseSchema: ESQUEMA },
      };
      const j = await pedir(BASE + '/models/' + encodeURIComponent(cfg.modelo) + ':generateContent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const cand = (j.candidates || [])[0];
      const crudo = cand && cand.content && (cand.content.parts || []).map((p) => p.text || '').join('');
      if (!crudo) throw new Error('Gemini no devolvió una respuesta. Prueba con otras palabras.');
      let datos;
      try { datos = JSON.parse(crudo); } catch (e) { throw new Error('Gemini respondió en un formato inesperado.'); }
      const { cambios, dudas } = P.validarCambios(datos.cambios, pj);
      const recomendaciones = (datos.recomendaciones || []).map((r) => {
        const c = P.buscar(P.CLASES, r.id);
        return c ? { id: c.id, nombre: c.nombre, por: String(r.por || '').slice(0, 160) } : null;
      }).filter(Boolean).slice(0, 3);
      return { cambios, recomendaciones, dudas: (datos.dudas || []).map(String).concat(dudas), respuesta: String(datos.respuesta || '').slice(0, 240) };
    },
  };
})(window.PJ);
