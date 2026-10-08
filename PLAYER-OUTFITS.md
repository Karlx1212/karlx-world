# Identidad y animaciones de KARLX

## Outfit 03 — integración funcional

`outfit-03-animation.js` sigue el patrón independiente de Outfit 02: cuatro
hojas de 512 × 256 con cuatro celdas de 128 × 256, a 120 ms por frame,
anclaje (64, 250), y activación exclusiva para `outfit-03` desde el estado
compartido del jugador. El frame 1 de cada dirección sirve de reposo provisional
y de pose fija durante el movimiento reducido. La orientación no se reinicia.
`game.ready` valida y espera la carga de las cuatro hojas.

La fuente es `Spritesheet de caminata gótica en 16 poses.png`, 1254 × 1254 RGBA,
con 961365 píxeles totalmente transparentes. Las 16 figuras están completas.
Los residuos de color son prácticamente invisibles al componer sobre fondo opaco;
no se aplica un borrado global por tonalidad. Las filas se tocan en varios puntos.
`tools/prepare-outfit-03.py` traza separaciones locales en bandas acotadas entre
filas mediante transparencia y el borde de inicio del cabello bajo las botas,
sin cambiar colores dentro del avatar. Elimina únicamente fragmentos pequeños
desconectados fuera de los límites verticales de la figura principal.

Una escala común de preparación 118/237 deja márgenes laterales y conserva las
proporciones de los originales. El render 122/(324 × 118/237) mantiene la altura
de referencia de 122 unidades, con pequeñas variaciones originales entre poses.
Se conserva un margen de dos píxeles de origen para los bordes suavizados.
No se añade oscilación al render ni se generan nuevas poses.

**Las caminatas laterales son provisionales**, aceptadas para esta etapa:
las piernas no completan una alternancia y pueden dar sensación de deslizamiento.
Una futura actualización visual debe mejorar las poses sin cambiar el avatar.
Los recursos y módulos de animación de Outfits 01 y 02 permanecen intactos.
El selector, persistencia, movimiento, velocidad, controles, cámara, colisiones,
mapa y pantallas de entrada no se modifican.

Validación: `node --experimental-vm-modules tools/check-outfit-03.cjs` y
`node --experimental-vm-modules tools/check-outfit-02.cjs`. Los harness ejecutan
los módulos reales con DOM/canvas simulados y dimensiones reales de los PNG:
caminata/reposo en cuatro direcciones, ciclo de 120 ms, anclaje/escala del render,
movimiento reducido, selección persistente y regresiones de Outfits 01 y 02.
La inspección de las hojas derivadas complementa esas pruebas; no equivalen
a una prueba manual completa del playground en navegador.

## Outfit 02 — primera versión funcional

`outfit-02-animation.js` carga cuatro hojas de 512 × 256, con cuatro frames
de 128 × 256 por dirección a 120 ms. Solo se activa para `outfit-02`.
El frame 1 de cada dirección se utiliza como reposo provisional y también
durante el desplazamiento con `prefers-reduced-motion`. La dirección se conserva
al detenerse. Las hojas se validan y cargan antes de completar `game.ready`.

Los 16 frames proceden de `Hoja de sprites de chica caminando.png` (1254 × 1254,
RGBA). `tools/prepare-outfit-02.py` reproduce la extracción sin generar poses:
separa las siluetas que cruzan las divisiones nominales mediante límites trazados,
incluidos los contactos entre zapatillas y cabello de la fila siguiente. Descarta
alfa 1–9 casi invisible y fragmentos desconectados de menos de 128 píxeles por
encima o debajo de la silueta principal, sin filtrar colores. El original no se modifica.
Una escala de preparación común 118/227 conserva las zancadas completas dentro
de la celda. El render usa 122/(310 × 118/227), equivalente a una altura máxima
de referencia de 122 unidades, y el anclaje fijo (64, 250). No se añade rebote.
Las pequeñas diferencias de altura de las poses originales se conservan.

**Las caminatas izquierda y derecha son provisionales:** no presentan una
alternancia completa de piernas y pueden parecer deslizantes. Se aceptan para
esta etapa funcional; una actualización visual deberá reemplazar las poses
laterales por pasos intermedios y zancadas contrarias, manteniendo la identidad.
No se modifican las hojas ni animaciones de Outfit 01, movimiento, controles,
velocidad, cámara, colisiones, mapa ni selector/persistencia.

Comprobación técnica: `node --experimental-vm-modules tools/check-outfit-02.cjs`.
El harness ejecuta los módulos reales con un canvas simulado y lee las dimensiones
de los PNG; verifica las cuatro direcciones, reposo, secuencia, movimiento reducido,
Outfit 01, cambio de outfit y restauración de la selección. No sustituye una
evaluación visual manual del playground en un navegador.

`public/js/player-state.js` contiene el único estado de outfit. `playerState.activeOutfit`
devuelve `outfit-01` a `outfit-04`; `playerState.outfit` devuelve su ficha del catálogo.
Las flechas actualizan este estado y guardan la selección. La entrada al mundo no
crea una copia ni reinicia la identidad: `player.outfit` y `game.playerOutfit` consultan
el mismo estado durante toda la experiencia.

La persistencia mantiene `karlx-selected-outfit` con los valores existentes `01` a
`04`. Se restaura al cargar el módulo; si falta, es inválida o no está disponible,
se utiliza 01 y el selector sigue funcionando.

## Apariencia jugable pendiente

Los otros outfits siguen usando `/assets/characters/karlx/idle-front.png`,
con las dimensiones actuales de 52 × 122. Hay una prueba reversible para Outfit 01
caminando hacia abajo: `front-walk-preview.js` carga una hoja de 896 × 256 con siete
celdas de 128 × 256, poses 1–6 y 8, a 100 ms por frame. No se usa la pose 7 recortada.
Los frames son copias exactas de la revisión externa, sin nuevos ajustes anatómicos.
El anclaje (64, 250) se coloca sobre la posición del jugador, sin oscilación adicional.
La escala común 122/224 conserva la altura de referencia de 122 unidades del mundo.
Las diferencias de proporciones y la discontinuidad por omitir la pose 7 permanecen
como limitaciones de esta prueba. Con movimiento reducido se utiliza el reposo
direccional de Outfit 01. `game.playerAppearance` informa el recurso realmente dibujado.
Los PNG del selector y las hojas antiguas no se utilizan en el canvas.

Outfit 01 también utiliza `left-walk.js` al caminar hacia la izquierda: cuatro
frames a 120 ms, hoja de 512 × 256, celdas de 128 × 256 y anclaje (64, 250).
Las cuatro poses originales miden 771–772 px de altura visible; se prepararon
con una única escala 224/772. Comparten el render y la escala 122/224 de la
caminata frontal. No se modifica movimiento, cámara, colisiones ni reposo.
Con movimiento reducido se conserva la pose direccional fija de Outfit 01.

La caminata derecha utiliza `right-walk.js`: cuatro frames a 120 ms en una hoja
de 512 × 256. Se limpiaron exclusivamente 48 píxeles de alfa 1–9 en la última
columna del recurso derivado; el original permanece intacto. Las figuras se
separaron siguiendo sus siluetas, sin cortar las botas en divisiones verticales.
Las alturas originales son 758, 764, 761 y 762 px. La escala de preparación común
204/764 permite conservar las zancadas anchas en celdas de 128 × 256. En canvas,
122/204 mantiene la altura de referencia de 122 unidades y el anclaje (64, 250).

La caminata de espaldas utiliza `back-walk.js` únicamente para Outfit 01 en
dirección `up`: cuatro frames a 120 ms, hoja de 512 × 256 y celdas de 128 × 256.
Las cuatro figuras originales están completas, con alturas 796, 797, 797 y 795 px.
Una única escala 224/797 y el render 122/224 mantienen la altura de referencia,
el centrado y el anclaje (64, 250). Las otras tres animaciones no se modifican.

## Reposo direccional de Outfit 01

`outfit-01-idle.js` reutiliza sin modificar las hojas existentes: frame frontal 1,
izquierdo 2, derecho 2 y de espaldas 2 (numeración desde 1). Son poses provisionales
de caminata inmóviles, no ilustraciones nuevas de reposo. Cada pose conserva exactamente
las dimensiones, la escala y el anclaje de su dirección. `player.facing` no se reinicia
al detenerse. Con movimiento reducido se utiliza la pose fija correspondiente también
durante el desplazamiento. Las hojas de reposo deben estar cargadas antes de completar
la entrada; Outfit 01 nunca se dibuja con `idle-front.png`. Los otros outfits conservan
su comportamiento anterior. `game.playerAppearance.pose` distingue reposo y caminata.

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
