# OpenFreedom · Identidad Original, Corrección Móvil y Animaciones Fluidas 0.5x

Plan de ingeniería y diseño para renombrar la marca a **OpenFreedom** con un nuevo logotipo original de vector SVG (onda sonora estilizada en forma de alas de libertad con el título posicionado debajo del isotipo), solucionar el desbordamiento de la barra superior en dispositivos móviles (evitando el recorte de los botones de idioma, cuota y GitHub evidenciado en la captura), e implementar un motor de animaciones ultra fluidas de alto rendimiento calibradas a escala x0.5 en toda la interfaz.

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones confirmadas durante la fase interactiva de preguntas:
>
> - **Identidad y Logotipo (Confirmado)**: Cambio de nombre a **OpenFreedom**. Creación de un isotipo vectorial original exclusivo que fusiona barras de ecualización/onda sonora ascendentes con la silueta geométrica de alas de libertad en gradiente esmeralda (`#10B981`) y cian (`#06B6D4`). En la cabecera y el hero, el nombre "OpenFreedom" se sitúa de forma armónica respecto al logotipo.
> - **Ajuste Móvil de la Barra Superior (Confirmado)**: Rediseño responsivo de la barra superior (`TopBar.tsx`). Para pantallas móviles ($\le 480\text{px}$), se implementa un diseño compacto que distribuye el ancho de forma proporcional: isotipo con wordmark compacto `shrink`, botones de Idioma (`ES` / `EN`), Cuota (`🔑 60`) y GitHub en versiones micro con padding ajustado (`px-2 py-1`), garantizando que **ningún botón quede cortado fuera de la pantalla**.
> - **Sistema de Animaciones Ultra-Rápidas a Escala 0.5x (Confirmado)**: Configuración global en Tailwind/CSS y Framer Motion:
>   - *Escala de animación de ventana*: 1x (despliegue completo y suave sin deformaciones).
>   - *Escala de animación de transición*: x0.5 (tiempo de respuesta rápido de 150ms a 200ms con curva `cubic-bezier(0.16, 1, 0.3, 1)`).
>   - *Escala de duración*: x0.5 (animaciones de apertura de modales, filtrado de tarjetas, hover interactivo y pestañas con latencia reducida a la mitad para una sensación nativa ágil).

---

### 1. Overview & Core Concept

- **What It Does**: Renueva la identidad visual bajo el nombre **OpenFreedom**, dotando al proyecto de un emblema original y reconocible. Resuelve de raíz el problema de layout en smartphones donde los botones de control se salían del margen derecho, y eleva la percepción de fluidez mediante aceleración de transiciones al 50% del tiempo estándar.
- **Target Audience / Persona**: Usuarios móviles y de escritorio que navegan en busca de software libre de audio y valoran una interfaz rápida, precisa, sin bugs visuales en pantallas pequeñas y con respuesta inmediata al tacto.
- **Key Value**: Acceso táctil inmediato a todos los controles (idioma, cuota, sincronización) en cualquier resolución de teléfono, identidad fresca con logo exclusivo y una experiencia de navegación hiper-reactiva.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Navegación Móvil Impecable*: En cualquier dispositivo móvil (como el capturado en la captura de pantalla), el usuario visualiza el nuevo logo de alas/ondas sonoras junto a **OpenFreedom**, con los botones de idioma (`[ 🇪🇸 ES ]`), cuota (`[ 🔑 60 ]`) y el enlace/icono de GitHub completamente dentro del viewport, con márgenes simétricos de 12px a cada lado.
  2. *Apertura de Modales Ágil*: Al tocar cualquiera de los botones, el modal se abre con animación de ventana escala 1x pero duración reducida x0.5 (~150ms), apareciendo de forma instantánea sin retrasos perceptibles.
  3. *Filtrado y Cambio de Vistas*: Al cambiar filtros o alternar entre vista de cuadrícula y lista, los elementos se acomodan de inmediato con transiciones fluidas a 150ms.
- **Visual Identity & Theme**:
  - *Logo OpenFreedom*: Isotipo SVG compuesto por barras de resonancia acústica que se elevan y despliegan hacia los lados emulando las alas de un ave en pleno vuelo, con gradiente `from-emerald-400 to-cyan-400` y reflejo sutil.
  - *Disposición Tipográfica*: Wordmark "OpenFreedom" con peso `font-extrabold tracking-tight text-white`, posicionado debajo del logo o en lockup compacto con balance óptico.
  - *TopBar Mobile Contract*: Contenedor con `w-full max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 overflow-x-hidden`. Los botones de acción usan `shrink-0 text-xs` con padding responsivo `px-2 py-1 sm:px-2.5 sm:py-1.5`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Isotipo SVG en código versus imagen estática**:
  - *Chosen Approach*: Implementar el logotipo vectorial en un componente React dedicado (`OpenFreedomLogo.tsx`) con trazados SVG matemáticos en gradiente.
  - *Why*: Carga en 0ms, nitidez perfecta en pantallas Retina/OLED de alta densidad móvil, sin riesgo de URLs externas rotas y fácilmente animable con CSS/Framer Motion.
- **Decisión 2: Prevenir desbordamiento móvil mediante `min-w-0` y flexbox elástico**:
  - *Chosen Approach*: Asignar `min-w-0 flex-1 truncate` al contenedor del logo en móvil y `flex items-center gap-1.5 shrink-0` a la zona de acciones, con etiquetas optimizadas (`ES`, `60`, icono GitHub visible).
  - *Why*: Elimina el bug de recorte del botón derecho visto en la captura del usuario, manteniendo todos los botones operables con área táctil $\ge 40\text{px}$.
- **Decisión 3: Curvas de animación a escala x0.5 (`150ms cubic-bezier(0.16, 1, 0.3, 1)`)**:
  - *Chosen Approach*: Sobrescribir las duraciones de transición estándar (que suelen ser de 300ms a 400ms) a 150ms-200ms con aceleración por hardware (`transform`, `opacity`), reduciendo a la mitad el tiempo de espera.
  - *Why*: Proporciona la sensación de rendimiento instantáneo ("Android 0.5x developer scale") que solicitó el usuario, manteniendo la elegancia visual.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cliente Web OpenFreedom                         │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 TopBar.tsx (Responsivo Móvil)                  │   │
│   │                                                                │   │
│   │   [ OpenFreedomLogo.tsx ]      [ Acciones Compactas ]          │   │
│   │   • Alas de onda sonora        • [ 🇪🇸 ES ]                    │   │
│   │   • Texto "OpenFreedom"        • [ 🔑 60 ]                    │   │
│   │   • flex shrink balanceado     • [ GitHub Icon ] (¡100% visible!│   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │              HeroSection.tsx & Componentes Base                │   │
│   │   • Logo Expandido con "OpenFreedom" posicionado debajo        │   │
│   │   • Subtítulo: "Apps de código abierto para escuchar música"   │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │               Motor de Animación Escala 0.5x                   │   │
│   │   • Transición: 150ms (0.5x duration)                          │   │
│   │   • Curva: cubic-bezier(0.16, 1, 0.3, 1)                       │   │
│   │   • Modales: scale(0.96) -> scale(1.0) en 150ms                │   │
│   │   • Tarjetas & Filtros: micro-feedback instantáneo             │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Archivos a modificar**:
  - `src/components/OpenFreedomLogo.tsx`: Nuevo componente vectorial del logo con concepto de ondas sonoras en alas de libertad.
  - `src/components/TopBar.tsx`: Integrar el nuevo logo, marca OpenFreedom y adaptar el layout responsivo móvil para que no se desborde ningún botón.
  - `src/components/HeroSection.tsx`: Incluir el nuevo logo original con el título "OpenFreedom" posicionado debajo del isotipo.
  - `src/index.css` & configuración de Tailwind: Definir clases de animación y transiciones aceleradas a escala 0.5x (`duration-150`, curvas de aceleración instantánea).
  - Modales (`QuotaMonitoringModal`, `LanguageModal`, `PinchtabDashboard`): Ajustar animaciones de entrada a 150ms y centrado seguro en móvil.
  - `metadata.json`, `index.html` y traducciones: Sincronizar el nombre OpenFreedom manteniendo el subtítulo oficial.
