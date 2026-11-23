# Auditoría de guiones 1 a 5

Fecha: 23 de noviembre de 2026. Revisé los textos de `originales/`: video01.json (versión del 14 de noviembre, no
la final) y del video02.txt al video05.txt, que son el texto exacto que se mandó a ElevenLabs.

Los audios de los videos 2 a 5 ya están pagados, así que aquí **no se reescribe nada**. Solo reporto lo que encontré,
con su severidad, si vale la pena regenerar el audio y cuántos caracteres costaría hacerlo. ElevenLabs cobra por carácter
y el texto se manda en trozos de máximo 3,000 caracteres.

## Resumen

| Video | Palabras | Caracteres | Duración del audio | Hallazgos graves | ¿Regenerar? |
|---|---|---|---|---|---|
| 1 | 1,723 (versión vieja) | 9,166 | 8:37 (versión final) | 0 | No |
| 2 | 1,554 | 8,428 | 515 s | 0 | No |
| 3 | 1,599 | 8,430 | 502.1 s | 0 | No |
| 4 | 1,583 | 8,412 | 516 s | **1** | **No hace falta**: se arregla con un corte de audio, sin gastar créditos (ver G1) |
| 5 | 1,598 | 8,451 | 511.6 s | 0 | No |

**Palabras cortadas o mal escritas** (el problema de la edición anterior, donde se borraron "y" y "n"): revisé con un
script todas las palabras poco frecuentes de los 5 guiones, las palabras repetidas seguidas, los dobles espacios y los
símbolos raros. **No encontré ninguna palabra cortada** ni símbolos prohibidos (no hay comillas dobles, paréntesis ni
dígitos). Hay un posible enunciado faltante en el video 2 (ver M1), pero no es una palabra mutilada.

**Estadísticas sin fuente**: ninguno de los 5 guiones trae porcentajes ni cifras de estudios. Lo que hay son
recomendaciones generales (dormir de siete a nueve horas, factor treinta o más) y superlativos sin respaldo
(ver M6).

---

## Hallazgos graves

### G1. Video 4: dice que ya existe un video que todavía no existe

> Aquí no te voy a decir que lo tires ni que lo dejes por completo, **de eso ya hay un video entero en el canal**.

- **Por qué es grave**: es falso. El canal tiene 0 videos publicados, y en la base de Notion "Guiones YouTube" ese tema
  es el **#18, "Cómo DEJAR el CELULAR y Recuperar tu TIEMPO"** (fecha planeada: 28 de noviembre, Estado "Idea"). Si el
  video 4 sale antes, quien lo busque no lo va a encontrar, y eso se ve poco serio.
- **Arreglo sin gastar créditos (recomendado)**: cortar del audio solo el fragmento ", de eso ya hay un video entero en
  el canal". La frase que queda, *Aquí no te voy a decir que lo tires ni que lo dejes por completo.*, se entiende sola.
  Es un corte limpio al final de la oración. Se ubica en el bloque "Agarrar el celular apenas abres los ojos" (el
  séptimo punto del guion, que en la cuenta regresiva es el #3). Por proporción de palabras cae cerca del **minuto 5:28**
  de los 516 segundos (es una estimación: hay que confirmarlo escuchando). El corte es tarea de producción (Y4).
- **Otra opción**: publicar el video 4 después del #18. Así la frase deja de ser falsa, pero solo si para entonces el
  #18 ya está público.
- **Costo si se regenera**: el párrafo completo tiene **775 caracteres**, que caben en un solo trozo. El título del
  punto y la oración afectada suman **unos 150 caracteres**, pero empalmar una oración suelta suele notarse en la
  entonación. Con el corte no hace falta gastar nada.

---

## Hallazgos menores (no justifican regenerar)

### M1. Video 2: salto lógico en el gancho, quizá falta una oración

> Duele, güey. Son hábitos pequeños que repites todos los días sin darte cuenta.

Falta el puente entre "te calculan más años" y "son hábitos". Algo como *Y casi nunca es tu edad real*. Puede ser una
oración que se borró al editar. Se entiende por contexto. **No regenerar**: costaría 596 caracteres (el párrafo de
intro completo). Si molesta, se puede tapar con un texto en pantalla, por ejemplo NO ES TU EDAD.

### M2. Video 3: promete un video que todavía no tiene fecha

> Aquí no vamos a recomendar perfumes, eso viene en otro video.

No es falso, porque no dice que ya exista, pero deja una promesa abierta. En Notion existe la idea "10 Perfumes para
POSADAS que Hacen que te Pregunten Qué Usas", **sin número ni fecha**. Recomendación: programar ese video para que la
promesa se cumpla. **No regenerar.**

### M3. Video 1: frotar las muñecas presentado como hecho

> No te frotes las muñecas, eso rompe el aroma.

Es un consejo muy repetido, pero no está demostrado. El video 3 lo dijo mejor: *se dice que apaga las primeras notas*.
Además, el texto final del video 1 no está en esta carpeta, así que no sé si se quedó igual. Para el futuro, usar esa
misma forma prudente.

### M4. Videos 1 y 2: el agua y la piel o los labios

> Toma más agua durante el día, que es lo que realmente hidrata desde adentro. (video 1, labios)
> Cuando tu cuerpo anda corto de agua y de buenos alimentos, se nota. La piel se ve más seca y apagada. (video 2)

Que tomar agua mejore la piel es una idea popular con poca evidencia. No es peligroso, pero se presenta como un hecho.
Para el futuro, decir *te ayuda a sentirte mejor* en lugar de prometer un efecto en la piel.

### M5. Video 5: el rebote de grasa, repetido dos veces

> ...y en muchos casos reacciona produciendo todavía más grasa para compensar.
> Cuando tu piel está deshidratada, puede producir más grasa para defenderse.

La idea de que la piel produce más grasa si la resecas es discutida entre especialistas. Está matizada con *puede* y
*en muchos casos*, así que no es riesgosa, pero se repite. **No regenerar.**

### M6. Superlativos sin fuente

> el número uno es el que más gente comete (video 1)
> el más grave de todos, el que más gente comete (video 4)
> piel mixta, que es muy común en hombres jóvenes (video 5)

No hay dato que lo respalde. Es aceptable como opinión, pero las reglas del canal piden no inventar estadísticas.
Para el futuro: *el que más se nota*, *el que casi nadie revisa*, *de los más comunes*.

### M7. Recomendaciones de salud concretas, pero dentro del consenso

- Video 2: *Apunta a dormir de siete a nueve horas* y *bloqueador de factor treinta o más todas las mañanas*.
- Video 5: *factor treinta o más*, *lo que cabe a lo largo de dos dedos*, *prueba en una zona pequeña ... por un par de
  días*.

Son recomendaciones públicas y generales, no diagnósticos ni tratamientos, y el video 5 manda al dermatólogo en caso de
acné fuerte, lo cual está muy bien. No las considero violación de la regla, pero en videos futuros conviene decir *lo
que suelen recomendar los dermatólogos* en lugar de dar la indicación como orden propia.

### M8. Video 4: "modo supervivencia"

> Es difícil sentirte seguro cuando tu cuerpo anda en modo supervivencia.

Exageración casi fisiológica por no desayunar. Además, algunas personas no desayunan por indicación médica o por
elección. Es menor, porque el guion dice *No te voy a dar una dieta*.

### M9. Repeticiones notorias de muletillas

| Video | Muletilla | Veces |
|---|---|---|
| 4 | Qué hacer | 8 (una por punto) |
| 2 | Lo que puedes hacer / Qué hacer | 4 + 2 |
| 5 | Cómo se usa | 3 |
| 5 | paso más importante / el más importante | 3, más la intro |
| 5 | Y ahora sí | 2 |

Funcionan como estructura, pero escuchar *Qué hacer* ocho veces en nueve minutos cansa. Para el futuro: alternar entre
*La solución*, *Lo que te recomiendo*, *Aquí va el truco*, *Haz esto* y otras.

### M10. Video 1: inconsistencias con el plan

- *cada semana subo más videos*, pero el plan es un video diario.
- *Ahora que viene el frío*: tiene fecha de caducidad, porque no aplica si alguien ve el video en mayo.
- Esta versión dice *Número diez*, *Número nueve*... Según `00-CONTEXTO.md`, eso se quitó en la versión final.

No hay nada que hacer, porque el video 1 ya está terminado.

### M11. Video 2: "rasuradora sencilla con guías"

Lo correcto es *recortadora*: una rasuradora no lleva guías. Es menor, y se entiende.

---

## Gancho de los primeros 30 segundos y retención (recomendaciones para los videos siguientes)

A unas 3 palabras por segundo, los primeros 30 segundos son unas 90 palabras. Las intros miden de 117 a 159 palabras
(de 39 a 43 segundos), así que **la promesa del video casi siempre llega después del segundo 30**.

| Video | Qué funciona | Qué mejorar |
|---|---|---|
| 1 | Paradoja potente: *te bañas diario y aun así te ven descuidado*. Dolor social claro: *nadie te lo va a decir*. | Es la intro más larga (159 palabras, unos 50 s). La lista arranca tarde. |
| 2 | Escena concreta y graciosa: *¿eres el tío de alguien?*, *te hablan de usted*. Ordena de menos a más impactante y anuncia el último. | Falta el puente (M1). Los puntos no tienen micro-ganchos entre sí: suena a lista corrida. |
| 3 | Contraste: *uno gasta una fortuna y no huele, otro con un perfume sencillo deja huella*. Aclara qué NO incluye. | Empieza igual que el 2 (*¿te ha pasado...?*). La promesa *con dos o tres trucos ya notas la diferencia* llega al final. |
| 4 | Lo mejor del canal en retención: **micro-gancho al final de cada punto** (*el siguiente error está justo detrás de ti*). El cierre explica por qué no cambiar los 9 de golpe. | La mentira del video del canal (G1). *Qué hacer* repetido. |
| 5 | Identificación inmediata: *el mismo jabón del cuerpo, la toalla de toda la semana*. Micro-ganchos en todos los puntos. Aviso responsable de ir al dermatólogo. | Párrafos de 180 a 200 palabras (más de un minuto por punto); conviene partirlos. El paso más importante se anuncia demasiadas veces. |

### Patrones a repetir

1. **Escena reconocible en la primera oración** (videos 2, 4 y 5). Mejor que una pregunta genérica.
2. **Anunciar el número uno sin revelarlo**: *el último es la raíz de todos los demás* (video 4).
3. **Micro-gancho al cerrar cada punto** que adelante el siguiente (videos 4 y 5).
4. **Repaso rápido + un solo reto para hoy + pregunta concreta para los comentarios** (todos).
5. **Precios en rangos con *más o menos* y *depende de la tienda*** (video 3).

### Patrones a evitar

1. Intros de más de 110 palabras: la promesa tiene que llegar antes del segundo 30.
2. Empezar dos videos seguidos con *¿Te ha pasado...?*.
3. Decir que existe contenido del canal que todavía no está publicado.
4. Puntos de más de 170 palabras sin un cambio de ritmo (pregunta, ejemplo o mini-historia).
5. La misma muletilla en todos los puntos.
