# El Camino a Mordor

Aplicación para registrar tus pasos diarios y ver tu avance a lo largo del viaje de Frodo y Sam hacia el Monte del Destino.

## Cómo usarla

Abre `index.html` con doble clic en cualquier navegador. No necesita instalación ni conexión a internet salvo para cargar las tipografías.

Tu progreso se guarda en el propio navegador (`localStorage`), así que si vuelves a abrir el mismo archivo desde el mismo navegador y ordenador, seguirás donde lo dejaste. Si cambias de navegador o de equipo, el progreso no se traslada automáticamente.

## Usarla en el móvil como aplicación

Para instalarla en la pantalla de inicio necesitas abrirla desde una URL (no desde un archivo local del teléfono), porque así funcionan las reglas de instalación de iOS y Android:

1. Sube la carpeta `camino-a-mordor` a un hosting estático.
2. Abre esa URL en el navegador del móvil (Safari en iPhone, Chrome en Android).
3. En iPhone: pulsa el icono de compartir → "Añadir a pantalla de inicio". En Android: menú ⋮ → "Añadir a pantalla de inicio" o "Instalar aplicación".
4. Se creará un icono en tu pantalla de inicio que abre la app a pantalla completa, sin barra del navegador, como una app normal.

El proyecto ya incluye `manifest.json`, iconos y un `service-worker.js` para que esto funcione y la app se pueda abrir incluso sin conexión una vez instalada.

### Importante: cómo actualizar la app ya instalada

El proyecto usa [semver](https://semver.org/lang/es/) (`MAYOR.MENOR.PARCHE`), empezando en `1.0.0`. El número vive en `js/version.js` y se muestra en el pie de la app.

El service worker sirve los archivos desde su caché, y el navegador solo descarga la nueva versión cuando el propio `service-worker.js` cambia de contenido. Por eso, **cada vez que subas cambios reales, tienes que actualizar el número en dos sitios a la vez**:

1. `js/version.js` → cambia `APP_VERSION`.
2. `service-worker.js` → cambia `CACHE_NAME` para que coincida (por ejemplo, de `camino-a-mordor-v1.0.0` a `camino-a-mordor-v1.1.0`).

Opcionalmente, actualiza también `version` en `package.json` para que quede registrado como referencia del proyecto (no afecta al funcionamiento).

Tu progreso (pasos, logros) no se ve afectado por nada de esto: se guarda en el navegador con `localStorage`, independientemente de los archivos de la app.

## Estructura del proyecto

```
road-to-mordor/
├── index.html          estructura de la página
├── manifest.json        configuración para instalarla como app
├── service-worker.js     permite abrirla sin conexión
├── package.json          nombre y versión del proyecto
├── icons/                iconos de la app
├── css/
│   └── style.css        todos los estilos
└── js/
    ├── version.js         número de versión (semver)
    ├── data.js           hitos, personajes y frases del diario
    └── app.js             lógica de la aplicación
```

## Cómo modificarla

- **Añadir o cambiar hitos, distancias, compañía o escenas**: edita el array `MILESTONES` en `js/data.js`. Cada hito tiene `km` (distancia acumulada desde La Comarca), `region` (para el color de la escena), `icon`, `scene` (texto de la escena), `achievement` (texto del logro) y `company` (lista de personajes presentes en ese tramo).
- **Añadir personajes**: añade una entrada en el objeto `CHAR` de `js/data.js` con su emoji y nombre, y referencia su clave en el `company` de los hitos donde deba aparecer.
- **Cambiar las frases del diario**: edita las listas dentro de `DAILY_POOLS` en `js/data.js`.
- **Cambiar la longitud de zancada por defecto**: en `js/app.js`, dentro de `defaultState()`.
- **Cambiar el aspecto visual**: todo el diseño está en `css/style.css`, con variables de color al principio del archivo (`:root`).

No hace falta tocar `js/app.js` salvo que quieras cambiar el comportamiento de la aplicación (cómo se calculan los kilómetros, los logros, la racha, etc.).
