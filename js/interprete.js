/* Intérprete local de lenguaje natural: convierte lo que escribes en cambios concretos y recomendaciones.
   Funciona sin IA. La IA opcional (ia.js) produce la misma estructura y pasa por la misma validación. */
(function (P) {
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  P.normalizar = normalizar;

  const RAZAS = [
    ['semielfo', ['semielf', 'medio elf', 'media elf', 'mitad elf']],
    ['semiorco', ['semiorc', 'medio orc', 'media orc', 'mitad orc', 'orc']],
    ['tiflin', ['tiflin', 'tiefling', 'demonio', 'demoniac', 'infernal', 'con cuernos', 'diablo']],
    ['draconido', ['draconid', 'dragonborn', 'dragon', 'dragona', 'escamas de']],
    ['mediano', ['mediano', 'mediana', 'halfling', 'hobbit']],
    ['gnomo', ['gnomo', 'gnoma']],
    ['enano', ['enano', 'enana']],
    ['elfo', ['elfo', 'elfa', 'elfico', 'elfica', 'drow']],
    ['humano', ['humano', 'humana', 'persona normal']],
  ];
  const SUBRAZAS = [
    ['elfo', 'alto', ['alto elf', 'alta elf', 'elfo alto', 'elfa alta']], ['elfo', 'bosque', ['del bosque', 'de los bosques']], ['elfo', 'oscuro', ['drow', 'oscur']],
    ['enano', 'colinas', ['colina']], ['enano', 'montanas', ['montaña', 'montana']],
    ['mediano', 'piesligeros', ['piesliger', 'pies liger']], ['mediano', 'fornido', ['fornid']],
    ['gnomo', 'rocas', ['roca', 'inventor']], ['gnomo', 'bosque', ['del bosque']],
  ];
  const CLASES = [
    ['barbaro', ['barbaro', 'barbara', 'berserker', 'furia']],
    ['bardo', ['bardo', 'barda', 'musico', 'musica', 'cantante', 'trovador']],
    ['brujo', ['brujo', 'bruja', 'warlock', 'pacto']],
    ['clerigo', ['clerigo', 'cleriga', 'sacerdot', 'cura ', 'monja']],
    ['druida', ['druida', 'chaman']],
    ['explorador', ['explorador', 'exploradora', 'ranger', 'arquero', 'arquera', 'cazador', 'cazadora']],
    ['guerrero', ['guerrero', 'guerrera', 'espadachin', 'caballero', 'gladiador', 'luchador']],
    ['hechicero', ['hechicero', 'hechicera', 'sorcerer']],
    ['mago', ['mago', 'maga', 'wizard']],
    ['monje', ['monje', 'artista marcial', 'artes marciales', 'karate', 'kung fu']],
    ['paladin', ['paladin', 'paladina', 'cruzado', 'templario']],
    ['picaro', ['picaro', 'picara', 'ladron', 'ladrona', 'asesino', 'asesina', 'rogue']],
  ];
  const TRASFONDOS = [
    ['acolito', ['acolito', 'acolita', 'templo']], ['artesano', ['artesano', 'artesana', 'herrero', 'herrera', 'carpintero', 'gremio']], ['artista', ['artista', 'actor', 'actriz', 'bailarin']], ['charlatan', ['charlatan', 'estafador', 'estafadora']], ['criminal', ['criminal', 'contrabandista', 'delincuente']], ['ermitano', ['ermitaño', 'ermitano', 'ermitaña']], ['forastero', ['forastero', 'forastera', 'salvaje']], ['heroe', ['heroe del pueblo', 'heroina del pueblo', 'campesino', 'campesina', 'granjero', 'granjera']], ['marinero', ['marinero', 'marinera', 'pirata', 'navegante']], ['noble', ['noble', 'princesa', 'principe', 'rico', 'rica']], ['pilluelo', ['pilluelo', 'huerfano', 'huerfana', 'de la calle']], ['sabio', ['sabio', 'sabia', 'erudito', 'erudita', 'estudioso', 'estudiosa', 'investigador']], ['soldado', ['soldado', 'militar', 'ejercito', 'veterano']],
  ];
  const GUSTOS = [
    ['pegar', ['pegar', 'golpe', 'fuerte', 'combat', 'pelear', 'luchar', 'espada', 'hacha', 'dano', 'destruir', 'matar']],
    ['aguantar', ['aguantar', 'resist', 'tanque', 'proteger', 'defender', 'armadura', 'escudo', 'dificil de matar']],
    ['magia', ['magia', 'magic', 'conjuro', 'hechizo', 'lanzar rayos', 'poderes']],
    ['curar', ['curar', 'sanar', 'cura al', 'ayudar al grupo', 'apoyar', 'apoyo', 'heridas']],
    ['sombras', ['sigilo', 'sigilos', 'sombra', 'esconder', 'trampa', 'robar', 'por sorpresa', 'silencio', 'oscuridad']],
    ['hablar', ['hablar', 'convencer', 'persuadir', 'carism', 'enganar', 'mentir', 'negociar', 'seducir', 'encantar', 'liderar', 'lider']],
    ['distancia', ['arco', 'flecha', 'disparar', 'distancia', 'desde lejos', 'ballesta', 'punteria']],
    ['naturaleza', ['naturaleza', 'bosque', 'animal', 'planta', 'selva', 'lobo']],
    ['estudio', ['estudiar', 'libro', 'inteligent', 'conocimiento', 'sabiondo', 'ciencia', 'investigar']],
    ['fuego', ['fuego', 'llama', 'explosion']],
  ];
  const CAR = [
    ['fue', ['fuerza', 'muy fuerte', 'musculos']], ['des', ['destreza', 'agilidad', 'muy agil', 'rapido', 'rapida']], ['con', ['constitucion', 'aguante', 'resistente']], ['int', ['inteligencia', 'muy inteligente', 'listo', 'lista']], ['sab', ['sabiduria', 'intuicion', 'instinto']], ['car', ['carisma', 'presencia', 'carismatic']],
  ];
  const NOMBRE_RE = /(?:me llamo|llamame|se llama|se llame|se llamara|llamado|llamada|de nombre|mi nombre es|su nombre es|nombre a)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ'-]+)?)/i;
  const PARADA = new Set(['y', 'que', 'pero', 'de', 'el', 'la', 'un', 'una', 'con', 'mi', 'su']);

  // Devuelve true si la coincidencia en la posición está negada: «no quiero ser mago», «sin magia»
  function negado(texto, i) {
    const antes = texto.slice(Math.max(0, i - 28), i);
    return /\b(no|nunca|sin|nada de|odio|evita|evitar|menos)\b[^,.;]{0,24}$/.test(antes) && !/\bno solo\b/.test(antes);
  }
  // Coincide por inicio de palabra, para que «orc» no salte en «fuerza» ni «mago» en «imagino»
  function encontrar(texto, pistas) {
    let mejor = null;
    pistas.forEach((p) => {
      const q = p.trimEnd();
      const re = new RegExp('(^|\\s)' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      let m;
      while ((m = re.exec(texto))) {
        const pos = m.index + m[1].length;
        const neg = negado(texto, pos);
        if (!mejor || (!neg && mejor.neg)) mejor = { pos, neg, largo: q.length };
      }
    });
    return mejor;
  }
  const primero = (lista, texto) => {
    for (const [id, pistas] of lista) {
      const hit = encontrar(texto, pistas);
      if (hit) return { id, neg: hit.neg, pos: hit.pos, largo: hit.largo };
    }
    return null;
  };

  P.CAMBIO = {
    raza: (v) => 'Tu raza: ' + P.buscar(P.RAZAS, v).nombre,
    subraza: (v, pj, razaId) => {
      const r = P.buscar(P.RAZAS, razaId || pj.razaId);
      const s = r && r.subrazas ? P.buscar(r.subrazas, v) : null;
      return 'Tu subraza: ' + (s ? s.nombre : v);
    },
    clase: (v) => 'Tu clase: ' + P.buscar(P.CLASES, v).nombre,
    trasfondo: (v) => 'Tu trasfondo: ' + P.buscar(P.TRASFONDOS, v).nombre,
    nombre: (v) => 'Tu nombre: ' + v,
    prioridad: (v) => 'Subir ' + P.buscar(P.CARACT, v).nombre + ' al repartir tus puntos',
    rasgo: (v) => 'Cómo te comportas: ' + v,
    ideal: (v) => 'En qué crees: ' + v,
    vinculo: (v) => 'Qué proteges: ' + v,
    defecto: (v) => 'Tu defecto: ' + v,
  };

  // Valida una lista de cambios contra el catálogo. Tanto el intérprete como la IA pasan por aquí.
  P.validarCambios = function (lista, pj) {
    const validos = [], dudas = [];
    const razaFinal = () => (validos.find((c) => c.tipo === 'raza') || { valor: pj.razaId }).valor;
    (lista || []).forEach((c) => {
      if (!c || typeof c.valor !== 'string' || !c.valor.trim()) return;
      const v = c.valor.trim();
      if (validos.some((x) => x.tipo === c.tipo)) return;
      if (c.tipo === 'raza' && P.buscar(P.RAZAS, v)) validos.push({ tipo: 'raza', valor: v });
      else if (c.tipo === 'clase' && P.buscar(P.CLASES, v)) validos.push({ tipo: 'clase', valor: v });
      else if (c.tipo === 'trasfondo' && P.buscar(P.TRASFONDOS, v)) validos.push({ tipo: 'trasfondo', valor: v });
      else if (c.tipo === 'prioridad' && P.buscar(P.CARACT, v)) validos.push({ tipo: 'prioridad', valor: v });
      else if (c.tipo === 'nombre') validos.push({ tipo: 'nombre', valor: v.slice(0, 40) });
      else if (['rasgo', 'ideal', 'vinculo', 'defecto'].includes(c.tipo)) validos.push({ tipo: c.tipo, valor: v.slice(0, 120) });
      else if (c.tipo === 'subraza') {
        const r = P.buscar(P.RAZAS, razaFinal());
        if (r && r.subrazas && P.buscar(r.subrazas, v)) validos.push({ tipo: 'subraza', valor: v });
        else dudas.push('Esa subraza no existe para tu raza.');
      } else dudas.push('No reconozco «' + v + '».');
    });
    return { cambios: validos.map((c) => Object.assign(c, { texto: P.CAMBIO[c.tipo](c.valor, pj, razaFinal()) })), dudas };
  };

  P.recomendarClases = function (gustos, evitar) {
    const puntos = P.CLASES.map((c) => {
      let p = 0;
      const razones = [];
      gustos.forEach((g) => { if (c.tags.includes(g.id)) { p += 2; razones.push(g.etiqueta); } });
      evitar.forEach((g) => { if (c.tags.includes(g.id)) p -= 100; });
      if (p > 0) p += (4 - c.dif) * 0.1; // ante un empate, gana la más fácil de aprender
      return { id: c.id, nombre: c.nombre, puntos: p, razones };
    });
    return puntos.filter((x) => x.puntos > 0).sort((a, b) => b.puntos - a.puntos).slice(0, 3)
      .map((x) => ({ id: x.id, nombre: x.nombre, por: 'Encaja con ' + x.razones.join(', ') + '.' }));
  };

  const ETIQUETA = { pegar: 'pegar fuerte', aguantar: 'aguantar golpes', magia: 'usar magia', curar: 'curar al grupo', sombras: 'moverte en las sombras', hablar: 'hablar y convencer', distancia: 'atacar a distancia', naturaleza: 'la naturaleza', estudio: 'el estudio', fuego: 'el fuego' };

  P.interpretar = function (textoOriginal, pj) {
    const texto = normalizar(textoOriginal);
    const crudos = [];
    const dudas = [];

    const raza = primero(RAZAS, texto);
    if (raza && !raza.neg) crudos.push({ tipo: 'raza', valor: raza.id });
    const razaId = raza && !raza.neg ? raza.id : pj.razaId;
    SUBRAZAS.filter((s) => s[0] === razaId).forEach(([, id, pistas]) => {
      if (crudos.some((c) => c.tipo === 'subraza')) return;
      const h = encontrar(texto, pistas);
      if (h && !h.neg) crudos.push({ tipo: 'subraza', valor: id });
    });

    const clase = primero(CLASES, texto);
    if (clase && !clase.neg) crudos.push({ tipo: 'clase', valor: clase.id });

    const fondo = primero(TRASFONDOS, texto);
    if (fondo && !fondo.neg) crudos.push({ tipo: 'trasfondo', valor: fondo.id });

    const nom = textoOriginal.match(NOMBRE_RE);
    if (nom) {
      const limpio = nom[1].split(/\s+/).filter((w) => !PARADA.has(w.toLowerCase())).join(' ');
      if (limpio) crudos.push({ tipo: 'nombre', valor: limpio.charAt(0).toUpperCase() + limpio.slice(1) });
    }

    CAR.forEach(([id, pistas]) => {
      const h = encontrar(texto, pistas);
      if (h && !h.neg && /\b(sube|subir|subeme|mas|mucha|mucho|alta|alto|mejora|mejorar|muy|buen|buena|prioriza|tenga|tener)\b/.test(texto.slice(Math.max(0, h.pos - 22), h.pos + h.largo + 2))) crudos.push({ tipo: 'prioridad', valor: id });
    });

    const gustos = [], evitar = [];
    GUSTOS.forEach(([id, pistas]) => {
      const h = encontrar(texto, pistas);
      if (!h) return;
      (h.neg ? evitar : gustos).push({ id, etiqueta: ETIQUETA[id] });
    });
    if (clase && clase.neg) evitar.push({ id: '__' + clase.id, etiqueta: '' });

    const { cambios, dudas: d2 } = P.validarCambios(crudos.slice(0, 8), pj);
    dudas.push(...d2);

    let recomendaciones = [];
    if (!cambios.some((c) => c.tipo === 'clase') && gustos.length) {
      recomendaciones = P.recomendarClases(gustos, evitar);
      if (clase && clase.neg) recomendaciones = recomendaciones.filter((r) => r.id !== clase.id);
    }
    if (!cambios.length && !recomendaciones.length) {
      dudas.push('No logré entenderlo. Prueba con algo como «un enano guerrero» o «quiero curar y usar magia».');
    }
    return { cambios, recomendaciones, dudas, respuesta: '' };
  };

  P.EJEMPLOS_TEXTO = [
    'Quiero ser una elfa sigilosa con arco',
    'Un enano fuerte que proteja al grupo',
    'Me gusta la magia y curar a los demás',
    'Un tiflin bardo que se llame Nyx',
  ];
})(window.PJ);
