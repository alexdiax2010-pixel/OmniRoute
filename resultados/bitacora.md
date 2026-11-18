# Bitácora de razonamiento — Prospección Zapopan

## 15:32 UTC — Arranque
- **Decisión:** la carpeta `bocetos-zapopan` no existe en este entorno (sesión en la nube; solo está el repo OmniRoute). Trabajo en `/home/user/OmniRoute/resultados/` (sin commitear nada al repo) y publico el reporte como Artifact para que no se pierda cuando el contenedor se recicle.
- **Plan:** Fase 1 = 6 agentes de investigación en paralelo, cada uno escribe su JSON crudo en `resultados/raw/<giro>.json`. Fase 2 = Verificador → Analista (secuencial, el analista necesita la lista limpia). Fase 3 = Estratega y Redactor en paralelo. Al final yo armo el CSV/HTML.
- **Riesgo anticipado:** Google Maps no carga desde aquí → los agentes deben marcar "verificar en Maps" en vez de suponer.

## 15:34 UTC — Fase 1 lanzada (6 agentes en paralelo)
- Lanzados: Salud, Automotriz, Belleza, Servicios, Comida, Oportunidades.
- **Decisión de diseño:** cada agente escribe JSON estructurado (no texto libre) con un objeto `fuentes` por dato. Así el Verificador puede comprobar mecánicamente que nada quede sin URL, y yo puedo generar el CSV y el dashboard con un script en lugar de copiar a mano (menos riesgo de errores de transcripción).
- Le pedí a Belleza priorizar barberías y a Salud priorizar tratamientos caros, porque son los paquetes con precio definido ($2,500 y $4,500).
- Mientras corren, preparo la plantilla del dashboard (`reporte.html`) para que solo haya que inyectar datos.

## 15:37 UTC — Termina Agente Oportunidades (primer hallazgo incómodo)
- 12 proyectos encontrados (7 Workana, 5 Freelancer), pero **ninguno verificable como abierto**: la red de este entorno bloquea workana.com y freelancer.mx (ENOTFOUND). Todo viene de resúmenes del buscador → se marcan "abierto: no confirmado".
- Solo 1 proyecto cae en la ventana de 30 días; ningún cliente es de Jalisco.
- **Sorpresa útil:** en Freelancer.mx se ofrecen landings por 10–250 USD, mientras que las agencias de GDL/Zapopan anuncian desde $4,000–4,750 MXN. Tu precio de $2,500 está por debajo del mercado local de agencias → argumento de venta, y quizá margen para subir el de barberías/talleres.
- **Cambio de estrategia:** las plataformas freelance no son buen canal para ti (precio bajo, competencia nacional). El foco se queda en prospección local directa.

## 15:41 UTC — Termina Agente Servicios
- 15 negocios (3 abogados, 4 contadores, 3 guarderías, 2 cerrajerías, 1 inmobiliaria, 1 escuela de idiomas, 1 notaría). Descartó Portos Abogados por ser despacho grande.
- **Limitación importante:** la red del entorno también bloquea seccionamarilla.com.mx y cronoshare.com.mx. Los datos salen de los fragmentos del buscador, y la URL fuente a veces es una página de resultados del directorio, no la ficha del negocio. Esos datos quedan como "verificar".
- 3 negocios (Alcaraz Leal, Azteca, Balbaneda) aparecen con dos direcciones distintas, y la Notaría 30 sale en Guadalajara aunque es "de Zapopan" → el Verificador debe marcarlos.
- "Sin web" aquí significa "no apareció dominio al buscar", no "confirmado que no tiene web". Ajuste: la puntuación de "sin web" la dejo completa, pero el CSV dirá "no encontrada" en vez de "no".

## 15:45 UTC — Fase 1 completa (5 agentes de giro terminaron)
- Salud 15 · Automotriz 18 · Belleza 16 · Comida 16 · Servicios 15 → **80 negocios en bruto**.
- **Patrón en todos los agentes:** la red del entorno bloquea casi todos los directorios (Doctoralia, WhatClinic, TopDoctors, Sección Amarilla, Cylex, Fresha, AgendaPro). Solo funcionó WebSearch. Cada dato trae la URL que citó el buscador, pero las fichas no se abrieron. Decisión: no invento nada. Todo queda con su fuente y la nota "confirmar en la ficha/Maps".
- **Teléfono es el cuello de botella:** Doctoralia y WhatClinic ocultan los teléfonos, y en Comida solo 2 de 16 tienen. Ajusto: en la rúbrica, "facilidad de contacto" pesa mucho para desempatar, y los negocios sin teléfono no deberían entrar al top 10 aunque su perfil sea bueno.
- **Ninguno de los 80 mostró web propia** al buscarlo. Sorprende, y confirma que hay mercado, aunque en parte se debe a que no se pudo revisar todo. Laminado y Pintura JV tiene un dominio citado (laminadojv.com) que no aparece en la búsqueda → posible "web caída", buen gancho.
- Descartes en la fase: cadenas (Hopp, Prodynamics, O'Reilly, APYMSA, Portos Abogados). La Zapopana (≈20 sucursales) y Avanti (posible franquicia) quedan marcados para descartar.
- Siguiente: Verificador (duplicados, datos contradictorios, cadenas) → Analista (rúbrica 0–100).

## 15:47 UTC — Fase 2 arranca + Ronda 2 en paralelo
- Lancé el **Verificador** sobre los 80 negocios: duplicados, cadenas, datos sin fuente → "no encontrado", alertas de contradicciones.
- **Cambio de estrategia (Ronda 2 adelantada):** no esperé al minuto 60. Salud es el giro de mayor ticket ($4,500), pero solo 5 de 15 tenían teléfono. Lancé en paralelo un agente que busca **dentistas con teléfono** en colonias sin cubrir (Providencia, Chapalita, Ciudad Granja, Las Águilas, Santa Margarita, Tesistán, Jardines Universidad, Ciudad del Sol). Sus resultados entran directo al Analista.
- Comida queda como el giro más débil para prospectar en frío (2 de 16 con teléfono). Para ese giro conviene la visita en persona más que el WhatsApp.

## 15:53 UTC — Termina el Verificador
- 80 → **76 prospectos** (0 duplicados reales, 4 descartados: La Zapopana y Poltrone da Barbiere por ser cadenas; Transmisiones Federalismo y Bloom por no tener una URL que respalde el nombre).
- 5 negocios de belleza perdieron dirección o teléfono porque venían de texto sin URL → ahora dicen "no encontrado" (regla de no inventar).
- 43 registros con alerta "verificar en Maps". **Sorpresa:** El Barbero Co y Eagle Man aparecen en la misma dirección (Aviación 4455), así que podría ser una plaza con varias barberías, una buena parada para la ruta.
- Taller de Espresso podría tener web (un agregador cita tallerdeespresso.com). Lo marco para que el Analista lo baje.
- Siguiente: Analista con la rúbrica, incluyendo los dentistas de la Ronda 2.

## 15:58 UTC — Termina la Ronda 2 de Salud y lanzo al Analista
- 13 dentistas nuevos, **11 con teléfono o WhatsApp** (en la ronda 1 eran 5 de 15). La apuesta salió bien.
- **Hallazgo:** Las Águilas concentra 6 dentistas con teléfono → candidata natural para una ruta de visitas de dentistas (el paquete de $4,500).
- Ciudad Granja: solo apareció Dentalia (cadena, descartada). Providencia y Jardines Universidad no dieron consultorios con teléfono.
- Descarte probable: Dentist Vibliorio (Tesistán) ya tiene web propia.
- Lancé al **Analista** con la rúbrica del cliente y le agregué dos reglas propias: (1) sin datos de reseñas, máximo 8 en "va bien", para no premiar lo desconocido; (2) -5 si hay alertas graves (dos direcciones, duda Zapopan/GDL), para que el top 10 sea visitable sin sorpresas.

## 16:02 UTC — Termina el Analista y arranca la Fase 3
- 93 revisados → **88 prospectos puntuados**, 43 con 60 puntos o más. Descartados 5 (se sumó Dentist Vibliorio, que ya tiene web propia).
- **Top:** 4 dentistas de Las Águilas empatados en 85 (Denti Mundo, Dental Infante, SPA Dental, Armando Núñez), EFD Abogados 81, Easy Dental Láser 80.
- **El giro manda:** Salud promedia 67.6 y 21 de 26 pasan de 60; Comida promedia 44 y ninguno llega a 60. Comida tiene fama pero no teléfono ni ticket alto, así que no es buen blanco para landing; le sirve más un menú QR.
- **Riesgo:** Dental Infante y Easy Dental Láser comparten dirección (Río Cuixtle 5784) y los dos están en el top 6. Podrían ser el mismo consultorio con dos nombres. Lo dejo visible como alerta en lugar de borrar uno sin evidencia.
- Lancé en paralelo al **Estratega** (giros, rutas, ideas) y al **Redactor** (WhatsApp + guion para el top 10). Al Redactor le pedí no afirmar "no tienen web" sino "no encontré una página propia", porque eso es lo que realmente verificamos.

## 16:05 UTC — Verificación propia del caso Río Cuixtle 5784
- Busqué yo mismo la dirección. **Dental Infante sí queda respaldado:** su perfil de Doctoralia (https://www.doctoralia.com.mx/perfil/miriam-infante-taracena) lo ubica en Río Cuixtle 5784, Colinas de las Águilas, con 2 consultorios, primera visita desde $600, profilaxis $1,000 y acepta Seguros Monterrey. Esos datos sirven para personalizar el mensaje.
- **Easy Dental Láser no se pudo corroborar:** una búsqueda directa no devolvió ninguna ficha con ese nombre. Mantengo la alerta. Si visitas Dental Infante, pregunta ahí mismo si "Easy Dental Láser" es su segunda marca; si lo es, cuentan como un solo prospecto.

## 16:08 UTC — Termina el Redactor
- 10 WhatsApp (67–74 palabras, contadas con código) y 10 guiones de 30 s. Usa "usted" en salud y legal, y "tú" en la hojalatería. Ninguno menciona precio y todos ofrecen un boceto sin costo.
- Revisé dos al azar (Denti Mundo, Dental Infante): cada uno cita un dato que sí está en las fuentes (calle o perfil de Doctoralia) y dice "no encontré una página propia", no "no tienen web". Correcto.
- Mejora posible para la siguiente sesión: los mensajes son algo genéricos porque los datos públicos son escasos. Cuando confirmes en Maps, mete una reseña real o un servicio concreto (ej. "vi que atienden con Seguros Monterrey").

## 16:11 UTC — Termina el Estratega (Fase 3 completa)
- Giros top: **Salud, Automotriz, Servicios profesionales**. Belleza y Comida quedan como secundarios.
- 3 rutas: Las Águilas (dentistas, 10:00), Chapalita (Av. de las Rosas, 10:00) y El Colli/Felipe Ruvalcaba (talleres, 8:30). Los talleres abren antes, así que esa ruta va temprano.
- **Idea más rentable:** un paquete "Pro" de $3,500–3,900, todavía abajo de las agencias ($4,000–4,750), y la alta de la ficha de Google Business ($800–1,200) como upsell. Encaja con que casi ninguno aparece bien en búsquedas.
- Genero CSV y dashboard con el script, y queda tiempo para una Ronda 3 en las zonas de las rutas.

## 16:16 UTC — Dashboard generado y revisado
- `build.py` arma `prospectos.csv` (88 filas) y `reporte.html` a partir de los JSON. Así ningún dato se copia a mano.
- En la revisión en celular (400 px) había scroll horizontal por URLs largas en las observaciones de mercado. Lo corregí con ajuste de línea.
- **Corrección de honestidad:** el KPI decía "87 sin página web propia" y "12 proyectos freelance abiertos". Lo cambié a "sin web propia encontrada" y "abiertos sin confirmar", porque eso es lo que realmente sabemos.

## 16:18 UTC — Reporte publicado y Ronda 3 lanzada
- Publiqué el dashboard como Artifact privado (https://claude.ai/artifact/HforWV1wYy7L4wVMvDCjrC) para que no dependa de este contenedor.
- Quedan ~15 min del presupuesto. **Ronda 3:** en vez de abrir otro giro, refuerzo las dos rutas con más densidad (Las Águilas y Chapalita) con barberías, talleres y dentistas que tengan teléfono. Más paradas por mañana significa más visitas por viaje.

## 16:24 UTC — Termina la Ronda 3 e integración final
- 8 negocios nuevos (4 en Las Águilas, 4 en Chapalita/Av. Guadalupe). 5 tienen teléfono; los 2 dentistas y Don Rufino sirven solo para visita en persona.
- **Ajuste del director:** Frenos Frescos (76) y Okrasa (75) habrían entrado al top 10 desplazando a Kyma Life. Pero los dos tienen una sola fuente, que no confirma que sigan operando ni qué giro son (Okrasa "según directorio"). Les resté 5 (→71 y 70), con el mismo criterio que el Analista aplicó a datos dudosos. El top 10 queda igual y todos llevan mensaje.
- Agregué las paradas nuevas al final de las rutas 1 y 2 como opcionales.
- **Total final:** 101 negocios revisados, 96 prospectos, 50 con 60 puntos o más.

---

# Sesión 2 — 2026-11-18

## 2026-11-18 15:58 UTC — Corrección de horas de la sesión 1 y plan de la sesión 2
- **Corrección importante:** al revisar el reloj del sistema (`date`) vi que ahora son las 15:58 UTC. La sesión 1 empezó a las 15:31 UTC, así que duró **unos 26 minutos reales, no 55**. Las horas de la sesión 1 posteriores a 15:45 eran estimaciones mías y se adelantaron al reloj. El orden de los eventos sí es correcto. Desde ahora cada entrada toma la hora de `date`.
- **Plan:** el Estratega marcó Salud, Automotriz y Servicios como los giros más rentables. Las colonias con 0 o 1 prospecto en el CSV son Providencia, Puerta de Hierro, Valle Real, Royal Country, Ciudad Granja, Santa Margarita, Ciudad del Sol, Arcos de Zapopan, Tabachines, Zapopan Centro, Tesistán y Jardines Universidad. Lanzo 5 agentes de investigación en paralelo, repartidos por giro y zona, y cada uno lee el CSV para no repetir negocios.
- Dejo fuera Comida y Oportunidades: la sesión 1 mostró que tienen bajo rendimiento (0 de 16 con 60+ y ningún proyecto freelance confirmable).

## 2026-11-18 15:59 UTC — Fase 1 de la sesión 2 lanzada (5 agentes en paralelo)
- **Salud A:** dentistas en Puerta de Hierro, Valle Real, Royal Country, Andares, Zapopan Centro, Arcos, Tabachines, Santa Margarita, Ciudad Granja y Seattle.
- **Salud B:** fisioterapia, dermatología, psicología, nutrición, podología, ópticas y veterinarias en Ciudad del Sol, Jardines Universidad, Providencia, Santa Margarita, Tesistán, Ciudad Granja y Arcos.
- **Automotriz:** hojalatería, transmisiones y especialidades en el norte (Santa Margarita, Tesistán, Centro, Tabachines, Belenes, Vallarta poniente).
- **Servicios:** abogados, notarías, inmobiliarias, contables, guarderías e idiomas en el poniente y el norte.
- **Rutas (agente nuevo):** su misión no es abrir zonas sino **hacer más densas las rutas existentes** (El Colli/Felipe Ruvalcaba y Ciudad del Sol/Mariano Otero). La sesión 1 mostró que el valor de una ruta crece con el número de paradas.
- Las zonas no se traslapan entre agentes, y todos leen el CSV para no repetir negocios.
