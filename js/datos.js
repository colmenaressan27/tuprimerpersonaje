/* Datos del juego. Las reglas están explicadas con palabras propias; ver créditos en README.md. */
window.PJ = window.PJ || {};
(function (P) {
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

  const VISION = { n: 'Visión en la oscuridad', d: 'Distingues formas sin luz hasta 18 m, sin colores.' };
  const FEERICO = { n: 'Linaje feérico', d: 'Ventaja contra encantamientos. La magia no puede dormirte.' };

  P.RAZAS = [
    { id: 'humano', nombre: 'Humano', en: 'human', icono: 'humano', frase: 'Adaptable y ambicioso. Bueno en un poco de todo.', bonos: { fue: 1, des: 1, con: 1, int: 1, sab: 1, car: 1 }, velocidad: 9, idiomas: ['Común', 'Uno a elegir'], rasgos: [{ n: 'Versátil', d: 'Es la raza más sencilla de manejar: +1 a las seis características.' }], buenas: 'Cualquier clase' },
    { id: 'elfo', nombre: 'Elfo', en: 'elf', icono: 'elfo', frase: 'Ágil, longevo y muy unido a la magia y a los bosques.', bonos: { des: 2 }, velocidad: 9, idiomas: ['Común', 'Élfico'], habilidades: ['percepcion'], rasgos: [VISION, FEERICO, { n: 'Sentidos agudos', d: 'Competencia en Percepción.' }, { n: 'Trance', d: 'Meditas 4 horas en lugar de dormir 8.' }], buenas: 'Explorador, Pícaro, Mago, Monje',
      subrazas: [
        { id: 'alto', nombre: 'Alto elfo', bonos: { int: 1 }, frase: '+1 INT y un truco de mago.', rasgos: [{ n: 'Truco de alto elfo', d: 'Conoces un truco de mago.' }] },
        { id: 'bosque', nombre: 'Elfo del bosque', bonos: { sab: 1 }, velocidad: 10.5, frase: '+1 SAB y caminas más rápido.', rasgos: [{ n: 'Pies ligeros', d: 'Tu velocidad es 10,5 m.' }, { n: 'Máscara de la naturaleza', d: 'Te escondes entre follaje, lluvia o niebla.' }] },
        { id: 'oscuro', nombre: 'Elfo oscuro (drow)', bonos: { car: 1 }, frase: '+1 CAR y gran visión, pero sufres con el sol.', rasgos: [{ n: 'Visión superior', d: 'Ves en la oscuridad hasta 36 m.' }, { n: 'Sensibilidad a la luz', d: 'Desventaja al atacar y percibir bajo el sol.' }] },
      ] },
    { id: 'enano', nombre: 'Enano', en: 'dwarf', icono: 'enano', frase: 'Bajo, fuerte y muy terco. Cuesta mucho derribarlo.', bonos: { con: 2 }, velocidad: 7.5, sinFrenoArmadura: true, idiomas: ['Común', 'Enano'], rasgos: [VISION, { n: 'Resistencia enana', d: 'Ventaja para salvarte del veneno y mitad de su daño.' }, { n: 'Entrenamiento enano', d: 'Competencia con hachas y martillos.' }], buenas: 'Guerrero, Clérigo, Paladín, Bárbaro',
      subrazas: [
        { id: 'colinas', nombre: 'Enano de las colinas', bonos: { sab: 1 }, pgPorNivel: 1, frase: '+1 SAB y +1 de vida por nivel.', rasgos: [{ n: 'Dureza enana', d: '+1 punto de golpe por nivel.' }] },
        { id: 'montanas', nombre: 'Enano de las montañas', bonos: { fue: 2 }, frase: '+2 FUE y entrenamiento con armadura.', rasgos: [{ n: 'Armadura enana', d: 'Competencia con armadura ligera y media.' }] },
      ] },
    { id: 'mediano', nombre: 'Mediano', en: 'halfling', icono: 'mediano', frase: 'Pequeño, alegre y con una suerte increíble.', bonos: { des: 2 }, velocidad: 7.5, tamano: 'Pequeño', idiomas: ['Común', 'Mediano'], rasgos: [{ n: 'Suertudo', d: 'Si sacas 1 en el d20, vuelves a tirar.' }, { n: 'Valiente', d: 'Ventaja contra el miedo.' }, { n: 'Agilidad', d: 'Pasas por el espacio de criaturas más grandes.' }], buenas: 'Pícaro, Bardo, Monje',
      subrazas: [
        { id: 'piesligeros', nombre: 'Mediano piesligeros', bonos: { car: 1 }, frase: '+1 CAR y te escondes detrás de otros.', rasgos: [{ n: 'Sigilo natural', d: 'Te escondes detrás de criaturas más grandes.' }] },
        { id: 'fornido', nombre: 'Mediano fornido', bonos: { con: 1 }, frase: '+1 CON y resistes el veneno.', rasgos: [{ n: 'Resistencia fornida', d: 'Ventaja contra veneno y mitad de su daño.' }] },
      ] },
    { id: 'draconido', nombre: 'Dracónido', en: 'dragonborn', icono: 'draconido', frase: 'Descendiente de dragones, orgulloso y con aliento elemental.', bonos: { fue: 2, car: 1 }, velocidad: 9, idiomas: ['Común', 'Dracónico'], rasgos: [{ n: 'Aliento de dragón', d: '2d6 de daño en un área. Se recarga con un descanso.' }, { n: 'Resistencia dracónica', d: 'Recibes la mitad del daño de tu elemento.' }], buenas: 'Paladín, Guerrero, Hechicero, Bárbaro' },
    { id: 'gnomo', nombre: 'Gnomo', en: 'gnome', icono: 'gnomo', frase: 'Curioso, inventor y lleno de energía.', bonos: { int: 2 }, velocidad: 7.5, tamano: 'Pequeño', idiomas: ['Común', 'Gnomo'], rasgos: [VISION, { n: 'Astucia gnoma', d: 'Ventaja en salvaciones de INT, SAB y CAR contra magia.' }], buenas: 'Mago, Pícaro, Bardo',
      subrazas: [
        { id: 'rocas', nombre: 'Gnomo de las rocas', bonos: { con: 1 }, frase: '+1 CON y fabricas pequeños aparatos.', rasgos: [{ n: 'Manitas', d: 'Fabricas pequeños aparatos mecánicos.' }] },
        { id: 'bosque', nombre: 'Gnomo del bosque', bonos: { des: 1 }, frase: '+1 DES e ilusiones menores.', rasgos: [{ n: 'Ilusionista nato', d: 'Conoces el truco Ilusión menor.' }, { n: 'Amigo de los animales', d: 'Hablas con animales pequeños.' }] },
      ] },
    { id: 'semielfo', nombre: 'Semielfo', en: 'half-elf', icono: 'semielfo', frase: 'Mitad humano, mitad elfo. Encantador y versátil.', bonos: { car: 2 }, eligeCar: 2, velocidad: 9, idiomas: ['Común', 'Élfico', 'Uno a elegir'], eligeHabilidades: 2, rasgos: [VISION, FEERICO, { n: 'Versatilidad', d: 'Competencia en 2 habilidades que elijas.' }], buenas: 'Bardo, Brujo, Paladín, Hechicero' },
    { id: 'semiorco', nombre: 'Semiorco', en: 'half-orc', icono: 'semiorco', frase: 'Mitad humano, mitad orco. Fuerte y muy difícil de tumbar.', bonos: { fue: 2, con: 1 }, velocidad: 9, idiomas: ['Común', 'Orco'], habilidades: ['intimidacion'], rasgos: [VISION, { n: 'Aguante incansable', d: 'Una vez por descanso largo, si caes a 0 PG, te quedas en 1.' }, { n: 'Ataques salvajes', d: 'Tus críticos cuerpo a cuerpo tiran un dado extra.' }], buenas: 'Bárbaro, Guerrero, Paladín' },
    { id: 'tiflin', nombre: 'Tiflin', en: 'tiefling', icono: 'tiflin', frase: 'Con sangre infernal: cuernos, cola y mucha presencia.', bonos: { car: 2, int: 1 }, velocidad: 9, idiomas: ['Común', 'Infernal'], rasgos: [VISION, { n: 'Resistencia infernal', d: 'Recibes la mitad del daño de fuego.' }, { n: 'Legado infernal', d: 'Sabes el truco Taumaturgia. Ganas más magia en niveles 3 y 5.' }], buenas: 'Brujo, Bardo, Hechicero, Paladín' },
  ];

  P.ARMAS = {
    daga: { nombre: 'Daga', dado: '1d4', tipo: 'perforante', sutil: true, lanzar: '6/18 m' },
    dardo: { nombre: 'Dardo', dado: '1d4', tipo: 'perforante', sutil: true, lanzar: '6/18 m' },
    baston: { nombre: 'Bastón', dado: '1d6', tipo: 'contundente', nota: '1d8 a dos manos' },
    maza: { nombre: 'Maza', dado: '1d6', tipo: 'contundente' },
    'hacha-mano': { nombre: 'Hacha de mano', dado: '1d6', tipo: 'cortante', lanzar: '6/18 m' },
    jabalina: { nombre: 'Jabalina', dado: '1d6', tipo: 'perforante', lanzar: '9/36 m' },
    'espada-corta': { nombre: 'Espada corta', dado: '1d6', tipo: 'perforante', sutil: true },
    cimitarra: { nombre: 'Cimitarra', dado: '1d6', tipo: 'cortante', sutil: true },
    estoque: { nombre: 'Estoque', dado: '1d8', tipo: 'perforante', sutil: true },
    'espada-larga': { nombre: 'Espada larga', dado: '1d8', tipo: 'cortante', nota: '1d10 a dos manos' },
    'gran-hacha': { nombre: 'Gran hacha', dado: '1d12', tipo: 'cortante', dosManos: true },
    mandoble: { nombre: 'Mandoble', dado: '2d6', tipo: 'cortante', dosManos: true },
    'arco-corto': { nombre: 'Arco corto', dado: '1d6', tipo: 'perforante', distancia: '24/96 m', dosManos: true },
    'arco-largo': { nombre: 'Arco largo', dado: '1d8', tipo: 'perforante', distancia: '45/180 m', dosManos: true },
    'ballesta-ligera': { nombre: 'Ballesta ligera', dado: '1d8', tipo: 'perforante', distancia: '24/96 m', dosManos: true },
  };

  P.ARMADURAS = {
    cuero: { nombre: 'Armadura de cuero', base: 11 },
    escamas: { nombre: 'Cota de escamas', base: 14, desMax: 2 },
    malla: { nombre: 'Cota de malla', base: 16, desMax: 0, fue: 13 },
  };

  P.CLASES = [
    { id: 'barbaro', nombre: 'Bárbaro', icono: 'barbaro', color: '#E0523A', d: 12, dif: 1, tags: ['pegar', 'aguantar'], frase: 'Entra en furia, pega durísimo y aguanta más que nadie.', clave: 'Fuerza', salv: ['fue', 'con'], armadura: 'Ligera, media y escudo', nHab: 2, hab: ['atletismo', 'intimidacion', 'naturaleza', 'percepcion', 'supervivencia', 'animales'], reparto: { fue: 15, con: 14, des: 13, sab: 12, car: 10, int: 8 },
      rasgos: [{ n: 'Furia', d: '2 veces por descanso largo: +2 al daño cuerpo a cuerpo y mitad del daño físico.' }, { n: 'Defensa sin armadura', d: 'Sin armadura, tu CA es 10 + DES + CON.' }],
      kits: [{ id: 'a', nombre: 'Arma a dos manos', armas: ['gran-hacha', 'hacha-mano', 'jabalina'], otros: ['2 hachas de mano', '4 jabalinas', 'Paquete de explorador'] }],
      progreso: ['Ataque temerario, Sentido del peligro', 'Elige su senda', 'Mejora de característica', 'Ataque adicional, más velocidad'] },
    { id: 'bardo', nombre: 'Bardo', icono: 'bardo', color: '#E06BA8', d: 8, dif: 3, tags: ['magia', 'curar', 'hablar'], frase: 'Músico mágico. Anima al grupo, encanta enemigos y sabe de todo.', clave: 'Carisma', salv: ['des', 'car'], armadura: 'Ligera', nHab: 3, hab: 'todas', reparto: { car: 15, des: 14, con: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Inspiración bárdica', d: 'Das un d6 extra a un aliado. Usos: tu mod. de CAR por descanso largo.' }],
      magia: { car: 'car', trucos: 2, conocidos: 4, tipo: 'completo' },
      kits: [{ id: 'a', nombre: 'Equipo del bardo', armadura: 'cuero', armas: ['estoque', 'daga'], otros: ['Laúd', 'Paquete de artista'] }],
      progreso: ['Aprendiz de todo, Canción de descanso', 'Elige su colegio, Pericia', 'Mejora de característica', 'Inspiración d8, conjuros de nivel 3'] },
    { id: 'brujo', nombre: 'Brujo', icono: 'brujo', color: '#9B72F2', d: 8, dif: 2, tags: ['magia', 'hablar'], frase: 'Hizo un pacto con un ser poderoso a cambio de magia.', clave: 'Carisma', salv: ['sab', 'car'], armadura: 'Ligera', nHab: 2, hab: ['arcano', 'engano', 'historia', 'intimidacion', 'investigacion', 'naturaleza', 'religion'], reparto: { car: 15, con: 14, des: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Magia de pacto', d: 'Tu espacio de conjuro vuelve con un descanso corto.' }],
      opcion: { titulo: 'Tu patrón', ayuda: '¿Quién te dio tu poder?', lista: [{ id: 'infernal', nombre: 'Infernal', d: 'Un ser de los infiernos. Magia de fuego.' }, { id: 'feerico', nombre: 'Archifeérico', d: 'Un noble de las hadas. Magia de encanto.' }, { id: 'primigenio', nombre: 'Primigenio', d: 'Una entidad antigua. Magia de la mente.' }] },
      magia: { car: 'car', trucos: 2, conocidos: 2, tipo: 'pacto' },
      kits: [{ id: 'a', nombre: 'Equipo del brujo', armadura: 'cuero', armas: ['ballesta-ligera', 'daga'], otros: ['Foco arcano', '2 dagas', '20 virotes', 'Paquete de erudito'] }],
      progreso: ['Invocaciones sobrenaturales', 'Don del pacto', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'clerigo', nombre: 'Clérigo', icono: 'clerigo', color: '#E6BE4F', d: 8, dif: 2, tags: ['magia', 'curar', 'aguantar'], frase: 'Su fe le da magia. Cura, protege y golpea.', clave: 'Sabiduría', salv: ['sab', 'car'], armadura: 'Ligera, media y escudo', nHab: 2, hab: ['historia', 'medicina', 'perspicacia', 'persuasion', 'religion'], reparto: { sab: 15, con: 14, fue: 13, car: 12, des: 10, int: 8 },
      rasgos: [],
      opcion: { titulo: 'Tu dominio divino', ayuda: '¿Qué aspecto de tu dios te guía?', lista: [{ id: 'vida', nombre: 'Vida', d: 'Tus curaciones sanan más.' }, { id: 'luz', nombre: 'Luz', d: 'Tu fe quema con fuego sagrado.' }, { id: 'guerra', nombre: 'Guerra', d: 'Tu fe te guía en el combate.' }] },
      magia: { car: 'sab', trucos: 3, prepara: true, tipo: 'completo' },
      kits: [{ id: 'a', nombre: 'Equipo del clérigo', armadura: 'escamas', escudo: true, armas: ['maza', 'ballesta-ligera'], otros: ['Símbolo sagrado', '20 virotes', 'Paquete de sacerdote'] }],
      progreso: ['Canalizar divinidad', 'Conjuros de nivel 2', 'Mejora de característica', 'Destruir muertos vivientes, conjuros de nivel 3'] },
    { id: 'druida', nombre: 'Druida', icono: 'druida', color: '#57B878', d: 8, dif: 3, tags: ['magia', 'curar', 'naturaleza'], frase: 'Guardián de la naturaleza. Lanza magia y se convierte en animales.', clave: 'Sabiduría', salv: ['int', 'sab'], armadura: 'Ligera, media y escudo, sin metal', nHab: 2, hab: ['arcano', 'medicina', 'naturaleza', 'percepcion', 'perspicacia', 'religion', 'supervivencia', 'animales'], reparto: { sab: 15, con: 14, des: 13, int: 12, car: 10, fue: 8 },
      rasgos: [{ n: 'Druídico', d: 'Hablas el idioma secreto de los druidas.' }],
      magia: { car: 'sab', trucos: 2, prepara: true, tipo: 'completo' },
      kits: [{ id: 'a', nombre: 'Equipo del druida', armadura: 'cuero', escudo: true, armas: ['cimitarra'], otros: ['Foco druídico', 'Escudo de madera', 'Paquete de explorador'] }],
      progreso: ['Forma salvaje, elige su círculo', 'Conjuros de nivel 2', 'Mejora de característica, mejor forma salvaje', 'Conjuros de nivel 3'] },
    { id: 'explorador', nombre: 'Explorador', icono: 'explorador', color: '#3FB6A2', d: 10, dif: 2, tags: ['sombras', 'pegar', 'naturaleza', 'distancia'], frase: 'Cazador de las tierras salvajes. Rastrea, sobrevive y dispara.', clave: 'Destreza y Sabiduría', salv: ['fue', 'des'], armadura: 'Ligera, media y escudo', nHab: 3, hab: ['atletismo', 'investigacion', 'naturaleza', 'percepcion', 'perspicacia', 'sigilo', 'supervivencia', 'animales'], reparto: { des: 15, sab: 14, con: 13, fue: 12, int: 10, car: 8 },
      rasgos: [{ n: 'Enemigo predilecto', d: 'Eliges un tipo de criatura y aprendes a rastrearla.' }, { n: 'Explorador nato', d: 'Te orientas mejor en un tipo de terreno.' }],
      magia: { car: 'sab', desdeNivel: 2, tipo: 'medio' },
      kits: [{ id: 'arco', nombre: 'Ligero con arco', armadura: 'cuero', armas: ['arco-largo', 'espada-corta'], otros: ['2 espadas cortas', '20 flechas', 'Paquete de explorador'] }, { id: 'escamas', nombre: 'Mejor protegido', armadura: 'escamas', armas: ['arco-largo', 'espada-corta'], otros: ['2 espadas cortas', '20 flechas', 'Paquete de explorador'] }],
      progreso: ['Estilo de combate, Conjuros', 'Elige su arquetipo, Consciencia primigenia', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'guerrero', nombre: 'Guerrero', icono: 'guerrero', color: '#8CA3C2', d: 10, dif: 1, tags: ['pegar', 'aguantar', 'distancia'], frase: 'Experto en armas y armaduras. La clase más directa para aprender.', clave: 'Fuerza o Destreza', salv: ['fue', 'con'], armadura: 'Todas y escudo', nHab: 2, hab: ['acrobacias', 'atletismo', 'historia', 'intimidacion', 'percepcion', 'perspicacia', 'supervivencia', 'animales'], reparto: { fue: 15, con: 14, des: 13, sab: 12, car: 10, int: 8 },
      rasgos: [{ n: 'Tomar aliento', d: 'Una vez por descanso, te curas 1d10 + tu nivel.' }],
      opcion: { titulo: 'Tu estilo de combate', ayuda: '¿Cómo te gusta pelear?', lista: [{ id: 'defensa', nombre: 'Defensa', d: '+1 a tu CA mientras lleves armadura.' }, { id: 'duelo', nombre: 'Duelo', d: '+2 al daño con un arma a una mano.' }, { id: 'arqueria', nombre: 'Arquería', d: '+2 para acertar con armas a distancia.' }, { id: 'grande', nombre: 'Arma grande', d: 'Repites los 1 y 2 de daño con armas a dos manos.' }] },
      kits: [{ id: 'escudo', nombre: 'Espada y escudo', armadura: 'malla', escudo: true, armas: ['espada-larga', 'hacha-mano'], otros: ['2 hachas de mano', 'Paquete de explorador de mazmorras'] }, { id: 'grande', nombre: 'Arma a dos manos', armadura: 'malla', armas: ['mandoble', 'hacha-mano'], otros: ['2 hachas de mano', 'Paquete de explorador de mazmorras'] }, { id: 'arco', nombre: 'Arquero', armadura: 'cuero', armas: ['arco-largo', 'espada-larga'], otros: ['20 flechas', 'Escudo', 'Paquete de explorador'] }],
      progreso: ['Acción súbita', 'Elige su arquetipo', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'hechicero', nombre: 'Hechicero', icono: 'hechicero', color: '#EE7A45', d: 6, dif: 3, tags: ['magia', 'hablar', 'fuego'], frase: 'Nació con magia en la sangre. Sabe pocos conjuros, pero los moldea.', clave: 'Carisma', salv: ['con', 'car'], armadura: 'Ninguna', nHab: 2, hab: ['arcano', 'engano', 'intimidacion', 'perspicacia', 'persuasion', 'religion'], reparto: { car: 15, con: 14, des: 13, sab: 12, int: 10, fue: 8 },
      rasgos: [],
      opcion: { titulo: 'Tu origen mágico', ayuda: '¿De dónde viene tu poder?', lista: [{ id: 'draconico', nombre: 'Linaje dracónico', d: 'CA 13 + DES sin armadura y +1 de vida por nivel.' }, { id: 'salvaje', nombre: 'Magia salvaje', d: 'Tu magia es impredecible y sorprendente.' }] },
      magia: { car: 'car', trucos: 4, conocidos: 2, tipo: 'completo' },
      kits: [{ id: 'a', nombre: 'Equipo del hechicero', armas: ['ballesta-ligera', 'daga'], otros: ['Foco arcano', '2 dagas', '20 virotes', 'Paquete de explorador de mazmorras'] }],
      progreso: ['Puntos de hechicería', 'Metamagia', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'mago', nombre: 'Mago', icono: 'mago', color: '#5F93F5', d: 6, dif: 3, tags: ['magia', 'estudio'], frase: 'Estudia magia en un libro. Tiene la lista de conjuros más grande.', clave: 'Inteligencia', salv: ['int', 'sab'], armadura: 'Ninguna', nHab: 2, hab: ['arcano', 'historia', 'investigacion', 'medicina', 'perspicacia', 'religion'], reparto: { int: 15, con: 14, des: 13, sab: 12, car: 10, fue: 8 },
      rasgos: [{ n: 'Recuperación arcana', d: 'Una vez al día recuperas un espacio en un descanso corto.' }],
      magia: { car: 'int', trucos: 3, conocidos: 6, libro: true, tipo: 'completo' },
      kits: [{ id: 'a', nombre: 'Equipo del mago', armas: ['baston'], otros: ['Foco arcano', 'Libro de conjuros', 'Paquete de erudito'] }],
      progreso: ['Elige su tradición arcana', 'Conjuros de nivel 2', 'Mejora de característica', 'Conjuros de nivel 3'] },
    { id: 'monje', nombre: 'Monje', icono: 'monje', color: '#3CBAD0', d: 8, dif: 2, tags: ['sombras', 'pegar'], frase: 'Artista marcial rápido. Pelea con los puños y esquiva casi todo.', clave: 'Destreza y Sabiduría', salv: ['fue', 'des'], armadura: 'Ninguna', nHab: 2, hab: ['acrobacias', 'atletismo', 'historia', 'perspicacia', 'religion', 'sigilo'], reparto: { des: 15, sab: 14, con: 13, fue: 12, int: 10, car: 8 },
      rasgos: [{ n: 'Artes marciales', d: 'Tus puños hacen 1d4 y puedes golpear de nuevo como acción adicional.' }, { n: 'Defensa sin armadura', d: 'Sin armadura ni escudo, tu CA es 10 + DES + SAB.' }],
      kits: [{ id: 'a', nombre: 'Equipo del monje', armas: ['espada-corta', 'dardo'], otros: ['10 dardos', 'Paquete de explorador'] }],
      progreso: ['Ki, más velocidad', 'Elige su tradición, Desviar proyectiles', 'Mejora de característica, Caída lenta', 'Ataque adicional, Golpe aturdidor'] },
    { id: 'paladin', nombre: 'Paladín', icono: 'paladin', color: '#EDBB3F', d: 10, dif: 2, tags: ['pegar', 'aguantar', 'curar', 'hablar'], frase: 'Guerrero sagrado unido a un juramento. Pega fuerte y cura con las manos.', clave: 'Fuerza y Carisma', salv: ['sab', 'car'], armadura: 'Todas y escudo', nHab: 2, hab: ['atletismo', 'intimidacion', 'medicina', 'perspicacia', 'persuasion', 'religion'], reparto: { fue: 15, car: 14, con: 13, sab: 12, des: 10, int: 8 },
      rasgos: [{ n: 'Sentido divino', d: 'Percibes criaturas celestiales, infernales y no muertos.' }, { n: 'Imposición de manos', d: 'Curas al tocar. Tienes nivel × 5 puntos por descanso largo.' }],
      magia: { car: 'car', desdeNivel: 2, tipo: 'medio' },
      kits: [{ id: 'escudo', nombre: 'Espada y escudo', armadura: 'malla', escudo: true, armas: ['espada-larga', 'jabalina'], otros: ['5 jabalinas', 'Símbolo sagrado', 'Paquete de explorador'] }, { id: 'grande', nombre: 'Arma a dos manos', armadura: 'malla', armas: ['mandoble', 'jabalina'], otros: ['5 jabalinas', 'Símbolo sagrado', 'Paquete de explorador'] }],
      progreso: ['Estilo de combate, Conjuros, Castigo divino', 'Salud divina, elige su juramento', 'Mejora de característica', 'Ataque adicional'] },
    { id: 'picaro', nombre: 'Pícaro', icono: 'picaro', color: '#A8ADB8', d: 8, dif: 1, tags: ['sombras', 'hablar'], frase: 'Especialista en sigilo, trampas y ataques por sorpresa.', clave: 'Destreza', salv: ['des', 'int'], armadura: 'Ligera', nHab: 4, hab: ['acrobacias', 'atletismo', 'engano', 'interpretacion', 'intimidacion', 'investigacion', 'manos', 'percepcion', 'perspicacia', 'persuasion', 'sigilo'], pericia: 2, reparto: { des: 15, con: 14, sab: 13, car: 12, int: 10, fue: 8 },
      rasgos: [{ n: 'Pericia', d: 'Duplicas tu bono de competencia en 2 habilidades.' }, { n: 'Ataque furtivo', d: 'Una vez por turno, 1d6 de daño extra si tienes ventaja o un aliado cerca.' }, { n: 'Jerga de ladrones', d: 'Hablas el código secreto de los pícaros.' }],
      kits: [{ id: 'a', nombre: 'Equipo del pícaro', armadura: 'cuero', armas: ['estoque', 'arco-corto', 'daga'], otros: ['2 dagas', '20 flechas', 'Herramientas de ladrón', 'Paquete de ladrón'] }],
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
    { id: 'toque', nombre: 'Toque electrizante', nivel: 0, clases: ['hechicero', 'mago'], d: 'Un toque de 1d8 de rayo.', ataque: { modo: 'ataque', dado: '1d8', tipo: 'rayo' } },
    { id: 'descarga-brujo', nombre: 'Descarga sobrenatural', nivel: 0, clases: ['brujo'], d: 'Un rayo de energía: 1d10 de fuerza.', ataque: { modo: 'ataque', dado: '1d10', tipo: 'fuerza' } },
    { id: 'llama-sagrada', nombre: 'Llama sagrada', nivel: 0, clases: ['clerigo'], d: 'Luz divina que cae del cielo: 1d8 radiante.', ataque: { modo: 'salv', car: 'des', dado: '1d8', tipo: 'radiante' } },
    { id: 'guia', nombre: 'Guía', nivel: 0, clases: ['clerigo', 'druida'], d: 'Un aliado suma 1d4 a una prueba.' },
    { id: 'taumaturgia', nombre: 'Taumaturgia', nivel: 0, clases: ['clerigo'], d: 'Pequeños prodigios: voz potente, temblores, llamas.' },
    { id: 'resistencia', nombre: 'Resistencia', nivel: 0, clases: ['clerigo', 'druida'], d: 'Un aliado suma 1d4 a una salvación.' },
    { id: 'garrote', nombre: 'Garrote mágico', nivel: 0, clases: ['druida'], d: 'Tu bastón pega con Sabiduría y hace 1d8.' },
    { id: 'llama-producida', nombre: 'Llama producida', nivel: 0, clases: ['druida'], d: 'Una llama que ilumina o se lanza: 1d8 de fuego.', ataque: { modo: 'ataque', dado: '1d8', tipo: 'fuego' } },
    { id: 'druidismo', nombre: 'Druidismo', nivel: 0, clases: ['druida'], d: 'Pequeños efectos naturales, como predecir el clima.' },
    { id: 'curar', nombre: 'Curar heridas', nivel: 1, clases: ['bardo', 'clerigo', 'druida'], d: 'Al tocar, cura 1d8 + tu modificador de magia.' },
    { id: 'palabra', nombre: 'Palabra de curación', nivel: 1, clases: ['bardo', 'clerigo', 'druida'], d: 'A distancia, cura 1d4 + tu modificador de magia.' },
    { id: 'bendecir', nombre: 'Bendecir', nivel: 1, clases: ['clerigo'], d: '3 aliados suman 1d4 a ataques y salvaciones.' },
    { id: 'rayo-guia', nombre: 'Rayo guía', nivel: 1, clases: ['clerigo'], d: 'Un rayo de luz de 4d6 radiante.' },
    { id: 'escudo-fe', nombre: 'Escudo de fe', nivel: 1, clases: ['clerigo'], d: 'Un aliado gana +2 a su CA.' },
    { id: 'proyectil', nombre: 'Proyectil mágico', nivel: 1, clases: ['hechicero', 'mago'], d: '3 dardos que nunca fallan: 1d4+1 cada uno.' },
    { id: 'escudo', nombre: 'Escudo', nivel: 1, clases: ['hechicero', 'mago'], d: 'Como reacción, +5 a tu CA por un turno.' },
    { id: 'armadura-mago', nombre: 'Armadura de mago', nivel: 1, clases: ['hechicero', 'mago'], d: 'Tu CA es 13 + DES por 8 horas.' },
    { id: 'dormir', nombre: 'Dormir', nivel: 1, clases: ['bardo', 'hechicero', 'mago'], d: 'Duerme a criaturas según 5d8 de vida.' },
    { id: 'manos-ardientes', nombre: 'Manos ardientes', nivel: 1, clases: ['hechicero', 'mago'], d: 'Un cono de 3d6 de fuego.' },
    { id: 'hechizar', nombre: 'Hechizar persona', nivel: 1, clases: ['bardo', 'brujo', 'druida', 'hechicero', 'mago'], d: 'Alguien te ve como amigo por 1 hora.' },
    { id: 'detectar', nombre: 'Detectar magia', nivel: 1, clases: ['bardo', 'clerigo', 'druida', 'hechicero', 'mago'], d: 'Percibes la magia cerca de ti.' },
    { id: 'onda', nombre: 'Onda atronadora', nivel: 1, clases: ['bardo', 'druida', 'hechicero', 'mago'], d: 'Un estallido de 2d8 de trueno que empuja.' },
    { id: 'disfrazarse', nombre: 'Disfrazarse', nivel: 1, clases: ['bardo', 'hechicero', 'mago'], d: 'Cambias tu apariencia por 1 hora.' },
    { id: 'enmaranar', nombre: 'Enmarañar', nivel: 1, clases: ['druida'], d: 'Plantas que atrapan a los enemigos.' },
    { id: 'fuego-feerico', nombre: 'Fuego feérico', nivel: 1, clases: ['bardo', 'druida'], d: 'Revela enemigos y da ventaja para golpearlos.' },
    { id: 'bayas', nombre: 'Buenas bayas', nivel: 1, clases: ['druida'], d: '10 bayas que curan 1 punto y alimentan.' },
    { id: 'reprension', nombre: 'Reprensión infernal', nivel: 1, clases: ['brujo'], d: 'Si te hieren, respondes con 2d10 de fuego.' },
    { id: 'manos-brujo', nombre: 'Armadura de sombras', nivel: 1, clases: ['brujo'], d: 'Sombras te envuelven: CA 13 + DES por 8 horas.' },
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
