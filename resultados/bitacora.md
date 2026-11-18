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
