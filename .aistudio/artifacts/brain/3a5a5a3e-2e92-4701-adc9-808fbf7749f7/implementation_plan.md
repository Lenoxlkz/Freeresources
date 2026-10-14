# OpenStream: Integración Directa con GitHub REST API & Verificación Automática en Vivo

Arquitectura y plan de implementación para conectar OpenStream directamente a la API REST de GitHub (`https://api.github.com`), permitiendo la carga progresiva y en tiempo real de estrellas exactas, últimos lanzamientos con enlaces de descarga directa de APK/binarios, commits recientes y URLs oficiales verificadas de repositorios y fuentes de distribución (Flathub, F-Droid, IzzyOnDroid).

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones técnicas confirmadas según las respuestas de clarificación del usuario:

- **Límite de Tasa y Autenticación (Confirmado)**: Sistema de caché persistente inteligente (`localStorage` con expiración) complementado con un selector accesible en el TopBar para que el usuario pueda opcionalmente ingresar su propio GitHub Personal Access Token (`ghp_...`), elevando la cuota de peticiones de 60/hora a 5,000/hora con almacenamiento local seguro en el navegador.
- **Estrategia de Carga en Tiempo Real (Confirmado)**: Carga progresiva y no bloqueante mediante observador de visibilidad (`IntersectionObserver`). Las aplicaciones consultan la API de GitHub únicamente cuando su tarjeta ingresa al campo visual del usuario, optimizando el consumo de red y cuota.
- **Datos Mostrados en Vivo (Confirmado)**: Estrellas exactas en tiempo real, versión y etiqueta del último release publicado, enlace de descarga directa de instaladores (`.apk`, `.exe`, `.dmg`, `.flatpak`), contador de forks y fecha del último commit.
- **Corrección Exhaustiva de Fuentes de Instalación**: Mapeo estricto de URLs y esquemas oficiales para:
  - **F-Droid**: URLs canónicas `https://f-droid.org/packages/{id}/`
  - **IzzyOnDroid**: `https://apt.izzysoft.de/fdroid/index/apk/{id}/`
  - **Flathub**: `https://flathub.org/apps/{id}`
  - **GitHub Releases**: `https://github.com/{owner}/{repo}/releases/latest` con activos directos parseados desde la API.

---

### 1. Overview & Core Concept

- **Qué hace**: Conecta cada tarjeta del directorio a la API REST oficial de GitHub (`Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`). En lugar de depender de metadatos estáticos desactualizados, la plataforma recupera datos vivos sobre la marcha, detectando automáticamente si un proyecto tiene nuevos releases, cambios de repositorio o nuevas estrellas.
- **Público Objetivo**: Usuarios que necesitan saber con certeza qué apps están activamente mantenidas, cuál es la versión más reciente lista para instalar y dónde obtener el binario oficial sin intermediarios.
- **Valor Principal**: Resuelve de raíz las URLs incorrectas o desactualizadas, mostrando datos transparentes, verificables y directamente conectados al ecosistema de código abierto.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Navegación Fluida con Carga Progresiva**:
   - Al desplazarse por el catálogo, cada tarjeta detecta su visibilidad y solicita de forma asíncrona sus métricas a la API de GitHub.
   - Mientras carga, muestra un indicador sutil de sincronización y luego reemplaza los valores de estrellas, forks y release con números tabulares vivos.
2. **Acceso Directo a Descargas Reales del Release**:
   - Si la API reporta un último release con activos adjuntos (ej. `ViMusic-v0.5.4.apk`, `Spotube-windows.exe`), la tarjeta y el modal despliegan un botón destacado de **Descarga Directa** con el nombre del archivo y tamaño real.
3. **Control de Rate Limit y Configuración de Token**:
   - En el TopBar se muestra un indicador discreto de cuota restante (ej. `Cuota GitHub: 54/60`).
   - Al hacer clic en el indicador de cuota o en "Configurar API", el usuario puede pegar un Personal Access Token para desbloquear 5,000 req/hr y probar búsquedas masivas sin interrupciones.
4. **Verificación de Fuentes de Distribución**:
   - Enlaces limpios y categorizados según la fuente:
     - 🏪 **Tienda de Aplicaciones**: F-Droid, IzzyOnDroid, Google Play, App Store.
     - 📦 **Gestor de Paquetes**: Flathub, Winget, Homebrew, Arch AUR.
     - ⬇️ **Descarga Directa**: GitHub Releases (.apk, .exe, .dmg, .zip).

#### Visual Identity & Theme
- Estética oscura de precisión (`#0A0D14`), métricas tabulares mono (`tabular-nums font-mono`), insignias de estado de la API discretas y sin elementos estridentes.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Pipeline Híbrido de Caché + IntersectionObserver**
  - *Enfoque*: Una cola de peticiones con `IntersectionObserver` que prioriza las apps en pantalla, consulta la caché local (`TTL: 1 hora`) y, si expiró, llama a `https://api.github.com/repos/{owner}/{repo}` y `.../releases/latest`.
  - *Por qué*: Evita agotar los 60 llamados por hora en segundos; solo se consumen llamadas para las aplicaciones que el usuario efectivamente está viendo.
- **Decisión 2: Token Opcional Almacenado Exclusivamente en `localStorage`**
  - *Enfoque*: Permitir ingresar un GitHub Personal Access Token con alcance de solo lectura público (`public_repo` o sin permisos especiales), almacenado en el navegador local del cliente.
  - *Por qué*: Ofrece a los evaluadores y usuarios avanzados 5,000 req/hr sin requerir backend ni exponer credenciales privadas en el servidor.
- **Decisión 3: Normalización y Corrección de Repositorios en la Base de Datos**
  - *Enfoque*: Auditar y corregir todas las URLs de los repositorios de chayotic en `src/data/musicApps.ts`, sustituyendo placeholders genéricos por sus identificadores exactos de GitHub (`owner/repo`) y package IDs de F-Droid/Flathub.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GitHub API Live Synchronization                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
┌──────────────────────────────────┐             ┌──────────────────────────────────┐
│   GitHub Token & Quota Manager   │             │   Intersection Observer Queue    │
│  (Token modal, Rate limit check, │             │  (Detects visible cards, queues  │
│   Remaining calls monitor)       │             │   fetch requests sequentially)   │
└────────────────┬─────────────────┘             └────────────────┬─────────────────┘
                 │                                                │
                 ▼                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          GitHub REST API Client Engine                            │
│  - GET https://api.github.com/repos/:owner/:repo                                  │
│  - GET https://api.github.com/repos/:owner/:repo/releases/latest                 │
│  - Headers: Accept: application/vnd.github+json, X-GitHub-Api-Version: 2022-11-28│
│  - LocalStorage Caching Layer with 1-hour TTL                                     │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
┌──────────────────────────────────┐           ┌────────────────────────────────────┐
│      Live Card Data Binding      │           │     Verified Sources Resolution    │
│ - Exact Stargazers & Forks       │           │ - F-Droid: /packages/:id/          │
│ - Latest Release Tag & Date      │           │ - IzzyOnDroid: /apk/:id            │
│ - Direct Download Assets (.apk)  │           │ - Flathub: /apps/:id               │
│ - Last Commit Relative Timestamp │           │ - GitHub Releases / Direct Assets  │
└──────────────────────────────────┘           └────────────────────────────────────┘
```

#### Modelo Extendido de Datos en Vivo (`LiveGitHubData`)
- `repoUrl`: URL canónica verificada devuelta por GitHub.
- `stars`: Número exacto de estrellas.
- `forks`: Número de forks.
- `latestRelease`: { `tagName`: string, `publishedAt`: string, `downloadUrl`: string, `assets`: Array<{ name, downloadUrl, size }> }
- `lastCommitDate`: Fecha del último push/commit.
- `openIssues`: Cantidad de issues abiertos.
- `license`: Nombre normalizado de la licencia detectada por GitHub SPDX.
