# Pavimento recuperado adaptado a geometria C

Fuente exclusiva: plaza-original-TILESET-PARA-APROBACION.zip.
provenance.json identifica el SHA-256 del archivo y el ensamblado.

Runtime: ground-C.png, capa de suelo 1400 x 960, dibujada 1:1 en coordenadas
del mundo. La camara aplica su escala existente al conjunto de la escena.
No hay tintes, nuevos colores ni escalados independientes por pieza.

Procedencia:
- Bordes y diagonales: RGB muestreado de las piezas transparentes literales
  horizontal-curb, horizontal-path, vertical-path, vertical-curb y las cuatro
  diagonales del ZIP. Los finales de las diagonales conservan sus extremos;
  se inserta un fragmento interior cuando hace falta prolongar una arista.
- Superficies interiores: pink-quilted y cream-quilted del ZIP. Ya eran
  reconstrucciones documentadas, hechas con fragmentos originales.
- Uniones y prolongaciones: composicion RECONSTRUIDA de esos materiales y
  bordes. No son pixeles recuperados de una zona oculta del boceto.
- Una conversion isotropica comun de 1.32 pixeles fuente/unidad de mundo
  reproduce la escala de preparacion del ZIP. Se muestrea al vecino mas
  cercano y se prolonga mediante recortes. No se estira ninguna textura.
- Las mascaras de union se adaptan al contorno C, no a las dimensiones del
  ejemplo incluido en el ZIP. Los bordes internos no se duplican.

Los caminos del boceto tienen anchuras distintas; sus uniones completas no
pueden pegarse literalmente sobre los caminos actuales de 120 unidades.
Se reconstruyen exclusivamente con el mismo material. La geometria C,
las bandas de colision de la fuente y los limites transitables se conservan.
El extremo norte sigue recto en Y=270, como conexion provisional autorizada.
La franja exterior de transicion contiene cesped literal de las piezas;
no sustituye el terreno ni agrega vegetacion.

Reproducir:
python tools/prepare-recovered-pavement.py APPROVED_ZIP [AUDIT_DIRECTORY]
La carpeta de auditoria recibe mascaras de cobertura y procedencia.

Validar:
python tools/check-recovered-pavement.py APPROVED_ZIP
node tools/check-pavement.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE

Limitacion visual: el ensamblado no puede reproducir la composicion o camara
del boceto, porque la geometria C y la camara actual estan bloqueadas.
Las prolongaciones reutilizan fragmentos; no se promete identidad pixel a
pixel con una zona del boceto que no existe.
