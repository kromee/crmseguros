import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.io"],
  // Evita que Next escanee el home del usuario como raíz del monorepo
  turbopack: {
    root: __dirname,
  },
  // No empaquetar drivers pesados en el bundle del servidor
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-mariadb",
    "mariadb",
    "bcryptjs",
  ],
  // Compilación on-demand: solo compila la ruta que abres, no todas
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  // Importaciones optimizadas para reducir bundle (especialmente lucide-react)
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
