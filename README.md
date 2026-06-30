# Portal de Gestión de Eventos - CI Informática 🎮

Este proyecto es una aplicación web y Progressive Web App (PWA) de alto rendimiento diseñada para la Facultad de Ingeniería Informática, utilizada durante la **Semana Universitaria 2026**. Permite a los estudiantes explorar los torneos disponibles, registrarse individualmente o en equipos de manera simplificada, y a los administradores monitorear la ocupación y participantes en tiempo real.

---

## 🛠️ Stack Tecnológico

- **Frontend & Routing:** Next.js 14+ (App Router con Server & Client Components)
- **Estilos:** Tailwind CSS con diseño responsive Mobile-First y estética premium (modo oscuro)
- **Base de Datos & ORM:** PostgreSQL + Prisma ORM (con transacciones seguras `$transaction`)
- **Validación de Datos:** Zod (esquemas isomórficos aplicados en cliente y servidor)
- **PWA (Progressive Web App):** Soporte offline y criterios de instalabilidad para dispositivos móviles

---

## 🚀 Comenzando

### Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior recomendada)
- **PostgreSQL** (instancia local o en la nube)

### Instalación y Configuración

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto con la siguiente variable para la base de datos:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/events_manager?schema=public"
   ```

3. **Ejecutar Migraciones de Base de Datos:**
   Prepara el esquema en la base de datos de PostgreSQL usando Prisma:
   ```bash
   npx prisma migrate dev
   ```

4. **Sembrar Datos Iniciales (Opcional):**
   Si deseas inicializar categorías y eventos de ejemplo:
   ```bash
   npx prisma db seed
   ```

5. **Iniciar Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 👤 Guía del Usuario (Clientes/Participantes)

La aplicación cuenta con una interfaz mobile-first optimizada para pantallas táctiles, donde los estudiantes pueden inscribirse a los torneos.

### 1. Catálogo de Juegos y Torneos
Al acceder al portal (`/`), los usuarios verán una tarjeta de bienvenida y el catálogo dinámico de eventos en vivo.
- **Visualización de tarjetas:** Cada juego muestra su categoría, descripción corta, fecha/hora y encargados del torneo.
- **Indicador "En Vivo" / Cupos:** Muestra dinámicamente si hay registros abiertos y cuántas personas/equipos se han inscrito.

### 2. Proceso de Registro (`/registro`)
Al pulsar en **Inscribirse** en cualquier torneo activo del catálogo, se abrirá el formulario inteligente que cuenta con dos modos de registro según la naturaleza del juego:

#### A. Torneos Individuales (Ej: Ajedrez, Clash Royale)
Los campos obligatorios son:
- **Nombre Completo:** Solo letras y espacios.
- **Correo Electrónico:** Dirección válida.
- **Código Universitario:** Código de estudiante (alfanumérico y guiones, entre 6 y 20 caracteres).
- **Número de Celular:** Celular válido de Bolivia (8 dígitos, empezando con 6 o 7, ej: 70712345).

#### B. Torneos en Equipo (Ej: Valorant, League of Legends, Futsal)
Los usuarios disponen de una pestaña doble de interacción:
1. **Crear un Equipo:**
   - El primer usuario introduce el **Nombre del Equipo** y sus datos personales como **Líder del Equipo**.
   - Al finalizar, el sistema genera un **Código de Equipo** único de 6 caracteres (ej: `A8B2C4`).
   - El líder debe compartir este código con sus compañeros de equipo.
2. **Unirse a un Equipo:**
   - Los compañeros de equipo seleccionan esta pestaña.
   - Introducen el **Código de Equipo** proporcionado por el líder y completan sus datos personales.
   - El sistema los unirá automáticamente al mismo grupo (límite estándar de 5 miembros por equipo).

### 3. Confirmación y Ticket Digital (`/registro/exito`)
Una vez completado el registro con éxito:
- Se muestra una pantalla de confirmación interactiva estilo **Ticket Digital**.
- Contiene un **Código de Confirmación** único.
- Muestra el rol en el equipo (si corresponde) y un botón de acceso directo para coordinar mediante **WhatsApp** con los encargados oficiales del torneo.

---

## 🔑 Guía de Administración (Admins)

La consola de administración está diseñada para centralizar las métricas clave de ocupación y los flujos de inscripción durante la Semana Universitaria.

### 1. Panel de Control (`/admin/dashboard`)
Al acceder al panel de control, los administradores tienen acceso a:
- **Métricas Globales de Resumen:**
  - **Jugadores:** Cantidad total de participantes individuales inscritos en la base de datos.
  - **Equipos:** Número total de equipos creados para torneos grupales.
  - **Ocupación Global:** Porcentaje total de ocupación sumando las capacidades máximas de todos los torneos activos.
- **Ratio de Inscripciones por Torneo:**
  - Listado de todos los juegos con barras de progreso visuales avanzadas.
  - Indica el número exacto de inscritos contra el límite máximo definido (ej: `4 / 8 Equipos` o `12 / 20 Jugadores`).
  - Apoya el control visual mediante colores diferenciados para torneos individuales (verde) y grupales (violeta).
- **Tabla de Registros Recientes:**
  - Muestra un feed en tiempo real de las últimas 10 inscripciones completadas.
  - Incluye el nombre del participante, el torneo correspondiente, el tipo de inscripción (Individual o Equipo), el código de confirmación y la fecha/hora exacta del registro.
- **Acción de Refresco Rápido:**
  - Cuenta con un botón de **Actualizar** en la parte superior derecha para sincronizar el estado actual de la base de datos de manera asíncrona sin necesidad de recargar toda la página web.

---

## 🛡️ Reglas y Validaciones de Seguridad

- **Evitar Duplicados:** El sistema impide transaccionalmente que un mismo código universitario o correo electrónico se registre más de una vez en un mismo torneo.
- **Fechas Límite:** No se permiten inscripciones a eventos cuya fecha límite haya expirado o si el cupo del torneo está completo.
- **Límite por Equipo:** Un código de equipo solo permite hasta un máximo de 5 participantes. Cualquier intento adicional lanzará un error controlado en la UI.
