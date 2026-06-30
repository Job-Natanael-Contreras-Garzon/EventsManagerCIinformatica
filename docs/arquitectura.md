# Arquitectura Modular — EventsManager CI Informática

> **Stack:** Next.js (App Router) · Prisma · PostgreSQL · Tailwind CSS · PWA

---

## Estructura de Directorios

```
├── prisma/
│   └── schema.prisma          # Definición de tablas (Modelos de BD)
├── src/
│   ├── app/                   # Capa de presentación y ruteo (App Router)
│   │   ├── layout.tsx         # Configuración global y registro de PWA
│   │   ├── page.tsx           # Catálogo de juegos (Vista móvil)
│   │   └── registro/          # Ruta para el formulario de inscripción
│   ├── components/            # Componentes atómicos de UI (Botones, Inputs)
│   ├── lib/                   # Clientes de servicios globales
│   │   └── db.ts              # Instancia única de Prisma Client
│   ├── modules/               # Lógica de negocio pura (Separada por dominio)
│   │   ├── events/            # Controladores y servicios para juegos
│   │   └── registration/      # Server Actions para inserción y códigos de equipo
│   │       ├── actions.ts     # Funciones ejecutadas en servidor (Server Actions)
│   │       ├── schema.ts      # Validaciones con Zod
│   │       └── services.ts    # Consultas directas a la BD a través de Prisma
│   └── public/                # Assets del PWA (manifest.json, iconos)
├── .env                       # Variables de entorno locales (Excluido de Git)
└── tailwind.config.ts
```

---

## Responsabilidades por Capa

### `prisma/schema.prisma`
- Única fuente de verdad del esquema de base de datos.
- Define todos los modelos, relaciones, enums e índices.
- Se gestiona exclusivamente a través de migraciones (`prisma migrate dev`).

---

### `src/app/` — Presentación y Ruteo
Implementa el **App Router** de Next.js 14+.

| Archivo / Carpeta | Responsabilidad |
|---|---|
| `layout.tsx` | Layout raíz: fuentes, metadatos globales, registro del Service Worker PWA |
| `page.tsx` | Página principal: catálogo de juegos disponibles (Server Component) |
| `registro/` | Subruta que contiene el formulario de inscripción de equipos |

**Regla:** Esta capa **no contiene lógica de negocio**. Solo orquesta componentes y delega acciones al módulo correspondiente.

---

### `src/components/` — UI Atómica
- Botones, Inputs, Cards, Modales y demás elementos reutilizables.
- Componentes **sin estado de negocio**: reciben props y emiten eventos.
- Deben cumplir touch targets mínimos de **44 × 44 px** (estándar móvil).
- Estilizados exclusivamente con **Tailwind CSS**.

---

### `src/lib/` — Clientes Globales

#### `db.ts`
- Exporta una **instancia singleton** de `PrismaClient`.
- Previene múltiples instancias en modo desarrollo (hot reload de Next.js).
- Es el **único punto de acceso** a la base de datos; ningún otro archivo importa `PrismaClient` directamente.

```ts
// Patrón singleton recomendado
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

### `src/modules/` — Lógica de Negocio

Cada subdirectorio representa un **dominio de negocio** independiente.

#### `modules/events/`
- Servicios y controladores relacionados con los juegos/eventos disponibles.
- Consultas de lectura sobre el catálogo de eventos.

#### `modules/registration/`
El módulo más crítico. Gestiona la inscripción de equipos.

| Archivo | Responsabilidad |
|---|---|
| `actions.ts` | Server Actions (`"use server"`): punto de entrada desde el cliente. Orquesta validación → lógica → BD. |
| `schema.ts` | Schemas de validación **Zod**: validación isomórfica cliente/servidor. |
| `services.ts` | Funciones de acceso a BD vía `db` (Prisma). Solo lectura/escritura, sin reglas de negocio. |

**Flujo de datos dentro del módulo:**

```
Cliente (formulario)
      ↓  llama
actions.ts  →  schema.ts (validación Zod)
               ↓  si válido
            services.ts  →  db.ts  →  PostgreSQL
```

---

### `public/` — Assets PWA
- `manifest.json`: configuración de instalabilidad (nombre, íconos, display mode).
- Íconos adaptativos en múltiples resoluciones (192px, 512px, maskable).
- Splash screens para iOS y Android.

---

### `.env` — Variables de Entorno
- **Excluido de Git** (`.gitignore`).
- Variable obligatoria: `DATABASE_URL` (connection string de PostgreSQL).
- Nunca hardcodear credenciales en el código fuente.

---

## Principios de la Arquitectura

1. **Separación estricta server/client**: los Server Components y Server Actions manejan datos; los Client Components manejan interactividad.
2. **Singleton de Prisma**: una sola instancia de `PrismaClient` en toda la aplicación.
3. **Validación isomórfica**: los schemas Zod de `schema.ts` se usan tanto en el cliente (react-hook-form) como en el servidor (Server Actions).
4. **Módulos por dominio**: la lógica de negocio nunca reside en `app/`; siempre en `modules/`.
5. **Assets PWA centralizados**: todos los archivos estáticos de la PWA viven en `public/`.

---

## Referencias de Skills Aplicadas

| Skill | Módulo aplicable |
|---|---|
| `NextJS_AppRouter_Expertise` | `src/app/` |
| `NextJS_ServerActions` | `src/modules/registration/actions.ts` |
| `Form_Validation_Zod` | `src/modules/registration/schema.ts` |
| `Prisma_Query_Optimization` | `src/modules/registration/services.ts`, `src/lib/db.ts` |
| `Tailwind_Component_Architect` | `src/components/` |
| `Tailwind_UX_Mobile` | `src/app/registro/` |
| `Responsive_Layout_Guard` | Global (`src/app/`, `src/components/`) |
| `PWA_Manifest_Spec` | `public/manifest.json` |
| `PWA_Assets_Spec` | `public/` |
| `Team_Code_Logic` | `src/modules/` (todos) |
