# CONTEXTO — tuprimerpersonaje

> Memoria viva del proyecto para personas e IAs: qué es, cómo va, qué se decidió y qué sigue.
> Última actualización: 2026-11-02 00:44 · rama main · commit 866bcf7 · sin versión
> Cómo mantenerlo: AGENTS.md → «Al terminar un bloque de trabajo».

<!-- hilo:estado:inicio -->
## Estado actual
- **Qué es:** sitio estático en español para crear un primer personaje de D&D 5.ª edición sin saber nada del juego, con un guía paso a paso.
- **Fase:** TODO(hilo): confirmar (funciona de punta a punta en local; falta saber si ya está publicado)
- **Funciona hoy:** recorrido de 9 pasos, dados 3D, hoja en PDF y JPEG, impresión en blanco y negro, QR sin servidor, lenguaje natural sin IA y Gemini opcional. 28 pruebas en Node pasan.
- **En curso:** mejoras del 2026-11-02 terminadas pero sin commit: 12 archivos modificados más `js/elegir.js` y los archivos de hilo.
- **Siguiente paso:** probar con una clave real de Gemini, imprimir una hoja de prueba y hacer el commit.
- **Bloqueos / riesgos:** Gemini solo se ha probado con respuestas simuladas y la impresión solo generando el PDF desde Chrome.
<!-- hilo:estado:fin -->

## 1. Propósito y alcance
- **Problema / para quién:** personas que nunca jugaron D&D y quieren su primer personaje sin leer el manual.
- **Incluye:** reglas de 2014 con 9 razas, 12 clases y 13 trasfondos; práctica de dados; subir de nivel hasta 20; guía de consulta; panel de apariencia y accesibilidad; asistente en lenguaje natural con Gemini opcional y clave propia de cada persona.
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
- **Despliegue:** el README indica GitHub Pages desde `main`, carpeta raíz. Repositorio: `colmenaressan27/tuprimerpersonaje`. TODO(hilo): confirmar si ya está publicado.

## 3. Mapa del código
<!-- Solo lo que no es obvio: dónde vive cada pieza importante y cómo se conectan. -->
```text
index.html            estructura, paneles, diálogos y orden de carga de los scripts
css/estilos.css       tokens de diseño, temas, accesibilidad e impresión
js/
  datos.js            catálogo del juego, P.GUSTOS y P.FIRMA
  motor.js            reglas: de las decisiones del jugador a los números de la hoja
  interprete.js       lenguaje natural sin IA, recomendaciones y validación de cambios
  elegir.js           «Elegir por mí» sin IA y validación de lo que proponga Gemini
  ia.js               conexión opcional con Gemini
  dados3d.js          dados 3D y P.azar
  hoja.js             dibujo de la hoja en lienzo y sus temas
  exportar.js         PDF, JPEG y QR
  pasos.js            pantallas y textos del guía
  app.js              estado, navegación y eventos
pruebas/motor.prueba.js
vendor/               Bootstrap, Three.js, jsPDF y generador de QR
fonts/                Almendra, Atkinson, Cinzel y Figtree
```
- **Entrada:** `index.html` carga scripts con `defer` y sin módulos. El orden importa: `iconos → datos → motor → interprete → elegir → ia → dados3d → hoja → exportar → pasos → app`.
- **Namespace:** todo cuelga de `window.PJ`, que cada archivo recibe como `P`.
- **Flujo:** `app.js` guarda el estado en `E`; `P.calcular(pj)` deriva todos los números; `P.PASOS` pinta cada pantalla.
- **Sin DOM, probado en Node:** `datos.js`, `motor.js`, `interprete.js`, `elegir.js` e `ia.js`.
- **Persistencia:** `localStorage` con `tpp.estado`, `tpp.prefs`, `tpp.url` y `tpp.ia`. El QR lleva solo las decisiones, comprimidas en el enlace tras `#pj.`.

## 4. Convenciones
- **Idioma:** código, comentarios e interfaz en español; la interfaz tutea y usa frases cortas.
- **Estructura:** cada archivo es una función `(function (P) { … })(window.PJ)`, sin módulos ES.
- **Eventos:** los botones usan `data-accion` y se resuelven en el mapa `ACCIONES` de `app.js`.
- **Vistas:** plantillas de texto; todo dato variable pasa por `P.esc`.
- **IA:** «la IA entiende, el código decide». Sus propuestas pasan por `P.validarCambios` o `P.elegir.validar`, y si no sirven se usa el modo sin IA.
- **Datos:** lo nuevo sobre gustos se agrega en `P.GUSTOS`; las pruebas comprueban que cada referencia exista.
- **Commits:** TODO(hilo): confirmar formato (solo hay `Initial commit`).

## 5. Decisiones
| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2026-11-02 | Un gusto («me gusta curar») ofrece caminos, nunca decide la clase | La persona debe elegir, y cada gusto admite varias formas de jugar | Asociar cada gusto a una sola clase |
| 2026-11-02 | Cada tiro es un renglón del selector y elegir uno ya usado intercambia ambas características | Permite colocar todos los repetidos sin perder ninguno | Lista de valores únicos |
| 2026-11-02 | Repartir por mí prueba todas las permutaciones y puntúa cada una | Aprovecha bonos de raza, gustos y la Fuerza que pide la armadura | Copiar el orden fijo de `clase.reparto` |
| 2026-11-02 | Gemini elige entre opciones cerradas y se valida en `js/elegir.js` | Una respuesta inválida no debe romper las reglas | Aplicar su respuesta directamente |
| 2026-11-02 | La hoja de impresión es el tema `byn` del mismo lienzo, con página 3 solo si hay magia | Reutiliza el dibujo y da espacio de notas a quien usa conjuros | Una hoja aparte o apretar la sección de magia |

## 6. Pendientes
- [ ] Probar con una clave real de Gemini: Imagina, Repartir, Elegir y Sugerir.
- [ ] Imprimir una hoja en una impresora real.
- [ ] Hacer el commit de los cambios del 2026-11-02.
- [ ] Hacer que Sugerir sin IA use el contexto; hoy es al azar.
- [ ] Valorar «Elegir por mí» en subraza, opción de clase y habilidades de raza o trasfondo; hoy no lo tienen.

## 7. Problemas conocidos y trampas
- **Pistas del intérprete:** se comparan sin acentos ni eñes, así que se escriben `montana` o `punos`. Con espacio final exigen la palabra exacta; sin él son prefijos, y por eso `cura` capturaba «curar».
- **Pruebas en Node:** `P.azar`, `P.MATRIZ` y `P.valoresPJ` viven en archivos que las pruebas no cargan (`dados3d.js`, `pasos.js`).
- **QR:** necesita una dirección pública; al abrir el archivo con doble clic es lo único que no funciona.
- **Gemini:** `generateContent` es una interfaz heredada; si deja de funcionar, solo hay que cambiar `js/ia.js`. Al simularlo hay que responder la consulta CORS `OPTIONS`, que dispara la cabecera de la clave.
- **QR y datos locales:** `concepto`, `metodo` y `tiradas` no viajan en el enlace; se quedan en el dispositivo.

## 8. Bitácora
<!-- Entradas nuevas ARRIBA. Aquí se conservan las últimas 8; las anteriores se archivan solas en .hilo/historial.md -->
### 2026-11-02 · sin versión · Claude Code
- Puntos: los tiros repetidos ya se pueden colocar todos, y «Repartir por mí» funciona en Lanzar dados y Comprar puntos (`js/motor.js`, `js/pasos.js`).
- Elegir por mí: nuevo `js/elegir.js` según clase, raza, trasfondo y lo escrito; con Gemini también en Sugerir, con validación y modo sin IA de respaldo (`js/ia.js`).
- Imagina: se corrige que «curar» asignara Clérigo; más vocabulario y varios caminos con clases, razas y trasfondos (`js/interprete.js`, `P.GUSTOS`).
- Habilidades con su característica en toda la app, como «Trato con Animales (SAB)» (`P.nombreHab`).
- Hoja en blanco y negro con botón de impresión y recuadros para anotar a lápiz (`js/hoja.js`, `js/exportar.js`, `css/estilos.css`).
- Verificado con 28 pruebas en Node y 26 comprobaciones en Chrome. Sin commit.

### 2026-11-02 · sin versión · hilo:init
- Se crea la memoria del proyecto (CONTEXTO.md, AGENTS.md, CLAUDE.md, .hilo/) a partir del estado actual del repositorio.
