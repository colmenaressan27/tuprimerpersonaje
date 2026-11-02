/* Modo DM: generadores de PNJ, encuentros, objetos y trampas, y el control del combate. Sin DOM, se prueba con Node.
   Principio: la IA da ideas y elige entre opciones válidas; las reglas, los números y los dados los pone este archivo. */
(function (P) {
  const azar = (n) => (P.azar ? P.azar(n) : 1 + Math.floor(Math.random() * n));
  const uno = (lista) => lista[azar(lista.length) - 1];
  const barajar = (lista) => { const l = lista.slice(); for (let i = l.length - 1; i > 0; i--) { const j = azar(i + 1) - 1; [l[i], l[j]] = [l[j], l[i]]; } return l; };

  /* ---------- PNJ ---------- */
  const OFICIOS = {
    taberna: ['Lleva la posada del cruce de caminos', 'Sirve mesas y escucha todos los rumores', 'Cocina para media ciudad en una fonda humilde', 'Toca el laúd a cambio de cena y cama', 'Gana sus monedas apostando en la trastienda'],
    ciudad: ['Vende verduras y noticias en el mercado', 'Patrulla las murallas en el turno de noche', 'Repara cerraduras en el barrio viejo', 'Cobra impuestos y lo disfruta poco', 'Enseña a leer a los niños del gremio', 'Lleva los libros de un mercader importante'],
    camino: ['Guía caravanas por rutas peligrosas', 'Vende remedios de pueblo en pueblo', 'Viaja buscando trabajo como escolta', 'Peregrina hacia un santuario lejano', 'Caza para abastecer las aldeas de la zona', 'Transporta cartas entre ciudades'],
    nobleza: ['Administra las tierras de una casa noble', 'Es el heredero discreto de una gran familia', 'Asesora al señor local en secreto', 'Colecciona arte y favores', 'Representa a una casa en la corte'],
    magia: ['Vende pociones de dudosa calidad', 'Estudia ruinas antiguas por encargo', 'Guarda una biblioteca de libros prohibidos', 'Investiga un fenómeno arcano que nadie cree', 'Lee el futuro en una tienda ambulante'],
    crimen: ['Trafica con mercancía sin preguntar', 'Compra y vende información', 'Dirige a los ladronzuelos del puerto', 'Falsifica documentos con mano perfecta', 'Cobra deudas por encargo'],
    templo: ['Cuida el santuario de una aldea', 'Atiende a los enfermos en el hospicio', 'Canta en el coro y sabe demasiado', 'Recauda limosnas por los caminos', 'Custodia una reliquia que pocos han visto'],
  };
  P.ROLES_PNJ = [['cualquiera', 'Cualquiera'], ['taberna', 'Taberna'], ['ciudad', 'Ciudad'], ['camino', 'Caminos'], ['nobleza', 'Nobleza'], ['magia', 'Magia'], ['crimen', 'Bajos fondos'], ['templo', 'Templo']];
  const ASPECTO = {
    cuerpo: ['Figura enjuta y nervuda', 'Hombros anchos y andar pesado', 'Estatura baja y gestos rápidos', 'Postura muy recta, casi militar', 'Cuerpo robusto de quien come bien', 'Delgadez que preocupa a quien la ve', 'Andar cojo que no frena a nadie'],
    rostro: ['Cicatriz que cruza una ceja', 'Ojos de distinto color', 'Nariz rota más de una vez', 'Sonrisa con un diente de oro', 'Pecas por toda la cara', 'Mirada que nunca parpadea', 'Tatuaje pequeño junto al ojo', 'Arrugas de tanto reír'],
    pelo: ['Cabello trenzado con cuentas', 'Cabeza afeitada y brillante', 'Melena gris mal recogida', 'Rizos rojos imposibles de domar', 'Pelo corto y siempre despeinado', 'Barba o patillas muy cuidadas'],
    ropa: ['Ropa elegante pero remendada', 'Capa llena de bolsillos', 'Delantal manchado de mil cosas', 'Túnica heredada que le queda grande', 'Botas de viaje gastadas', 'Sombrero con una pluma ridícula', 'Joyas baratas que parecen caras'],
    detalle: ['Huele a tabaco y a canela', 'Lleva siempre un cuaderno atado a la cintura', 'Juega con una moneda entre los dedos', 'Un cuervo le sigue a todas partes', 'Le falta el meñique de una mano', 'Tararea cuando está nervioso', 'Guarda un amuleto que no deja de tocar'],
  };
  const VOZ = ['Habla muy bajo y hay que acercarse', 'Voz ronca de mil tabernas', 'Termina todas las frases con una pregunta', 'Usa refranes que nadie conoce', 'Habla de sí en tercera persona', 'Tartamudea cuando miente', 'Grita sin darse cuenta', 'Habla despacio, midiendo cada palabra'];
  const QUIERE = ['Saldar una deuda antes de fin de mes', 'Encontrar a alguien que desapareció', 'Que nadie descubra lo que hizo', 'Conseguir un objeto muy concreto', 'Salir de la ciudad sin que le sigan', 'Vengarse de un antiguo socio', 'Proteger a un familiar en peligro', 'Comprar su libertad'];
  const SECRETO = ['Trabaja en secreto para otra persona', 'No es quien dice ser', 'Vio algo que no debía ver', 'Debe mucho dinero a gente peligrosa', 'Tiene un hijo que nadie conoce', 'Robó lo que más orgullo le da', 'Está bajo una maldición menor', 'Sabe dónde hay una entrada oculta'];

  function pnj({ raza = 'cualquiera', rol = 'cualquiera' } = {}) {
    const r = raza === 'cualquiera' ? uno(P.RAZAS) : P.buscar(P.RAZAS, raza);
    const zona = rol === 'cualquiera' ? uno(Object.keys(OFICIOS)) : rol;
    return {
      nombre: uno(P.NOMBRES[r.id]), raza: r.nombre, oficio: uno(OFICIOS[zona]),
      apariencia: [uno(ASPECTO.cuerpo), uno(ASPECTO.rostro), uno(ASPECTO.pelo), uno(ASPECTO.ropa), uno(ASPECTO.detalle)].join('. ') + '.',
      personalidad: uno(P.PERSONALIDAD.rasgo), ideal: uno(P.PERSONALIDAD.ideal), defecto: uno(P.PERSONALIDAD.defecto),
      voz: uno(VOZ), quiere: uno(QUIERE), secreto: uno(SECRETO),
    };
  }

  /* ---------- Encuentros ---------- */
  P.ENTORNOS = {
    mazmorra: { nombre: 'Mazmorra', tipos: ['Muerto', 'Cieno', 'Autómata', 'Aberración', 'Monstruosidad', 'Humanoide', 'Infernal'], escenas: ['Un pasillo estrecho que se abre a una sala con columnas rotas', 'Una cripta inundada hasta las rodillas', 'Una sala con un altar profanado y antorchas aún encendidas', 'Un puente de piedra sobre un foso oscuro'] },
    bosque: { nombre: 'Bosque', tipos: ['Bestia', 'Feérico', 'Planta', 'Monstruosidad', 'Humanoide', 'Enjambre'], escenas: ['Un claro con un círculo de setas gigantes', 'Un sendero cortado por árboles caídos', 'Las ruinas de una torre cubiertas de hiedra', 'Un arroyo donde el agua suena demasiado fuerte'] },
    ciudad: { nombre: 'Ciudad', tipos: ['Humanoide', 'Muerto', 'Autómata', 'Infernal', 'Enjambre'], escenas: ['Un callejón sin salida detrás de una taberna', 'Los tejados del barrio viejo en plena lluvia', 'Un almacén del puerto lleno de cajas', 'Las alcantarillas bajo el mercado'] },
    camino: { nombre: 'Caminos', tipos: ['Humanoide', 'Bestia', 'Monstruosidad', 'Gigante'], escenas: ['Una carreta volcada en mitad del camino', 'Un puente de madera con el peaje ocupado', 'Un campamento abandonado con el fuego aún caliente', 'Un paso estrecho entre dos colinas'] },
    montana: { nombre: 'Montaña', tipos: ['Gigante', 'Dragón', 'Bestia', 'Elemental', 'Monstruosidad'], escenas: ['Una cornisa que se desmorona con cada paso', 'La boca de una cueva que respira humo', 'Un puente natural de hielo y roca', 'Una mina abandonada con los raíles torcidos'] },
    pantano: { nombre: 'Pantano', tipos: ['Bestia', 'Planta', 'Cieno', 'Muerto', 'Monstruosidad'], escenas: ['Una pasarela podrida sobre agua negra', 'Un islote con un árbol muerto lleno de amuletos', 'Una niebla espesa con luces que se mueven', 'Un barco hundido medio tragado por el lodo'] },
    infraoscuridad: { nombre: 'Subterráneo', tipos: ['Aberración', 'Cieno', 'Monstruosidad', 'Humanoide', 'Autómata'], escenas: ['Una caverna de hongos que brillan', 'Un lago subterráneo sin orillas visibles', 'Una grieta profunda cruzada por telarañas', 'Una ciudad muerta tallada en la roca'] },
  };
  P.DIFICULTADES = { facil: ['Fácil', 0.5], media: ['Media', 1], dificil: ['Difícil', 1.5], mortal: ['Mortal', 2.2] };
  const GIROS = ['Hay un rehén que hay que proteger', 'Llegan refuerzos a la tercera ronda', 'El lugar empieza a derrumbarse', 'Un enemigo quiere negociar', 'Hay un tesoro a la vista que se puede destruir', 'Alguien les está observando desde lejos', 'La luz se apaga de golpe', 'Uno de los enemigos es un viejo conocido'];
  const tipoDe = (c) => c.t.split(' ')[0];
  const valorVd = (vd) => (String(vd).includes('/') ? 1 / +String(vd).split('/')[1] : +vd);
  // Más enemigos pegan más de lo que suman sus PX. Regla propia, parecida a la que usan muchas mesas.
  const pesoGrupo = (n) => (n <= 1 ? 1 : n === 2 ? 1.5 : n <= 6 ? 2 : 2.5);

  // Presupuesto propio: un grupo de cuatro aguanta un combate medio contra una criatura de desafío igual a su nivel
  function presupuesto(nivel, jugadores, dificultad) {
    const ref = P.SRD_CRIATURAS.filter((c) => valorVd(c.vd) <= nivel).reduce((m, c) => Math.max(m, c.px), 25);
    return Math.round(ref * (jugadores / 4) * P.DIFICULTADES[dificultad][1]);
  }

  function propuesta(candidatas, tope) {
    const ordenadas = candidatas.filter((c) => c.px > 0 && c.px <= tope);
    if (!ordenadas.length) return null;
    const patron = uno(['grupo', 'grupo', 'jefe', 'solo']);
    if (patron === 'solo') {
      const fuertes = ordenadas.filter((c) => c.px >= tope * 0.5);
      if (fuertes.length) return [{ c: uno(fuertes), q: 1 }];
    }
    if (patron === 'jefe' && ordenadas.length > 1) {
      const jefes = ordenadas.filter((c) => c.px >= tope * 0.3 && c.px <= tope * 0.6);
      const jefe = jefes.length ? uno(jefes) : null;
      if (jefe) {
        const sobra = tope / 2 - jefe.px;
        const esbirros = ordenadas.filter((c) => c.px * 2 <= sobra && tipoDe(c) === tipoDe(jefe) && c !== jefe);
        const e = esbirros.length ? uno(esbirros) : null;
        if (e) return [{ c: jefe, q: 1 }, { c: e, q: Math.min(6, Math.max(2, Math.floor(sobra / e.px))) }];
      }
    }
    const buenas = ordenadas.filter((c) => c.px * pesoGrupo(2) * 2 <= tope);
    const c = uno(buenas.length ? buenas : ordenadas);
    let q = 1;
    while (q < 8 && c.px * (q + 1) * pesoGrupo(q + 1) <= tope) q++;
    return [{ c, q }];
  }

  function encuentro({ nivel = 1, jugadores = 4, dificultad = 'media', entorno = 'mazmorra', tipo = 'cualquiera' } = {}) {
    const tope = presupuesto(nivel, jugadores, dificultad);
    const env = P.ENTORNOS[entorno];
    const maxVd = nivel + (dificultad === 'mortal' ? 4 : 2);
    const base = P.SRD_CRIATURAS.filter((c) => valorVd(c.vd) <= maxVd && (c.a || []).some((a) => a.dn));
    let pool = base.filter((c) => (tipo === 'cualquiera' ? env.tipos.includes(tipoDe(c)) : tipoDe(c) === tipo));
    if (!pool.length) pool = base;
    const grupo = propuesta(pool, tope) || [{ c: pool.slice().sort((a, b) => a.px - b.px)[0], q: 1 }];
    const px = grupo.reduce((s, g) => s + g.c.px * g.q, 0);
    const total = grupo.reduce((s, g) => s + g.q, 0);
    return { grupo: grupo.map((g) => ({ n: g.c.n, q: g.q, ca: g.c.ca, pg: g.c.pg, vd: g.c.vd, px: g.c.px, t: g.c.t })), px, ajustado: Math.round(px * pesoGrupo(total)), tope, escena: uno(env.escenas), giro: uno(GIROS), tactica: '', opciones: { nivel, jugadores, dificultad, entorno } };
  }

  /* ---------- Objetos mágicos ---------- */
  const ORIGEN = ['Lo forjaron para una guerra que nadie recuerda', 'Perteneció a una heroína de canción popular', 'Apareció en la tumba de un rey sin nombre', 'Lo ganaron en una apuesta con un feérico', 'Lo robaron de un templo y sigue maldiciendo a sus dueños', 'Su creador murió antes de terminar de probarlo', 'Pasó de mano en mano entre piratas', 'Lo encontraron dentro del estómago de una bestia'];
  const DETALLE = ['Tiene una inscripción en un idioma antiguo', 'Está siempre tibio al tacto', 'Vibra levemente cerca de un peligro', 'Huele a tormenta', 'Tiene una marca de quemadura con forma de mano', 'Brilla un poco en noches de luna llena'];
  P.RAREZAS = [['cualquiera', 'Cualquiera'], ['común', 'Común'], ['infrecuente', 'Infrecuente'], ['rara', 'Rara'], ['muy rara', 'Muy rara'], ['legendaria', 'Legendaria']];
  P.TIPOS_OBJETO = [['cualquiera', 'Cualquiera'], ['Anillo', 'Anillos'], ['Arma', 'Armas'], ['Armadura', 'Armaduras'], ['Poción', 'Pociones'], ['Pergamino', 'Pergaminos'], ['Varita', 'Varitas'], ['Vara', 'Varas'], ['Bastón', 'Bastones'], ['Objeto maravilloso', 'Objetos maravillosos']];
  const objetosDe = (rareza, tipo) => P.SRD_OBJETOS.filter((o) => (rareza === 'cualquiera' || o.r === rareza) && (tipo === 'cualquiera' || o.t.startsWith(tipo)));

  function objeto({ rareza = 'cualquiera', tipo = 'cualquiera' } = {}) {
    const lista = objetosDe(rareza, tipo);
    const o = lista.length ? uno(lista) : uno(P.SRD_OBJETOS);
    return { ...o, historia: uno(ORIGEN) + '. ' + uno(DETALLE) + '.', exacto: lista.length > 0 };
  }

  /* ---------- Trampas ---------- */
  // Dificultades y daño según las tablas de gravedad del SRD
  P.GRAVEDAD = {
    contratiempo: { nombre: 'Contratiempo', cd: [10, 11], ataque: [3, 5], dano: ['1d10', '2d10', '4d10', '10d10'] },
    peligrosa: { nombre: 'Peligrosa', cd: [12, 15], ataque: [6, 8], dano: ['2d10', '4d10', '10d10', '18d10'] },
    mortal: { nombre: 'Mortal', cd: [16, 20], ataque: [9, 12], dano: ['4d10', '10d10', '18d10', '24d10'] },
  };
  const tramoNivel = (n) => (n <= 4 ? 0 : n <= 10 ? 1 : n <= 16 ? 2 : 3);
  const DISPARADORES = [
    ['una placa de presión escondida entre las losas', 'Una losa está un poco más limpia que las demás'],
    ['un hilo tenso a la altura del tobillo', 'Se ve un brillo fino de lado a lado del pasillo'],
    ['abrir la puerta sin girar antes el pomo al revés', 'Las bisagras tienen aceite fresco'],
    ['levantar la tapa del cofre', 'Hay arañazos alrededor de la cerradura'],
    ['pisar el tercer escalón', 'Ese escalón suena hueco'],
    ['pasar junto a una estatua', 'La estatua tiene los ojos vidriosos y húmedos'],
    ['tocar el objeto del pedestal', 'El pedestal tiene una ranura muy fina alrededor'],
  ];
  const EFECTOS = [
    { n: 'Dardos del muro', tipo: 'mecánica', ataque: true, dano: 'perforante', d: 'Unos dardos salen disparados de agujeros ocultos en la pared.', desactivar: 'Tapar los agujeros o cortar el mecanismo con herramientas de ladrón' },
    { n: 'Foso con estacas', tipo: 'mecánica', sal: 'des', dano: 'perforante', d: 'El suelo cede de golpe y deja ver un foso lleno de estacas.', desactivar: 'Trabar la tapa con cuñas o cruzar por el borde' },
    { n: 'Hoja oscilante', tipo: 'mecánica', ataque: true, dano: 'cortante', d: 'Una enorme hoja baja del techo y barre el pasillo.', desactivar: 'Atascar el eje con una palanca' },
    { n: 'Bloque del techo', tipo: 'mecánica', sal: 'des', dano: 'contundente', d: 'Un bloque de piedra cae del techo sobre quien está debajo.', desactivar: 'Apuntalar el bloque o bloquear la cadena' },
    { n: 'Gas venenoso', tipo: 'mecánica', sal: 'con', dano: 'veneno', d: 'Unas rejillas sueltan un gas verdoso que llena la sala.', desactivar: 'Taponar las rejillas o abrir una salida de aire' },
    { n: 'Chorro de fuego', tipo: 'mágica', sal: 'des', dano: 'fuego', d: 'Unas runas se encienden y lanzan llamas por todo el pasillo.', desactivar: 'Borrar una runa o usar disipar magia' },
    { n: 'Glifo atronador', tipo: 'mágica', sal: 'con', dano: 'trueno', d: 'Un glifo invisible estalla con un golpe de sonido.', desactivar: 'Identificar el glifo y usar disipar magia' },
    { n: 'Rayo de la estatua', tipo: 'mágica', ataque: true, dano: 'relámpago', d: 'La estatua abre la boca y dispara un rayo.', desactivar: 'Cubrir la cabeza de la estatua o usar disipar magia' },
    { n: 'Runa de hielo', tipo: 'mágica', sal: 'con', dano: 'frío', d: 'El aire se congela de golpe alrededor de la víctima.', desactivar: 'Romper el cristal que alimenta la runa' },
  ];
  const entre = ([a, b]) => a + azar(b - a + 1) - 1;
  const CARACT = { des: 'Destreza', con: 'Constitución' };

  function trampa({ nivel = 1, gravedad = 'peligrosa', tipo = 'cualquiera' } = {}) {
    const g = P.GRAVEDAD[gravedad];
    const efectos = EFECTOS.filter((e) => tipo === 'cualquiera' || e.tipo === tipo);
    const e = uno(efectos), [disparador, pista] = uno(DISPARADORES);
    const cd = entre(g.cd);
    return { nombre: e.n, tipo: e.tipo, gravedad: g.nombre, disparador, pista, descripcion: e.d, comoDesactivar: e.desactivar, detectar: cd + 2, desactivar: cd, salvacion: e.ataque ? null : { car: CARACT[e.sal], cd }, ataque: e.ataque ? entre(g.ataque) : null, dano: g.dano[tramoNivel(nivel)], tipoDano: e.dano, mitad: !e.ataque };
  }

  /* ---------- Combate ---------- */
  const promedio = (dn) => { const d = partirDano(dn); return d.n * ((d.lados + 1) / 2) + d.bono; };
  function partirDano(dn) {
    const m = String(dn).match(/^(\d+)d(\d+)([+-]\d+)?$/);
    return m ? { n: +m[1], lados: +m[2], bono: +(m[3] || 0) } : { n: 0, lados: 0, bono: +dn || 0 };
  }
  const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const combate = {
    crear: () => ({ ronda: 0, turno: -1, gente: [], registro: [] }),
    // Convierte una ficha del SRD en combatientes numerados
    agregarCriatura(est, c, cantidad = 1) {
      const iguales = est.gente.filter((g) => g.fuente === c.n).length;
      for (let i = 0; i < cantidad; i++) {
        est.gente.push({ id: nuevoId(), fuente: c.n, nombre: cantidad + iguales > 1 ? `${c.n} ${iguales + i + 1}` : c.n, bando: 'enemigo', ca: c.ca, pg: c.pg, pgMax: c.pg, iniBono: P.mod(c.c[1]), ini: null, estados: [], ataques: (c.a || []).filter((a) => a.dn).map((a) => ({ n: a.n, b: a.b, dn: a.dn, ti: a.ti, ex: a.ex || [] })), multi: c.m || null });
      }
    },
    agregarPJ(est, datos) {
      est.gente.push(Object.assign({ id: nuevoId(), bando: 'pj', ini: null, estados: [], ataques: [], muerte: { e: 0, f: 0 } }, datos));
    },
    // Lleva un personaje guardado a la iniciativa con sus números reales
    desdePersonaje(pj) {
      const c = P.calcular(pj);
      return { fuente: pj.nombre, nombre: pj.nombre || 'Personaje', ca: c.ca.valor ?? 10, pg: c.pgMax ?? 10, pgMax: c.pgMax ?? 10, iniBono: c.iniciativa, ataques: c.ataques.filter((a) => !a.salvacion).map((a) => ({ n: a.nombre, b: a.acierta, dn: a.dado + (a.bonoDano ? (a.bonoDano > 0 ? '+' : '') + a.bonoDano : ''), ti: a.tipo, ex: [] })) };
    },
    quitar(est, id) {
      const actual = combate.actual(est);
      est.gente = est.gente.filter((g) => g.id !== id);
      if (actual && actual.id !== id) est.turno = est.gente.indexOf(actual);
      else est.turno = Math.min(est.turno, est.gente.length - 1);
    },
    // Los valores se pasan desde fuera para que se puedan tirar en 3D, a mano o de forma automática
    fijarIniciativa(est, id, d20) {
      const g = est.gente.find((x) => x.id === id);
      g.ini = d20 + g.iniBono;
    },
    ordenar(est) {
      combate.colocar(est);
      est.ronda = 1; est.turno = 0;
      combate.anotar(est, 'Empieza la pelea. Orden: ' + est.gente.map((g) => `${g.nombre} (${g.ini})`).join(', ') + '.');
    },
    // Ordena sin perder de quién es el turno: sirve para quien entra con la pelea empezada
    colocar(est) {
      const a = combate.actual(est);
      est.gente.sort((x, y) => (y.ini ?? -99) - (x.ini ?? -99) || y.iniBono - x.iniBono);
      if (a) est.turno = est.gente.indexOf(a);
    },
    actual: (est) => est.gente[est.turno] || null,
    vivo: (g) => (g.bando === 'pj' ? !g.muerto : g.pg > 0),
    siguiente(est) {
      if (!est.gente.some(combate.vivo)) return null;
      for (let i = 0; i < est.gente.length; i++) {
        est.turno += 1;
        if (est.turno >= est.gente.length) { est.turno = 0; est.ronda += 1; combate.anotar(est, `Ronda ${est.ronda}.`); }
        if (combate.vivo(est.gente[est.turno])) break;
      }
      return combate.actual(est);
    },
    anotar(est, texto) { est.registro.unshift({ r: est.ronda, t: texto }); est.registro = est.registro.slice(0, 200); },
    danar(est, id, n) {
      const g = est.gente.find((x) => x.id === id);
      const antes = g.pg;
      g.pg = Math.max(0, g.pg - n);
      if (g.pg === 0 && antes > 0) {
        if (g.bando === 'pj') { if (!g.estados.includes('Inconsciente')) g.estados.push('Inconsciente'); combate.anotar(est, `${g.nombre} cae a 0 de vida.`); } else combate.anotar(est, `${g.nombre} cae derrotado.`);
      } else if (antes === 0 && g.bando === 'pj' && n > 0) {
        g.muerte.f += 1;
        combate.anotar(est, `${g.nombre} recibe daño a 0 de vida: suma un fallo.`);
        if (g.muerte.f >= 3) { g.muerto = true; combate.anotar(est, `${g.nombre} muere.`); }
      }
      return g.pg;
    },
    curar(est, id, n) {
      const g = est.gente.find((x) => x.id === id);
      const antes = g.pg;
      g.pg = Math.min(g.pgMax, g.pg + n);
      if (antes === 0 && g.pg > 0 && g.bando === 'pj') { g.estados = g.estados.filter((e) => e !== 'Inconsciente'); g.muerte = { e: 0, f: 0 }; }
      return g.pg;
    },
    salvacionMuerte(est, id, d20) {
      const g = est.gente.find((x) => x.id === id);
      if (d20 === 20) { combate.curar(est, id, 1); combate.anotar(est, `${g.nombre} saca 20 y despierta con 1 de vida.`); return 'despierta'; }
      if (d20 === 1) g.muerte.f += 2; else if (d20 >= 10) g.muerte.e += 1; else g.muerte.f += 1;
      if (g.muerte.f >= 3) { g.muerto = true; combate.anotar(est, `${g.nombre} muere.`); return 'muere'; }
      if (g.muerte.e >= 3) { g.muerte = { e: 0, f: 0 }; g.estable = true; combate.anotar(est, `${g.nombre} se estabiliza.`); return 'estable'; }
      combate.anotar(est, `${g.nombre} saca ${d20} en su salvación contra muerte (${g.muerte.e} éxitos, ${g.muerte.f} fallos).`);
      return 'sigue';
    },
    rivales: (est, g) => est.gente.filter((x) => x.bando !== g.bando && combate.vivo(x)),
    // Elige a quién atacar: al que esté en pie con menos vida. A los caídos solo si no queda nadie más.
    objetivo(est, g) {
      const r = combate.rivales(est, g), enPie = r.filter((x) => x.pg > 0);
      return (enPie.length ? enPie : r).sort((a, b) => a.pg - b.pg)[0] || null;
    },
    // Lista de ataques de un turno, con el reparto oficial de su ataque múltiple si lo tiene
    golpes(g) {
      if (!g.ataques.length) return [];
      const mejor = g.ataques.slice().sort((a, b) => promedio(b.dn) - promedio(a.dn))[0];
      if (!g.multi) return [mejor];
      return g.multi.flatMap((m) => Array(m.q).fill(g.ataques.find((a) => a.n === m.a) || mejor));
    },
    resolver(bono, ca, d20) {
      const total = d20 + bono, critico = d20 === 20;
      return { total, critico, pifia: d20 === 1, impacta: critico || (d20 !== 1 && total >= ca) };
    },
  };

  /* ---------- Validación de lo que proponga la IA: si no cumple, devuelve null ---------- */
  const texto = (v, max) => String(v ?? '').trim().slice(0, max);
  const validarIA = {
    pnj(r) {
      const c = { nombre: texto(r.nombre, 60), raza: texto(r.raza, 40), oficio: texto(r.oficio, 120), apariencia: texto(r.apariencia, 400), personalidad: texto(r.personalidad, 240), ideal: texto(r.ideal, 200), defecto: texto(r.defecto, 200), voz: texto(r.voz, 160), quiere: texto(r.quiere, 200), secreto: texto(r.secreto, 240), ia: true };
      return c.nombre && c.apariencia && c.personalidad ? c : null;
    },
    // Elige entre propuestas ya válidas por índice: no puede inventar criaturas ni cambiar cantidades
    encuentro(r, opciones) {
      const e = opciones[r.opcion];
      if (!e) return null;
      return Object.assign({}, e, { escena: texto(r.escena, 400) || e.escena, tactica: texto(r.tactica, 300), giro: texto(r.giro, 240) || e.giro, ia: true });
    },
    objeto(r, opciones) {
      const o = opciones[r.opcion];
      return o ? Object.assign({}, o, { historia: texto(r.historia, 400) || o.historia, ia: true }) : null;
    },
    // Solo cambia la narración: los datos de la trampa no se tocan
    trampa(r, t) {
      const d = texto(r.descripcion, 400);
      return d ? Object.assign({}, t, { descripcion: d, pista: texto(r.pista, 240) || t.pista, ia: true }) : null;
    },
    turno(r, est, g) {
      const opciones = combate.rivales(est, g);
      const obj = opciones.find((x) => x.id === r.objetivo);
      return obj ? { objetivo: obj, narracion: texto(r.narracion, 240) } : null;
    },
  };

  P.dm = { pnj, encuentro, objeto, trampa, presupuesto, partirDano, combate, validarIA, objetosDe, barajar, valorVd, tipoDe };
})(window.PJ);
