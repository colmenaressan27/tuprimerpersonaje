/* Datos del juego. Las reglas están explicadas con palabras propias; ver créditos en README.md. */
window.PJ = window.PJ || {};
(function (P) {
  // Reconocimiento exacto que exige la licencia del SRD 5.1
  P.ATRIBUCION = 'Esta obra incluye materiales extraídos del Documento de referencia del sistema 5.1 (“SRD 5.1”) de Wizards of the Coast LLC, que está disponible en https://dnd.wizards.com/es/resources/systems-reference-document. SRD 5.1 tiene la licencia Creative Commons Atribución/Reconocimiento 4.0 Licencia Pública Internacional, que está disponible en https://creativecommons.org/licenses/by/4.0/legalcode.es.';

  P.CARACT = [
    { id: 'fue', nombre: 'Fuerza', abrev: 'FUE', palabra: 'Músculo', sirve: 'Levantar, empujar y golpear cuerpo a cuerpo.' },
    { id: 'des', nombre: 'Destreza', abrev: 'DES', palabra: 'Agilidad', sirve: 'Esquivar, moverte sin ruido y usar arcos.' },
    { id: 'con', nombre: 'Constitución', abrev: 'CON', palabra: 'Aguante', sirve: 'Te da vida y resiste venenos y cansancio.' },
    { id: 'int', nombre: 'Inteligencia', abrev: 'INT', palabra: 'Estudio', sirve: 'Recordar y razonar. Es la magia del mago.' },
    { id: 'sab', nombre: 'Sabiduría', abrev: 'SAB', palabra: 'Instinto', sirve: 'Notar cosas e intuir. Magia de clérigos y druidas.' },
    { id: 'car', nombre: 'Carisma', abrev: 'CAR', palabra: 'Presencia', sirve: 'Convencer e impresionar. Magia de bardos y brujos.' },
  ];

  P.HABILIDADES = [
    { id: 'acrobacias', nombre: 'Acrobacias', car: 'des', ej: 'Mantener el equilibrio y dar saltos ágiles' },
    { id: 'arcano', nombre: 'Conocimiento Arcano', car: 'int', ej: 'Saber sobre magia' },
    { id: 'atletismo', nombre: 'Atletismo', car: 'fue', ej: 'Trepar, nadar y saltar' },
    { id: 'engano', nombre: 'Engaño', car: 'car', ej: 'Mentir de forma creíble' },
    { id: 'historia', nombre: 'Historia', car: 'int', ej: 'Recordar hechos del pasado' },
    { id: 'interpretacion', nombre: 'Interpretación', car: 'car', ej: 'Actuar, cantar y entretener' },
    { id: 'intimidacion', nombre: 'Intimidación', car: 'car', ej: 'Asustar para conseguir algo' },
    { id: 'investigacion', nombre: 'Investigación', car: 'int', ej: 'Buscar pistas y deducir' },
    { id: 'manos', nombre: 'Juego de Manos', car: 'des', ej: 'Robar con disimulo' },
    { id: 'medicina', nombre: 'Medicina', car: 'sab', ej: 'Atender heridas' },
    { id: 'naturaleza', nombre: 'Naturaleza', car: 'int', ej: 'Conocer plantas y clima' },
    { id: 'percepcion', nombre: 'Percepción', car: 'sab', ej: 'Notar lo que te rodea' },
    { id: 'perspicacia', nombre: 'Perspicacia', car: 'sab', ej: 'Saber si alguien miente' },
    { id: 'persuasion', nombre: 'Persuasión', car: 'car', ej: 'Convencer con buenas razones' },
    { id: 'religion', nombre: 'Religión', car: 'int', ej: 'Conocer dioses y ritos' },
    { id: 'sigilo', nombre: 'Sigilo', car: 'des', ej: 'Moverte sin que te vean' },
    { id: 'supervivencia', nombre: 'Supervivencia', car: 'sab', ej: 'Rastrear y orientarte' },
    { id: 'animales', nombre: 'Trato con Animales', car: 'sab', ej: 'Calmar y guiar animales' },
  ];

  P.nombreHab = (id) => { const h = P.HABILIDADES.find((x) => x.id === id); return h.nombre + ' (' + h.car.toUpperCase() + ')'; };

  const VISION = { n: 'Visión en la oscuridad', d: 'Distingues formas sin luz hasta 60 ft, sin colores.' };
  const FEERICO = { n: 'Linaje feérico', d: 'Ventaja contra encantamientos. La magia no puede dormirte.' };

  P.RAZAS = [
    { id: 'humano', nombre: 'Humano', en: 'human', icono: 'humano', frase: 'Adaptable y ambicioso. Bueno en un poco de todo.', bonos: { fue: 1, des: 1, con: 1, int: 1, sab: 1, car: 1 }, velocidad: 30, idiomas: ['Común', 'Uno a elegir'], rasgos: [{ n: 'Versátil', d: 'Es la raza más sencilla de manejar: +1 a las seis características.' }], buenas: 'Cualquier clase' },
    { id: 'elfo', nombre: 'Elfo', en: 'elf', icono: 'elfo', frase: 'Ágil, longevo y muy unido a la magia y a los bosques.', bonos: { des: 2 }, velocidad: 30, idiomas: ['Común', 'Élfico'], habilidades: ['percepcion'], rasgos: [VISION, FEERICO, { n: 'Sentidos agudos', d: 'Competencia en Percepción.' }, { n: 'Trance', d: 'Meditas 4 horas en lugar de dormir 8.' }], buenas: 'Explorador, Pícaro, Mago, Monje',
      subrazas: [
        { id: 'alto', nombre: 'Alto elfo', bonos: { int: 1 }, frase: '+1 INT y un truco de mago.', rasgos: [{ n: 'Truco de alto elfo', d: 'Conoces un truco de mago.' }] },
        { id: 'bosque', nombre: 'Elfo del bosque', bonos: { sab: 1 }, velocidad: 35, frase: '+1 SAB y caminas más rápido.', rasgos: [{ n: 'Pies ligeros', d: 'Tu velocidad es 35 ft.' }, { n: 'Máscara de la naturaleza', d: 'Te escondes entre follaje, lluvia o niebla.' }] },
        { id: 'oscuro', nombre: 'Elfo oscuro (drow)', bonos: { car: 1 }, frase: '+1 CAR y gran visión, pero sufres con el sol.', rasgos: [{ n: 'Visión superior', d: 'Ves en la oscuridad hasta 120 ft.' }, { n: 'Sensibilidad a la luz', d: 'Desventaja al atacar y percibir bajo el sol.' }] },
      ] },
    { id: 'enano', nombre: 'Enano', en: 'dwarf', icono: 'enano', frase: 'Bajo, fuerte y muy terco. Cuesta mucho derribarlo.', bonos: { con: 2 }, velocidad: 25, sinFrenoArmadura: true, idiomas: ['Común', 'Enano'], rasgos: [VISION, { n: 'Resistencia enana', d: 'Ventaja para salvarte del veneno y mitad de su daño.' }, { n: 'Entrenamiento enano', d: 'Competencia con hachas y martillos.' }], buenas: 'Guerrero, Clérigo, Paladín, Bárbaro',
      subrazas: [
        { id: 'colinas', nombre: 'Enano de las colinas', bonos: { sab: 1 }, pgPorNivel: 1, frase: '+1 SAB y +1 de vida por nivel.', rasgos: [{ n: 'Dureza enana', d: '+1 punto de golpe por nivel.' }] },
        { id: 'montanas', nombre: 'Enano de las montañas', bonos: { fue: 2 }, frase: '+2 FUE y entrenamiento con armadura.', rasgos: [{ n: 'Armadura enana', d: 'Competencia con armadura ligera y media.' }] },
      ] },
    { id: 'mediano', nombre: 'Mediano', en: 'halfling', icono: 'mediano', frase: 'Pequeño, alegre y con una suerte increíble.', bonos: { des: 2 }, velocidad: 25, tamano: 'Pequeño', idiomas: ['Común', 'Mediano'], rasgos: [{ n: 'Suertudo', d: 'Si sacas 1 en el d20, vuelves a tirar.' }, { n: 'Valiente', d: 'Ventaja contra el miedo.' }, { n: 'Agilidad', d: 'Pasas por el espacio de criaturas más grandes.' }], buenas: 'Pícaro, Bardo, Monje',
      subrazas: [
        { id: 'piesligeros', nombre: 'Mediano piesligeros', bonos: { car: 1 }, frase: '+1 CAR y te escondes detrás de otros.', rasgos: [{ n: 'Sigilo natural', d: 'Te escondes detrás de criaturas más grandes.' }] },
        { id: 'fornido', nombre: 'Mediano fornido', bonos: { con: 1 }, frase: '+1 CON y resistes el veneno.', rasgos: [{ n: 'Resistencia fornida', d: 'Ventaja contra veneno y mitad de su daño.' }] },
      ] },
    { id: 'draconido', nombre: 'Dracónido', en: 'dragonborn', icono: 'draconido', frase: 'Descendiente de dragones, orgulloso y con aliento elemental.', bonos: { fue: 2, car: 1 }, velocidad: 30, idiomas: ['Común', 'Dracónico'], rasgos: [{ n: 'Aliento de dragón', d: '2d6 de daño en un área. Se recarga con un descanso.' }, { n: 'Resistencia dracónica', d: 'Recibes la mitad del daño de tu elemento.' }], buenas: 'Paladín, Guerrero, Hechicero, Bárbaro' },
    { id: 'gnomo', nombre: 'Gnomo', en: 'gnome', icono: 'gnomo', frase: 'Curioso, inventor y lleno de energía.', bonos: { int: 2 }, velocidad: 25, tamano: 'Pequeño', idiomas: ['Común', 'Gnomo'], rasgos: [VISION, { n: 'Astucia gnoma', d: 'Ventaja en salvaciones de INT, SAB y CAR contra magia.' }], buenas: 'Mago, Pícaro, Bardo',
      subrazas: [
        { id: 'rocas', nombre: 'Gnomo de las rocas', bonos: { con: 1 }, frase: '+1 CON y fabricas pequeños aparatos.', rasgos: [{ n: 'Manitas', d: 'Fabricas pequeños aparatos mecánicos.' }] },
        { id: 'bosque', nombre: 'Gnomo del bosque', bonos: { des: 1 }, frase: '+1 DES e ilusiones menores.', rasgos: [{ n: 'Ilusionista nato', d: 'Conoces el truco Ilusión menor.' }, { n: 'Amigo de los animales', d: 'Hablas con animales pequeños.' }] },
      ] },
    { id: 'semielfo', nombre: 'Semielfo', en: 'half-elf', icono: 'semielfo', frase: 'Mitad humano, mitad elfo. Encantador y versátil.', bonos: { car: 2 }, eligeCar: 2, velocidad: 30, idiomas: ['Común', 'Élfico', 'Uno a elegir'], eligeHabilidades: 2, rasgos: [VISION, FEERICO, { n: 'Versatilidad', d: 'Competencia en 2 habilidades que elijas.' }], buenas: 'Bardo, Brujo, Paladín, Hechicero' },
    { id: 'semiorco', nombre: 'Semiorco', en: 'half-orc', icono: 'semiorco', frase: 'Mitad humano, mitad orco. Fuerte y muy difícil de tumbar.', bonos: { fue: 2, con: 1 }, velocidad: 30, idiomas: ['Común', 'Orco'], habilidades: ['intimidacion'], rasgos: [VISION, { n: 'Aguante incansable', d: 'Una vez por descanso largo, si caes a 0 PG, te quedas en 1.' }, { n: 'Ataques salvajes', d: 'Tus críticos cuerpo a cuerpo tiran un dado extra.' }], buenas: 'Bárbaro, Guerrero, Paladín' },
    { id: 'tiflin', nombre: 'Tiflin', en: 'tiefling', icono: 'tiflin', frase: 'Con sangre infernal: cuernos, cola y mucha presencia.', bonos: { car: 2, int: 1 }, velocidad: 30, idiomas: ['Común', 'Infernal'], rasgos: [VISION, { n: 'Resistencia infernal', d: 'Recibes la mitad del daño de fuego.' }, { n: 'Legado infernal', d: 'Sabes el truco Taumaturgia. Ganas más magia en niveles 3 y 5.' }], buenas: 'Brujo, Bardo, Hechicero, Paladín' },
  ];

  /* cat: s = sencilla, m = marcial. La cerbatana y la red quedan fuera: no tienen un dado de daño que tirar. */
  P.ARMAS = {
    baston: { nombre: 'Bastón', cat: 's', dado: '1d6', tipo: 'contundente', nota: '1d8 a dos manos' },
    daga: { nombre: 'Daga', cat: 's', dado: '1d4', tipo: 'perforante', sutil: true, lanzar: '20/60 ft' },
    garrote: { nombre: 'Garrote', cat: 's', dado: '1d4', tipo: 'contundente' },
    'garrote-grande': { nombre: 'Garrote grande', cat: 's', dado: '1d8', tipo: 'contundente', dosManos: true },
    'hacha-mano': { nombre: 'Hacha de mano', cat: 's', dado: '1d6', tipo: 'cortante', lanzar: '20/60 ft' },
    hoz: { nombre: 'Hoz', cat: 's', dado: '1d4', tipo: 'cortante' },
    jabalina: { nombre: 'Jabalina', cat: 's', dado: '1d6', tipo: 'perforante', lanzar: '30/120 ft' },
    lanza: { nombre: 'Lanza', cat: 's', dado: '1d6', tipo: 'perforante', lanzar: '20/60 ft', nota: '1d8 a dos manos' },
    'martillo-ligero': { nombre: 'Martillo ligero', cat: 's', dado: '1d4', tipo: 'contundente', lanzar: '20/60 ft' },
    maza: { nombre: 'Maza', cat: 's', dado: '1d6', tipo: 'contundente' },
    'arco-corto': { nombre: 'Arco corto', cat: 's', dado: '1d6', tipo: 'perforante', distancia: '80/320 ft', dosManos: true },
    'ballesta-ligera': { nombre: 'Ballesta ligera', cat: 's', dado: '1d8', tipo: 'perforante', distancia: '80/320 ft', dosManos: true },
    dardo: { nombre: 'Dardo', cat: 's', dado: '1d4', tipo: 'perforante', sutil: true, lanzar: '20/60 ft' },
    honda: { nombre: 'Honda', cat: 's', dado: '1d4', tipo: 'contundente', distancia: '30/120 ft' },
    alabarda: { nombre: 'Alabarda', cat: 'm', dado: '1d10', tipo: 'cortante', dosManos: true },
    cimitarra: { nombre: 'Cimitarra', cat: 'm', dado: '1d6', tipo: 'cortante', sutil: true },
    'espada-corta': { nombre: 'Espada corta', cat: 'm', dado: '1d6', tipo: 'perforante', sutil: true },
    'espada-larga': { nombre: 'Espada larga', cat: 'm', dado: '1d8', tipo: 'cortante', nota: '1d10 a dos manos' },
    mandoble: { nombre: 'Espadón', cat: 'm', dado: '2d6', tipo: 'cortante', dosManos: true },
    estoque: { nombre: 'Estoque', cat: 'm', dado: '1d8', tipo: 'perforante', sutil: true },
    guja: { nombre: 'Guja', cat: 'm', dado: '1d10', tipo: 'cortante', dosManos: true },
    'gran-hacha': { nombre: 'Hacha a dos manos', cat: 'm', dado: '1d12', tipo: 'cortante', dosManos: true },
    'hacha-guerra': { nombre: 'Hacha de guerra', cat: 'm', dado: '1d8', tipo: 'cortante', nota: '1d10 a dos manos' },
    'lanza-caballeria': { nombre: 'Lanza de caballería', cat: 'm', dado: '1d12', tipo: 'perforante' },
    latigo: { nombre: 'Látigo', cat: 'm', dado: '1d4', tipo: 'cortante', sutil: true },
    lucero: { nombre: 'Lucero del alba', cat: 'm', dado: '1d8', tipo: 'perforante' },
    mangual: { nombre: 'Mangual', cat: 'm', dado: '1d8', tipo: 'contundente' },
    'martillo-guerra': { nombre: 'Martillo de guerra', cat: 'm', dado: '1d8', tipo: 'contundente', nota: '1d10 a dos manos' },
    'maza-grande': { nombre: 'Maza a dos manos', cat: 'm', dado: '2d6', tipo: 'contundente', dosManos: true },
    pica: { nombre: 'Pica', cat: 'm', dado: '1d10', tipo: 'perforante', dosManos: true },
    'pico-guerra': { nombre: 'Pico de guerra', cat: 'm', dado: '1d8', tipo: 'perforante' },
    tridente: { nombre: 'Tridente', cat: 'm', dado: '1d6', tipo: 'perforante', lanzar: '20/60 ft', nota: '1d8 a dos manos' },
    'arco-largo': { nombre: 'Arco largo', cat: 'm', dado: '1d8', tipo: 'perforante', distancia: '150/600 ft', dosManos: true },
    'ballesta-mano': { nombre: 'Ballesta de mano', cat: 'm', dado: '1d6', tipo: 'perforante', distancia: '30/120 ft' },
    'ballesta-pesada': { nombre: 'Ballesta pesada', cat: 'm', dado: '1d10', tipo: 'perforante', distancia: '100/400 ft', dosManos: true },
  };

  P.armasDe = (lista) => Object.entries(P.ARMAS).map(([id, a]) => Object.assign({ id }, a)).filter((a) => ({
    sencilla: a.cat === 's', 'sencilla-cc': a.cat === 's' && !a.distancia, marcial: a.cat === 'm', 'marcial-cc': a.cat === 'm' && !a.distancia, 'marcial-una': a.cat === 'm' && !a.dosManos,
  })[lista]).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));

  P.ARMADURAS = {
    cuero: { nombre: 'Armadura de cuero', base: 11 },
    escamas: { nombre: 'Cota de escamas', base: 14, desMax: 2 },
    malla: { nombre: 'Cota de malla', base: 16, desMax: 0, fue: 13 },
  };

  /* Equipo inicial: las opciones (a), (b) y (c) de cada clase en el SRD.
     elige: ranuras de arma libre, cada una con [lista de P.armasDe, arma por defecto]. requiere: opciones de clase que la permiten. */
  const PAQUETE = { mazmorras: 'Paquete de explorador de mazmorras', explorador: 'Paquete de explorador', erudito: 'Paquete de erudito', sacerdote: 'Paquete de sacerdote', diplomatico: 'Paquete de diplomático', artista: 'Paquete de artista', ladron: 'Paquete de ladrón' };
  const letra = (i) => 'abc'[i];
  const paquetes = (...k) => ({ id: 'paquete', t: 'Tu paquete de viaje', op: k.map((x, i) => ({ id: letra(i), t: PAQUETE[x], otros: [PAQUETE[x]] })) });
  const objetos = (id, t, nombres) => ({ id, t, op: nombres.map((n, i) => ({ id: letra(i), t: n, otros: [n] })) });
  const arma = (id, t, armaId) => ({ id, t, armas: [armaId] });
  const libre = (id, t, lista, defecto) => ({ id, t, elige: [[lista, defecto]] });
  const BALLESTA = { id: 'a', t: 'Ballesta ligera y 20 virotes', armas: ['ballesta-ligera'], otros: ['20 virotes'] };
  const SENCILLA = (id = 'b', defecto = 'baston') => libre(id, 'Un arma sencilla a tu elección', 'sencilla', defecto);
  const FOCO = objetos('foco', 'Tu foco de magia', ['Saquito de componentes', 'Canalizador arcano']);
  const MARCIALES = { id: 'armas', t: 'Tus armas', op: [
    { id: 'a', t: 'Un arma marcial y un escudo', escudo: true, elige: [['marcial-una', 'espada-larga']] },
    { id: 'b', t: 'Dos armas marciales', elige: [['marcial', 'mandoble'], ['marcial', 'espada-larga']] },
  ] };
  // Partidas y enlaces QR creados cuando el equipo eran paquetes cerrados
  P.KITS_ANTIGUOS = { guerrero: { grande: { armas: 'b' }, arco: { armadura: 'b' } }, explorador: { arco: { armadura: 'b' } }, paladin: { grande: { armas: 'b' } } };

  P.CLASES = [
    { id: 'barbaro', nombre: 'Bárbaro', icono: 'barbaro', color: '#E0523A', d: 12, dif: 1, tags: ['pegar', 'aguantar'], frase: 'Entra en furia, pega durísimo y aguanta más que nadie.', clave: 'Fuerza', salv: ['fue', 'con'], armadura: 'Ligera, media y escudo', nHab: 2, hab: ['atletismo', 'intimidacion', 'naturaleza', 'percepcion', 'supervivencia', 'animales'], reparto: { fue: 15, con: 14, des: 13, sab: 12, car: 10, int: 8 },
      rasgos: [{ n: 'Furia', d: '2 veces por descanso largo: +2 al daño cuerpo a cuerpo y mitad del daño físico.' }, { n: 'Defensa sin armadura', d: 'Sin armadura, tu CA es 10 + DES + CON.' }],
      equipo: [
        { id: 'principal', t: 'Tu arma principal', op: [arma('a', 'Hacha a dos manos', 'gran-hacha'), libre('b', 'Un arma marcial cuerpo a cuerpo a tu elección', 'marcial-cc', 'gran-hacha')] },
        { id: 'segunda', t: 'Tu segunda arma', op: [{ id: 'a', t: 'Dos hachas de mano', armas: ['hacha-mano'], otros: ['2 hachas de mano'] }, SENCILLA()] },
      ],
      fijo: { armas: ['jabalina'], otros: ['4 jabalinas', PAQUETE.explorador] },
      progreso: ['Ataque temerario, Sentido del peligro', 'Elige su senda', 'Mejora de característica', 'Ataque adicional, más velocidad'] },
    { id: 'bardo', nombre: 'Bardo', icono: 'bardo', color: '#E06BA8', d: 8, dif: 3, tags: ['magia', 'curar', 'hablar'], frase: 'Músico mágico. Anima al grupo, encanta enemigos y sabe de todo.', clave: 'Carisma', salv: ['des', 'car'], armadura: 'Ligera', nHab: 3, hab: 'todas', reparto: { car: 15, des: 14, con: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Inspiración bárdica', d: 'Das un d6 extra a un aliado. Usos: tu mod. de CAR por descanso largo.' }],
      magia: { car: 'car', trucos: 2, conocidos: 4, tipo: 'completo' },
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Estoque', 'estoque'), arma('b', 'Espada larga', 'espada-larga'), SENCILLA('c')] },
        paquetes('diplomatico', 'artista'),
        objetos('instrumento', 'Tu instrumento', ['Laúd', 'Otro instrumento musical']),
      ],
      fijo: { armadura: 'cuero', armas: ['daga'] },
      progreso: ['Aprendiz de todo, Canción de descanso', 'Elige su colegio, Pericia', 'Mejora de característica', 'Inspiración d8, conjuros de nivel 3'] },
    { id: 'brujo', nombre: 'Brujo', icono: 'brujo', color: '#9B72F2', d: 8, dif: 2, tags: ['magia', 'hablar'], frase: 'Hizo un pacto con un ser poderoso a cambio de magia.', clave: 'Carisma', salv: ['sab', 'car'], armadura: 'Ligera', nHab: 2, hab: ['arcano', 'engano', 'historia', 'intimidacion', 'investigacion', 'naturaleza', 'religion'], reparto: { car: 15, con: 14, des: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Magia de pacto', d: 'Tu espacio de conjuro vuelve con un descanso corto.' }],
      opcion: { titulo: 'Tu patrón', ayuda: '¿Quién te dio tu poder?', lista: [{ id: 'infernal', nombre: 'Infernal', d: 'Un ser de los infiernos. Magia de fuego.' }, { id: 'feerico', nombre: 'Archifeérico', d: 'Un noble de las hadas. Magia de encanto.' }, { id: 'primigenio', nombre: 'Primigenio', d: 'Una entidad antigua. Magia de la mente.' }] },
      magia: { car: 'car', trucos: 2, conocidos: 2, tipo: 'pacto' },
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [BALLESTA, SENCILLA()] },
        FOCO,
        paquetes('erudito', 'mazmorras'),
      ],
      fijo: { armadura: 'cuero', armas: ['daga'], otros: ['2 dagas'], elige: [['sencilla', 'baston']], eligeT: 'Además llevas un arma sencilla a tu elección' },
      progreso: ['Invocaciones sobrenaturales', 'Don del pacto', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'clerigo', nombre: 'Clérigo', icono: 'clerigo', color: '#E6BE4F', d: 8, dif: 2, tags: ['magia', 'curar', 'aguantar'], frase: 'Su fe le da magia. Cura, protege y golpea.', clave: 'Sabiduría', salv: ['sab', 'car'], armadura: 'Ligera, media y escudo', nHab: 2, hab: ['historia', 'medicina', 'perspicacia', 'persuasion', 'religion'], reparto: { sab: 15, con: 14, fue: 13, car: 12, des: 10, int: 8 },
      rasgos: [],
      opcion: { titulo: 'Tu dominio divino', ayuda: '¿Qué aspecto de tu dios te guía?', lista: [{ id: 'vida', nombre: 'Vida', d: 'Tus curaciones sanan más.' }, { id: 'luz', nombre: 'Luz', d: 'Tu fe quema con fuego sagrado.' }, { id: 'guerra', nombre: 'Guerra', d: 'Tu fe te guía en el combate.' }] },
      magia: { car: 'sab', trucos: 3, prepara: true, tipo: 'completo' },
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Maza', 'maza'), Object.assign(arma('b', 'Martillo de guerra', 'martillo-guerra'), { requiere: ['guerra'] })] },
        { id: 'armadura', t: 'Tu armadura', op: [{ id: 'a', t: 'Cota de escamas', armadura: 'escamas' }, { id: 'b', t: 'Armadura de cuero', armadura: 'cuero' }, { id: 'c', t: 'Cota de malla', armadura: 'malla', requiere: ['vida', 'guerra'] }] },
        { id: 'lejos', t: 'Tu segunda arma', op: [BALLESTA, SENCILLA()] },
        paquetes('sacerdote', 'explorador'),
      ],
      fijo: { escudo: true, otros: ['Símbolo sagrado'] },
      progreso: ['Canalizar divinidad', 'Conjuros de nivel 2', 'Mejora de característica', 'Destruir muertos vivientes, conjuros de nivel 3'] },
    { id: 'druida', nombre: 'Druida', icono: 'druida', color: '#57B878', d: 8, dif: 3, tags: ['magia', 'curar', 'naturaleza'], frase: 'Guardián de la naturaleza. Lanza magia y se convierte en animales.', clave: 'Sabiduría', salv: ['int', 'sab'], armadura: 'Ligera, media y escudo, sin metal', nHab: 2, hab: ['arcano', 'medicina', 'naturaleza', 'percepcion', 'perspicacia', 'religion', 'supervivencia', 'animales'], reparto: { sab: 15, con: 14, des: 13, int: 12, car: 10, fue: 8 },
      rasgos: [{ n: 'Druídico', d: 'Hablas el idioma secreto de los druidas.' }],
      magia: { car: 'sab', trucos: 2, prepara: true, tipo: 'completo' },
      equipo: [
        { id: 'defensa', t: 'Tu defensa', op: [{ id: 'a', t: 'Escudo de madera', escudo: true }, SENCILLA()] },
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Cimitarra', 'cimitarra'), libre('b', 'Un arma sencilla cuerpo a cuerpo a tu elección', 'sencilla-cc', 'baston')] },
      ],
      fijo: { armadura: 'cuero', otros: [PAQUETE.explorador, 'Canalizador druídico'] },
      progreso: ['Forma salvaje, elige su círculo', 'Conjuros de nivel 2', 'Mejora de característica, mejor forma salvaje', 'Conjuros de nivel 3'] },
    { id: 'explorador', nombre: 'Explorador', icono: 'explorador', color: '#3FB6A2', d: 10, dif: 2, tags: ['sombras', 'pegar', 'naturaleza', 'distancia'], frase: 'Cazador de las tierras salvajes. Rastrea, sobrevive y dispara.', clave: 'Destreza y Sabiduría', salv: ['fue', 'des'], armadura: 'Ligera, media y escudo', nHab: 3, hab: ['atletismo', 'investigacion', 'naturaleza', 'percepcion', 'perspicacia', 'sigilo', 'supervivencia', 'animales'], reparto: { des: 15, sab: 14, con: 13, fue: 12, int: 10, car: 8 },
      rasgos: [{ n: 'Enemigo predilecto', d: 'Eliges un tipo de criatura y aprendes a rastrearla.' }, { n: 'Explorador nato', d: 'Te orientas mejor en un tipo de terreno.' }],
      magia: { car: 'sab', desdeNivel: 2, tipo: 'medio' },
      equipo: [
        { id: 'armadura', t: 'Tu armadura', op: [{ id: 'a', t: 'Cota de escamas', armadura: 'escamas' }, { id: 'b', t: 'Armadura de cuero', armadura: 'cuero' }] },
        { id: 'arma', t: 'Tus armas', op: [{ id: 'a', t: 'Dos espadas cortas', armas: ['espada-corta'], otros: ['2 espadas cortas'] }, { id: 'b', t: 'Dos armas sencillas cuerpo a cuerpo', elige: [['sencilla-cc', 'hacha-mano'], ['sencilla-cc', 'daga']] }] },
        paquetes('mazmorras', 'explorador'),
      ],
      fijo: { armas: ['arco-largo'], otros: ['Aljaba con 20 flechas'] },
      progreso: ['Estilo de combate, Conjuros', 'Elige su arquetipo, Consciencia primigenia', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'guerrero', nombre: 'Guerrero', icono: 'guerrero', color: '#8CA3C2', d: 10, dif: 1, tags: ['pegar', 'aguantar', 'distancia'], frase: 'Experto en armas y armaduras. La clase más directa para aprender.', clave: 'Fuerza o Destreza', salv: ['fue', 'con'], armadura: 'Todas y escudo', nHab: 2, hab: ['acrobacias', 'atletismo', 'historia', 'intimidacion', 'percepcion', 'perspicacia', 'supervivencia', 'animales'], reparto: { fue: 15, con: 14, des: 13, sab: 12, car: 10, int: 8 },
      rasgos: [{ n: 'Tomar aliento', d: 'Una vez por descanso, te curas 1d10 + tu nivel.' }],
      opcion: { titulo: 'Tu estilo de combate', ayuda: '¿Cómo te gusta pelear?', lista: [{ id: 'defensa', nombre: 'Defensa', d: '+1 a tu CA mientras lleves armadura.' }, { id: 'duelo', nombre: 'Duelo', d: '+2 al daño con un arma a una mano.' }, { id: 'arqueria', nombre: 'Arquería', d: '+2 para acertar con armas a distancia.' }, { id: 'grande', nombre: 'Arma grande', d: 'Repites los 1 y 2 de daño con armas a dos manos.' }] },
      equipo: [
        { id: 'armadura', t: 'Tu armadura', op: [{ id: 'a', t: 'Cota de malla', armadura: 'malla' }, { id: 'b', t: 'Armadura de cuero, arco largo y 20 flechas', armadura: 'cuero', armas: ['arco-largo'], otros: ['20 flechas'] }] },
        MARCIALES,
        { id: 'lejos', t: 'Tu arma para atacar de lejos', op: [BALLESTA, { id: 'b', t: 'Dos hachas de mano', armas: ['hacha-mano'], otros: ['2 hachas de mano'] }] },
        paquetes('mazmorras', 'explorador'),
      ],
      fijo: {},
      progreso: ['Acción súbita', 'Elige su arquetipo', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'hechicero', nombre: 'Hechicero', icono: 'hechicero', color: '#EE7A45', d: 6, dif: 3, tags: ['magia', 'hablar', 'fuego'], frase: 'Nació con magia en la sangre. Sabe pocos conjuros, pero los moldea.', clave: 'Carisma', salv: ['con', 'car'], armadura: 'Ninguna', nHab: 2, hab: ['arcano', 'engano', 'intimidacion', 'perspicacia', 'persuasion', 'religion'], reparto: { car: 15, con: 14, des: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [],
      opcion: { titulo: 'Tu origen mágico', ayuda: '¿De dónde viene tu poder?', lista: [{ id: 'draconico', nombre: 'Linaje dracónico', d: 'CA 13 + DES sin armadura y +1 de vida por nivel.' }, { id: 'salvaje', nombre: 'Magia salvaje', d: 'Tu magia es impredecible y sorprendente.' }] },
      magia: { car: 'car', trucos: 4, conocidos: 2, tipo: 'completo' },
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [BALLESTA, SENCILLA()] },
        FOCO,
        paquetes('mazmorras', 'explorador'),
      ],
      fijo: { armas: ['daga'], otros: ['2 dagas'] },
      progreso: ['Puntos de hechicería', 'Metamagia', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'mago', nombre: 'Mago', icono: 'mago', color: '#5F93F5', d: 6, dif: 3, tags: ['magia', 'estudio'], frase: 'Estudia magia en un libro. Tiene la lista de conjuros más grande.', clave: 'Inteligencia', salv: ['int', 'sab'], armadura: 'Ninguna', nHab: 2, hab: ['arcano', 'historia', 'investigacion', 'medicina', 'perspicacia', 'religion'], reparto: { int: 15, con: 14, des: 13, sab: 12, car: 10, fue: 8 },
      rasgos: [{ n: 'Recuperación arcana', d: 'Una vez al día recuperas un espacio en un descanso corto.' }],
      magia: { car: 'int', trucos: 3, conocidos: 6, libro: true, tipo: 'completo' },
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Bastón', 'baston'), arma('b', 'Daga', 'daga')] },
        FOCO,
        paquetes('erudito', 'explorador'),
      ],
      fijo: { otros: ['Libro de conjuros'] },
      progreso: ['Elige su tradición arcana', 'Conjuros de nivel 2', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'monje', nombre: 'Monje', icono: 'monje', color: '#3CBAD0', d: 8, dif: 2, tags: ['sombras', 'pegar'], frase: 'Artista marcial rápido. Pelea con los puños y esquiva casi todo.', clave: 'Destreza y Sabiduría', salv: ['fue', 'des'], armadura: 'Ninguna', nHab: 2, hab: ['acrobacias', 'atletismo', 'historia', 'perspicacia', 'religion', 'sigilo'], reparto: { des: 15, sab: 14, con: 13, fue: 12, int: 10, car: 8 },
      rasgos: [{ n: 'Artes marciales', d: 'Tus puños hacen 1d4 y puedes golpear de nuevo como acción adicional.' }, { n: 'Defensa sin armadura', d: 'Sin armadura ni escudo, tu CA es 10 + DES + SAB.' }],
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Espada corta', 'espada-corta'), SENCILLA()] },
        paquetes('mazmorras', 'explorador'),
      ],
      fijo: { armas: ['dardo'], otros: ['10 dardos'] },
      progreso: ['Ki, más velocidad', 'Elige su tradición, Desviar proyectiles', 'Mejora de característica, Caída lenta', 'Ataque adicional, Golpe aturdidor'] },
    { id: 'paladin', nombre: 'Paladín', icono: 'paladin', color: '#EDBB3F', d: 10, dif: 2, tags: ['pegar', 'aguantar', 'curar', 'hablar'], frase: 'Guerrero sagrado unido a un juramento. Pega fuerte y cura con las manos.', clave: 'Fuerza y Carisma', salv: ['sab', 'car'], armadura: 'Todas y escudo', nHab: 2, hab: ['atletismo', 'intimidacion', 'medicina', 'perspicacia', 'persuasion', 'religion'], reparto: { fue: 15, car: 14, con: 13, sab: 12, des: 10, int: 8 },
      rasgos: [{ n: 'Sentido divino', d: 'Percibes criaturas celestiales, infernales y no muertos.' }, { n: 'Imposición de manos', d: 'Curas al tocar. Tienes nivel × 5 puntos por descanso largo.' }],
      magia: { car: 'car', desdeNivel: 2, tipo: 'medio' },
      equipo: [
        MARCIALES,
        { id: 'lejos', t: 'Tu segunda opción de ataque', op: [{ id: 'a', t: 'Cinco jabalinas', armas: ['jabalina'], otros: ['5 jabalinas'] }, libre('b', 'Un arma sencilla cuerpo a cuerpo a tu elección', 'sencilla-cc', 'maza')] },
        paquetes('sacerdote', 'explorador'),
      ],
      fijo: { armadura: 'malla', otros: ['Símbolo sagrado'] },
      progreso: ['Estilo de combate, Conjuros, Castigo divino', 'Salud divina, elige su juramento', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'picaro', nombre: 'Pícaro', icono: 'picaro', color: '#A8ADB8', d: 8, dif: 1, tags: ['sombras', 'hablar'], frase: 'Especialista en sigilo, trampas y ataques por sorpresa.', clave: 'Destreza', salv: ['des', 'int'], armadura: 'Ligera', nHab: 4, hab: ['acrobacias', 'atletismo', 'engano', 'interpretacion', 'intimidacion', 'investigacion', 'manos', 'percepcion', 'perspicacia', 'persuasion', 'sigilo'], pericia: 2, reparto: { des: 15, con: 14, sab: 13, car: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Pericia', d: 'Duplicas tu bono de competencia en 2 habilidades.' }, { n: 'Ataque furtivo', d: 'Una vez por turno, 1d6 de daño extra si tienes ventaja o un aliado cerca.' }, { n: 'Jerga de ladrones', d: 'Hablas el código secreto de los pícaros.' }],
      equipo: [
        { id: 'arma', t: 'Tu arma', op: [arma('a', 'Estoque', 'estoque'), arma('b', 'Espada corta', 'espada-corta')] },
        { id: 'segunda', t: 'Tu segunda arma', op: [{ id: 'a', t: 'Arco corto y aljaba con 20 flechas', armas: ['arco-corto'], otros: ['Aljaba con 20 flechas'] }, arma('b', 'Espada corta', 'espada-corta')] },
        paquetes('ladron', 'mazmorras', 'explorador'),
      ],
      fijo: { armadura: 'cuero', armas: ['daga'], otros: ['2 dagas', 'Herramientas de ladrón'] },
      progreso: ['Acción astuta', 'Elige su arquetipo, Ataque furtivo 2d6', 'Mejora de característica', 'Esquiva asombrosa, Ataque furtivo 3d6'] },
  ];

  /* nivel 0 = truco. ataque: se muestra en «Mis ataques». */
  P.CONJUROS = [
    { id: 'luz', nombre: 'Luz', nivel: 0, clases: ['bardo', 'clerigo', 'hechicero', 'mago'], d: 'Un objeto brilla como una antorcha por 1 hora.' },
    { id: 'mano', nombre: 'Mano de mago', nivel: 0, clases: ['bardo', 'brujo', 'hechicero', 'mago'], d: 'Una mano fantasmal mueve objetos ligeros.' },
    { id: 'prestidigitacion', nombre: 'Prestidigitación', nivel: 0, clases: ['bardo', 'brujo', 'hechicero', 'mago'], d: 'Pequeños trucos: limpiar, encender, dar sabor.' },
    { id: 'ilusion', nombre: 'Ilusión menor', nivel: 0, clases: ['bardo', 'brujo', 'hechicero', 'mago'], d: 'Creas un sonido o una imagen pequeña.' },
    { id: 'mensaje', nombre: 'Mensaje', nivel: 0, clases: ['bardo', 'hechicero', 'mago'], d: 'Susurras algo a alguien a distancia.' },
    { id: 'burla', nombre: 'Burla dañina', nivel: 0, clases: ['bardo'], d: 'Un insulto mágico: 1d4 psíquico.', ataque: { modo: 'salv', car: 'sab', dado: '1d4', tipo: 'psíquico' } },
    { id: 'descarga-fuego', nombre: 'Descarga de fuego', nivel: 0, clases: ['hechicero', 'mago'], d: 'Lanzas una chispa ardiente: 1d10 de fuego.', ataque: { modo: 'ataque', dado: '1d10', tipo: 'fuego' } },
    { id: 'escarcha', nombre: 'Rayo de escarcha', nivel: 0, clases: ['hechicero', 'mago'], d: '1d8 de frío y frena al objetivo.', ataque: { modo: 'ataque', dado: '1d8', tipo: 'frío' } },
    { id: 'toque', nombre: 'Agarre electrizante', nivel: 0, clases: ['hechicero', 'mago'], d: 'Un toque de 1d8 de rayo.', ataque: { modo: 'ataque', dado: '1d8', tipo: 'rayo' } },
    { id: 'descarga-brujo', nombre: 'Descarga sobrenatural', nivel: 0, clases: ['brujo'], d: 'Un rayo de energía: 1d10 de fuerza.', ataque: { modo: 'ataque', dado: '1d10', tipo: 'fuerza' } },
    { id: 'llama-sagrada', nombre: 'Llama sagrada', nivel: 0, clases: ['clerigo'], d: 'Luz divina que cae del cielo: 1d8 radiante.', ataque: { modo: 'salv', car: 'des', dado: '1d8', tipo: 'radiante' } },
    { id: 'guia', nombre: 'Guía', nivel: 0, clases: ['clerigo', 'druida'], d: 'Un aliado suma 1d4 a una prueba.' },
    { id: 'taumaturgia', nombre: 'Taumaturgia', nivel: 0, clases: ['clerigo'], d: 'Pequeños prodigios: voz potente, temblores, llamas.' },
    { id: 'resistencia', nombre: 'Resistencia', nivel: 0, clases: ['clerigo', 'druida'], d: 'Un aliado suma 1d4 a una salvación.' },
    { id: 'garrote', nombre: 'Shillelagh', nivel: 0, clases: ['druida'], d: 'Tu bastón pega con Sabiduría y hace 1d8.' },
    { id: 'llama-producida', nombre: 'Crear llama', nivel: 0, clases: ['druida'], d: 'Una llama que ilumina o se lanza: 1d8 de fuego.', ataque: { modo: 'ataque', dado: '1d8', tipo: 'fuego' } },
    { id: 'druidismo', nombre: 'Saber druídico', nivel: 0, clases: ['druida'], d: 'Pequeños efectos naturales, como predecir el clima.' },
    { id: 'curar', nombre: 'Curar heridas', nivel: 1, clases: ['bardo', 'clerigo', 'druida'], d: 'Al tocar, cura 1d8 + tu modificador de magia.' },
    { id: 'palabra', nombre: 'Palabra de curación', nivel: 1, clases: ['bardo', 'clerigo', 'druida'], d: 'A distancia, cura 1d4 + tu modificador de magia.' },
    { id: 'bendecir', nombre: 'Bendición', nivel: 1, clases: ['clerigo'], d: '3 aliados suman 1d4 a ataques y salvaciones.' },
    { id: 'rayo-guia', nombre: 'Saeta guía', nivel: 1, clases: ['clerigo'], d: 'Un rayo de luz de 4d6 radiante.' },
    { id: 'escudo-fe', nombre: 'Escudo de fe', nivel: 1, clases: ['clerigo'], d: 'Un aliado gana +2 a su CA.' },
    { id: 'proyectil', nombre: 'Proyectil mágico', nivel: 1, clases: ['hechicero', 'mago'], d: '3 dardos que nunca fallan: 1d4+1 cada uno.' },
    { id: 'escudo', nombre: 'Escudo', nivel: 1, clases: ['hechicero', 'mago'], d: 'Como reacción, +5 a tu CA por un turno.' },
    { id: 'armadura-mago', nombre: 'Armadura de mago', nivel: 1, clases: ['hechicero', 'mago'], d: 'Tu CA es 13 + DES por 8 horas.' },
    { id: 'dormir', nombre: 'Dormir', nivel: 1, clases: ['bardo', 'hechicero', 'mago'], d: 'Duerme a criaturas según 5d8 de vida.' },
    { id: 'manos-ardientes', nombre: 'Manos ardientes', nivel: 1, clases: ['hechicero', 'mago'], d: 'Un cono de 3d6 de fuego.' },
    { id: 'hechizar', nombre: 'Hechizar persona', nivel: 1, clases: ['bardo', 'brujo', 'druida', 'hechicero', 'mago'], d: 'Alguien te ve como amigo por 1 hora.' },
    { id: 'detectar', nombre: 'Detectar magia', nivel: 1, clases: ['bardo', 'clerigo', 'druida', 'hechicero', 'mago'], d: 'Percibes la magia cerca de ti.' },
    { id: 'onda', nombre: 'Ola atronadora', nivel: 1, clases: ['bardo', 'druida', 'hechicero', 'mago'], d: 'Un estallido de 2d8 de trueno que empuja.' },
    { id: 'disfrazarse', nombre: 'Disfrazarse', nivel: 1, clases: ['bardo', 'hechicero', 'mago'], d: 'Cambias tu apariencia por 1 hora.' },
    { id: 'enmaranar', nombre: 'Enmarañar', nivel: 1, clases: ['druida'], d: 'Plantas que atrapan a los enemigos.' },
    { id: 'fuego-feerico', nombre: 'Fuego feérico', nivel: 1, clases: ['bardo', 'druida'], d: 'Revela enemigos y da ventaja para golpearlos.' },
    { id: 'bayas', nombre: 'Buenas bayas', nivel: 1, clases: ['druida'], d: '10 bayas que curan 1 punto y alimentan.' },
    { id: 'reprension', nombre: 'Reprensión infernal', nivel: 1, clases: ['brujo'], d: 'Si te hieren, respondes con 2d10 de fuego.' },
    { id: 'retirada', nombre: 'Retirada expeditiva', nivel: 1, clases: ['brujo', 'hechicero', 'mago'], d: 'Durante 10 minutos puedes correr como acción adicional.' },
    { id: 'miedo', nombre: 'Orden imperiosa', nivel: 1, clases: ['clerigo'], d: 'Una palabra obliga a alguien a obedecer un turno.' },
  ];

  P.TRASFONDOS = [
    { id: 'acolito', nombre: 'Acólito', icono: 'acolito', antes: 'Sirviente de un templo', hab: ['perspicacia', 'religion'], extra: '2 idiomas a elegir', equipo: ['Símbolo sagrado', 'Libro de oraciones', 'Ropa común'], oro: 15 },
    { id: 'artesano', nombre: 'Artesano gremial', icono: 'artesano', antes: 'Miembro de un gremio de oficios', hab: ['perspicacia', 'persuasion'], extra: 'Herramientas de artesano, 1 idioma', equipo: ['Herramientas de artesano', 'Carta del gremio', 'Ropa de viaje'], oro: 15 },
    { id: 'artista', nombre: 'Artista', icono: 'artista', antes: 'Actor, músico o bailarín', hab: ['acrobacias', 'interpretacion'], extra: 'Kit de disfraz, 1 instrumento', equipo: ['Instrumento musical', 'Regalo de un admirador', 'Disfraz'], oro: 15 },
    { id: 'charlatan', nombre: 'Charlatán', icono: 'charlatan', antes: 'Estafador de lengua rápida', hab: ['engano', 'manos'], extra: 'Kit de disfraz, kit de falsificación', equipo: ['Ropa elegante', 'Kit de disfraz', 'Herramientas de estafa'], oro: 15 },
    { id: 'criminal', nombre: 'Criminal', icono: 'criminal', antes: 'Ladrón o contrabandista', hab: ['engano', 'sigilo'], extra: 'Herramientas de ladrón, 1 juego', equipo: ['Palanca', 'Ropa oscura con capucha'], oro: 15 },
    { id: 'ermitano', nombre: 'Ermitaño', icono: 'ermitano', antes: 'Alguien que vivió aislado', hab: ['medicina', 'religion'], extra: 'Kit de herboristería, 1 idioma', equipo: ['Estuche con notas', 'Manta de invierno', 'Kit de herboristería'], oro: 5 },
    { id: 'forastero', nombre: 'Forastero', icono: 'forastero', antes: 'Criado lejos de las ciudades', hab: ['atletismo', 'supervivencia'], extra: '1 instrumento, 1 idioma', equipo: ['Bastón', 'Trampa para cazar', 'Trofeo de un animal', 'Ropa de viaje'], oro: 10 },
    { id: 'heroe', nombre: 'Héroe del pueblo', icono: 'heroe', antes: 'Persona humilde con fama local', hab: ['supervivencia', 'animales'], extra: 'Herramientas de artesano, vehículos terrestres', equipo: ['Herramientas de artesano', 'Pala', 'Olla de hierro', 'Ropa común'], oro: 10 },
    { id: 'marinero', nombre: 'Marinero', icono: 'marinero', antes: 'Tripulante de un barco', hab: ['atletismo', 'percepcion'], extra: 'Herramientas de navegante, vehículos acuáticos', equipo: ['Cuerda de seda', 'Amuleto de la suerte', 'Ropa común'], oro: 10 },
    { id: 'noble', nombre: 'Noble', icono: 'noble', antes: 'Miembro de una familia rica', hab: ['historia', 'persuasion'], extra: '1 juego, 1 idioma', equipo: ['Ropa fina', 'Anillo con sello', 'Pergamino de linaje'], oro: 25 },
    { id: 'pilluelo', nombre: 'Pilluelo', icono: 'pilluelo', antes: 'Niño o niña de la calle', hab: ['manos', 'sigilo'], extra: 'Kit de disfraz, herramientas de ladrón', equipo: ['Navaja', 'Mapa de tu ciudad', 'Recuerdo de tu familia', 'Ropa común'], oro: 10 },
    { id: 'sabio', nombre: 'Sabio', icono: 'sabio', antes: 'Estudioso e investigador', hab: ['arcano', 'historia'], extra: '2 idiomas a elegir', equipo: ['Tinta y pluma', 'Carta sin responder', 'Ropa común'], oro: 10 },
    { id: 'soldado', nombre: 'Soldado', icono: 'soldado', antes: 'Miembro de un ejército', hab: ['atletismo', 'intimidacion'], extra: '1 juego, vehículos terrestres', equipo: ['Insignia de rango', 'Trofeo de guerra', 'Juego de dados', 'Ropa común'], oro: 10 },
  ];

  /* A dónde lleva cada cosa que le puede gustar a una persona. Las rutas van de la que más encaja a la que menos.
     car: características que conviene subir. hab y conjuros: los que se prefieren al elegir por ti. */
  P.GUSTOS = {
    curar: { etiqueta: 'curar al grupo', pregunta: '¿Cómo te imaginas curando?',
      rutas: [
        { clase: 'clerigo', opcion: 'vida', t: 'Con la fe de un dios', d: 'La curación más fuerte del juego, al tocar o a distancia.' },
        { clase: 'druida', t: 'Con el poder de la naturaleza', d: 'Sanas con plantas y magia, y más adelante te conviertes en animal.' },
        { clase: 'bardo', t: 'Con música e inspiración', d: 'Curas cantando y das ánimo a todo el grupo.' },
        { clase: 'paladin', t: 'En plena batalla', d: 'Curas con las manos mientras peleas en primera fila.' },
      ],
      razas: [['enano', 'colinas'], ['elfo', 'bosque'], ['semielfo'], ['mediano', 'fornido']], trasfondos: ['ermitano', 'acolito', 'heroe'],
      hab: ['medicina', 'perspicacia', 'religion'], conjuros: ['curar', 'palabra', 'bendecir', 'escudo-fe', 'bayas', 'guia', 'resistencia'] },
    aguantar: { etiqueta: 'aguantar golpes', pregunta: '¿Cómo proteges al grupo?', car: ['con'],
      rutas: [
        { clase: 'guerrero', opcion: 'defensa', t: 'Con la mejor armadura', d: 'Cota de malla, escudo y +1 a tu defensa.' },
        { clase: 'barbaro', t: 'Con puro aguante', d: 'En furia recibes la mitad del daño físico.' },
        { clase: 'paladin', t: 'Con armadura y un juramento', d: 'Te pones delante de todos y además curas.' },
        { clase: 'clerigo', opcion: 'guerra', t: 'Con fe y escudo', d: 'Magia de protección y una buena armadura.' },
      ],
      razas: [['enano', 'montanas'], ['enano', 'colinas'], ['semiorco'], ['draconido']], trasfondos: ['soldado', 'heroe', 'forastero'],
      hab: ['atletismo', 'intimidacion', 'percepcion'], conjuros: ['escudo', 'escudo-fe', 'armadura-mago', 'resistencia', 'bendecir'] },
    magia: { etiqueta: 'usar magia', pregunta: '¿De dónde viene tu magia?',
      rutas: [
        { clase: 'mago', t: 'Estudiando en un libro', d: 'Tienes la lista de conjuros más grande.' },
        { clase: 'hechicero', t: 'Naciste con ella', d: 'Sabes pocos conjuros, pero los moldeas a tu gusto.' },
        { clase: 'brujo', t: 'De un pacto', d: 'Un ser poderoso te da magia muy fiable.' },
        { clase: 'clerigo', t: 'De tu dios', d: 'Curas, proteges y castigas.' },
        { clase: 'druida', t: 'De la naturaleza', d: 'Magia de plantas, clima y animales.' },
        { clase: 'bardo', t: 'De la música', d: 'Encantas enemigos y apoyas al grupo.' },
      ],
      razas: [['elfo', 'alto'], ['gnomo', 'rocas'], ['tiflin'], ['semielfo']], trasfondos: ['sabio', 'acolito', 'ermitano'],
      hab: ['arcano', 'investigacion', 'religion'], conjuros: ['proyectil', 'detectar', 'escudo', 'mano', 'luz'] },
    pegar: { etiqueta: 'pegar fuerte', pregunta: '¿Cómo te gusta pelear?', car: ['fue'],
      rutas: [
        { clase: 'barbaro', t: 'Con furia', d: 'Pegas durísimo y casi nada te detiene.' },
        { clase: 'guerrero', t: 'Con técnica y buenas armas', d: 'La clase más directa: armas, armadura y a la carga.' },
        { clase: 'paladin', t: 'Con un juramento sagrado', d: 'Castigas con fuerza divina y también curas.' },
        { clase: 'monje', t: 'Con los puños y la velocidad', d: 'Golpeas varias veces por turno, sin armas ni armadura.' },
        { clase: 'explorador', t: 'Como cazador', d: 'Armas ligeras, puntería y mucha astucia.' },
      ],
      razas: [['semiorco'], ['draconido'], ['enano', 'montanas'], ['humano']], trasfondos: ['soldado', 'forastero', 'heroe'],
      hab: ['atletismo', 'intimidacion', 'percepcion'], conjuros: ['garrote', 'rayo-guia', 'proyectil', 'onda', 'manos-ardientes'] },
    sombras: { etiqueta: 'moverte en las sombras', pregunta: '¿Qué haces desde las sombras?', car: ['des'],
      rutas: [
        { clase: 'picaro', t: 'Robar y atacar por sorpresa', d: 'Sigilo, trampas y un golpe que duele mucho.' },
        { clase: 'explorador', t: 'Acechar y rastrear', d: 'Cazas a tus presas sin que te vean.' },
        { clase: 'monje', t: 'Moverte sin hacer ruido', d: 'Rápido, silencioso y sin armadura.' },
      ],
      razas: [['mediano', 'piesligeros'], ['elfo', 'bosque'], ['elfo', 'oscuro'], ['gnomo', 'bosque']], trasfondos: ['criminal', 'pilluelo', 'charlatan'],
      hab: ['sigilo', 'manos', 'percepcion', 'engano', 'acrobacias'], conjuros: ['disfrazarse', 'ilusion', 'dormir', 'mano'] },
    hablar: { etiqueta: 'hablar y convencer', pregunta: '¿Cómo convences a la gente?', car: ['car'],
      rutas: [
        { clase: 'bardo', t: 'Con encanto y música', d: 'Nadie cuenta una historia mejor que tú.' },
        { clase: 'picaro', t: 'Mintiendo con cara seria', d: 'Engañas, negocias y sales de cualquier lío.' },
        { clase: 'paladin', t: 'Como líder', d: 'Tu presencia inspira y tu palabra pesa.' },
        { clase: 'hechicero', t: 'Con tu magnetismo natural', d: 'Tu carisma también alimenta tu magia.' },
        { clase: 'brujo', t: 'Con secretos y amenazas', d: 'Sabes cosas que nadie debería saber.' },
      ],
      razas: [['semielfo'], ['tiflin'], ['mediano', 'piesligeros'], ['draconido']], trasfondos: ['charlatan', 'noble', 'artista'],
      hab: ['persuasion', 'engano', 'interpretacion', 'intimidacion', 'perspicacia'], conjuros: ['hechizar', 'disfrazarse', 'burla', 'mensaje', 'ilusion', 'prestidigitacion'] },
    distancia: { etiqueta: 'atacar a distancia', pregunta: '¿Cómo atacas desde lejos?', car: ['des'],
      rutas: [
        { clase: 'explorador', t: 'Con arco, como cazador', d: 'Rastreas a tu presa y aciertas desde muy lejos.' },
        { clase: 'guerrero', opcion: 'arqueria', t: 'Como tirador experto', d: '+2 para acertar con cualquier arma a distancia.' },
        { clase: 'picaro', t: 'Con arco y por sorpresa', d: 'Disparas desde las sombras con daño extra.' },
        { clase: 'hechicero', t: 'Con rayos de magia', d: 'Fuego, escarcha y electricidad sin gastar flechas.' },
        { clase: 'brujo', t: 'Con descargas sobrenaturales', d: 'Un rayo de energía fiable y sin límite de usos.' },
      ],
      razas: [['elfo', 'bosque'], ['mediano', 'piesligeros'], ['humano']], trasfondos: ['forastero', 'soldado', 'marinero'],
      hab: ['percepcion', 'sigilo', 'supervivencia'], conjuros: ['proyectil', 'descarga-fuego', 'descarga-brujo', 'escarcha', 'llama-producida', 'rayo-guia'] },
    naturaleza: { etiqueta: 'la naturaleza', pregunta: '¿Qué relación tienes con la naturaleza?', car: ['sab'],
      rutas: [
        { clase: 'druida', t: 'La proteges y te transformas', d: 'Usas su magia y hablas con los animales.' },
        { clase: 'explorador', t: 'Vives en ella y cazas', d: 'Nadie se orienta ni sobrevive mejor.' },
        { clase: 'barbaro', t: 'Eres tan salvaje como ella', d: 'Creciste lejos de las ciudades y peleas con instinto.' },
      ],
      razas: [['elfo', 'bosque'], ['gnomo', 'bosque'], ['semiorco']], trasfondos: ['forastero', 'ermitano', 'heroe'],
      hab: ['naturaleza', 'animales', 'supervivencia', 'percepcion'], conjuros: ['enmaranar', 'bayas', 'druidismo', 'garrote', 'fuego-feerico'] },
    estudio: { etiqueta: 'el estudio', pregunta: '¿Qué te gusta estudiar?', car: ['int'],
      rutas: [
        { clase: 'mago', t: 'La magia, en tu libro', d: 'Cada problema tiene un conjuro que lo resuelve.' },
        { clase: 'bardo', t: 'Un poco de todo', d: 'Sabes historias y secretos de cada lugar.' },
        { clase: 'clerigo', t: 'Los textos sagrados', d: 'Tu conocimiento se convierte en fe y en magia.' },
      ],
      razas: [['gnomo', 'rocas'], ['elfo', 'alto'], ['tiflin']], trasfondos: ['sabio', 'acolito', 'artesano'],
      hab: ['arcano', 'historia', 'investigacion', 'religion', 'naturaleza'], conjuros: ['detectar', 'mano', 'prestidigitacion', 'mensaje', 'luz'] },
    fuego: { etiqueta: 'el fuego', pregunta: '¿De dónde sale tu fuego?',
      rutas: [
        { clase: 'hechicero', opcion: 'draconico', t: 'De tu sangre de dragón', d: 'Tu poder es parte de ti y te da escamas protectoras.' },
        { clase: 'brujo', opcion: 'infernal', t: 'De un pacto infernal', d: 'Un ser de los infiernos te presta sus llamas.' },
        { clase: 'mago', t: 'De tus conjuros', d: 'Aprendes las explosiones más grandes del libro.' },
        { clase: 'clerigo', opcion: 'luz', t: 'De tu fe', d: 'Fuego sagrado que quema a tus enemigos.' },
      ],
      razas: [['draconido'], ['tiflin']], trasfondos: ['sabio', 'soldado', 'ermitano'],
      hab: ['arcano', 'intimidacion'], conjuros: ['descarga-fuego', 'manos-ardientes', 'llama-producida', 'reprension', 'llama-sagrada'] },
    musica: { etiqueta: 'la música y el arte', car: ['car'],
      rutas: [{ clase: 'bardo', t: 'Tu arte es tu magia', d: 'Cantas, tocas y actúas para encantar y curar.' }],
      razas: [['semielfo'], ['mediano', 'piesligeros'], ['elfo', 'alto']], trasfondos: ['artista', 'charlatan', 'noble'],
      hab: ['interpretacion', 'persuasion', 'engano'], conjuros: ['burla', 'hechizar', 'palabra', 'ilusion'] },
    fe: { etiqueta: 'la fe', pregunta: '¿Cómo sirves a tu fe?',
      rutas: [
        { clase: 'clerigo', t: 'Como sacerdote', d: 'Tu dios te da magia para curar y proteger.' },
        { clase: 'paladin', t: 'Como guerrero sagrado', d: 'Un juramento te da fuerza y magia.' },
      ],
      razas: [['enano', 'colinas'], ['humano'], ['draconido']], trasfondos: ['acolito', 'ermitano', 'sabio'],
      hab: ['religion', 'perspicacia', 'medicina', 'persuasion'], conjuros: ['bendecir', 'escudo-fe', 'llama-sagrada', 'guia', 'rayo-guia', 'taumaturgia'] },
    pacto: { etiqueta: 'los pactos y lo oscuro', pregunta: '¿Con quién hiciste tu pacto?',
      rutas: [
        { clase: 'brujo', opcion: 'infernal', t: 'Con un ser de los infiernos', d: 'Magia de fuego a cambio de un favor peligroso.' },
        { clase: 'brujo', opcion: 'feerico', t: 'Con un noble de las hadas', d: 'Magia de encanto y engaño.' },
        { clase: 'brujo', opcion: 'primigenio', t: 'Con una entidad antigua', d: 'Magia de la mente y secretos prohibidos.' },
      ],
      razas: [['tiflin'], ['semielfo'], ['elfo', 'oscuro']], trasfondos: ['ermitano', 'charlatan', 'sabio'],
      hab: ['arcano', 'engano', 'intimidacion'], conjuros: ['reprension', 'retirada', 'hechizar', 'descarga-brujo', 'ilusion'] },
    punos: { etiqueta: 'pelear sin armas', car: ['des'],
      rutas: [{ clase: 'monje', t: 'Con artes marciales', d: 'Tus puños son tu arma y esquivas casi todo.' }],
      razas: [['elfo', 'bosque'], ['humano'], ['mediano', 'fornido']], trasfondos: ['ermitano', 'acolito', 'soldado'],
      hab: ['acrobacias', 'atletismo', 'sigilo', 'perspicacia'] },
    rapido: { etiqueta: 'ser ágil y rápido', pregunta: '¿Cómo usas tu velocidad?', car: ['des'],
      rutas: [
        { clase: 'monje', t: 'Para esquivar y golpear', d: 'Te mueves más que nadie y atacas varias veces.' },
        { clase: 'picaro', t: 'Para entrar y salir sin que te toquen', d: 'Golpeas y te escondes en el mismo turno.' },
        { clase: 'explorador', t: 'Para cruzar cualquier terreno', d: 'Nada te frena en tierras salvajes.' },
      ],
      razas: [['elfo', 'bosque'], ['mediano', 'piesligeros']], trasfondos: ['artista', 'pilluelo', 'forastero'],
      hab: ['acrobacias', 'sigilo', 'atletismo'] },
  };

  // Qué gusto implica cada opción de clase: un dominio de la Vida quiere curar aunque no lo hayas escrito
  P.GUSTO_OPCION = { vida: 'curar', luz: 'fuego', guerra: 'pegar', infernal: 'fuego', feerico: 'hablar', primigenio: 'estudio', draconico: 'fuego', salvaje: 'magia', defensa: 'aguantar', duelo: 'pegar', arqueria: 'distancia', grande: 'pegar' };

  /* Lo más útil de cada clase, de mejor a peor. Es la base cuando no hay ningún gusto que incline la balanza. */
  P.FIRMA = {
    barbaro: { hab: ['atletismo', 'percepcion', 'intimidacion', 'supervivencia'] },
    bardo: { hab: ['persuasion', 'engano', 'perspicacia', 'interpretacion'], magia: ['burla', 'ilusion', 'mano', 'prestidigitacion', 'palabra', 'dormir', 'curar', 'hechizar', 'fuego-feerico', 'onda', 'detectar', 'disfrazarse'] },
    brujo: { hab: ['engano', 'arcano', 'intimidacion', 'investigacion'], magia: ['descarga-brujo', 'mano', 'ilusion', 'prestidigitacion', 'reprension', 'hechizar', 'retirada'] },
    clerigo: { hab: ['medicina', 'perspicacia', 'persuasion', 'religion'], magia: ['llama-sagrada', 'guia', 'taumaturgia', 'resistencia', 'luz', 'curar', 'palabra', 'bendecir', 'escudo-fe', 'rayo-guia', 'miedo', 'detectar'] },
    druida: { hab: ['percepcion', 'perspicacia', 'medicina', 'naturaleza'], magia: ['llama-producida', 'guia', 'garrote', 'resistencia', 'druidismo', 'curar', 'palabra', 'enmaranar', 'fuego-feerico', 'bayas', 'onda', 'detectar', 'hechizar'] },
    explorador: { hab: ['sigilo', 'percepcion', 'supervivencia', 'perspicacia'] },
    guerrero: { hab: ['atletismo', 'percepcion', 'intimidacion', 'perspicacia'] },
    hechicero: { hab: ['persuasion', 'arcano', 'engano', 'perspicacia'], magia: ['descarga-fuego', 'toque', 'escarcha', 'mano', 'mensaje', 'prestidigitacion', 'luz', 'ilusion', 'proyectil', 'escudo', 'armadura-mago', 'dormir', 'manos-ardientes', 'hechizar', 'disfrazarse', 'detectar', 'onda'] },
    mago: { hab: ['arcano', 'investigacion', 'perspicacia', 'historia'], magia: ['descarga-fuego', 'mano', 'escarcha', 'toque', 'prestidigitacion', 'luz', 'mensaje', 'ilusion', 'proyectil', 'escudo', 'armadura-mago', 'dormir', 'manos-ardientes', 'detectar', 'onda', 'hechizar', 'disfrazarse'] },
    monje: { hab: ['acrobacias', 'sigilo', 'perspicacia', 'atletismo'] },
    paladin: { hab: ['persuasion', 'atletismo', 'perspicacia', 'intimidacion'] },
    picaro: { hab: ['sigilo', 'percepcion', 'perspicacia', 'engano', 'acrobacias', 'manos'] },
  };

  P.ALINEAMIENTOS = [
    { id: 'LB', nombre: 'Legal bueno', d: 'Hace lo correcto y respeta las reglas' },
    { id: 'NB', nombre: 'Neutral bueno', d: 'Ayuda a quien lo necesita' },
    { id: 'CB', nombre: 'Caótico bueno', d: 'Hace el bien a su manera' },
    { id: 'LN', nombre: 'Legal neutral', d: 'La ley o el código van primero' },
    { id: 'NN', nombre: 'Neutral', d: 'Evita tomar partido' },
    { id: 'CN', nombre: 'Caótico neutral', d: 'Valora su libertad sobre todo' },
    { id: 'LM', nombre: 'Legal malvado', d: 'Usa las reglas para su beneficio' },
    { id: 'NM', nombre: 'Neutral malvado', d: 'Hace lo que le conviene' },
    { id: 'CM', nombre: 'Caótico malvado', d: 'Violento e impredecible' },
  ];

  P.PERSONALIDAD = {
    rasgo: ['Hablo poco y nunca retrocedo.', 'Hago bromas en los peores momentos.', 'Colecciono historias de cada lugar que visito.', 'Siempre tengo un plan, aunque sea malo.', 'Confío en todos hasta que me dan motivos.', 'Me emociono con cualquier misterio.', 'Trato a los animales mejor que a las personas.', 'Nunca rechazo un buen desafío.'],
    ideal: ['Proteger a los míos.', 'La libertad vale más que el oro.', 'El conocimiento debe compartirse.', 'Toda deuda se paga.', 'Los débiles merecen defensa.', 'La gloria me espera.', 'El equilibrio mantiene el mundo.', 'La verdad siempre sale a la luz.'],
    vinculo: ['Busco a alguien de mi familia que desapareció.', 'Le debo la vida a quien me entrenó.', 'Quiero reconstruir mi pueblo.', 'Guardo un objeto que no debe caer en malas manos.', 'Juré vengar a mi mejor amistad.', 'Mi grupo es ahora mi familia.', 'Hice una promesa que aún no cumplo.', 'Protejo el lugar donde crecí.'],
    defecto: ['Soy terco y me cuesta pedir ayuda.', 'No puedo resistirme a un objeto brillante.', 'Hablo antes de pensar.', 'Confío demasiado en mis fuerzas.', 'Le tengo miedo a la oscuridad.', 'Guardo rencor por todo.', 'No sé guardar un secreto.', 'Apuesto más de lo que tengo.'],
  };

  P.NOMBRES = {
    humano: ['Aldric', 'Mirela', 'Tomás', 'Inés', 'Bruno', 'Selene'], elfo: ['Aelir', 'Sylwen', 'Thaliel', 'Naeris', 'Elarion', 'Lyra'], enano: ['Brenna', 'Durgan', 'Helka', 'Thorvin', 'Ragna', 'Korr'], mediano: ['Pipo', 'Rosa', 'Milo', 'Tessa', 'Bodo', 'Lili'], draconido: ['Vorkar', 'Sythra', 'Drazen', 'Kalyx', 'Rhoga', 'Zerith'], gnomo: ['Nim', 'Tikka', 'Bimbo', 'Quilla', 'Zook', 'Pippa'], semielfo: ['Elian', 'Mara', 'Soren', 'Liora', 'Darian', 'Nerea'], semiorco: ['Grusk', 'Urla', 'Thokk', 'Mogra', 'Drek', 'Shara'], tiflin: ['Azura', 'Malek', 'Nyx', 'Vesper', 'Kael', 'Lilit'],
  };

  P.PALETAS_DADO = [
    { id: 'rubi', nombre: 'Rubí', cuerpo: '#6E0F0C', canto: '#E9C877', tinta: '#FFF3D6' },
    { id: 'zafiro', nombre: 'Zafiro', cuerpo: '#123A7A', canto: '#BFD8FF', tinta: '#FFFFFF' },
    { id: 'esmeralda', nombre: 'Esmeralda', cuerpo: '#0E5A3C', canto: '#E9C877', tinta: '#FFF3D6' },
    { id: 'amatista', nombre: 'Amatista', cuerpo: '#4B1E7E', canto: '#D9B8FF', tinta: '#FFFFFF' },
    { id: 'obsidiana', nombre: 'Obsidiana', cuerpo: '#15131A', canto: '#C9CDD6', tinta: '#FFFFFF' },
    { id: 'hueso', nombre: 'Hueso', cuerpo: '#E9DFC8', canto: '#6B4E2A', tinta: '#2A2016' },
    { id: 'oro', nombre: 'Oro', cuerpo: '#B8860B', canto: '#FFF0B8', tinta: '#2A1A00' },
    { id: 'hielo', nombre: 'Hielo', cuerpo: '#9FD8E8', canto: '#FFFFFF', tinta: '#0E3A4A' },
  ];

  P.PX = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  P.DADO_FIJO = { 6: 4, 8: 5, 10: 6, 12: 7 };
  P.NIVELES_MEJORA = [4, 8, 12, 16, 19];
  P.MEJORAS_EXTRA = { guerrero: [6, 14], picaro: [10] };

  P.ESPACIOS = {
    completo: [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]],
    medio: [[], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]],
    pacto: [[1], [2], [0, 2], [0, 2], [0, 0, 2], [0, 0, 2], [0, 0, 0, 2], [0, 0, 0, 2], [0, 0, 0, 0, 2], [0, 0, 0, 0, 2], [0, 0, 0, 0, 3], [0, 0, 0, 0, 3], [0, 0, 0, 0, 3], [0, 0, 0, 0, 3], [0, 0, 0, 0, 3], [0, 0, 0, 0, 3], [0, 0, 0, 0, 4], [0, 0, 0, 0, 4], [0, 0, 0, 0, 4], [0, 0, 0, 0, 4]],
  };

  P.GLOSARIO = [
    ['Dungeon Master (DM)', 'Dungeon Master', 'Quien dirige la partida.'],
    ['Personaje jugador (PJ)', 'Player Character (PC)', 'Un personaje manejado por un jugador.'],
    ['Personaje no jugador (PNJ)', 'Non-Player Character (NPC)', 'Cualquier personaje que maneja el DM.'],
    ['Característica', 'Ability', 'Fuerza, Destreza, Constitución, Inteligencia, Sabiduría o Carisma.'],
    ['Modificador', 'Modifier', 'El número que sumas al dado.'],
    ['Habilidad', 'Skill', 'Algo concreto que puedes intentar, como Sigilo o Persuasión.'],
    ['Competencia', 'Proficiency', 'Estar entrenado en algo. Sumas un bono extra.'],
    ['Tirada de salvación', 'Saving throw', 'Tirada para resistir un peligro.'],
    ['Clase de Armadura (CA)', 'Armor Class (AC)', 'El número que un ataque debe alcanzar para golpearte.'],
    ['Puntos de golpe (PG)', 'Hit Points (HP)', 'Tu vida. A 0 caes inconsciente.'],
    ['Dado de golpe', 'Hit Die', 'Define tu vida y te cura en un descanso corto.'],
    ['Dificultad (CD)', 'Difficulty Class (DC)', 'El número que debes alcanzar en una prueba o salvación.'],
    ['Ventaja y desventaja', 'Advantage, Disadvantage', 'Tirar dos d20 y usar el mayor o el menor.'],
    ['Truco', 'Cantrip', 'Hechizo menor que se lanza sin límite.'],
    ['Espacio de conjuro', 'Spell slot', 'La carga que gastas al lanzar un conjuro.'],
    ['Trasfondo', 'Background', 'Tu vida antes de ser aventurero.'],
    ['Dote', 'Feat', 'Talento especial opcional.'],
    ['Puntos de experiencia (PX)', 'Experience Points (XP)', 'Lo que acumulas para subir de nivel.'],
    ['Mediano', 'Halfling', 'Raza pequeña y afortunada.'],
    ['Dracónido', 'Dragonborn', 'Raza descendiente de dragones.'],
    ['Tiflin', 'Tiefling', 'Raza con sangre infernal.'],
  ];

  P.buscar = (lista, id) => lista.find((x) => x.id === id) || null;
})(window.PJ);
