# Plaza Central — geometría jugable y Fuente Mágica

`public/js/world-map.js` define la escena `central-plaza`, sin acceso al DOM ni
al canvas. `game.js` conserva el motor de movimiento, colisiones rectangulares,
cámara, controles, outfits y las interfaces de entrada existentes.

## Distribución

- Mundo: 1400 × 960. Límites transitables: X 42–1358, Y 330–915, sin cambios.
- Llegada: (700, 640), al sur de la fuente, sobre suelo transitable.
- Plaza: X 400–1000, Y 350–800 (600 × 450).
- Fuente Mágica: centro lógico (700, 520), escala uniforme 0.58. Lienzo del
  recurso 576 × 400: ocupa 334.08 × 232 unidades; la plataforma tiene una
  huella proyectada de 274 × 168, aproximadamente 2.25 veces el alto del avatar
  en ancho. Los manifiestos de los outfits conservan sus escalas.
- El centro del suelo corresponde al píxel (288,244); el anclaje frontal del
  recurso (288,388) queda en (700,603.52). No se deforma la imagen a 240 × 120.
- Colisión: doce bandas rectangulares conservadoras aproximan la plataforma
  elíptica RX=137, RY=84, dentro de X 563–837 / Y 436–604. Impiden caminar
  sobre agua, escalones y pedestales, sin bloquear las cuatro salidas. Se
  conserva el motor original con huella de pies 22 × 10 y deslizamiento.
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
La fuente utiliza `objects` con `layer: 'layered'`. La base se dibuja primero,
antes del avatar. Diez piezas elevadas (jardín posterior, dos pedestales
posteriores, dos jardines laterales, estructura central, dos pedestales
frontales y dos maceteros frontales) entran en el ordenado original por Y
con profundidad propia según el pie proyectado de cada pieza. No se ordena
toda la fuente por el borde inferior de la imagen. Los recortes son exclusivos:
cada píxel aparece en una sola pieza, sin dobles alfas ni partes reconstruidas.

El terreno y los caminos siguen siendo provisionales. La fuente usa únicamente
los recursos aprobados de `fuente-magica-CAPAS-PARA-APROBACION.zip`, con la misma
arquitectura estática en todos los frames y agua en máscaras autorizadas.
`magical-fountain.js` selecciona uno de 32 frames a 60 ms a partir del timestamp
del render existente: ciclo 1920 ms, sin intervalos ni temporizadores nuevos.
Movimiento reducido fija el agua en el frame 0. El degradado ambiental permanece.
`game.ready` espera la fuente; un fallo de carga usa el error del flujo existente.
No hay interacciones, misiones ni decoración adicional.

Pendiente de acabado: jardines y caminos, después de aprobación visual.
Los recursos están en `public/assets/world/magical-fountain/`: once PNG fijos
y cinco atlas de agua, aproximadamente 1.3 MB comprimidos y 30.4 MB de píxeles
decodificados. Los atlas usan cuatro columnas y ocho filas, todos menores de
4096 px por lado. No se carga el GIF, WebP, máscaras ni composiciones de revisión.
`fountain-assets.js` guarda recortes, profundidades y timing; se genera desde
el ZIP con `tools/prepare-magical-fountain.py`, sin remuestreo ni repintado.

## Encuadre responsive

La cámara mantiene el seguimiento horizontal centrado, los pies al 66 % del
alto visible cuando los límites lo permiten, y el clamp original al mundo.
La escala de escritorio parte de `min(ancho/1160, alto/790)` y se eleva solo
si el viewport excede el mundo: `max(escalaBase, ancho/1400, alto/960)`.
Esto permite que el clamp centre la fuente en X=700 al llegar, sin dibujar
espacio fuera del mapa. La posición del jugador sigue siendo (700, 640).
Antes, en un viewport 1920 × 900, el canvas 1880 × 795 mostraba 1868 unidades
horizontales; cámara X=0 y fuente desplazada 236 px. No era una transición:
la cámara antes del cierre del teléfono y los primeros frames coincidían.

En pantallas de hasta 600 px, o con puntero principal táctil hasta 1000 px, el
zoom se aplica uniformemente al mundo completo, sin cambiar ningún manifiesto
de outfit. En vertical se usa `max(1.2, ancho/480, alto/640)`; en horizontal se
usa `min(max(ancho/900, alto/500), alto/320)` para dejar espacio sobre el avatar.
La escala móvil nunca es inferior a `max(ancho/1400, alto/960)`, de modo que el
viewport visible cabe en el mundo y el clamp no expone bandas externas.

Referencia Edge 390 × 844: canvas 376 × 765, escala anterior 0.324 y altura
visible de 2360 unidades; la nueva escala 1.2 muestra 637.5 unidades de alto.
El avatar de referencia pasa de 40 a 146 px y la fuente de 78 a 288 px de ancho.
La plaza se explora mediante seguimiento de cámara; no se intenta mostrarla
completa simultáneamente en el ancho del teléfono. El HUD, los controles y
el flujo de entrada se conservan. ResizeObserver vuelve a calcular el encuadre
al rotar o redimensionar, sin cambiar la posición del jugador.

## Validación

```text
node tools/check-world-map.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE SCREENSHOT_DIRECTORY [BEFORE_DIRECTORY]
node --experimental-vm-modules tools/check-outfit-02.cjs
node --experimental-vm-modules tools/check-outfit-03.cjs
node --experimental-vm-modules tools/check-outfit-04.cjs
node --experimental-vm-modules tools/check-initial-loading.cjs
python tools/check-fountain-assets.py APPROVED_ZIP
node tools/check-magical-fountain.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY
```

La prueba de mapa abre Edge en escritorio 1280 × 800 y móvil 390 × 844, con y
sin movimiento reducido. Comprueba el flujo completo, aparición, los cuatro
outfits/direcciones, vuelta completa a la fuente, acceso a los cuatro extremos,
colisión desde cada lado, deslizamiento, diagonales, límites, cámara responsive
y ausencia de obstáculos antiguos mediante un muestreo del área transitable.
El control móvil usa eventos táctiles reales enviados por CDP, incluyendo
captura de puntero, movimiento y liberación. Los hooks se inyectan únicamente
en respuestas HTTP locales, no en producción. Captura los cuatro outfits en
cada tamaño/preferencia, fuera del repositorio. También valida 320 × 568,
844 × 390 y 430 × 932, la fuente visible al llegar y la posición conservada
al redimensionar. El directorio opcional BEFORE_DIRECTORY permite exigir
igualdad exacta de los PNG del canvas de escritorio antes y después.

Las pruebas de entrada, tarjeta y retrato (`check-entry-browser`,
`check-outfit-card`, `check-outfit-portrait`) completan las regresiones.
La comparación pixel a pixel contra el escenario de la etapa 1 ya no aplica:
la geometría y el arte cambian intencionalmente. Sus referencias anteriores siguen fuera
del repositorio para revisión histórica.

## Regresión del encuadre inicial de escritorio

```text
node tools/check-desktop-framing.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY [BEFORE_DIRECTORY]
```

El argumento final `baseline` registra el estado previo sin exigir centrado.
La prueba abre sesiones nuevas, selecciona cada outfit y completa la entrada.
Mide doce frames consecutivos inmediatamente después de EXPLORAR, sin tocar
teclado/táctil ni alterar la posición. Exige fuente centrada (menos de 0.5 px),
llegada original, cámara estable e igual a la del teléfono y viewport dentro del
mundo. Después valida movimiento, seguimiento y regreso al punto inicial.
Cubre 1280 × 800, 1920 × 900 y 2560 × 1080. Incluye una entrada normal sin
movimiento reducido y casos con movimiento reducido.
También prueba iPhone X 375 × 812, DPR 3, con insets sintéticos 44/34; compara
los PNG puros del canvas antes/después para los cuatro outfits. Eso demuestra
que este cambio de escritorio no altera el render móvil emulado, sin equivaler
a una prueba de Safari real. Las capturas se guardan fuera del repositorio.

## Validación de la fuente integrada

`check-fountain-assets.py` reconstruye los recursos realmente empaquetados y
los compara píxel por píxel con los 32 PNG del ZIP aprobado. Exige piezas sin
solapamientos y arquitectura idéntica fuera de la máscara.
`check-magical-fountain.cjs` abre Edge en 1920 × 900 y iPhone X 375 × 812,
DPR 3 e insets sintéticos 44/34, con movimiento normal y reducido. Comprueba
entrada completa, cuatro outfits, centro, arte completo visible al llegar,
caminos transitables, contorno bloqueado, profundidades independientes y el
orden real de dibujo al norte y al sur. Compara lecturas del canvas: cambian
con agua animada y permanecen idénticas en movimiento reducido.
Guarda capturas de llegada y de los cuatro lados; registra un ciclo de 32
frames del render real en Edge para producir un GIF de demostración. No se
inyectan hooks en producción. Safari real no está disponible en este entorno.
El encuadre de cámara y el CSS responsive no se modificaron. Al girar un móvil
a una pantalla muy baja se puede recortar el cristal superior, conservando la
visibilidad de la plataforma y el seguimiento de cámara original.
