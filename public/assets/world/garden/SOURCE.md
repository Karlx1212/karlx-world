# Jardín C y césped C2 aprobados

PNG copiados sin alteración de las propuestas externas `gardens-stage7` y
`grass-stage7` del 08/10/2026. La variante final de `grass-stage7/layouts.json`
es la referencia de posiciones: 26 piezas, exactamente dos árboles. Se excluye
el tercer árbol joven presente en la propuesta C más antigua.

Recursos: tree, shrub, rose, lilac, bed y meadow (PNG con alfa original), más
grass-C2.png, copia literal de C2.png con la paleta suavizada aprobada. No se
incluyen A, B, C1, C3, atlas originales, bocetos ni capturas en el juego.

La textura se remuestrea una sola vez con nearest-neighbor a 512 unidades de
mundo por repetición, exactamente como en la propuesta. El canvas de terreno
1400 × 960 se precalcula al cargar. No hay filtros, tintes, sombras añadidas,
animaciones ambientales ni generación de briznas durante el render.

El patrón y escala mantienen la repetición aprobada. Las diferencias en los
bordes de la muestra no exceden 1,3 veces el contraste habitual entre píxeles
interiores. La muestra no es matemáticamente periódica píxel por píxel; no
se repintaron sus bordes para esconder esta limitación del recurso aprobado.

Las posiciones y tamaños están en garden-data.js. Árbol izquierdo (210,455),
alto165; derecho (1110,450), alto175. Anclaje de dibujo: centro inferior del
PNG, como en la propuesta. Ambos usan profundidad Y del anclaje. Troncos:
rectángulos12×12 en (204,441) y (1104,436). Canteros:60×10 en (555,773) y
(785,773). Las copas, arbustos bajos y flores no bloquean la circulación.

check-garden-assets.py verifica identidad binaria y posiciones respecto a la
carpeta externa aprobada. check-garden.cjs cubre carga, fallos, profundidad y
colisiones con la huella de pies original del motor.
