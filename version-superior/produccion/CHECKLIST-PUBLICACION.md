# Checklist de publicación (un video a la vez)

> **Publicar lo haces tú**, desde YouTube Studio o la app de YouTube. Nadie más sube ni publica nada.
> Los textos (título, descripción, capítulos, etiquetas) y las miniaturas los preparan otras partes
> del equipo. Aquí solo se indica **de dónde tomarlos**:
>
> - Título, descripción, capítulos y etiquetas: carpeta **`version-superior/youtube/`** (un archivo por video).
> - Miniatura: carpeta **`version-superior/miniaturas/`**.
> - Shorts: carpeta **`version-superior/shorts/`**.
>
> Si en esas carpetas todavía no está el archivo de un video, espera a que esté listo; no lo
> improvises.

---

## A. Una sola vez, antes del primer video

- [ ] **Cambiar el nombre del canal** de "Sky_StudioLabs" a **Versión Superior**: YouTube Studio →
      Personalización → Información básica → Nombre.
- [ ] **Cambiar el handle**: en la misma pantalla. Opciones: `@versionsuperior` o
      `@versionsuperiormx`. YouTube te dice si está libre.
      YouTube limita cuántas veces puedes cambiar el nombre y el handle en un periodo corto, así que
      decídelo bien antes de cambiarlo.
- [ ] **Foto del canal**: Personalización → Imagen de perfil. Usa la opción 3, `perfil-3-texto.png`.
- [ ] **Verificar el canal con tu teléfono** (youtube.com/verify). Sin esto **no puedes subir
      miniaturas personalizadas**: YouTube solo te deja elegir un cuadro del video.
- [ ] Revisa que estén activadas las funciones intermedias: YouTube Studio → Configuración →
      Canal → **Elegibilidad de funciones**.

## B. Antes de subir cada video

- [ ] El `.log` de `producir.ps1` dice **OK** para ese video y una **duración de más de 8:00**.
- [ ] Viste **la vista previa completa** (`videoNN_vista_previa.mp4`) en el celular:
  - [ ] la voz se oye bien;
  - [ ] las tarjetas "#N" coinciden con lo que se dice;
  - [ ] ninguna foto tiene logos, marcas ni famosos.
- [ ] **Video 4:** ya no dice "de eso ya hay un video entero en el canal" (ver `INSTRUCCIONES.md`,
      paso 4).
- [ ] **Video 4:** ya decidiste el título (el original o "9 Hábitos de la Mañana que DESTRUYEN tu
      Confianza").
- [ ] Decidiste si va **Público**, **Oculto** o **Programado**.

## C. Al subir (YouTube Studio → Crear → Subir videos)

Sube **`videoNN_final.mp4`**, el de 1080p. No subas la vista previa.

**Detalles**
- [ ] **Título**: cópialo de `youtube/`.
- [ ] **Descripción**: cópiala de `youtube/`. Incluye los **capítulos** (`0:00 …`). El primero debe
      empezar en `0:00`, y en total debe haber al menos 3, de 10 segundos o más cada uno.
  - [ ] Si cortaste la frase del video 4, los tiempos de los capítulos posteriores al minuto 5:28 se
        adelantan unos 2–3 segundos. Compruébalos con el video final.
- [ ] **Miniatura**: súbela desde `miniaturas/`. Requiere el canal verificado (punto A).
- [ ] **Lista de reproducción**: agrégalo a la lista del canal. Si todavía no existe, créala con el
      nombre que proponga `youtube/`.
- [ ] **Público**: **"No, no es contenido creado para niños"**.
- [ ] **Restricción de edad**: no.

**Mostrar más**
- [ ] **Contenido alterado o sintético: Sí**. La voz es un clon hecho con IA.
- [ ] **Etiquetas**: cópialas de `youtube/`.
- [ ] Idioma del video: **Español (México)**.
- [ ] Categoría: **Consejos y estilo**.
- [ ] Ubicación del video: opcional (México).

**Elementos del video**
- [ ] **Subtítulos**: deja que YouTube los genere y revísalos después.
- [ ] **Pantalla final**: en los últimos 5–20 segundos agrega "Suscribirse" y un video: "Video más
      reciente" o "El más adecuado para el usuario". Desde el video 2 en adelante ya hay videos
      anteriores para enlazar.
- [ ] **Tarjetas**: agrega 1 o 2 tarjetas hacia videos anteriores del canal, en el momento en que
      tenga sentido. No pongas tarjetas a videos que todavía no existen.

**Comprobaciones y visibilidad**
- [ ] Espera a que **Comprobaciones** termine sin problemas de derechos de autor.
- [ ] Elige **Público**, **Oculto** o **Programar** (fecha y hora).
- [ ] Después de publicar, abre el video desde otro dispositivo y confirma:
  - [ ] que se ve en HD;
  - [ ] que salen los capítulos;
  - [ ] que la miniatura es la correcta.

## D. Video 1 en concreto (el enlace de OneDrive no funcionó)

El archivo es `C:\Users\alexa\OneDrive\Documentos\Version Superior\video01\video01_final.mp4`.
Ya está terminado. Tiene sus 3 shorts listos.

**Opción 1: desde la PC (la más sencilla)**
1. Abre **studio.youtube.com** en el navegador con la cuenta del canal.
2. Haz clic en **Crear → Subir videos** y arrastra `video01_final.mp4` desde el Explorador de
   archivos. No hace falta ningún enlace.
3. Sigue la sección C.

**Opción 2: desde el celular**
1. En la app **OneDrive** del celular, abre `Documentos/Version Superior/video01/`.
2. Toca los tres puntos de `video01_final.mp4` → **Descargar** (o "Guardar"), para que quede en la
   galería.
   - Usa **Wi-Fi**, porque el archivo es grande.
3. Abre la app **YouTube** → botón **+** → **Subir un video** → elige el video de la galería.
4. En el celular hay menos opciones. Sube el video como **Oculto** o **Privado** y termina estos
   puntos desde la PC en YouTube Studio:
   - miniatura;
   - pantalla final;
   - tarjetas;
   - "contenido alterado";
   - capítulos.
   Después cámbialo a Público o Programado.

**Shorts del video 1:** súbelos después del video largo, para poder enlazarlo desde cada short
("video relacionado"). Los textos están en `shorts/`.

## E. Al terminar cada video

- [ ] Actualiza el Estado del video en Notion ("Guiones YouTube") a **Publicado**.
- [ ] Anota la fecha y si quedó Público, Oculto o Programado.
