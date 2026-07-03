import { PrismaClient } from "@prisma/client";

// Singleton de Prisma para evitar abrir demasiadas conexiones en dev con hot reload.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reutiliza cliente global si ya existe; si no, crea uno nuevo.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Logs de Prisma: en debug muestra warnings, en otros casos solo errores.
    log: process.env.LOG_LEVEL === "debug" ? ["error", "warn"] : ["error"]
  });

// En dev lo dejamos en global para sobrevivir a recargas de Next.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
