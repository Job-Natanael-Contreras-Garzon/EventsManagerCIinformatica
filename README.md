# Portal de Gestión de Eventos — CI Informática

Aplicación web progresiva (PWA) de alto rendimiento para la **Facultad de Ingeniería Informática**, utilizada durante la **Semana Universitaria 2026**. Permite a estudiantes explorar torneos y ferias, registrarse individualmente o en equipos, y a administradores/coordinadores monitorear y gestionar toda la operación en tiempo real.

---

## Stack Tecnológico

- **Framework:** Next.js 16 (App Router con Server & Client Components)
- **Lenguaje:** TypeScript 5 (strict mode)
- **Estilos:** Tailwind CSS v4 con diseño responsive mobile-first y modo oscuro
- **Base de Datos & ORM:** PostgreSQL + Prisma 6 (transacciones ACID con `$transaction`)
- **Validación:** Zod 4 (esquemas isomórficos cliente/servidor)
- **Autenticación:** JWT + PBKDF2 (Web Crypto API), httpOnly cookies
- **Notificaciones Push:** Web Push API con VAPID
- **PWA:** Service Worker con estrategia cache-first, offline fallback
- **Contenedorización:** Docker (multi-stage build, alpine, non-root user)

---

## Funcionalidades Principales

### Módulo Público

- **Catálogo de Eventos y Ferias** (`/`): Tarjeta de bienvenida configurable, listado dinámico de torneos activos con indicador de cupos, y sección de ferias de emprendimiento.
- **Registro Inteligente** (`/registro`): Formulario adaptativo según el tipo de torneo:
  - **Individual**: nombre, correo, código universitario, celular (válido Bolivia).
  - **Equipo**: crear equipo (genera código único de 6 caracteres) o unirse a equipo existente (límite de 5 miembros).
- **Ticket Digital** (`/registro/exito`): Confirmación con código único, rol en el equipo y enlace directo a WhatsApp del encargado.
- **Offline** (`/offline`): Página de respaldo para navegación sin conexión.

### Panel de Administración (`/admin/*`)

Rutas protegidas por autenticación JWT con dos roles:

| Ruta | Descripción |
|---|---|
| `/admin/login` | Inicio de sesión de administradores/coordinadores |
| `/admin/dashboard` | Panel con métricas globales: jugadores, equipos, ocupación, progreso por torneo, registros recientes, editor de configuración del sistema |
| `/admin/eventos` | CRUD completo de torneos: crear/editar/duplicar, asignar categoría, imagen, campos personalizados, género, fecha límite, encargados, estado |
| `/admin/ferias` | CRUD de ferias de emprendimiento: nombre, descripción, costo, fechas, imagen, URL de registro |
| `/admin/usuarios` | Gestión de cuentas: crear/editar/eliminar administradores y coordinadores |
| `/admin/registrados` | Visualización y gestión de inscripciones: filtro por evento, registro manual |

### Sistema de Notificaciones Push

- Suscripción y desuscripción desde el navegador.
- Notificaciones al coordinador cuando se completa un registro en su evento.
- Recordatorio automático vía cron (`/api/cron/reminders`) 1 hora antes de cada evento.

### Características Técnicas

- Validación isomórfica con Zod (`react-hook-form` + Server Actions).
- Protección contra registros duplicados (código universitario/correo único por torneo).
- Límite de cupos y fecha de cierre automáticos.
- Imágenes de eventos/ferias almacenadas como Base64 en BD.
- Campos personalizables por evento (JSON) y campos deshabilitables.
- Service Worker para funcionalidad offline y recepción de notificaciones push.
- Refresh asíncrono del dashboard sin recargar la página.

---

## Comenzando

### Requisitos Previos

- Node.js 18+ (recomendado 20+)
- PostgreSQL 14+ (local o Supabase)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear variables de entorno
# Copia el archivo .env.example o crea .env con:
# DATABASE_URL, DIRECT_URL, NODE_ENV,
# NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_VAPID_PUBLIC_KEY,
# VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET

# 3. Ejecutar migraciones
npx prisma migrate dev

# 4. Sembrar datos iniciales (opcional)
npx prisma db seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (pooler) |
| `DIRECT_URL` | Connection string directa para migraciones |
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública VAPID para push |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID |
| `VAPID_SUBJECT` | Email de contacto VAPID |
| `CRON_SECRET` | Token de seguridad para endpoint cron |
| `NODE_ENV` | Entorno (`development` / `production`) |

### Docker

```bash
docker build -t events-manager-ci .
docker run -p 3000:3000 --env-file .env events-manager-ci
```

---

## Esquema de Base de Datos

El modelo de datos incluye 9 tablas principales:

- **Category** — Categorías de torneos (ej: Deportes, E-Sports)
- **Event** — Torneos con tipo (INDIVIDUAL/TEAM/OPEN), género, fecha, estado, capacidad, campos personalizados
- **Feria** — Ferias de emprendimiento con costo, fechas e imagen
- **Encargado** — Coordinadores asignados a eventos o ferias
- **Participant** — Datos de estudiantes inscritos
- **Registration** — Inscripciones con código de confirmación único (relación participant-evento)
- **Team** — Equipos con código único de 6 caracteres y líder
- **User** — Cuentas de administradores/coordinadores (roles ADMIN/COORDINATOR)
- **PushSubscription** — Suscripciones a notificaciones push por usuario
- **SystemConfig** — Configuración singleton de textos del catálogo público

---

## Arquitectura

El proyecto sigue una arquitectura modular con separación estricta de responsabilidades:

```
src/
├── app/           # Presentación y ruteo (App Router)
├── components/    # Componentes atómicos de UI reutilizables
├── lib/           # Clientes globales (Prisma singleton)
├── modules/       # Lógica de negocio por dominio
│   ├── auth/      # Autenticación, autorización, sesiones
│   ├── events/    # Gestión de torneos
│   ├── ferias/    # Gestión de ferias
│   ├── notifications/  # Notificaciones push
│   ├── registration/   # Registro de participantes
│   └── system-config/  # Configuración del sistema
└── middleware.ts  # Protección de rutas admin con JWT
```

Cada módulo de negocio sigue el patrón: **actions** (Server Actions) → **schema** (Zod) → **services** (Prisma queries), manteniendo la lógica de negocio fuera de la capa de presentación.

Ver `docs/arquitectura.md` para documentación detallada.

---

## Roles de Usuario

| Rol | Acceso |
|---|---|
| **ADMIN** | Acceso completo a todas las rutas y operaciones del panel |
| **COORDINATOR** | Visibilidad restringida a métricas y registros de sus eventos asignados |

---

## PWA

La aplicación es instalable como PWA con:
- Manifest con íconos adaptativos (192px, 512px, maskable)
- Service Worker con estrategia cache-first
- Soporte de notificaciones push
- Pantalla offline
- Modo standalone con orientación portrait
- Tema oscuro personalizado (#09090B) y color primario violeta (#7C3AED)
