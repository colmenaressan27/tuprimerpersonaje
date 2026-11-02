# Tu Primer Personaje

Sitio para crear un primer personaje compatible con la quinta edición sin saber nada del juego. Un guía acompaña cada paso, los dados se lanzan en 3D, también sobre la cámara, y la hoja se descarga en PDF o JPEG, se imprime en blanco y negro o se lleva al celular con un QR. El Modo DM ayuda a dirigir la partida.

Es un sitio estático: HTML, CSS y JavaScript con Bootstrap 5. No tiene servidor ni base de datos.

## Cómo abrirlo

Haz doble clic en `index.html`. Todo funciona menos el QR y la cámara, que necesitan una dirección de internet con https.

## Cómo publicarlo gratis en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta.
2. Entra a **Settings → Pages**.
3. En **Source** elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
4. Guarda. En uno o dos minutos tendrás una dirección como `https://tu-usuario.github.io/tu-primer-personaje/`.

Cuando el sitio está publicado, el QR funciona solo. Ya no hace falta escribir la dirección.

## Cómo funciona el QR

El personaje viaja dentro del enlace, comprimido, después de `#pj.`. Por eso no hace falta servidor y el sitio no guarda datos de nadie. Al escanearlo, el celular abre la hoja, puede descargarla en PDF o JPEG y guardarla en ese dispositivo.

## Varios personajes

El panel **Personajes** guarda todos los que crees en ese dispositivo. Desde ahí se crean, se abren y se eliminan. Cada cambio se guarda solo. Quien ya tenía un personaje de una versión anterior lo conserva.

El navegador da unos 5 MB por sitio. Las imágenes son lo que más ocupa, así que se reducen al subirlas y la app avisa si ya no cabe nada.

## Cómo imprimir la hoja

En la hoja final, **Imprimir en blanco y negro** abre el diálogo de impresión del navegador. También se puede elegir el estilo **Blanco y negro** y descargar el PDF o el JPEG.

Ese estilo usa tinta negra sobre papel blanco, sin fondos, y deja espacio para anotar a lápiz la vida actual, el oro y la experiencia. Quien tiene magia recibe una tercera página para notas, porque sus conjuros ocupan ese lugar en la página 2. La **Hoja en blanco** también sale en este estilo.

El nivel y la cantidad de dados de golpe quedan siempre como una línea para rellenar a mano. Quien tiene conjuros recibe además una **hoja de conjuros** con el texto oficial completo del SRD, en el mismo formato del libro.

## Dados: colores y realidad aumentada

En el panel **Dados** se eligen los colores: ocho combinaciones listas o cuerpo, bordes y números a tu gusto.

**Lanzar sobre la cámara** hace que los dados caigan sobre la imagen de la cámara en todas las tiradas de la app. Funciona en iPhone y Android con el sitio publicado. La imagen no sale del dispositivo.

**Dejarlos fijos sobre mi mesa** solo aparece donde el navegador tiene WebXR para realidad aumentada, hoy Android con Chrome. Safari en iPhone no lo ofrece. Este modo vive en `js/ra.js`.

## Modo DM

Está en la barra superior y funciona con y sin IA.

- **Iniciativa:** añade criaturas del SRD, personajes guardados o jugadores a mano. Lleva el orden, la vida, los estados y las rondas. Los dados pueden ser automáticos, en 3D o escritos a mano, y los enemigos pueden jugar solos.
- **Encuentros:** propone criaturas según el nivel, los jugadores, la dificultad y el lugar.
- **PNJ:** apariencia, personalidad, voz, deseos y secretos.
- **Objetos mágicos:** uno al azar con su texto oficial y una historia.
- **Trampas:** una al azar según las tablas de gravedad del SRD, más las ocho trampas oficiales con sus datos.

Lo automático cubre los ataques de cada criatura, con su reparto de ataque múltiple y su daño adicional. Las demás acciones, como alientos o conjuros, se leen en la ficha y las aplica el DM.

Con Gemini, la app le da opciones ya válidas: elige una, narra y adapta el texto a tu campaña. Los números y los dados siempre los pone el código.

El presupuesto de los encuentros es una regla propia, porque esas tablas no están en el SRD: un grupo de cuatro aguanta un combate medio contra una criatura de desafío igual a su nivel.

## IA opcional con Gemini

Está en el panel **Pedir cambios**, en el desplegable **Usar IA con Gemini (opcional)**. Cada persona usa su propia clave de [Google AI Studio](https://aistudio.google.com/apikey).

- La clave y lo que se escribe van directo del navegador a Google.
- La clave solo se guarda en el dispositivo si la persona marca **Recordar**.
- **Probar conexión** comprueba la clave y lista los modelos Flash disponibles.
- Gemini solo propone cambios. El código los valida contra el catálogo del juego, así que no puede inventar razas ni clases.
- **Repartir por mí**, **Elegir por mí** y **Sugerir** también le piden la mejor opción según la clase, la raza, el trasfondo y lo que la persona contó. Si propone algo que no cumple las reglas, se descarta.
- El Modo DM también puede usarla. Ver esa sección.
- Si Gemini falla, se usa el modo sin IA y se avisa.

Sin clave, `js/interprete.js` entiende frases como «una elfa sigilosa con arco» o «cambia mi clase a paladín». Muestra lo que entendió y la persona decide qué aplicar, igual que la sección Cambios de SlotNova. Si solo cuenta lo que le gusta, como «me gusta curar», no elige por ella: ofrece varios caminos con clases, razas y trasfondos. Esos caminos están en `P.GUSTOS`, en `js/datos.js`.

También sin clave, `js/elegir.js` resuelve **Repartir por mí** y **Elegir por mí**: el número más alto va siempre a la característica principal de la clase y el segundo a la siguiente, y el resto aprovecha los bonos de raza. Además evita repetir lo que ya da el trasfondo, elige el equipo que mejor combina defensa y daño, y prefiere lo que encaja con lo que la persona escribió.

El modelo por defecto está en `P.MODELOS_GEMINI`, en `js/ia.js`. La conexión usa `generateContent`, que Google marca como interfaz heredada. Si deja de funcionar, ese archivo es el único que hay que cambiar.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página, paneles y diálogos |
| `css/estilos.css` | Tokens de diseño, temas, movimiento y accesibilidad |
| `js/datos.js` | Razas, clases, equipo, conjuros, trasfondos y tablas |
| `js/motor.js` | Reglas: de las decisiones a los números de la hoja |
| `js/guardados.js` | Personajes guardados en el dispositivo |
| `js/interprete.js` | Lenguaje natural sin IA, recomendaciones y validación de cambios |
| `js/elegir.js` | «Elegir por mí» sin IA y validación de lo que proponga Gemini |
| `js/ia.js` | Conexión opcional con Gemini |
| `js/dados3d.js` | Dados 3D con Three.js |
| `js/ra.js` | Realidad aumentada: cámara y WebXR |
| `js/hoja.js` | Dibujo de la hoja de personaje y de la hoja de conjuros |
| `js/exportar.js` | PDF, JPEG y QR |
| `js/pasos.js` | Pantallas y textos del guía |
| `js/dm.js` | Modo DM: generadores y reglas del combate |
| `js/dm-vista.js` | Modo DM: pantallas y eventos |
| `js/app.js` | Navegación, estado y eventos |
| `js/srd-conjuros.js`, `js/srd-dm.js` | Datos del SRD. Son archivos generados: no se editan a mano |
| `herramientas/` | Generador de esos datos a partir del PDF oficial |
| `vendor/` | Bootstrap, Three.js, jsPDF y generador de QR |
| `pruebas/motor.prueba.js` | Pruebas del motor, el intérprete, «Elegir por mí», los datos del SRD, el guardado y el Modo DM |

## Pruebas

```bash
node pruebas/motor.prueba.js
```

## Licencias y créditos

Proyecto no oficial, compatible con quinta edición.

- **Reglas:** Esta obra incluye materiales extraídos del Documento de referencia del sistema 5.1 (“SRD 5.1”) de Wizards of the Coast LLC, que está disponible en <https://dnd.wizards.com/es/resources/systems-reference-document>. SRD 5.1 tiene la licencia Creative Commons Atribución/Reconocimiento 4.0 Licencia Pública Internacional, que está disponible en <https://creativecommons.org/licenses/by/4.0/legalcode.es>.
- **Textos:** las explicaciones están escritas con palabras propias. Los conjuros de la hoja de conjuros, las criaturas, los objetos mágicos, las trampas y los estados son el texto oficial del SRD, con las medidas convertidas de metros a pies, pulgadas y millas. Algunas opciones, como ciertas subrazas y trasfondos, no están en el SRD y se explican con palabras propias.
- **Iconos:** Lorc, Delapouite y colaboradores en [game-icons.net](https://game-icons.net), con licencia [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Se les cambió el color y el tamaño.
- **Fuentes:** Almendra, Cinzel, Figtree y Atkinson Hyperlegible, con licencia SIL Open Font License.
- **Librerías:** Bootstrap, Three.js y qrcode-generator (MIT); jsPDF (MIT).
