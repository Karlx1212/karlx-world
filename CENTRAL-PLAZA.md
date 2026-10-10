# Plaza Central aprobada

Integración sobre main 983b6b7, rama feat/plaza-central. Sin cambios artísticos.

## Capas

El césped C2, ground-C.png y las prolongaciones originales continúan como base. pavement.js carga además plaza-overlay.png (RGBA,1245x877) y la dibuja a resolución mundial nativa en (78,91), después de la base y antes de la fuente/personajes. No se utiliza terrain-static.png.

La capa incluye el núcleo aprobado, la transición localizada y cuatro conectores. Regiones de los conectores (extremo final excluido): oeste X78–147/Y448–625; este X1253–1322/Y448–625; norte X635–765/Y91–160; sur X635–765/Y898–967. El exterior transparente conserva el suelo original.

central-plaza-data.js contiene 171 objetos con coordenadas y anclajes mundiales originales; reutilizan 162 PNG. Hay cuatro bancos, ocho faroles y 159 máscaras de vegetación. Las máscaras se superponen a la base aprobada; no son una reconstrucción de terreno oculto. Se mantiene el orden vertical existente de game.js.

## Colisiones y sistemas protegidos

world-map.js sustituye los objetos y las cuatro huellas del jardín anterior por los objetos y las 60 huellas aprobadas; conserva una única copia de las 12 bandas originales de la Fuente Mágica (72 obstáculos en total). No se eliminan recursos antiguos.

Sin cambios en fuente, outfits, movimiento, cámara, controles, entrada, límites, tamaño del mundo, caminos exteriores ni responsive. La carga de la nueva capa participa en game.ready y en el manejo de errores existente.

## Validación

- check-central-plaza.cjs: recursos, referencias compartidas, RGBA, objetos y colisiones.
- check-world-camera.cjs: invariantes de cámara.
- check-visual-scale.cjs: referencia visual independiente del mundo.
- check-magical-fountain.cjs: cuatro outfits, profundidad, navegación compatible con el mobiliario, animación/reduced-motion y errores de recursos.
- check-entry-browser.cjs: selector, persistencia, flujo de entrada y carga; espera la sustitución asíncrona del retrato.

Capturas y diagnósticos permanecen fuera del repositorio en plaza-integration-check. Comparación de capturas iniciales: cero diferencias frente a la prueba aprobada en1920x900 y375x812 DPR3. Comparación del suelo completo real: cero diferencias respecto al compuesto aprobado; 3709383 píxeles exteriores protegidos comparados y cero cambios. Pruebas de los cuatro recorridos y regresos, más72 puntos de eje de conectores por dispositivo;342 comprobaciones de orden delante/detrás. Móvil es Edge emulado, no Safari real.
