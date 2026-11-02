# CONTEXTO — tuprimerpersonaje

> Memoria viva del proyecto para personas e IAs: qué es, cómo va, qué se decidió y qué sigue.
> Última actualización: 2026-11-02 12:13 · rama main · commit cccacef · sin versión
> Cómo mantenerlo: AGENTS.md → «Al terminar un bloque de trabajo».

<!-- hilo:estado:inicio -->
## Estado actual
- **Qué es:** sitio estático en español para crear un primer personaje de D&D 5.ª edición sin saber nada del juego, con un guía paso a paso.
- **Fase:** prototipo, publicado en GitHub Pages.
- **Funciona hoy:** recorrido de 9 pasos, dados 3D con colores, hoja en PDF y JPEG con imagen propia, hoja de conjuros, impresión en blanco y negro, QR sin servidor, Mis personajes, realidad aumentada, Modo DM, guía de combate, lenguaje natural sin IA y Gemini opcional. Datos del SRD 5.1 en español (CC BY 4.0).
- **Último commit:** `1.2` (`cccacef`). Las medidas en pies de la última sesión están sin commit ni subir.
- **Verificado:** 41 pruebas en Node y comprobación en Chrome de hoja, panel y ficha de criatura con velocidad en pies.
- **Siguiente paso:** commit y subida de las medidas en pies; luego probar con una clave real de Gemini, WebXR en Android real, cámara en un celular real e imprimir una hoja de prueba.
- **Bloqueos / riesgos:** Gemini solo se ha probado con respuestas simuladas; WebXR y cámara solo en escritorio; la impresión solo generando el PDF desde Chrome.
<!-- hilo:estado:fin -->

## 1. Propósito y alcance
- **Problema / para quién:** personas que nunca jugaron D&D y quieren su primer personaje sin leer el manual.
- **Incluye:** reglas de 2014 con 9 razas, 12 clases y 13 trasfondos; práctica de dados; subir de nivel hasta 20; guía de consulta y de combate; hoja de conjuros con texto oficial; Mis personajes; realidad aumentada; Modo DM (iniciativa, encuentros, PNJ, objetos y trampas, con o sin Gemini); panel de apariencia y accesibilidad; asistente en lenguaje natural con Gemini opcional y clave propia de cada persona.
- **Fuente de textos:** SRD 5.1 oficial en español (CC BY 4.0), con 317 criaturas, 240 objetos y 8 trampas. Se usa su texto, no se copia el manual; las medidas se pasan a pies; la atribución es exacta y la app dice «compatible con 5E».
- **No incluye (por ahora):** servidor, base de datos ni cuentas. Es un proyecto no oficial, sin respaldo de Wizards of the Coast.

## 2. Stack y entorno
| Capa | Tecnología | Versión | Nota |
|---|---|---|---|
| Base | HTML + CSS + JavaScript (sitio estático) | — | Sin paso de compilación ni dependencias npm |
| Interfaz | Bootstrap | 5.3.8 | En `vendor/` |
| Dados 3D | Three.js | sin confirmar | En `vendor/three-dados.min.js` |
| Descargas | jsPDF y qrcode-generator | sin confirmar | En `vendor/` |
| IA opcional | API de Gemini | `P.MODELOS_GEMINI` | Directa desde el navegador, con `generateContent` |
| Pruebas | Node | — | Solo para `pruebas/motor.prueba.js` |

| Acción | Comando |
|---|---|
| Previsualizar | abrir `index.html` con Live Preview o `npx serve .` |
| Pruebas | `node pruebas/motor.prueba.js` |

- **Entorno:** navegador moderno. No hay variables de entorno; cada persona escribe su clave de Gemini en la app y solo se guarda si marca **Recordar**.
- **Despliegue:** publicado en GitHub Pages desde `main`, carpeta raíz. Repositorio: `colmenaressan27/tuprimerpersonaje`.

## 3. Mapa del código
<!-- Solo lo que no es obvio: dónde vive cada pieza importante y cómo se conectan. -->
```text
index.html            estructura, paneles, diálogos y orden de carga de los scripts
css/estilos.css       tokens de diseño, temas, accesibilidad e impresión
js/
  datos.js            catálogo del juego, P.GUSTOS y P.FIRMA
  motor.js            reglas: de las decisiones del jugador a los números de la hoja
  guardados.js        Mis personajes; migra `tpp.estado`
  interprete.js       lenguaje natural sin IA, recomendaciones y validación de cambios
  elegir.js           «Elegir por mí» sin IA y validación de lo que proponga Gemini
  ia.js               conexión opcional con Gemini
  dados3d.js          dados 3D, colores y P.azar
  ra.js               realidad aumentada: cámara para todos y WebXR donde exista
  srd-conjuros.js     texto oficial de conjuros (SRD, páginas 101+)
  hoja.js             dibujo de la hoja en lienzo y sus temas
  exportar.js         PDF, JPEG y QR
  pasos.js            pantallas y textos del guía
  dm.js               Modo DM: iniciativa, enemigos automáticos, encuentros, PNJ, objetos y trampas
  dm-vista.js         pantallas del Modo DM
  srd-dm.js           datos DM (criaturas, objetos, trampas); carga diferida, no está en index.html
  app.js              estado, navegación y eventos
herramientas/         generador de los datos SRD (`srd-generar.js`, `srd-lineas.mjs`)
pruebas/motor.prueba.js
vendor/               Bootstrap, Three.js, jsPDF y generador de QR
fonts/                Almendra, Atkinson, Cinzel y Figtree
```
- **Entrada:** `index.html` carga scripts con `defer` y sin módulos. El orden importa: `iconos → datos → motor → guardados → interprete → elegir → ia → dados3d → ra → srd-conjuros → hoja → exportar → pasos → dm → dm-vista → app`.
- **Namespace:** todo cuelga de `window.PJ`, que cada archivo recibe como `P`.
- **Flujo:** `app.js` guarda el estado en `E`; `P.calcular(pj)` deriva todos los números; `P.PASOS` pinta cada pantalla.
- **Sin DOM, probado en Node:** `datos.js`, `motor.js`, `interprete.js`, `elegir.js` e `ia.js`.
- **Persistencia:** `localStorage` con `tpp.estado`, `tpp.prefs`, `tpp.url` y `tpp.ia`. Mis personajes guarda con imágenes, así que el límite de unos 5 MB pesa. El QR lleva solo las decisiones, comprimidas en el enlace tras `#pj.`.

## 4. Convenciones
- **Idioma:** código, comentarios e interfaz en español; la interfaz tutea y usa frases cortas.
- **Estructura:** cada archivo es una función `(function (P) { … })(window.PJ)`, sin módulos ES.
- **Eventos:** los botones usan `data-accion` y se resuelven en el mapa `ACCIONES` de `app.js`.
- **Vistas:** plantillas de texto; todo dato variable pasa por `P.esc`.
- **IA:** «la IA entiende, el código decide». Sus propuestas pasan por `P.validarCambios` o `P.elegir.validar`, y si no sirven se usa el modo sin IA.
- **Datos:** lo nuevo sobre gustos se agrega en `P.GUSTOS`; las pruebas comprueban que cada referencia exista.
- **Commits:** sin formato fijo; basta una frase corta en español que diga qué cambió.

## 5. Decisiones
| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2026-11-02 | ~~La velocidad se muestra en pies; alcances, visión en la oscuridad y textos del SRD siguen en metros~~ **Sustituida** por la fila siguiente | ~~Lo pidió el usuario; los textos oficiales están en metros~~ | ~~Convertir todas las distancias~~ |
| 2026-11-02 | ~~Las criaturas del Modo DM convierten su velocidad al mostrarse (`P.dm.velocidadEnPies`), sin tocar `js/srd-dm.js`~~ **Sustituida**: se quitó `P.dm.velocidadEnPies` | ~~No regenerar datos desde el PDF~~ | ~~Convertir en el generador~~ |
| 2026-11-02 | Todas las medidas se muestran en pies y la conversión se hace en el generador (`herramientas/srd-generar.js`), no al mostrar. Cm y km también se convierten (pulgadas y millas); los pesos en kg no cambian | Lo pidió el usuario; no mezclar unidades, y 5280 ft no se leen | Conservar el texto métrico oficial; convertir al mostrar |
| 2026-11-02 | Un gusto («me gusta curar») ofrece caminos, nunca decide la clase | La persona debe elegir, y cada gusto admite varias formas de jugar | Asociar cada gusto a una sola clase |
| 2026-11-02 | Cada tiro es un renglón del selector y elegir uno ya usado intercambia ambas características | Permite colocar todos los repetidos sin perder ninguno | Lista de valores únicos |
| 2026-11-02 | Repartir por mí prueba todas las permutaciones y puntúa cada una | Aprovecha bonos de raza, gustos y la Fuerza que pide la armadura | Copiar el orden fijo de `clase.reparto` |
| 2026-11-02 | Gemini elige entre opciones cerradas y se valida en `js/elegir.js` | Una respuesta inválida no debe romper las reglas | Aplicar su respuesta directamente |
| 2026-11-02 | La hoja de impresión es el tema `byn` del mismo lienzo, con página 3 solo si hay magia | Reutiliza el dibujo y da espacio de notas a quien usa conjuros | Una hoja aparte o apretar la sección de magia |
| 2026-11-02 | El SRD 5.1 en español es la fuente de textos oficiales | Tiene licencia CC BY 4.0 y el texto es el oficial | Copiar el manual |
| 2026-11-02 | Los datos del Modo DM van en `js/srd-dm.js` con carga diferida | Evita cargar criaturas, objetos y trampas en cada visita | — |
| 2026-11-02 | Gemini solo elige entre opciones válidas y narra; el código pone los números y los dados | Los cálculos y tiradas deben ser fiables sin depender de la IA | — |
| 2026-11-02 | Presupuesto de encuentros propio | Las tablas de presupuesto no están en el SRD | Usar tablas del manual |
| 2026-11-02 | Cámara para todos y WebXR solo donde exista | iPhone no ofrece WebXR | — |
| 2026-11-02 | Textos públicos sin mencionar D&D | Evita confundir la marca con un producto oficial | — |

## 6. Pendientes
- [x] Hacer commit y subir los cambios previos del 2026-11-02 (hecho: commits 1.1 y 1.2, `cccacef`).
- [ ] Hacer commit y subir el cambio de medidas a pies.
- [ ] Probar con una clave real de Gemini: Imagina, Repartir, Elegir, Sugerir y Modo DM.
- [ ] Probar WebXR en un Android real.
- [ ] Probar la cámara en un celular real.
- [ ] Imprimir una hoja en una impresora real.
- [ ] Hacer que Sugerir sin IA use el contexto; hoy es al azar.
- [ ] Valorar «Elegir por mí» en subraza, opción de clase y habilidades de raza o trasfondo; hoy no lo tienen.

## 7. Problemas conocidos y trampas
- **Pistas del intérprete:** se comparan sin acentos ni eñes, así que se escriben `montana` o `punos`. Con espacio final exigen la palabra exacta; sin él son prefijos, y por eso `cura` capturaba «curar».
- **Pruebas en Node:** `P.azar`, `P.MATRIZ` y `P.valoresPJ` viven en archivos que las pruebas no cargan (`dados3d.js`, `pasos.js`).
- **QR:** necesita una dirección pública; al abrir el archivo con doble clic es lo único que no funciona.
- **Gemini:** `generateContent` es una interfaz heredada; si deja de funcionar, solo hay que cambiar `js/ia.js`. Al simularlo hay que responder la consulta CORS `OPTIONS`, que dispara la cabecera de la clave.
- **QR y datos locales:** `concepto`, `metodo` y `tiradas` no viajan en el enlace; se quedan en el dispositivo.
- **Modo DM:** lo automático cubre solo ataques; las demás acciones se aplican a mano.
- **Datos del SRD:** Avatar de la muerte y Mosca gigante no se extrajeron del SRD, así que no aparecen.
- **Medidas en pies:** los textos del SRD ya no son literales en sus medidas (el README lo declara). Algunos volúmenes y el golpe de represalia del bastón usan la edición en inglés, escritos a mano en `herramientas/srd-generar.js`.
- **Ficha de raza:** muestra la velocidad base aunque la subraza la cambie (elfo 30 ft, elfo del bosque 35 ft). Ya ocurría antes.

## 8. Bitácora
<!-- Entradas nuevas ARRIBA. Aquí se conservan las últimas 8; las anteriores se archivan solas en .hilo/historial.md -->
### 2026-11-02 · sin versión · Claude Code
- Todas las medidas pasan a pies, a pedido del usuario: armas, rasgos y datos del SRD (conjuros, criaturas, objetos, trampas).
- La conversión se hace al generar en `herramientas/srd-generar.js` (`enPies`): m a ft, cm a pulgadas o ft, km a millas, km/h a mi/h, m² y m³ a ft² y ft³. Regenerados `js/srd-conjuros.js` y `js/srd-dm.js`.
- Se quitó `P.dm.velocidadEnPies` de `js/dm.js`; ya no hay mezcla de unidades en la hoja ni en el Modo DM.
- Pesos (kg) sin cambiar: no se pidieron. Sin commit.

### 2026-11-02 · sin versión · Claude Code
- La velocidad pasa de metros a pies: razas en 30/25/35 ft y penalización de armadura pesada de −10 ft (`js/datos.js`, `js/motor.js`). Equivalencia: 5 ft = 1,5 m, una casilla.
- Se muestra en pies en la hoja, el panel lateral, la ficha de raza y la guía de combate (`js/hoja.js`, `js/app.js`, `js/pasos.js`, `js/dm-vista.js`).
- Modo DM: las criaturas se convierten al mostrarlas con `P.dm.velocidadEnPies` (`js/dm.js`); `js/srd-dm.js` no cambia.
- Alcances de armas, visión en la oscuridad y textos oficiales del SRD siguen en metros. README actualizado.
- Verificado con 41 pruebas en Node (nueva prueba de velocidad en `pruebas/motor.prueba.js`). Sin commit.

### 2026-11-02 · sin versión · Claude Code
- Reparto y datos: «Repartir por mí» pone el número más alto en la característica clave; el equipo ofrece opciones (a)/(b) del SRD y todas las armas (`js/motor.js`, `js/datos.js`).
- Nuevas pantallas: Mis personajes con migración de `tpp.estado` (`js/guardados.js`), imagen propia en la hoja (`js/hoja.js`), hoja de conjuros con texto oficial de las páginas 101+ (`js/srd-conjuros.js`), «Nivel ____» y dados de golpe a mano, y colores de dados (`js/dados3d.js`).
- Realidad aumentada con cámara para todos y WebXR solo donde exista (`js/ra.js`). Nueva guía de combate.
- Modo DM: iniciativa con enemigos automáticos, encuentros, PNJ, objetos y trampas, con y sin Gemini; datos en `js/srd-dm.js` de carga diferida (`js/dm.js`, `js/dm-vista.js`, `js/srd-dm.js`). Gemini solo elige y narra; el código pone números y dados.
- Datos generados desde el SRD 5.1 en español (CC BY 4.0) con su atribución exacta, sin mencionar D&D en los textos públicos (`herramientas/`).
- Verificado con 40 pruebas en Node y 78 comprobaciones en Chrome. Sin commit.

### 2026-11-02 · sin versión · Claude Code
- Puntos: los tiros repetidos ya se pueden colocar todos, y «Repartir por mí» funciona en Lanzar dados y Comprar puntos (`js/motor.js`, `js/pasos.js`).
- Elegir por mí: nuevo `js/elegir.js` según clase, raza, trasfondo y lo escrito; con Gemini también en Sugerir, con validación y modo sin IA de respaldo (`js/ia.js`).
- Imagina: se corrige que «curar» asignara Clérigo; más vocabulario y varios caminos con clases, razas y trasfondos (`js/interprete.js`, `P.GUSTOS`).
- Habilidades con su característica en toda la app, como «Trato con Animales (SAB)» (`P.nombreHab`).
- Hoja en blanco y negro con botón de impresión y recuadros para anotar a lápiz (`js/hoja.js`, `js/exportar.js`, `css/estilos.css`).
- Verificado con 28 pruebas en Node y 26 comprobaciones en Chrome. Sin commit.

### 2026-11-02 · sin versión · hilo:init
- Se crea la memoria del proyecto (CONTEXTO.md, AGENTS.md, CLAUDE.md, .hilo/) a partir del estado actual del repositorio.
