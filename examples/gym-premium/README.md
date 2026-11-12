# AURUM Athletic Club — sitio web premium (demo)

Landing page estática para un gimnasio premium. Es independiente del código de OmniRoute: no tiene
dependencias ni paso de build.

## Ver en local

```bash
cd examples/gym-premium
python3 -m http.server 8080   # abre http://localhost:8080
```

Usa un servidor HTTP: al abrir `index.html` con `file://`, el navegador bloquea la fuente autoalojada.

## Estructura

| Ruta                    | Contenido                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| `index.html`            | Marcado semántico de todas las secciones                                  |
| `assets/css/styles.css` | Tokens de diseño (`--au-*`), componentes y diseño responsive              |
| `assets/js/main.js`     | Navegación, animaciones, precios, horarios, testimonios, FAQ y formulario |
| `assets/fonts/`         | Switzer variable (Fontshare Free Font License, `FFL.txt`)                 |

## Recursos reutilizados de OmniRoute

- **Tipografía Switzer** autoalojada, copiada de `packages/ui-kit/src/fonts/`.
- **Convención de tokens** del UI kit (`--ci-*` → `--au-*`): colores, radios y curvas de animación en `:root`.
- **Prettier** con `prettier.config.mjs` del repositorio para formatear el código.
- **Playwright** (el mismo que usan los tests E2E) para el QA visual en escritorio y móvil.

## Contenido de muestra que hay que sustituir

- Nombre de la marca, dirección, teléfono y email (`index.html`).
- Coaches, testimonios, precios y horarios (los horarios están en `SCHEDULE`, `assets/js/main.js`).
- Fotografía: añade `data-photo-src="ruta/foto.jpg"` a cualquier elemento con `data-photo`.
- Formulario: conecta el envío a tu CRM o backend en el punto marcado en `main.js`
  (hoy solo valida en el navegador y muestra la confirmación).
