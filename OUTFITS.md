# Outfits de KARLX

El selector de la ficha usa los PNG originales `outfit-XX-idle.png` y guarda
el ID (01–04) en `karlx-selected-outfit`. Sin almacenamiento disponible,
la selección funciona durante la visita. Un valor guardado inválido vuelve a 01.

`public/js/outfits.js` vincula cada ID con su preview y hoja de poses.
`animation: null` indica que esa hoja todavía no es utilizable por el motor.
El playground sigue usando `idle-front.png`; no cambia el personaje jugable.

## Inspección

| Outfit | Idle | Hoja | Transparencia |
| --- | --- | --- | --- |
| 01 | 92 × 216 | 1536 × 1024 | Ambos RGBA; conservan píxeles de fondo |
| 02 | 819 × 1921 | 1536 × 1024 | Ambos RGBA; la hoja conserva fondo |
| 03 | 819 × 1920 | 1536 × 1024 | Ambos RGBA; la hoja conserva fondo |
| 04 | 819 × 1920 | 1536 × 1024 | Ambos RGB, sin canal alfa |

Las hojas son composiciones ilustradas con etiquetas, fondos y brillos.
Visualmente agrupan 4 poses por orientación idle, 6 por dirección de caminar,
6 por grupo de carrera y grupos de acciones especiales. No incluyen un atlas
con coordenadas verificadas. Las poses no están registradas en celdas uniformes,
el tamaño y posición varían, y las etiquetas/orden de carrera difieren entre
hojas (en 01 aparecen RUN DOWN / RUN LEFT / RUN RIGHT / RUN UP; en las demás,
los rótulos indican otro orden y no siempre corresponden a la orientación).

El motor actual dibuja la imagen completa en 52 × 122, con un desplazamiento
vertical al caminar. No usa recortes de frames ni secuencias direccionales.

Para integrar animaciones: exportar personajes aislados con transparencia
real, eliminar fondos/etiquetas, usar celdas y escala consistentes, alinear los
pies a un mismo ancla y entregar un atlas con rectángulos exactos, orientación,
orden y duración de cada secuencia. Después se puede completar `animation`
y añadir reproducción de frames sin cambiar velocidad, colisiones o cámara.
No se recortaron ni modificaron los ocho archivos suministrados.
