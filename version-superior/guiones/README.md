# guiones/: Versión Superior

Carpeta de guiones del canal. La trabaja el subagente Y1. Reglas del canal y formato de `guion.json`: `../LEEME-canal.md`.

| Ruta | Qué es |
|---|---|
| `originales/` | Guiones de los videos 1 a 5 **tal como se usaron**. `video01.json` es la versión del 14 de noviembre, no la final. Del `video02.txt` al `video05.txt` está el texto exacto enviado a ElevenLabs (audios ya pagados). **No editar.** |
| `auditoria.md` | Revisión de los guiones 1 a 5: hallazgos graves y menores con cita textual, si conviene regenerar el audio y cuánto costaría en caracteres, y una evaluación del gancho y la retención de cada video. |
| `plantilla-guion.md` | Estructura recomendada (gancho, promesa, cuenta regresiva, micro-ganchos, cierre) y lista de verificación previa a grabar. |
| `nuevos/video06.json` | Guion del video 6: **10 Prendas BÁSICAS que Todo Hombre NECESITA**. 1,630 palabras, 8,749 caracteres. |
| `nuevos/video07.json` | Guion del video 7: **Por qué NADIE te Toma en SERIO (y cómo cambiarlo)**. 1,608 palabras, 8,479 caracteres. |
| `validar-guion.mjs` | Validador: JSON, campos, límites de `t`/`i1`/`i2`, 4 slugs en `q`, ausencia de dígitos y símbolos en `x`, y total de 1,550 a 1,650 palabras. |

## Validar un guion

```bash
node validar-guion.mjs nuevos/video06.json nuevos/video07.json
```

Imprime las palabras por bloque, el total, los caracteres y la cantidad mínima de trozos de 3,000 caracteres para
ElevenLabs. Al cortar en finales de párrafo pueden salir uno o dos trozos más. Termina con código 1 si hay errores.

## Notas sobre los guiones nuevos

- Los títulos salen de la base de Notion "Guiones YouTube" (#6 y #7, los dos en Estado "Idea"). Solo se leyó la base;
  no se escribió nada en Notion.
- Todos los bloques traen `i1` e `i2`, como pide `LEEME-canal.md`; fuera de la intro van vacíos. `video01.json` no
  los traía y aun así se montó, así que `build.ps1` no debería tener problema. Conviene confirmarlo en la primera
  prueba.
- **Precios del video 6**: son rangos aproximados en pesos, con *más o menos* y *depende de la tienda*. No se pudieron
  revisar en tiendas en vivo desde aquí, así que el usuario debería confirmarlos antes de grabar.
- El video 7 no menciona otros videos del canal, para no repetir el error G1 de la auditoría. Evita también los temas
  de los videos 4 (promesas a ti mismo), 16 (lenguaje corporal) y 24 (hablar inmaduro).
- Antes de grabar, pasa la lista de verificación de `plantilla-guion.md`.
