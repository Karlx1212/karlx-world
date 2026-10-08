# Plaza Central — geometría jugable provisional

`public/js/world-map.js` define la escena `central-plaza`, sin acceso al DOM ni
al canvas. `game.js` conserva el motor de movimiento, colisiones rectangulares,
cámara, controles, outfits y las interfaces de entrada existentes.

## Distribución

- Mundo: 1400 × 960. Límites transitables: X 42–1358, Y 330–915, sin cambios.
- Llegada: (700, 640), al sur de la fuente, sobre suelo transitable.
- Plaza: X 400–1000, Y 350–800 (600 × 450).
- Fuente: elipse centrada en (700, 520), 240 × 120; interior 190 × 84.
- Colisión única: X 580–820, Y 460–580. Cubre agua y borde; las esquinas del
  rectángulo conservador también bloquean aunque queden fuera de la elipse.
- Norte: X 640–760, Y 330–460.
- Sur: X 640–760, Y 580–915.
- Oeste: X 42–580, Y 500–620.
- Este: X 820–1358, Y 500–620.
- Paseo continuo: elipse de 380 × 260 centrada en la fuente, conectada a los
  cuatro caminos. El resto de la plaza también es transitable.

Se retiraron de la escena los tres edificios, ocho árboles, dos bancos, cuatro
faroles, el cartel, cinco maceteros, flores, emblema, caminos y brillos antiguos.
Sus obstáculos también fueron retirados. Los dibujantes anteriores siguen
disponibles en el motor; no hay estructuras nuevas ni conexiones de escena.

## Capas y alcance

El terreno se dibuja primero: fondo, textura estática, plaza, caminos y paseo.
La fuente utiliza `objects` con `layer: 'ground'`: base y agua planas se dibujan
antes del avatar, sin taparlo cuando circula por los costados. Los objetos sin
esa capa siguen usando el ordenado original por `depth`; una futura pieza
elevada puede utilizarlo sin cambiar las animaciones o el anclaje del jugador.

Los colores son provisionales. No hay agua animada, partículas, reflejos nuevos,
misiones, interacciones, tilesheets ni sprites nuevos. El degradado ambiental
original permanece. Movimiento reducido conserva poses fijas de los outfits.

Pendiente de acabado: arte pixel RPG/Y2K, borde cromado, volumen de la fuente,
jardines y vegetación. También queda evaluar el contorno rectangular conservador
contra el contorno artístico final. El encuadre móvil mantiene la cámara actual:
puede mostrar fondo fuera del mundo cuando la altura visible supera 960 unidades.

## Validación

```text
node tools/check-world-map.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE SCREENSHOT_DIRECTORY
node --experimental-vm-modules tools/check-outfit-02.cjs
node --experimental-vm-modules tools/check-outfit-03.cjs
node --experimental-vm-modules tools/check-outfit-04.cjs
node --experimental-vm-modules tools/check-initial-loading.cjs
```

La prueba de mapa abre Edge en escritorio 1280 × 800 y móvil 390 × 844, con y
sin movimiento reducido. Comprueba el flujo completo, aparición, los cuatro
outfits/direcciones, vuelta completa a la fuente, acceso a los cuatro extremos,
colisión desde cada lado, deslizamiento, diagonales, límites, fórmula de cámara
y ausencia de obstáculos antiguos mediante un muestreo del área transitable.
El control móvil usa eventos táctiles reales enviados por CDP, incluyendo
captura de puntero, movimiento y liberación. Los hooks se inyectan únicamente
en respuestas HTTP locales, no en producción. Captura los cuatro outfits en
cada tamaño/preferencia, fuera del repositorio.

Las pruebas de entrada, tarjeta y retrato (`check-entry-browser`,
`check-outfit-card`, `check-outfit-portrait`) completan las regresiones.
La comparación pixel a pixel contra el escenario de la etapa 1 ya no aplica:
la geometría cambia intencionalmente. Sus referencias anteriores siguen fuera
del repositorio para revisión histórica.
