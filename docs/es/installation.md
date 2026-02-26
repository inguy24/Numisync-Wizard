---
layout: default
title: Guía de Instalación
lang: es
page_id: installation
---

# Guía de Instalación

NumiSync Wizard está disponible para **Windows**, **macOS** y **Linux**. Elige tu plataforma a continuación para ver las instrucciones de instalación.

---

## Requisitos del Sistema

### Todas las plataformas
- **OpenNumismat** instalado ([opennumismat.github.io](https://opennumismat.github.io/))
- **Clave de API de Numista** (gratuita en [numista.com](https://www.numista.com/))
- **RAM:** 4 GB mínimo, 8 GB recomendado
- **Almacenamiento:** 200 MB + espacio para caché

### Windows
- **SO:** Windows 10 (64 bits) o Windows 11
- **Procesador:** Intel Core i3 o equivalente

### macOS
- **SO:** macOS 10.13 High Sierra o posterior
- **Arquitectura:** Intel (x64) y Apple Silicon (M1/M2/M3 arm64)

### Linux
- **SO:** Ubuntu 20.04+, Debian 10+, Fedora 32+ o compatible
- **Arquitectura:** x64
- **Servidor de pantalla:** X11 o Wayland

---

## Instalación en Windows

### Opción 1: Microsoft Store (Próximamente)

NumiSync Wizard ha sido enviado a Microsoft Store y está pendiente de certificación. Una vez aprobado, podrás instalarlo directamente desde la Tienda con actualizaciones automáticas y sin advertencias de SmartScreen.

### Opción 2: Descarga Directa

#### Paso 1: Descargar NumiSync Wizard

1. Visita la [página de lanzamientos](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Descarga el instalador más reciente:
   - **Sistemas de 64 bits:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **Sistemas de 32 bits:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**¿No sabes qué versión elegir?** La mayoría de los sistemas Windows modernos son de 64 bits. Para comprobarlo:
- Haz clic derecho en **Este equipo** → **Propiedades**
- Busca "Tipo de sistema" (p. ej., "Sistema operativo de 64 bits")

#### Paso 2: Ejecutar el Instalador

1. **Haz doble clic** en el instalador descargado
2. Windows puede mostrar una advertencia de SmartScreen (instalador sin firmar)
   - Haz clic en **"Más información"** → **"Ejecutar de todas formas"**
3. Acepta el Contrato de Licencia para el Usuario Final (EULA)
4. Elige el directorio de instalación (predeterminado: `C:\Program Files\NumiSync Wizard`)
5. Haz clic en **Instalar**
6. Espera a que se complete la instalación
7. Haz clic en **Finalizar** para lanzar NumiSync Wizard

#### Paso 3: Primer Inicio

En el primer inicio, NumiSync Wizard:
- Creará un directorio de caché en `%LOCALAPPDATA%\numisync-wizard-cache`
- Se abrirá sin ninguna colección cargada

---

## Instalación en macOS

**Importante:** NumiSync Wizard **no está firmado** con un certificado de Apple Developer. macOS lo bloqueará por defecto. Sigue estos pasos para instalarlo:

### Paso 1: Descargar NumiSync Wizard

1. Visita la [página de lanzamientos](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Descarga el último DMG:
   - **DMG Universal:** `NumiSync-Wizard-1.0.0-universal.dmg` (funciona tanto en Intel como en Apple Silicon)
   - **Específico para Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**La mayoría de los usuarios deben descargar el DMG Universal.**

### Paso 2: Instalar la App

1. **Abre el DMG** haciendo doble clic
2. **Arrastra NumiSync Wizard** a tu carpeta de Aplicaciones
3. **Expulsa el DMG** (clic derecho → Expulsar)

### Paso 3: Omitir Gatekeeper (Obligatorio)

Como la app no está firmada, macOS la bloqueará. Usa el **Método 1** (el más sencillo):

#### Método 1: Abrir con clic derecho (Recomendado)

1. **Ve a la carpeta Aplicaciones** en el Finder
2. **Haz clic derecho** (o Control+clic) sobre NumiSync Wizard
3. Selecciona **"Abrir"** en el menú
4. Haz clic en **"Abrir"** en el diálogo de seguridad
5. La app se iniciará — **los lanzamientos futuros funcionarán con normalidad** (solo haz doble clic)

#### Método 2: Preferencias del Sistema

1. Intenta abrir la app normalmente (será bloqueada)
2. Ve a **Preferencias del Sistema** → **Seguridad y privacidad** → **General**
3. Haz clic en **"Abrir de todas formas"** junto al mensaje de la app bloqueada
4. Haz clic en **"Abrir"** en el diálogo de confirmación

#### Método 3: Terminal (Avanzado)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Para una solución de problemas detallada, consulta la [Guía de Instalación en macOS](/macos-install).**

### Paso 4: Primer Inicio

En el primer inicio, NumiSync Wizard:
- Creará un directorio de caché en `~/Library/Application Support/numisync-wizard-cache`
- Se abrirá sin ninguna colección cargada

---

## Instalación en Linux

NumiSync Wizard está disponible en tres formatos para Linux. Elige según tu distribución:

### Opción 1: AppImage (Universal - Recomendado)

**Ideal para:** Todas las distribuciones

1. Descarga `NumiSync-Wizard-1.0.0.AppImage` desde [Lanzamientos](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Hazlo ejecutable:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Ejecútalo:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Opcional:** Intégralo con tu entorno de escritorio usando [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Opción 2: Debian/Ubuntu (.deb)

**Ideal para:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Descarga el archivo .deb
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Instala
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Instala dependencias si es necesario
sudo apt-get install -f
```

Lánzalo desde el menú de aplicaciones o ejecuta:
```bash
numisync-wizard
```

### Opción 3: Fedora/RHEL (.rpm)

**Ideal para:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Descarga el archivo .rpm
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Instala
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# O con dnf (recomendado)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Lánzalo desde el menú de aplicaciones o ejecuta:
```bash
numisync-wizard
```

### Primer Inicio (Linux)

En el primer inicio, NumiSync Wizard:
- Creará un directorio de caché en `~/.config/numisync-wizard-cache`
- Se abrirá sin ninguna colección cargada

---

## Configuración Inicial

**Nota:** Estos pasos son iguales en todas las plataformas (Windows, macOS, Linux)

### 1. Añadir Tu Clave de API de Numista

1. Haz clic en **Settings** (icono de engranaje) o pulsa `Ctrl+,`
2. Ve a la pestaña **API Settings**
3. Introduce tu clave de API de Numista
4. Haz clic en **Save**

**Cómo obtener una clave de API:**
1. Ve a [numista.com](https://www.numista.com/) y crea una cuenta gratuita
2. Inicia sesión → Perfil → Acceso a API
3. Solicita una clave de API (aprobación instantánea para uso personal)
4. Copia la clave y pégala en NumiSync Wizard

### 2. Abrir Tu Colección

1. Haz clic en **File → Open Collection** (el atajo de teclado varía según la plataforma)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navega hasta tu archivo `.db` de OpenNumismat
3. Selecciona el archivo y haz clic en **Open**
4. Tus monedas se cargarán en la ventana principal

### 3. Configurar los Ajustes de Datos (Opcional)

1. Ve a **Settings → Data Settings**
2. Elige qué datos sincronizar:
   - **Basic** - Datos del catálogo a nivel de tipo (tirada, composición, gobernante, diseñador)
   - **Issue** - Datos específicos de la emisión (año, marca de ceca, variantes de tipo)
   - **Pricing** - Precios de mercado actuales (grados UNC, XF, VF, F)
3. Configura el mapeo de campos si es necesario (solo para usuarios avanzados)

---

## Verificar la Instalación

### Probar la Funcionalidad Básica

1. Selecciona algunas monedas de tu colección
2. Haz clic en el botón **Search & Enrich**
3. NumiSync debería buscar en Numista y encontrar coincidencias
4. Revisa las coincidencias en la interfaz de comparación de campos
5. Acepta una coincidencia para verificar que las actualizaciones de datos funcionan

Si ves coincidencias y puedes actualizar los datos de las monedas, ¡la instalación fue exitosa!

---

## Solución de Problemas

### Problemas en Windows

**El instalador no se ejecuta:**
- Advertencia de SmartScreen: haz clic en "Más información" → "Ejecutar de todas formas"
- Antivirus bloqueando: añade una excepción para el instalador
- Descarga corrupta: vuelve a descargar y verifica el tamaño del archivo

**La aplicación no inicia:**
- Revisa el Visor de eventos: Registros de Windows → Aplicación
- Dependencias faltantes: instala [Visual C++ Redistributable](https://learn.microsoft.com/es-es/cpp/windows/latest-supported-vc-redist)
- Interferencia del antivirus: añade una excepción para `NumiSync Wizard.exe`

### Problemas en macOS

**"NumiSync Wizard está dañado y no se puede abrir":**
- Elimina el DMG y vuelve a descargarlo
- Verifica que el tamaño del archivo coincide con la página de lanzamientos
- Prueba el Método 1 (clic derecho → Abrir)

**"No hay opción de Abrir en el diálogo de seguridad":**
- Hiciste doble clic en lugar de clic derecho
- Usa el Método 1 o el Método 2 de los pasos de instalación anteriores

**La app se cierra inmediatamente:**
- Revisa la app Consola para ver los registros de errores
- Informa del problema con la versión de macOS y el registro de errores

**Consulta la [Guía de Instalación en macOS](/macos-install) para una solución de problemas detallada.**

### Problemas en Linux

**AppImage no se ejecuta:**
- Asegúrate de que es ejecutable: `chmod +x *.AppImage`
- Instala FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Intenta ejecutarlo desde la terminal para ver los mensajes de error

**La instalación del .deb falla:**
- Instala dependencias: `sudo apt-get install -f`
- Verifica los requisitos del sistema (Ubuntu 20.04+)

**La instalación del .rpm falla:**
- Instala dependencias: `sudo dnf install <nombre-del-paquete>`
- Verifica los requisitos del sistema (Fedora 32+)

**Librerías faltantes:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Todas las plataformas

**No se puede abrir la colección:**
- Verifica que el archivo `.db` existe y no está corrupto
- Asegúrate de tener permisos de lectura y escritura
- Cierra OpenNumismat si tiene la colección abierta
- Prueba File → Recent Collections

**La clave de API no funciona:**
- Copia y pega con cuidado (sin espacios adicionales)
- Comprueba los límites de velocidad (120 solicitudes/minuto)
- Verifica que tu cuenta de Numista está activa
- Prueba la clave en la página de documentación de la API de Numista

**Problemas con el directorio de caché:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Verifica los permisos de escritura
- Limpia la caché si está corrupta

---

## Desinstalación

### Windows

1. Ve a **Configuración → Aplicaciones → Aplicaciones y características**
2. Busca "NumiSync Wizard"
3. Haz clic en **Desinstalar**
4. Sigue las instrucciones del desinstalador

**Limpieza manual (opcional):**
- Eliminar caché: `%LOCALAPPDATA%\numisync-wizard-cache`
- Eliminar configuración: `%APPDATA%\numisync-wizard`

### macOS

1. Cierra la aplicación
2. Elimina `NumiSync Wizard.app` de la carpeta Aplicaciones
3. **Limpieza opcional:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Simplemente elimina el archivo `.AppImage`

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# O con dnf
sudo dnf remove numisync-wizard
```

**Limpieza manual (todos los Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Actualizar a una Nueva Versión

NumiSync Wizard comprobará si hay actualizaciones al iniciarse (si está habilitado en Settings).

### Actualización Automática (Cuando Esté Disponible)
1. Haz clic en la notificación **"Update Available"**
2. La descarga comenzará automáticamente
3. La instalación procederá cuando se complete la descarga
4. La aplicación se reiniciará con la nueva versión

### Actualización Manual
1. Descarga el último instalador desde [Lanzamientos](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Ejecuta el instalador
3. Detectará y actualizará automáticamente la instalación existente
4. Tu configuración y caché se conservarán

---

## Próximos Pasos

- **[Guía de Inicio Rápido](/es/quickstart)** - Empieza en 5 minutos
- **[Manual de usuario](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentación completa de funciones
- **[Obtener una Licencia Supporter](/es/license)** - Desbloquea Fast Pricing Mode y Auto-Propagate

---

## ¿Necesitas ayuda?

- **Problemas:** [Reportar en GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Preguntas:** [Pregunta a la comunidad](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentación:** [Documentación completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/es/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Volver al inicio</a>
  <a href="/es/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Siguiente: Inicio Rápido →</a>
</div>
