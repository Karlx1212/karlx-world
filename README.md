# KARLX WORLD

Página estática mínima para comprobar el hosting en Cloudflare Workers.
Solo muestra **KARLX WORLD** y *Coming Soon*.

## Estructura

- `public/index.html`: página.
- `public/styles.css`: estilos.
- `wrangler.json`: configuración de Workers Static Assets.

No necesita frameworks, dependencias de la aplicación ni compilación.
No se agrega JavaScript porque la página no requiere interacción.

## Probar localmente

Con Node.js LTS y npm instalados, desde la raíz del repositorio:

```sh
npx wrangler dev
```

## Desplegar

Si aún no hay una sesión autorizada de Cloudflare:

```sh
npx wrangler login
```

Después:

```sh
npx wrangler deploy
```

Wrangler publica directamente la carpeta `public` e indica la URL del sitio.
No hace falta un script de Worker para servir estos archivos estáticos.

## Cloudflare Workers conectado a GitHub

- Repositorio: `karlx-world`.
- Rama de producción: `main`.
- Directorio raíz: raíz del repositorio.
- Comando de compilación: vacío.
- Comando de despliegue: `npx wrangler deploy`.

Documentación: https://developers.cloudflare.com/workers/static-assets/
