# Tu Primer Personaje

Sitio para crear un primer personaje de D&D 5.ª edición sin saber nada del juego. Un guía acompaña cada paso, los dados se lanzan en 3D y la hoja se descarga en PDF o JPEG, o se lleva al celular con un QR.

Es un sitio estático: HTML, CSS y JavaScript con Bootstrap 5. No tiene servidor ni base de datos.

## Cómo abrirlo

Haz doble clic en `index.html`. Todo funciona menos el QR, que necesita una dirección de internet.

## Cómo publicarlo gratis en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta.
2. Entra a **Settings → Pages**.
3. En **Source** elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
4. Guarda. En uno o dos minutos tendrás una dirección como `https://tu-usuario.github.io/tu-primer-personaje/`.

Cuando el sitio está publicado, el QR funciona solo. Ya no hace falta escribir la dirección.

## Cómo funciona el QR

El personaje viaja dentro del enlace, comprimido, después de `#pj.`. Por eso no hace falta servidor y el sitio no guarda datos de nadie. Al escanearlo, el celular abre la hoja, puede descargarla en PDF o JPEG y guardarla en ese dispositivo.

## IA opcional con Gemini

Está en el panel **Pedir cambios**, en el desplegable **Usar IA con Gemini (opcional)**. Cada persona usa su propia clave de [Google AI Studio](https://aistudio.google.com/apikey).

- La clave y lo que se escribe van directo del navegador a Google.
- La clave solo se guarda en el dispositivo si la persona marca **Recordar**.
- **Probar conexión** comprueba la clave y lista los modelos Flash disponibles.
- Gemini solo propone cambios. El código los valida contra el catálogo del juego, así que no puede inventar razas ni clases.
- Si Gemini falla, el texto se revisa con el intérprete local.

Sin clave, `js/interprete.js` entiende frases como «una elfa sigilosa con arco» o «cambia mi clase a paladín». Muestra lo que entendió y la persona decide qué aplicar, igual que la sección Cambios de SlotNova.

El modelo por defecto está en `P.MODELOS_GEMINI`, en `js/ia.js`. La conexión usa `generateContent`, que Google marca como interfaz heredada. Si deja de funcionar, ese archivo es el único que hay que cambiar.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página, paneles y diálogos |
| `css/estilos.css` | Tokens de diseño, temas, movimiento y accesibilidad |
| `js/datos.js` | Razas, clases, conjuros, trasfondos y tablas |
| `js/motor.js` | Reglas: de las decisiones a los números de la hoja |
| `js/interprete.js` | Lenguaje natural sin IA y validación de cambios |
| `js/ia.js` | Conexión opcional con Gemini |
| `js/dados3d.js` | Dados 3D con Three.js |
| `js/hoja.js` | Dibujo de la hoja de personaje |
| `js/exportar.js` | PDF, JPEG y QR |
| `js/pasos.js` | Pantallas y textos del guía |
| `js/app.js` | Navegación, estado y eventos |
| `vendor/` | Bootstrap, Three.js, jsPDF y generador de QR |
| `pruebas/motor.prueba.js` | Pruebas del motor y del intérprete |

## Pruebas

```bash
node pruebas/motor.prueba.js
```

## Licencias y créditos

- **Reglas:** explicadas con palabras propias. Incluye material del System Reference Document 5.1 («SRD 5.1») de Wizards of the Coast LLC, disponible en <https://dnd.wizards.com/resources/systems-reference-document>, con licencia [Creative Commons Atribución 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). Algunas opciones, como ciertas subrazas y trasfondos, vienen del Manual del Jugador y no del SRD.
- **Marcas:** Dungeons & Dragons y D&D son marcas de Wizards of the Coast. Este proyecto no es oficial ni está respaldado por esa empresa.
- **Iconos:** Lorc, Delapouite y colaboradores en [game-icons.net](https://game-icons.net), con licencia [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Se les cambió el color y el tamaño.
- **Fuentes:** Almendra, Cinzel, Figtree y Atkinson Hyperlegible, con licencia SIL Open Font License.
- **Librerías:** Bootstrap, Three.js y qrcode-generator (MIT); jsPDF (MIT).
