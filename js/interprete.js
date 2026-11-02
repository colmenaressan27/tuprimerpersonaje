/* Intérprete local de lenguaje natural: convierte lo que escribes en cambios concretos y recomendaciones.
   Funciona sin IA. La IA opcional (ia.js) produce la misma estructura y pasa por la misma validación. */
(function (P) {
  // Sin acentos ni eñes, en minúsculas. Con pausa ';' conserva dónde termina cada frase, para acotar las negaciones.
  const limpiar = (t, pausa) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[,.:;!?]+/g, pausa).replace(/[^a-z0-9;\s]/g, ' ').replace(/\s+/g, ' ').trim();
  P.normalizar = (t) => limpiar(t, ' ');

  const RAZAS = [
    ['semielfo', ['semielf', 'medio elf', 'media elf', 'mitad elf']],
    ['semiorco', ['semiorc', 'medio orc', 'media orc', 'mitad orc', 'orco ', 'orca ']],
    ['tiflin', ['tiflin', 'tiefling', 'demonio ', 'demoniac', 'infernal ', 'con cuernos', 'cuernos y cola', 'diablo ']],
    ['draconido', ['draconid', 'dragonborn', 'dragon ', 'dragona ', 'mitad dragon', 'hombre dragon', 'escamas de']],
    ['mediano', ['mediano', 'mediana', 'halfling', 'hobbit']],
    ['gnomo', ['gnomo', 'gnoma']],
    ['enano', ['enano', 'enana']],
    ['elfo', ['elfo', 'elfa', 'elfico', 'elfica', 'drow', 'orejas puntiagudas']],
    ['humano', ['humano ', 'humana ', 'persona normal']],
  ];
  const SUBRAZAS = [
    ['elfo', 'alto', ['alto elf', 'alta elf', 'elfo alto', 'elfa alta']], ['elfo', 'bosque', ['del bosque', 'de los bosques']], ['elfo', 'oscuro', ['drow', 'oscur']],
    ['enano', 'colinas', ['colina']], ['enano', 'montanas', ['montana']],
    ['mediano', 'piesligeros', ['piesliger', 'pies liger']], ['mediano', 'fornido', ['fornid']],
    ['gnomo', 'rocas', ['roca', 'inventor']], ['gnomo', 'bosque', ['del bosque']],
  ];
  // Solo identidades: «curar», «música», «furia» o «pacto» son gustos y dan a elegir entre varias clases
  const CLASES = [
    ['barbaro', ['barbaro', 'barbara', 'berserker', 'vikingo']],
    ['bardo', ['bardo', 'barda', 'musico', 'cantante', 'trovador', 'juglar']],
    ['brujo', ['brujo', 'bruja', 'warlock']],
    ['clerigo', ['clerigo', 'cleriga', 'sacerdot', 'un cura ', 'soy cura ', 'ser cura ', 'monja', 'fraile', 'priest']],
    ['druida', ['druida', 'chaman']],
    ['explorador', ['explorador', 'exploradora', 'ranger', 'arquero', 'arquera', 'cazador', 'cazadora']],
    ['guerrero', ['guerrero', 'guerrera', 'espadachin', 'caballero', 'gladiador', 'luchador', 'luchadora', 'mercenari']],
    ['hechicero', ['hechicero', 'hechicera', 'sorcerer']],
    ['mago', ['mago', 'maga', 'wizard', 'nigromante']],
    ['monje', ['monje', 'artista marcial', 'artes marciales', 'karate', 'kung fu']],
    ['paladin', ['paladin', 'paladina', 'cruzado', 'templario']],
    ['picaro', ['picaro', 'picara', 'ladron', 'ladrona', 'asesino', 'asesina', 'rogue', 'ninja', 'bandido', 'bandida']],
  ];
  const TRASFONDOS = [
    ['acolito', ['acolito', 'acolita', 'templo']], ['artesano', ['artesano', 'artesana', 'herrero', 'herrera', 'carpintero', 'gremio']], ['artista', ['artista', 'actor', 'actriz', 'bailarin']], ['charlatan', ['charlatan', 'estafador', 'estafadora']], ['criminal', ['criminal', 'contrabandista', 'delincuente']], ['ermitano', ['ermitano', 'ermitana']], ['forastero', ['forastero', 'forastera', 'salvaje']], ['heroe', ['heroe del pueblo', 'heroina del pueblo', 'campesino', 'campesina', 'granjero', 'granjera']], ['marinero', ['marinero', 'marinera', 'pirata', 'navegante']], ['noble', ['noble', 'princesa', 'principe', 'rico', 'rica']], ['pilluelo', ['pilluelo', 'huerfano', 'huerfana', 'de la calle']], ['sabio', ['sabio', 'sabia', 'erudito', 'erudita', 'estudioso', 'estudiosa', 'investigador']], ['soldado', ['soldado', 'militar', 'ejercito', 'veterano']],
  ];
  // Raíces para captar «curo», «curando» o «curación». Con espacio final, solo la palabra exacta.
  const GUSTOS = [
    ['curar', ['curar', 'curo', 'cure', 'curan', 'cura ', 'curand', 'curaci', 'curativ', 'sanar', 'sano ', 'sane', 'sanad', 'sanand', 'sanaci', 'medic', 'enfermer', 'herid', 'salvar vidas', 'cuidar', 'cuido', 'cuide', 'cuidand', 'ayudar', 'ayudo', 'ayude', 'ayudand', 'apoy', 'soporte', 'support', 'healer', 'revivir', 'resucit', 'dar animo', 'inspirar']],
    ['aguantar', ['aguantar', 'aguanto', 'resist', 'tanque', 'tank', 'proteg', 'protej', 'protect', 'defend', 'defens', 'defiend', 'armadura', 'escudo', 'dificil de matar', 'recibir golpes', 'duro ', 'dura ']],
    ['pacto', ['pacto', 'magia oscura', 'magia negra', 'artes oscuras', 'tinieblas', 'maldicion', 'maldit', 'entidad', 'cthulhu', 'lovecraft', 'vender mi alma']],
    ['magia', ['magia', 'magic', 'conjuro', 'hechizo', 'lanzar rayos', 'poderes', 'arcan', 'mistic', 'sobrenatural', 'brujeria', 'hechiceria', 'invocar', 'invocacion', 'nigroman']],
    ['pegar', ['pegar', 'pego', 'pegue', 'golpe', 'fuerte', 'fuerza bruta', 'combat', 'pelear', 'peleo', 'pelea', 'luchar', 'lucho', 'lucha', 'espada', 'hacha', 'martillo', 'dano', 'destruir', 'destrozar', 'aplastar', 'matar', 'mato', 'primera linea', 'primera fila', 'cuerpo a cuerpo', 'melee', 'guerra', 'batalla', 'furia']],
    ['sombras', ['sigil', 'sombra', 'esconder', 'escondo', 'escondid', 'trampa', 'robar', 'robo', 'por sorpresa', 'silencio', 'oscuridad', 'espiar', 'espia', 'infiltr', 'acechar', 'furtiv', 'sin que me vean', 'sin ser visto', 'cerradura', 'emboscad', 'discret']],
    ['hablar', ['hablar', 'hablo', 'convencer', 'convenzo', 'persua', 'carism', 'enganar', 'engano', 'mentir', 'miento', 'negociar', 'seducir', 'encantar', 'encantador', 'liderar', 'lider', 'diplomac', 'labia', 'manipul']],
    ['distancia', ['arco', 'flecha', 'disparar', 'disparo', 'distancia', 'desde lejos', 'de lejos', 'ballesta', 'punteria', 'francotirador', 'tirador', 'tiradora']],
    ['naturaleza', ['naturaleza', 'bosque', 'animal', 'planta', 'selva', 'jungla', 'lobo', 'oso ', 'osos ', 'bestia', 'salvaje', 'transformar', 'convertirme en', 'hombre lobo', 'mujer lobo']],
    ['estudio', ['estudi', 'libro', 'inteligent', 'conocimiento', 'sabiondo', 'ciencia', 'investig', 'leer', 'leo ', 'biblioteca', 'sabelotodo', 'inventar', 'erudit']],
    ['fuego', ['fuego', 'llamas ', 'llamarada', 'explosi', 'quemar', 'quemo', 'incendi', 'ardient', 'lava', 'volcan']],
    ['musica', ['musica', 'cantar', 'canto ', 'cancion', 'instrumento', 'guitarra', 'laud', 'bailar', 'bailo', 'baile', 'poesia', 'poeta', 'actuar', 'teatro']],
    ['fe', ['fe ', 'dios', 'divin', 'sagrad', 'religi', 'rezar', 'rezo', 'oracion', 'santo', 'santa', 'bendic', 'bendec', 'iglesia']],
    ['punos', ['punos', 'punetazo', 'sin armas', 'a golpes', 'boxe', 'patada']],
    ['rapido', ['rapid', 'agil', 'veloz', 'velocidad', 'acrobac', 'esquiv', 'correr', 'parkour']],
  ];
  const CAR = [
    ['fue', ['fuerza', 'muy fuerte', 'musculos']], ['des', ['destreza', 'agilidad', 'muy agil', 'rapido', 'rapida']], ['con', ['constitucion', 'aguante', 'resistente']], ['int', ['inteligencia', 'muy inteligente', 'listo', 'lista']], ['sab', ['sabiduria', 'intuicion', 'instinto']], ['car', ['carisma', 'presencia', 'carismatic']],
  ];
  const NOMBRE_RE = /(?:me llamo|llamame|se llama|se llame|se llamara|llamado|llamada|de nombre|mi nombre es|su nombre es|nombre a)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ'-]+)?)/i;
  const PARADA = new Set(['y', 'que', 'pero', 'de', 'el', 'la', 'un', 'una', 'con', 'mi', 'su']);

  // Devuelve true si la coincidencia en la posición está negada: «no quiero ser mago», «sin magia».
  // La negación termina con la frase o con palabras como «pero» y «solo»: «no quiero magia, solo pegar».
  function negado(texto, i) {
    const antes = texto.slice(Math.max(0, i - 28), i);
    return /\b(no|nunca|sin|nada de|odio|detesto|evita|evitar|menos)\b(?:(?!\b(?:pero|sino|solo|prefiero|y quiero|y me)\b)[^;]){0,24}$/.test(antes) && !/\bno solo\b/.test(antes);
  }
  // Coincide por inicio de palabra, para que «mago» no salte en «imagino». Con espacio final exige la palabra completa.
  function encontrar(texto, pistas) {
    let mejor = null;
    pistas.forEach((p) => {
      const q = p.trimEnd();
      const re = new RegExp('(^|\\s)' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (p === q ? '' : '(?=\\s|$)'), 'g');
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
    opcion: (v, pj, claseId) => {
      const c = P.buscar(P.CLASES, claseId || pj.claseId);
      return c.opcion.titulo + ': ' + P.buscar(c.opcion.lista, v).nombre;
    },
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
    const claseFinal = () => ((lista || []).find((c) => c && c.tipo === 'clase' && P.buscar(P.CLASES, c.valor)) || { valor: pj.claseId }).valor;
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
      } else if (c.tipo === 'opcion') {
        const cl = P.buscar(P.CLASES, claseFinal());
        if (cl && cl.opcion && P.buscar(cl.opcion.lista, v)) validos.push({ tipo: 'opcion', valor: v });
        else dudas.push('Esa opción no existe para tu clase.');
      } else dudas.push('No reconozco «' + v + '».');
    });
    // La opción va al final porque elegir una clase la borra
    validos.sort((a, b) => Number(a.tipo === 'opcion') - Number(b.tipo === 'opcion'));
    return { cambios: validos.map((c) => Object.assign(c, { texto: P.CAMBIO[c.tipo](c.valor, pj, c.tipo === 'opcion' ? claseFinal() : razaFinal()) })), dudas };
  };

  P.unir = (lista) => (lista.length > 1 ? lista.slice(0, -1).join(', ') + ' y ' + lista[lista.length - 1] : lista[0] || '');

  // Lo que le gusta y lo que quiere evitar, en el orden en que lo dijo
  P.leerGustos = function (textoOriginal) {
    const texto = limpiar(textoOriginal || '', ' ; ');
    const hallados = GUSTOS.map(([id, pistas]) => ({ id, hit: encontrar(texto, pistas) })).filter((g) => g.hit).sort((a, b) => a.hit.pos - b.hit.pos);
    return { gustos: hallados.filter((g) => !g.hit.neg).map((g) => g.id), evitar: hallados.filter((g) => g.hit.neg).map((g) => g.id) };
  };

  // Tarjetas: lo que se muestra y los cambios que aplica el botón Usar. Gemini produce las mismas.
  P.tarjetaClase = (id, opcion, por) => {
    const c = P.buscar(P.CLASES, id), o = opcion && c.opcion ? P.buscar(c.opcion.lista, opcion) : null;
    return { id, nombre: o ? c.nombre + ' · ' + o.nombre : c.nombre, por, icono: c.icono, color: c.color, cambios: [{ tipo: 'clase', valor: id }].concat(o ? [{ tipo: 'opcion', valor: o.id }] : []) };
  };
  P.tarjetaRaza = (id, subraza, por) => {
    const r = P.buscar(P.RAZAS, id), s = subraza && r.subrazas ? P.buscar(r.subrazas, subraza) : null;
    return { id, nombre: s ? s.nombre : r.nombre, por: por || (s ? s.frase : r.frase), icono: r.icono, cambios: [{ tipo: 'raza', valor: id }].concat(s ? [{ tipo: 'subraza', valor: s.id }] : []) };
  };
  P.tarjetaFondo = (id, por) => {
    const t = P.buscar(P.TRASFONDOS, id);
    return { id, nombre: t.nombre, por: por || t.antes + '. Te da ' + P.unir(t.hab.map(P.nombreHab)) + '.', icono: t.icono, cambios: [{ tipo: 'trasfondo', valor: id }] };
  };

  // Una tarjeta por camino: las clases que cumplen más gustos van primero y, a igualdad, la más fácil de aprender
  P.recomendarClases = function (gustos, evitar) {
    const vetadas = new Set(evitar.flatMap((g) => P.GUSTOS[g].rutas.map((r) => r.clase)));
    const filas = new Map();
    gustos.forEach((g) => P.GUSTOS[g].rutas.forEach((r, i) => {
      if (vetadas.has(r.clase)) return;
      if (!filas.has(r.clase)) filas.set(r.clase, { puntos: {}, rutas: [] });
      const f = filas.get(r.clase);
      f.puntos[g] = Math.max(f.puntos[g] || 0, 10 - i);
      f.rutas.push({ ruta: r, gusto: g });
    }));
    const suma = (f) => Object.values(f.puntos).reduce((a, b) => a + b, 0);
    const orden = [...filas.entries()].sort(([a, x], [b, y]) => Object.keys(y.puntos).length - Object.keys(x.puntos).length || suma(y) - suma(x) || P.buscar(P.CLASES, a).dif - P.buscar(P.CLASES, b).dif);
    const tarjetas = [];
    orden.forEach(([id, f]) => {
      const conOpcion = f.rutas.filter((x) => x.ruta.opcion);
      const caminos = (conOpcion.length ? conOpcion : f.rutas.slice(0, 1)).filter((x, i, l) => l.findIndex((y) => y.ruta.opcion === x.ruta.opcion) === i);
      caminos.forEach(({ ruta, gusto }) => {
        const otros = Object.keys(f.puntos).filter((g) => g !== gusto).map((g) => P.GUSTOS[g].etiqueta);
        tarjetas.push(P.tarjetaClase(id, ruta.opcion, ruta.t + '. ' + ruta.d + (otros.length ? ' También encaja con ' + P.unir(otros) + '.' : '')));
      });
    });
    return tarjetas.slice(0, 6);
  };

  const sinRepetir = (lista, clave) => lista.filter((x, i) => lista.findIndex((y) => clave(y) === clave(x)) === i);
  P.recomendarRazas = (gustos, clase) => {
    const porGusto = gustos.flatMap((g) => P.GUSTOS[g].razas);
    const porClase = clase ? P.RAZAS.filter((r) => r.buenas.includes(clase.nombre)).map((r) => [r.id]) : [];
    return sinRepetir(porGusto.concat(porClase), (r) => r.join()).slice(0, 4).map(([id, sub]) => P.tarjetaRaza(id, sub));
  };
  P.recomendarTrasfondos = (gustos) => sinRepetir(gustos.flatMap((g) => P.GUSTOS[g].trasfondos), (id) => id).slice(0, 4).map((id) => P.tarjetaFondo(id));

  P.interpretar = function (textoOriginal, pj) {
    const texto = limpiar(textoOriginal, ' ; ');
    const crudos = [];
    const dudas = [];

    // «Matar a un dragón» habla de un enemigo, no de ser uno
    const raza = primero(RAZAS, texto);
    const esVictima = raza && /\b(matar|mato|cazar|cazo|caza|derrotar|vencer|contra)\b[^;]{0,14}$/.test(texto.slice(Math.max(0, raza.pos - 22), raza.pos));
    const razaDicha = raza && !raza.neg && !esVictima ? raza.id : null;
    if (razaDicha) crudos.push({ tipo: 'raza', valor: razaDicha });
    const razaId = razaDicha || pj.razaId;
    SUBRAZAS.filter((s) => s[0] === razaId).forEach(([, id, pistas]) => {
      if (crudos.some((c) => c.tipo === 'subraza')) return;
      const h = encontrar(texto, pistas);
      if (h && !h.neg) crudos.push({ tipo: 'subraza', valor: id });
    });

    const clase = primero(CLASES, texto);
    if (clase && !clase.neg) crudos.push({ tipo: 'clase', valor: clase.id });

    const fondo = primero(TRASFONDOS, texto.replace(/\bartistas? marcial(es)?\b/g, ' '));
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

    const { gustos, evitar } = P.leerGustos(textoOriginal);

    // «Un clérigo que cure» ya dice qué dominio le conviene
    if (clase && !clase.neg) {
      const ruta = gustos.flatMap((g) => P.GUSTOS[g].rutas).find((r) => r.clase === clase.id && r.opcion);
      if (ruta) crudos.push({ tipo: 'opcion', valor: ruta.opcion });
    }

    const { cambios, dudas: d2 } = P.validarCambios(crudos.slice(0, 9), pj);
    dudas.push(...d2);

    const claseDicha = P.buscar(P.CLASES, (cambios.find((c) => c.tipo === 'clase') || {}).valor);
    const razaFijada = razaDicha || pj.razaId;
    let recomendaciones = [];
    if (!claseDicha && gustos.length) {
      recomendaciones = P.recomendarClases(gustos, evitar);
      if (clase && clase.neg) recomendaciones = recomendaciones.filter((r) => r.id !== clase.id);
    } else if (!claseDicha && !pj.claseId && razaDicha) {
      const buenas = P.buscar(P.RAZAS, razaDicha).buenas;
      recomendaciones = P.CLASES.filter((c) => buenas.includes(c.nombre)).map((c) => P.tarjetaClase(c.id, null, c.frase));
    }

    // Sin gustos escritos, la clase elegida también orienta qué raza y qué trasfondo le van
    const claseBase = claseDicha || P.buscar(P.CLASES, pj.claseId);
    const orientan = gustos.length ? gustos : (claseBase ? claseBase.tags.filter((g) => P.GUSTOS[g]) : []);
    const razas = razaFijada ? [] : P.recomendarRazas(orientan, claseBase);
    const trasfondos = cambios.some((c) => c.tipo === 'trasfondo') || pj.trasfondoId ? [] : P.recomendarTrasfondos(orientan);

    if (!cambios.length && !recomendaciones.length) {
      dudas.push('No logré entenderlo. Prueba con algo como «un enano guerrero» o «quiero curar y usar magia».');
    }
    const partes = [];
    if (gustos.length) partes.push('te gusta ' + P.unir(gustos.map((g) => P.GUSTOS[g].etiqueta)));
    if (evitar.length) partes.push('prefieres evitar ' + P.unir(evitar.map((g) => P.GUSTOS[g].etiqueta)));
    const conPregunta = gustos.find((g) => P.GUSTOS[g].pregunta && P.GUSTOS[g].rutas.length > 1);
    return { cambios, recomendaciones, razas, trasfondos, dudas, respuesta: partes.length ? 'Entendí que ' + partes.join(' y que ') + '.' : '', pregunta: recomendaciones.length && conPregunta ? P.GUSTOS[conPregunta].pregunta : '' };
  };

  P.EJEMPLOS_TEXTO = [
    'Me gusta curar a mis amigos',
    'Quiero ser una elfa sigilosa con arco',
    'Un enano fuerte que proteja al grupo',
    'Magia oscura y un pacto peligroso',
    'Un tiflin bardo que se llame Nyx',
  ];
})(window.PJ);
