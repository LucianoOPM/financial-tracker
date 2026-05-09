├── src/
│   ├── app/                         # App Router (UI + routing)
│   │   ├── (auth)/                  # Rutas agrupadas (login, register, etc.)
│   │   ├── (dashboard)/             # Rutas protegidas
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   │   └── lib/                     # Adaptadores estilo Next (puente)
│   │       └── db.ts                # re-export desde db/client
│   │
│   ├── db/                          # Infraestructura de base de datos
│   │   ├── client.ts                # conexión (drizzle + pool)
│   │   ├── config.ts
│   │   ├── schema/                  # definición de tablas (Drizzle)
│   │   │   ├── user.ts
│   │   │   ├── session.ts
│   │   │   └── index.ts
│   │   ├── migrations/              # migraciones generadas
│   │   └── seed/
│   │       └── index.ts
│   │
│   ├── modules/                     # Dominio (feature-based)
│   │   ├── auth/
│   │   │   ├── auth.config.ts       # configuración Better Auth
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── user/
│   │   │   ├── user.model.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.types.ts
│   │   │
│   │   └── product/
│   │       ├── product.model.ts
│   │       ├── product.repository.ts
│   │       ├── product.service.ts
│   │       └── product.types.ts
│   │
│   ├── server/                      # lógica server-only
│   │   ├── actions/                 # Server Actions (Next.js)
│   │   │   └── user.actions.ts
│   │   ├── loaders/                 # data fetching server
│   │   └── services/                # orquestación entre módulos
│   │
│   ├── lib/                         # utilidades compartidas
│   │   ├── auth.ts                  # instancia Better Auth
│   │   ├── utils.ts
│   │   └── validators/              # zod schemas
│   │       └── user.validator.ts
│   │
│   ├── config/                      # configuración global
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   └── types/                       # tipos globales
│       └── index.ts
│
├── drizzle.config.ts                # config drizzle-kit
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env
