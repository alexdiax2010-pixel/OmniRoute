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
