# Auditoría móvil — iPhone X

Referencia: 375 × 812 CSS px, DPR 3, zoom 100 %. También se revisan 320 × 568,
390 × 844 y 430 × 932; escritorio de referencia 1280 × 800.

## Hallazgos y corrección

- El viewport no incluía `viewport-fit=cover` y no se consumían safe-area insets.
  Se añadieron ambos sin limitar el zoom del usuario.
- Audio fijo y HUD inferior se superponían. La interfaz móvil ahora reserva una
  fila de audio debajo del footer, por encima del área segura inferior.
- Había textos principales de 12 px, botones de 10–11 px y etiquetas de 7–9 px.
  Las descripciones/chat usan 14 px, botones principales 14 px, acciones táctiles
  al menos 44 px de alto y etiquetas secundarias 10–12 px, conservando jerarquía.
- La identificación es más alta que el viewport. Se conserva una columna con
  scroll nativo, ventanas sin contracción y margen de scroll para los controles
  fijos. No se intenta encajar todo reduciendo avatar o textos.
- Se usa `dvh` con fallbacks `svh`/`vh` para ajustar pantalla y teléfono a la
  altura disponible; el chat mantiene scroll interno en pantallas cortas.
- `text-size-adjust:100%` estabiliza el ajuste automático móvil. El viewport
  mantiene zoom accesible; no hay `maximum-scale` ni `user-scalable=no`.

La hoja `public/css/mobile.css` se carga después de las existentes y limita las
correcciones a 600 px. El logo original, el avatar y su calibración se conservan;
solo se compactan márgenes y presentación del logo en la bienvenida móvil.
No se modifica JavaScript del juego, mapa, fuente, colisiones, entrada ni outfits.

## Validación y límites

```text
node tools/check-iphone-layout.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY [BEFORE_DIRECTORY]
```

Para registrar referencias antes de un cambio, el último argumento puede ser
`baseline`. Las capturas incluyen bienvenida, cuatro outfits (avatar y detalles),
loading, llegada, mensajes/acciones del teléfono y playground.

La prueba usa Edge con emulación móvil y DPR 3. A 375 × 812 inyecta márgenes
seguros de 44 px arriba y 34 px abajo mediante variables CSS: es una simulación
de restricciones de espacio, no una medición de Safari. Revisa scroll, anchos,
posición del teléfono, audio separado del footer y zoom 100 %. También reduce
la altura del viewport y amplía 25 % el texto principal como prueba de layout.
Puede comparar las medidas de escritorio contra una referencia previa.
Los salientes decorativos del teléfono se distinguen del contenido interior.

No hay Safari real, simulador de iOS ni WebKit instalado en este entorno Windows.
Las pruebas de Edge no validan el comportamiento específico de las barras de
Safari, su autoajuste tipográfico o los insets reales. Falta comprobar en el
iPhone físico con Safari, barras abiertas/cerradas y preferencias de texto.

Fuentes primarias para la implementación:

- https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/

Se ejecutan además las regresiones existentes de entrada, carga lenta/errores,
outfits, persistencia, retrato estable, tarjeta, mapa/cámara y controles táctiles.
