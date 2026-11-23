# Plantilla de guion: Versión Superior

Esta plantilla toma lo que mejor funcionó en los videos 1 a 5 (ver `auditoria.md`) y las reglas de `../LEEME-canal.md`.
Meta: un video de 8:30 a 9:30 minutos, con **1,550 a 1,650 palabras** de narración. Con la voz clonada salen unas 3
palabras por segundo.

## Estructura (cuenta regresiva)

| Bloque | `id` | Palabras | Duración aprox. | Qué lleva |
|---|---|---|---|---|
| Gancho + promesa | `00` | 90–110 | 30–37 s | Escena, tensión, promesa, mecánica y anzuelo del número uno |
| Puntos (de N a 1) | `10`…`01` (o `08`…`01`, etc.) | ver tabla de abajo | 40–60 s cada uno | Problema, por qué pasa, solución concreta, micro-gancho |
| Cierre | `99` | 120–150 | 40–50 s | Repaso, un solo reto, pregunta, llamado a la acción |

Palabras por punto según cuántos puntos tenga el video, para llegar a unas 1,600:

| Puntos | Palabras por punto |
|---|---|
| 7 | 190–200 (agregar un ejemplo o una mini-historia para que no se haga pesado) |
| 8 | 165–175 |
| 9 | 150–155 |
| 10 | 135–140 |
| 12 | 110–115 |

### 1. Gancho + promesa (`00`): los primeros 30 segundos

1. **Escena reconocible** en la primera oración, en segunda persona y en presente. Es lo que mejor funcionó en los
   videos 2, 4 y 5: *Te lavas la cara con el mismo jabón del cuerpo...*. Evita abrir siempre con *¿Te ha pasado...?*.
2. **Tensión**: el costo de no saberlo (*nadie te lo va a decir*, *la gente se queda con esa impresión*).
3. **Promesa concreta antes del segundo 30**: cuántos puntos son, qué gana quien ve el video y cuánto cuesta (*gratis o
   casi gratis*).
4. **Mecánica**: *Van del diez al uno*.
5. **Anzuelo del número uno**, sin revelarlo: *el último es la raíz de todos los demás*.

Máximo 110 palabras. Si te pasas, recorta la tensión, nunca la promesa.

### 2. Cada punto (`10`…`01`)

Orden interno, más o menos con estas proporciones:

1. **Nombre del punto** como primera oración, corto y igual a la tarjeta `t` (*Tenis sucios.*). No digas *Número
   diez*: la tarjeta ya muestra el número.
2. **Diagnóstico** (30 %): la escena del error y por qué se nota. Una frase de identificación (*Y lo haces todos los
   días*).
3. **Solución** (50 %): de dos a cuatro acciones concretas, en imperativo, con el cómo y el cuánto. Si hay que comprar
   algo, un **rango de precio aproximado** con *más o menos* o *depende de la tienda*. Si no cuesta nada, dilo.
4. **Remate** (una oración): el beneficio o una frase para recordar.
5. **Micro-gancho** (una oración) que empuje al siguiente punto sin revelarlo. Por ejemplo: *Y si crees que eso es
   malo, el siguiente lo haces sin darte cuenta*.

Varía la muletilla de la solución: *La solución*, *Haz esto*, *Lo que te recomiendo*, *Aquí va el truco*, *Qué hacer*.
No uses la misma más de dos veces por video.

**Orden de la cuenta regresiva**: del menos al más impactante. Pon en la mitad (#6, #5) un punto sorpresa o
contraintuitivo, porque ahí suele caer la retención. El #1 tiene que cumplir el anzuelo de la intro.

### 3. Cierre (`99`)

1. **Repaso rápido** de todos los puntos en una sola oración larga.
2. **Reencuadre**: *no necesitas dinero, son hábitos*.
3. **Un solo reto para hoy**: el más fácil, con una acción exacta (*esta noche, cambia la funda de tu almohada*).
4. **Pregunta concreta** para los comentarios: *¿cuál de estos hacías tú?*. Evita el simple *déjame tu comentario*.
5. **Llamado a la acción**: suscribirse a Versión Superior y, opcionalmente, recomendar otro video **que ya esté
   publicado**.
6. Despedida corta.

## Formato `guion.json`

```json
[
 {"id":"00","n":"","t":"","i1":"MÁXIMO 18 CARACT","i2":"OTRA LÍNEA","q":["slug-uno","slug-dos","slug-tres","slug-cuatro"],"x":"Narración..."},
 {"id":"10","n":"#10","t":"TÍTULO DE 22 MÁXIMO","i1":"","i2":"","q":["..."],"x":"..."},
 {"id":"99","n":"","t":"","i1":"","i2":"","q":["..."],"x":"..."}
]
```

- `i1`/`i2`: solo en la intro, en MAYÚSCULAS, de 18 caracteres como máximo. En los demás bloques van vacíos.
- `t`: en MAYÚSCULAS, de 22 caracteres como máximo. `n`: almohadilla y número (`#7`), sin cero inicial.
- `q`: 4 búsquedas de Unsplash en inglés, en slug. Nada de marcas ni famosos, y que no salga una persona reconocible
  en algo negativo.

## Lista de verificación antes de grabar

Corre el validador (ver `README.md`) y revisa a mano:

**Duración y forma**
- [ ] Narración total entre **1,550 y 1,650 palabras**, contadas con script.
- [ ] Intro de 110 palabras como máximo, con la promesa antes de la palabra 90 más o menos.
- [ ] Puntos con un largo parecido entre sí (ninguno arriba de 200 palabras).
- [ ] JSON válido, con campos `id`, `n`, `t`, `i1`, `i2`, `q` y `x` en todos los bloques; `t` ≤ 22, `i1`/`i2` ≤ 18 y
      `q` con 4 slugs.

**Texto para la voz**
- [ ] Números escritos con palabras (*quince*, *ciento cincuenta pesos*). Cero dígitos en `x`.
- [ ] Sin símbolos: nada de `%`, `$`, `#`, `&`, `/`, `+`, ni emojis. Sin paréntesis ni comillas dobles.
- [ ] Sin abreviaturas que la voz lea mal (*etc.*, *aprox.*, *min.*).
- [ ] Ninguna palabra cortada: busca palabras de una o dos letras raras, y revisa que no se hayan perdido *y*, *n* ni
      *o*.
- [ ] Cada trozo para ElevenLabs de **3,000 caracteres como máximo**, cortado en un final de párrafo.

**Contenido**
- [ ] Cero estadísticas, porcentajes o *estudios dicen* sin fuente verificable.
- [ ] Cero consejos médicos concretos: sin dosis, medicamentos, diagnósticos ni tratamientos. Ante algo de salud,
      *ve con un profesional*.
- [ ] Cero consejos financieros concretos. Para precios, solo rangos aproximados y verificables, con *más o menos*.
- [ ] Sin marcas ni nombres de productos, tiendas o famosos.
- [ ] Los superlativos van como opinión (*el que más se nota*), no como dato (*el que más gente comete*).
- [ ] No menciona videos del canal que todavía no estén publicados.
- [ ] Nada con fecha de caducidad (*ahora que viene el frío*), salvo que el tema sea de temporada.
- [ ] Tono: español de México, informal, de tú. *Güey* o *vato* como máximo dos o tres veces por video.

**Retención**
- [ ] Cada punto termina con un micro-gancho, menos el #1.
- [ ] El #1 cumple lo que prometió la intro.
- [ ] El cierre tiene un solo reto y una pregunta concreta.
