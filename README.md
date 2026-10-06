# KARLX WORLD — Nivel 01

Primer playground visual en HTML, CSS y JavaScript vanilla. Escena RPG 3/4,
menú Y2K, personaje oficial y movimiento provisional. Sin dependencias,
backend ni portfolio completo. La configuración de Cloudflare se conserva.

## Probar localmente

```sh
npx wrangler dev
```

Abrir la URL indicada por Wrangler y pulsar **ENTRAR AL MUNDO**. Mover con
**WASD** o **flechas**. El movimiento diagonal está normalizado, usa
`requestAnimationFrame` y tiempo transcurrido. Hay límites y colisiones
simples con edificios, bancos y troncos. **MENÚ** vuelve al inicio.

El personaje utiliza un recorte de la primera pose frontal del sprite sheet
adjunto, sin rediseño ni frames inventados. Se mantiene la pose frontal
al caminar en todas las direcciones, con un desplazamiento vertical sutil.
`character` en `public/js/game.js` define el asset y su tamaño para una
futura integración de animaciones. `gameEvents` prepara eventos para sonido,
sin incluir audio. Desktop primero; todavía no hay controles táctiles.

## Archivos

- `public/index.html`: menú, canvas e interfaz.
- `public/css/styles.css`: interfaz retro y adaptación al viewport.
- `public/js/game.js`: escenario, cámara, movimiento y dibujo por profundidad.
- `public/assets/characters/karlx/idle-front.png`: pose oficial extraída.
- `wrangler.json`: Workers Static Assets, sin cambios.

## Desplegar

```sh
npx wrangler deploy
```

En Cloudflare Workers conectado a GitHub: rama `main`, raíz del repositorio,
compilación vacía y comando de despliegue `npx wrangler deploy`.
La autenticación de Cloudflare es necesaria para desplegar desde CLI.

Documentación: https://developers.cloudflare.com/workers/static-assets/
