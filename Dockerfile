# ==========================================
# Etapa 1: Dependencias
# ==========================================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias e instalar de forma limpia
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# Etapa 2: Construcción (Build)
# ==========================================
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar el cliente de Prisma basado en el esquema del proyecto
RUN npx prisma generate

# Desactivar la telemetría de Next.js para mejorar la velocidad de construcción y privacidad
ENV NEXT_TELEMETRY_DISABLED=1

# Compilar la aplicación Next.js
RUN npm run build

# ==========================================
# Etapa 3: Ejecución (Runner)
# ==========================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario y grupo de sistema no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar los artefactos requeridos desde el builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Asignar la propiedad de los archivos copiados al usuario no-root
RUN chown -R nextjs:nodejs /app

# Cambiar al usuario no-root
USER nextjs

# Exponer el puerto por defecto de Next.js
EXPOSE 3000

# Arrancar la aplicación
CMD ["npm", "start"]
