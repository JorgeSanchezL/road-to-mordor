# Road to Mordor

Aplicación para registrar tus pasos diarios y ver tu avance a lo largo del viaje de Frodo y Sam hacia el Monte del Destino.

## Cómo usarla

Abre `index.html` con doble clic en cualquier navegador. No necesita instalación ni conexión a internet salvo para cargar las tipografías.

Tu progreso se guarda en el propio navegador (`localStorage`), así que si vuelves a abrir el mismo archivo desde el mismo navegador y ordenador, seguirás donde lo dejaste. Si cambias de navegador o de equipo, el progreso no se traslada automáticamente.

## Estructura del proyecto

```
road-to-mordor/
├── index.html        estructura de la página
├── css/
│   └── style.css      todos los estilos
└── js/
    ├── data.js         hitos, personajes y frases del diario
    └── app.js           lógica de la aplicación
```

## Cómo modificarla

- **Añadir o cambiar hitos, distancias, compañía o escenas**: edita el array `MILESTONES` en `js/data.js`. Cada hito tiene `km` (distancia acumulada desde La Comarca), `region` (para el color de la escena), `icon`, `scene` (texto de la escena), `achievement` (texto del logro) y `company` (lista de personajes presentes en ese tramo).
- **Añadir personajes**: añade una entrada en el objeto `CHAR` de `js/data.js` con su emoji y nombre, y referencia su clave en el `company` de los hitos donde deba aparecer.
- **Cambiar las frases del diario**: edita las listas dentro de `DAILY_POOLS` en `js/data.js`.
- **Cambiar la longitud de zancada por defecto**: en `js/app.js`, dentro de `defaultState()`.
- **Cambiar el aspecto visual**: todo el diseño está en `css/style.css`, con variables de color al principio del archivo (`:root`).