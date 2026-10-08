# Identidad y animaciones de KARLX

`public/js/player-state.js` contiene el único estado de outfit. `playerState.activeOutfit`
devuelve `outfit-01` a `outfit-04`; `playerState.outfit` devuelve su ficha del catálogo.
Las flechas actualizan este estado y guardan la selección. La entrada al mundo no
crea una copia ni reinicia la identidad: `player.outfit` y `game.playerOutfit` consultan
el mismo estado durante toda la experiencia.

La persistencia mantiene `karlx-selected-outfit` con los valores existentes `01` a
`04`. Se restaura al cargar el módulo; si falta, es inválida o no está disponible,
se utiliza 01 y el selector sigue funcionando.

## Apariencia jugable pendiente

Reposo, derecha, arriba y otros outfits siguen usando `/assets/characters/karlx/idle-front.png`,
con las dimensiones actuales de 52 × 122. Hay una prueba reversible para Outfit 01
caminando hacia abajo: `front-walk-preview.js` carga una hoja de 896 × 256 con siete
celdas de 128 × 256, poses 1–6 y 8, a 100 ms por frame. No se usa la pose 7 recortada.
Los frames son copias exactas de la revisión externa, sin nuevos ajustes anatómicos.
El anclaje (64, 250) se coloca sobre la posición del jugador, sin oscilación adicional.
La escala común 122/224 conserva la altura de referencia de 122 unidades del mundo.
Las diferencias de proporciones y la discontinuidad por omitir la pose 7 permanecen
como limitaciones de esta prueba. Con movimiento reducido o fallo de carga se utiliza
el recurso temporal. `game.playerAppearance` informa el recurso realmente dibujado.
Los PNG del selector y las hojas antiguas no se utilizan en el canvas.

Outfit 01 también utiliza `left-walk.js` al caminar hacia la izquierda: cuatro
frames a 120 ms, hoja de 512 × 256, celdas de 128 × 256 y anclaje (64, 250).
Las cuatro poses originales miden 771–772 px de altura visible; se prepararon
con una única escala 224/772. Comparten el render y la escala 122/224 de la
caminata frontal. No se modifica movimiento, cámara, colisiones ni reposo.
Con movimiento reducido o fallo de carga se conserva el sprite temporal.

Cada entrada de `public/js/outfits.js` tiene `animation: null`, reservado para el
manifiesto validado de animaciones. Para completar la etapa visual hacen falta
cuatro hojas definitivas (pueden reemplazar, una vez preparadas, los archivos
`outfit-01-sprites.png` a `outfit-04-sprites.png`) o secuencias equivalentes:

- Reposo y caminata en las cuatro direcciones: frente, espalda, izquierda y derecha.
- Transparencia real, celdas y anclaje de pies consistentes, escala equivalente.
- Un manifiesto con dimensiones de celda, coordenadas de cada frame, dirección,
  secuencia, duración y anclaje. No deben deducirse recortes a ojo.

La integración posterior deberá interpretar esos manifiestos en el render del
personaje manteniendo su tamaño, posición y las colisiones actuales. Añadir las
hojas al catálogo por sí solo no activa animaciones.
