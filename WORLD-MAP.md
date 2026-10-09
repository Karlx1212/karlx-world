# Plaza Central — geometría jugable y Fuente Mágica

`public/js/world-map.js` define la escena `central-plaza`, sin acceso al DOM ni
al canvas. `game.js` conserva el motor de movimiento, colisiones rectangulares,
cámara, controles, outfits y las interfaces de entrada existentes.

## Distribución

- Mundo: 1400 × 960. Límites transitables: X 42–1358, Y 270–915.
- Llegada: (700, 640), al sur de la fuente, sobre suelo transitable.
- Plaza: X 400–1000, Y 325–735 (600 × 410), centro (700, 530).
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
- Norte: X 640–760, Y 270–460.
- Sur: X 640–760, Y 580–915.
- Oeste: X 42–580, Y 500–620.
- Este: X 820–1358, Y 500–620.
- Paseo continuo sobre el pavimento octogonal, conectado a los cuatro caminos.
  El resto de la plaza también es transitable.

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

El césped sigue siendo provisional. Plaza, caminos y paseo usan los nuevos
materiales descritos en la sección Pavimento. La fuente usa únicamente
los recursos aprobados de `fuente-magica-CAPAS-PARA-APROBACION.zip`, con la misma
arquitectura estática en todos los frames y agua en máscaras autorizadas.
`magical-fountain.js` selecciona uno de 32 frames a 60 ms a partir del timestamp
del render existente: ciclo 1920 ms, sin intervalos ni temporizadores nuevos.
Movimiento reducido fija el agua en el frame 0. El degradado ambiental permanece.
`game.ready` espera la fuente; un fallo de carga usa el error del flujo existente.
No hay interacciones, misiones ni decoración adicional.

Pendiente de acabado: jardines y vegetación, después de aprobación visual.
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

## Plaza octogonal definitiva — etapa 5

La referencia aprobada es el boceto escritorio/móvil de la plaza octogonal.
El pavimento rosa ocupa el polígono (550,325), (850,325), (1000,435),
(1000,625), (850,735), (550,735), (400,625), (400,435), dentro del área
600 × 410 aprobada en la opción C. Los cuatro caminos conservan su ancho
de 120 unidades. Se retiró el paseo elíptico y el relleno rectangular:
los caminos crema llegan al octágono sin atravesar visualmente su interior.

`terrain.pavement` define tres recursos PNG: rosa, crema y bordes de piedra.
Las baldosas pequeñas usan juntas finas y una veladura perlada suave para
reducir el contraste de las manchas del material rosa. No se añade anillo
ornamental ni nuevas decoraciones. La hierba y el degradado permanecen iguales.

`pavement.js` carga los recursos mediante la promesa existente de preparación
del juego. Compone una sola superficie en coordenadas del mundo. Los polígonos
son máscaras del arte raster, no sustitutos de las texturas. Los bordes usan
fragmentos de piedra orientados a cada lado y esquina diagonal; una máscara
de la unión elimina líneas interiores en los cuatro accesos. La superficie
requiere un único drawImage por frame, debajo de la fuente y el avatar.

No se cambia game.js, cámara, responsive, movimiento, controles, profundidad,
colisiones, llegada (700,640) ni fuente (700,520), escala .58. No hay nuevas
colisiones asociadas al pavimento. Los materiales tienen fase y escala fija,
independientes del viewport. Preparación y procedencia: SOURCE.md y
tools/prepare-octagonal-pavement.cjs.

check-pavement.cjs comprueba el octágono, cobertura, límites de superficie,
uniones exactas de texturas y transiciones abiertas. Compara los datos del mapa
con 952a5d5 salvo el pavimento y la superficie de plaza reemplazada; exige
inalterados cámara, colisiones, fuente, outfits, intro y CSS. Las regresiones
check-world-map y check-magical-fountain cubren circulación, cuatro outfits,
entrada, controles táctiles, agua animada y movimiento reducido en Edge.
Safari real no está disponible. Jardines y vegetación esperan aprobación visual.

## Centrado equilibrado aprobado — opción C

La geometría reproduce la vista previa C: centro (700,530), ancho 600,
altura 410, márgenes de 111 unidades al norte, 131 al sur y 163 a cada
lado respecto de la huella de la fuente (X 563–837, Y 436–604).
Solo se prolonga el sendero norte hasta Y=270, manteniendo X 640–760
y su extremo sur Y=460. Los otros tres senderos no cambian; el render
existente de la unión evita bordes internos en los encuentros.

El límite transitable norte pasa de 330 a 270 para permitir alcanzar
el extremo del camino. Los otros límites siguen en X 42–1358 y Y máximo
915, dentro del mundo 1400 × 960. No se añaden escenas ni interacciones.
La fuente conserva (700,520), escala 0.58, todas sus bandas de colisión,
profundidad y ciclo de 1920 ms. KARLX conserva la aparición (700,640).
No se cambian materiales, recursos, cámara, motor ni controles.

Las regresiones de mapa verifican los vértices, márgenes, recorridos completos
hasta los cuatro extremos y el nuevo límite norte. Las pruebas de pavimento
siguen verificando juntas, opacidad y encuentros con los materiales existentes.

## Pavimento recuperado — etapa 6, aprobado

La geometría C, los senderos y los límites transitables no cambian. El extremo
norte sigue recto en Y=270; no se incorpora el remate achaflanado de revisión.
`terrain.pavement.surface` referencia `recovered/ground-C.png`, composición de
suelo 1400 × 960 preparada con el ZIP `plaza-original-TILESET-PARA-APROBACION.zip`.
`pavement.js` espera su carga y la dibuja a resolución de mundo, debajo de fuente
y avatar. No recompone figuras ni aplica tintes durante el render.

La escala común es 1,32 píxeles fuente por unidad de mundo. Las diagonales y
bordes usan los píxeles literales de las piezas del ZIP, con recortes y fragmentos
interiores para prolongarlas. Las superficies rosa y crema usan las texturas
reconstruidas documentadas del paquete. Las uniones no son recortes literales
completos: sus anchuras originales son diferentes y se ensamblan con esos mismos
materiales. No se estiran piezas ni se añaden colores. La procedencia y las
limitaciones están en `recovered/LEEME.md` y `provenance.json`.

`tools/prepare-recovered-pavement.py` reproduce el ensamblado desde el ZIP.
`tools/check-recovered-pavement.py` comprueba su hash, procedencia RGB, continuidad
de las texturas de origen y cobertura opaca. La regresión de Canvas verifica
identidad de la imagen dibujada, cobertura y conservación de todos los datos
del mapa salvo los materiales frente a 43793ab. Los recursos anteriores se
conservan; no se descarta trabajo ni se modifica la Fuente Mágica.

## Jardín C + césped C2 — etapa 7, integrado sin commit

Se conserva toda la geometría C, pavimento recuperado, fuente y sus doce
bandas de colisión. `garden-data.js` guarda las 26 posiciones literales de
la revisión aprobada C2: dos árboles, cuatro arbustos bajos, cuatro grupos
de rosas, dos canteros, seis grupos lilas y ocho manchas florales pequeñas.
Los árboles están en (210,455), alto165, y (1110,450), alto175; mantienen
la proporción del PNG y su anclaje inferior. No se incluye el tercer árbol
de la primera propuesta. Flores y arbustos bajos son transitables.

Los árboles usan la profundidad Y existente, permitiendo pasar delante o
detrás de las copas. Solo se bloquean troncos12×12 en (204,441)/(1104,436)
y bases de canteros60×10 en (555,773)/(785,773). La huella de pies22×10,
el deslizamiento y el algoritmo de colisiones no cambian. Los cuatro caminos
y el paseo alrededor de la fuente permanecen libres.

`garden.js` precarga los seis PNG de vegetación y `grass-C2.png`, copia
binaria de la variante aprobada. Compone una superficie de césped1400×960
una sola vez, repitiendo la muestra a512 unidades de mundo como la propuesta.
No aplica filtros ni tintes. Un drawImage por frame dibuja el terreno, luego
el pavimento original y la vegetación baja, después la fuente y las piezas
con profundidad. `game.ready` espera todos los nuevos recursos y un fallo
utiliza la pantalla de reintento existente; no se modifica intro.js.

La superficie ocupa aproximadamente5,1MiB decodificada; no depende del DPR
del móvil. No hay temporizadores nuevos, briznas procedurales por frame ni
animaciones de vegetación. El ciclo del agua y movimiento reducido no cambian.
Los PNG originales se preservan, sin reinterpretación ni modificación de
las costuras del recurso. La muestra no tiene bordes matemáticamente idénticos;
su variación al repetirla es comparable a la textura interna aprobada.

Pruebas específicas:

```text
python tools/check-garden-assets.py APPROVED_GRASS_STAGE7_DIRECTORY
node tools/check-garden.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY
```

Verifican identidad de recursos y coordenadas, transparencia, continuidad
estadística de la muestra, cuatro colisiones pequeñas desde todos los lados,
ausencia de obstáculos por copas/flores, profundidad real del drawImage,
carga fallida segura y capturas de llegada, árboles y canteros en escritorio
1920×900 e iPhone X375×812 emulado. Las regresiones anteriores siguen
cubriendo cuatro outfits, entrada, cámara, controles táctiles, circulación,
fuente animada y movimiento reducido. Safari de iOS real no está disponible.
