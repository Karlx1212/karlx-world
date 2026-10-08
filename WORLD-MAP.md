# Definición del escenario actual

`public/js/world-map.js` contiene datos, sin acceso al DOM ni al canvas:

- `dimensions`, `spawn` y `walkableBounds`: tamaño, llegada y límites originales.
- `objects`: edificios, árboles, bancos, faroles, cartel y maceteros, con tipo,
  posición, dimensiones o escala cuando corresponde, y profundidad explícita.
- `obstacles`: rectángulos derivados de edificios, bancos y troncos. Los troncos
  mantienen su colisión original independiente de la escala visual del árbol.
- `terrain`: textura determinista, polígonos de caminos, pavimento, plaza actual,
  emblema, flores y distribución de brillos.
- `ambient`: fondo y paradas del degradado original.

El orden de `objects` conserva los empates del ordenado por profundidad.
`game.js` conserva dibujo procedimental, animación ambiental, movimiento,
colisión del personaje, cámara, controles, outfits y todas las interfaces de
entrada. No cambia la escala ni se implementan tiles, interacciones o escenas.
El identificador y la separación de terreno/objetos/obstáculos permiten ampliar
la definición posteriormente sin introducir un motor nuevo.

## Comparación en Edge

```text
node tools/check-world-map.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE baseline REFERENCE_DIRECTORY
node tools/check-world-map.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE compare REFERENCE_DIRECTORY
```

Registrar `baseline` antes del cambio y ejecutar `compare` después, usando la
misma versión de Edge. La referencia se guarda fuera del repositorio. Compara
los PNG completos del canvas para los cuatro outfits en escritorio y móvil,
con movimiento reducido para eliminar diferencias temporales ambientales.
También compara colisiones en una cuadrícula de cinco unidades, valida llegada,
movimiento por dirección, diagonales, obstáculos, límites y control táctil.
Los hooks de prueba se inyectan en respuestas HTTP locales, nunca en producción.
Las regresiones `check-outfit-02/03/04`, `check-initial-loading`,
`check-entry-browser`, `check-outfit-card` y `check-outfit-portrait` complementan
la comparación con animaciones, persistencia, accesibilidad y flujo de entrada.
