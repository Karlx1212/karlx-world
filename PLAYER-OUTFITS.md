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

Los cuatro outfits siguen dibujándose con `/assets/characters/karlx/idle-front.png`,
con las dimensiones actuales de 52 × 122. `game.playerAppearance` informa la
identidad, el recurso realmente utilizado y `usesFallback: true`. No existe todavía
un cambio visual de vestuario en el mundo. Los PNG del selector no se utilizan en
el canvas y las hojas antiguas no se cargan.

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
