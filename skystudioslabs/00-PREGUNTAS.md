# Preguntas pendientes para Alex

## Para publicar (nada de esto se hizo; requiere tu aprobación)
- [ ] ¿Publico en producción (skystudioslabs.com) los cambios de esta ronda cuando estén listos?
- [ ] ¿Importo los 171 prospectos reales a la base de datos de producción (Supabase)? Queda listo el script, pero no lo ejecuté contra producción.

## Datos que faltan (no se inventaron)
- [ ] Correo de contacto (en el pie aparece `[MI_CORREO]`).
- [ ] Facebook de la empresa, o confirmar que no hay y quitar el espacio.
- [ ] Precios de los paquetes (en el sitio aparecen como `[PRECIO]`).

## Configuración pendiente (ya conocida)
- [ ] Supabase → Authentication → URL Configuration: Site URL sigue en `localhost` (el enlace por correo no funciona).
- [ ] Vercel → Production Branch sigue en `release/v3.8.54`.
- [ ] Confirmar que revocaste la llave secreta de Supabase que salió en una foto.
- [ ] ¿Quieres la etiqueta "contenido generado con IA" en el Reel (voz clonada)?
- [ ] La voz `marketing/video/voz.mp3` está en un repo público. ¿La quito?

## Del subagente de contenido (D)
- [ ] Precios del catálogo de la rama (nov 2026, sin IVA) — ¿siguen vigentes y se publican? Página web desde $2,500 (talleres/barberías) y $4,500 (consultorios); Google Maps $700 + $500/mes; Redes $2,500/mes (12 publicaciones); Chatbot desde $3,500 + $800/mes; combos Taller Visible $4,200 (+$700/mes), Agenda Llena $6,000 (+$3,000/mes), Consultorio Pro $9,900 (+$1,700/mes) o $12,900 con página Premium. ¿Con o sin IVA?
- [ ] Precio de los paquetes Básico, Estándar y Premium del sitio.
- [ ] El catálogo dice "hosting incluido el primer año", pero el mantenimiento de $1,099/mes incluye hosting. ¿Cuál es la regla?
- [ ] ¿Se ofrecen "2 rondas de cambios" y pago "50% anticipo / 50% al entregar"?
- [ ] Tiempo de entrega real (marcador `[TIEMPO DE ENTREGA]`).
- [ ] Aviso de privacidad: hace falta uno antes de prometer "no compartimos tus datos".
- [ ] ¿Creo las páginas de giro "abogados y contadores" y "consultorios médicos"? (hay ~15 y ~14 prospectos de esos giros en el CRM)
- [ ] Bocetos: algunos muestran el teléfono público del negocio, otros "[Teléfono por confirmar]". ¿Está bien así mientras sean propuestas privadas que caducan el 31 de diciembre?
- [ ] Los videos intro de los bocetos y los PDF de propuesta quedaron fuera (el sitio no sirve mp4/webm y los PDF traen precios sin confirmar).

## Del subagente de SEO (B)
- [ ] Logo en PNG cuadrado (fondo sólido, ≥112 px) para Google.
- [ ] ¿Ya existe tu Perfil de Negocio de Google (área de servicio: todo México)? Si sí, pásame el enlace para enlazarlo.
- [ ] Cuando tengas reseñas reales de Google, ¿las mostramos en el sitio?
- [ ] El menú tiene "Clientes" (`/#clientes`): confirmar que se queda (hoy muestra el gimnasio Wellness Fitness 5AM).

## Del subagente del CRM (C)
- [ ] ¿Aplicamos la migración `0003_admin_correo_confirmado.sql` en Supabase? (refuerza que solo tu correo confirmado sea admin)
- [ ] Los prospectos traen direcciones y textos ("mensaje", "guion") de Zapopan: ¿se quedan así? (son negocios de Zapopan reales)
- [ ] 8 prospectos que vienen de bocetos no tienen puntaje (entran con 0): ¿les asignamos uno?
- [ ] ¿Te parece bien el tope global de 30 códigos fallidos por hora? Si alguien lo provoca, el código se pausa una hora (el correo sigue funcionando).
- [ ] Los mensajes y guiones dicen "[Tu nombre]": ¿lo cambio por tu nombre?

## Del subagente de diseño (A)
- [ ] Reseñas reales (texto + nombre y negocio, con permiso) para la portada; mientras no haya, el bloque no se muestra.
- [ ] La constelación muestra 2 sitios activos (dato real) y deja espacio vacío: ¿la achicamos mientras haya pocos sitios?
