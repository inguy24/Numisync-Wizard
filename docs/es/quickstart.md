---
layout: default
title: Guía de Inicio Rápido
lang: es
page_id: quickstart
---

# Guía de Inicio Rápido

Empieza a usar NumiSync Wizard en 5 minutos. Esta guía te lleva paso a paso por el flujo de trabajo básico para enriquecer tu colección de monedas.

**Nota sobre plataformas:** Esta guía es válida para Windows, macOS y Linux. Los atajos de teclado se muestran para todas las plataformas cuando difieren.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **NumiSync Wizard instalado** ([Guía de Instalación](/es/installation))
- **Colección de OpenNumismat** (archivo .db con algunas monedas)
- **Clave de API de Numista** (gratuita en [numista.com](https://www.numista.com/))

---

## Paso 1: Iniciar y Configurar

### Abrir NumiSync Wizard

1. Lanza NumiSync Wizard:
   - **Windows:** Menú Inicio o acceso directo del escritorio
   - **macOS:** Carpeta Aplicaciones o Launchpad
   - **Linux:** Menú de aplicaciones o ejecuta `numisync-wizard` (si se instaló mediante .deb/.rpm)
2. El primer inicio creará un directorio de caché automáticamente

### Añadir Tu Clave de API

1. Haz clic en **Settings** (icono de engranaje) o pulsa:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Ve a la pestaña **API Settings**
3. Pega tu clave de API de Numista
4. Haz clic en **Save**

**¿No tienes clave de API?** Obtén una gratis en [numista.com](https://www.numista.com/) → Perfil → Acceso a API

---

## Paso 2: Abrir Tu Colección

1. Haz clic en **File → Open Collection** o pulsa:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navega hasta tu archivo `.db` de OpenNumismat
3. Haz clic en **Open**
4. Tus monedas se cargarán en la ventana principal

**Consejo:** NumiSync recuerda las colecciones recientes. Usa **File → Recent Collections** para acceder rápidamente.

---

## Paso 3: Buscar Coincidencias

### Seleccionar Monedas para Enriquecer

Puedes enriquecer monedas de una en una o en lotes:

- **Moneda individual:** Haz clic en una fila para seleccionarla
- **Varias monedas:** Mantén pulsada la tecla modificadora y haz clic en varias filas
  - **Windows/Linux:** `Ctrl+Clic`
  - **macOS:** `Cmd+Clic`
- **Rango:** Haz clic en la primera moneda, mantén `Shift` y haz clic en la última
- **Todas las monedas:** Seleccionar todo
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Iniciar la Búsqueda

1. Haz clic en el botón **Search & Enrich** (o pulsa `F2`)
2. NumiSync buscará en Numista cada moneda seleccionada
3. El indicador de progreso muestra el estado actual

**Qué ocurre:**
- Busca usando denominación, país, año y marca de ceca
- Gestiona variaciones (p. ej., "Cent" vs "Cents", "España" vs "Spain")
- Admite calendarios no gregorianos (años Meiji, años Hijri, etc.)
- Usa resultados en caché cuando están disponibles (¡más rápido!)

---

## Paso 4: Revisar Coincidencias

### Comprender los Resultados de la Búsqueda

Tras la búsqueda, cada moneda muestra uno de tres estados:

- **Match Found** - Se encontró una entrada en el catálogo de Numista
- **Multiple Matches** - Varias posibilidades (se necesita selección manual)
- **No Match** - No se encontró ninguna entrada (prueba la búsqueda manual)

### Ver la Comparación de Campos

1. Haz clic en una moneda con coincidencia
2. El **Field Comparison Panel** muestra:
   - **Columna izquierda:** Tus datos existentes
   - **Columna derecha:** Datos del catálogo de Numista
   - **Diferencias resaltadas** en color
3. Revisa qué cambiará

---

## Paso 5: Aceptar o Ajustar Coincidencias

### Aceptar Todos los Cambios

Si la coincidencia parece correcta:
1. Haz clic en el botón **Accept Match** (o pulsa `Enter`)
2. Todos los datos de Numista actualizarán tu moneda inmediatamente
3. La moneda queda marcada como enriquecida

### Selección de Campos Individuales

Para actualizar solo campos específicos:
1. En el Field Comparison Panel, **desmarca** los campos que no quieras actualizar
2. Haz clic en **Accept Match**
3. Solo se actualizarán los campos marcados

### Elegir una Emisión Diferente

Muchas monedas tienen múltiples emisiones (años, marcas de ceca, tipos):

1. Haz clic en el botón **Choose Issue**
2. El **Issue Picker Dialog** muestra todas las variantes
3. Selecciona la emisión correcta para tu moneda
4. La comparación de campos se actualiza con los datos de esa emisión
5. Haz clic en **Accept Match**

### Búsqueda Manual

Si no se encontró ninguna coincidencia automáticamente:
1. Haz clic en el botón **Manual Search** o pulsa:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Modifica los parámetros de búsqueda (denominación, año, país)
3. Haz clic en **Search**
4. Navega por los resultados y selecciona la entrada correcta
5. Haz clic en **Accept Match**

---

## Paso 6: Descargar Imágenes (Opcional)

### Descarga Automática de Imágenes

Si **Data Settings → Images** está habilitado:
- Las imágenes se descargan automáticamente al aceptar una coincidencia
- Imágenes de anverso, reverso y canto (si están disponibles)
- Se almacenan en el directorio de imágenes de OpenNumismat

### Descarga Manual de Imágenes

1. Selecciona una moneda enriquecida
2. Haz clic en el botón **Download Images**
3. Elige qué imágenes descargar (anverso, reverso, canto)
4. Haz clic en **Download**

**Consejo:** Usa **Image Comparison** para previsualizar antes de aceptar

---

## Flujos de Trabajo Habituales

### Flujo 1: Enriquecer una Colección Nueva

1. Abre la colección con muchas monedas sin enriquecer
2. Selecciona todas las monedas (`Ctrl+A`)
3. Haz clic en **Search & Enrich** (o pulsa `F2`)
4. Revisa las coincidencias una por una
5. Acepta las coincidencias a medida que avanzas
6. Usa la búsqueda manual para las monedas sin coincidencia

**Ahorro de tiempo:** de 2-3 minutos por moneda a 10-15 segundos por moneda

### Flujo 2: Actualizar Solo los Precios

1. Ve a **Settings → Data Settings**
2. Desmarca **Basic** e **Issue** (deja **Pricing** marcado)
3. Selecciona las monedas a actualizar
4. Haz clic en **Search & Enrich**
5. Acepta las coincidencias (solo se actualizan los precios)

**Consejo Pro:** Obtén una [Licencia Supporter](/es/license) para usar **Fast Pricing Mode** — ¡actualiza todas las monedas identificadas al instante!

### Flujo 3: Corregir Coincidencias Incorrectas

1. Selecciona una moneda con datos incorrectos
2. Haz clic en **Manual Search**
3. Encuentra la entrada correcta del catálogo
4. Acepta la coincidencia
5. Los datos antiguos se sobreescriben

**Consejo:** Usa **Field Comparison** para verificar antes de aceptar

---

## Consejos para Mejores Resultados

### Consejos de Búsqueda

**Mejores prácticas:**
- Empieza con monedas que tengan información completa (año, país, denominación)
- Usa abreviaturas de denominación estándar ("1 Cent" en lugar de "1c")
- Deja que NumiSync normalice las denominaciones automáticamente

**Evita:**
- Buscar monedas con campos críticos vacíos (país, denominación)
- Editar las consultas de búsqueda manualmente salvo que sea necesario
- Dar por hecho que la primera coincidencia es correcta — ¡verifica siempre!

### Calidad de los Datos

**Mejores prácticas:**
- Revisa la comparación de campos antes de aceptar
- Usa el Issue Picker cuando existan múltiples variantes
- Verifica que las imágenes coinciden con tu moneda física

**Evita:**
- Aceptar todas las coincidencias a ciegas
- Sobreescribir buenos datos con datos incompletos del catálogo
- ¡Olvidarte de hacer una copia de seguridad de tu colección primero!

### Rendimiento

**Mejores prácticas:**
- Activa la caché (Settings → General → Cache)
- Trabaja en lotes de 10-20 monedas
- Usa Fast Pricing Mode para actualizaciones masivas (Licencia Supporter)

**Evita:**
- Buscar más de 1000 monedas a la vez (respeta los límites de velocidad, pero es lento)
- Desactivar la caché (desperdicia llamadas a la API)
- Buscar la misma moneda varias veces (usa la caché)

---

## Atajos de Teclado

**Windows/Linux:**
- `Ctrl+O` - Abrir colección
- `F2` - Search & Enrich de las monedas seleccionadas
- `Ctrl+F` - Búsqueda manual
- `Enter` - Aceptar coincidencia
- `Escape` - Cancelar/Cerrar diálogo
- `Ctrl+A` - Seleccionar todas las monedas
- `Ctrl+,` - Abrir configuración
- `F1` - Abrir ayuda

**macOS:**
- `Cmd+O` - Abrir colección
- `F2` - Search & Enrich de las monedas seleccionadas
- `Cmd+F` - Búsqueda manual
- `Enter` - Aceptar coincidencia
- `Escape` - Cancelar/Cerrar diálogo
- `Cmd+A` - Seleccionar todas las monedas
- `Cmd+,` - Abrir configuración
- `F1` - Abrir ayuda

---

## ¿Qué viene después?

### Explorar Funciones Premium

Obtén una **[Licencia Supporter ($10)](/es/license)** para desbloquear:
- **Fast Pricing Mode** - Actualización masiva de precios para todas las monedas identificadas
- **Auto-Propagate** - Aplica datos de tipo a monedas coincidentes automáticamente
- **¡Sin más avisos molestos!**

### Funciones Avanzadas

- **Field Mapping** - Personaliza cómo los datos de Numista se asignan a tus campos
- **Operaciones masivas** - Procesa cientos de monedas de forma eficiente
- **Soporte multimáquina** - Comparte la caché entre dispositivos
- **Ubicación de caché personalizada** - Almacena la caché en una unidad de red

### Aprende más

- **[Manual de usuario](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentación completa de funciones
- **[Preguntas frecuentes](#)** - Respuestas a preguntas habituales
- **[Tutoriales en vídeo](#)** - ¡Próximamente!

---

## ¿Necesitas Ayuda?

### Problemas Comunes

**P: ¿Por qué no encontró mi moneda?**
- R: El país o la denominación puede necesitar normalización. Prueba la búsqueda manual con variaciones.

**P: ¿Por qué no se actualizan algunos campos?**
- R: Revisa **Data Settings** — puede que algunas categorías de datos estén desactivadas.

**P: ¿Puedo deshacer una coincidencia aceptada?**
- R: No automáticamente. Restaura desde una copia de seguridad o revierte los datos manualmente.

**P: ¿Cómo actualizo los precios sin cambiar otros campos?**
- R: Settings → Data Settings → Desmarca Basic e Issue, deja Pricing marcado.

**P: ¿Qué ocurre si busco una moneda dos veces?**
- R: NumiSync usa los resultados en caché (instantáneo) a menos que hagas clic en "Refresh from API".

### Obtener Soporte

- **Problemas:** [Reportar en GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Preguntas:** [Pregunta a la comunidad](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentación:** [Documentación completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/es/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Guía de Instalación</a>
  <a href="/es/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Volver al inicio</a>
</div>
