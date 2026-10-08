# Pavimento de la Plaza Central

Arte nuevo generado con el tool integrado imagegen el 2026-10-08. La paleta y
el material toman como referencia la Fuente Mágica aprobada; sus archivos no
se editaron. Los originales generados permanecen en el directorio de imágenes
generadas de Codex, sin referencias del juego a archivos externos al proyecto.

## Recursos finales

- `pearl-pink.png`: piedra rosa perlada, crema y lavanda para la plaza.
- `cream-stone.png`: piedra crema cálida para caminos y paseo.
- Ambos PNG son 512 × 512, completamente opacos, formados por cuatro reflejos
  de una muestra 256 × 256 de los originales. Muestreo nearest-neighbor en
  Canvas nativo, sin interpolación. Los píxeles enfrentados de todas las
  uniones son iguales. No se da por correcta la repetibilidad de la salida IA.
- `pearl-star.svg`: pequeño rombo pixelado de 24 × 16 diseñado como gráfico
  vectorial sencillo con bordes enteros; cuatro instancias, ninguna animada.
- Empaquetado reproducible: `tools/prepare-pavement-assets.cjs`.

## Prompts finales del tool integrado (sin CLI/API externa)

### Plaza

Create one production game texture, opaque square, seamless tileable on all four edges. Asset: KARLX WORLD fantasy RPG / feminine Y2K plaza paving. Only a continuous surface of large hand-pixelled pale pearl pink stone paving slabs in staggered running bond, approximately four slabs across and six rows down per texture. Warm pale blush pink with a few soft ivory and very muted lavender slabs. Wide horizontally rectangular stones, restrained discrete rosy mortar joints, delicate silver-grey edge highlights, gentle shallow bevel shadows and a few tiny scuffs. Detailed carefully clustered pixel art, sharp pixel steps, no photographic detail, no vector appearance, no blur. Each logical art pixel should be a 4x4 pixel block in a 1024 square output so it will read clearly at 256 game units. Very low contrast and gentle color variation. Lighting uniformly from upper left, no overall lighting gradient or vignette. Flat orthographic paving texture to use as a repeating bitmap for an RPG ground plane, slab proportions suggest flattened overhead perspective. Matching palette to a fantasy fountain with pearl pink stone steps, warm cream paving and silver trim. The ground must remain quiet behind a detailed fountain. Crucially the left/right and top/bottom boundaries must continue perfectly when tiled; do not frame the square with an outline, do not terminate all slabs at texture edges. No fountain, water, objects, grass, flowers, characters, text, borders, ornaments, logos or watermark. Deliver just the seamless paving texture filling the entire image.

### Caminos

Create one production game texture: an opaque square SEAMLESS repeatable pixel-art cream stone walkway surface filling the whole image. Fantasy RPG with feminine Y2K pearl pink stone fantasy fountain surroundings. Four large wide rectangular slabs across, six rows, staggered running bond, NOT a square checker grid. Quiet warm ivory / pale buttercream limestone, very subtle pink-pearl undertones and rare slightly warmer stones, light rosy-grey mortar joints, discreet silver-grey edging highlights, tiny hand-pixelled chips and gentle shallow bevel shade. Clean detailed pixel clusters, each logical art pixel as a 4x4 block in a 1024px square so the asset reads well at 256 world units, crisp pixel steps, no blur, no photographic noise or vector look. Slabs twice as wide as tall to suit an overhead RPG ground with shallow perspective. Consistent upper-left lighting on each stone, no overall gradient. Low contrast, brighter and creamier than pale blush pink plaza paving, no distracting ornaments. MATCH left to right and top to bottom perfectly for tiling. Opposite edge stone patterns and grout must connect exactly. No drawn frame around the texture, no cropped decorative border, no gaps or transparent edge. No fountain, water, characters, vegetation, buildings, flowers, objects, text or watermark. Deliver ONLY the repeatable paving material.
