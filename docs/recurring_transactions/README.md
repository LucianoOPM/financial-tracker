# Sistema de Transacciones Recurrentes

Documentación técnica para desarrolladores del módulo de automatización financiera.

---

## ¿Qué es este sistema?

Las **transacciones recurrentes** son plantillas que generan transacciones financieras reales de forma automática o manual. Una recurrente representa una **regla**, no dinero. Las transacciones que genera sí representan movimientos reales en los balances.

Ejemplos de uso:
- Sueldo mensual depositado automáticamente
- Renta fija cada mes
- Transferencia automática a cuenta de ahorro

---

## Arquitectura del sistema

```
lib/
  recurring/
    transactionHelpers.ts  ← Helpers de balance/snapshot compartidos
    scheduler.ts           ← Cálculo de fechas con rrule
    executor.ts            ← Motor de ejecución (core)
    job.ts                 ← Procesador batch con concurrencia segura

  schemas/
    recurring.ts           ← Validación Zod

  data/
    recurring.ts           ← Queries de lectura (data layer)

  actions/
    recurring.ts           ← Server actions CRUD + ejecución manual

app/
  api/
    cron/
      recurring/
        route.ts           ← Endpoint HTTP para cron externo

jobs/
  execute-recurring.ts     ← Script CLI standalone (node-cron daemon)

db/
  schemas/
    recurringTransactions.ts              ← Tabla de plantillas
    recurringTransactionExecutions.ts     ← Historial de ejecuciones
```

### Flujo de datos

```
Cron externo / CLI daemon
        ↓
app/api/cron/recurring (HTTP GET)  ─── o ───  jobs/execute-recurring.ts
        ↓
lib/recurring/job.ts → processAllDueRecurring()
        ↓ (por cada ID)
lib/recurring/job.ts → processSingleRecurring()
        ↓ (con db.transaction + FOR UPDATE SKIP LOCKED)
lib/recurring/executor.ts → executeRecurringTransaction()
        ↓
  INSERT transactions
  UPDATE financial_accounts (balance)
  UPSERT monthly_account_snapshots
  UPDATE recurring_transactions (nextExecutionDate, lastExecutedAt)
  INSERT recurring_transaction_executions (success/failed)
```

---

## Tabla de responsabilidades

| Módulo | Responsabilidad |
|---|---|
| `transactionHelpers.ts` | Delta de balance, actualización atómica, snapshot mensual |
| `scheduler.ts` | Cálculo de siguiente fecha (rrule), formateo DB, guard de endDate |
| `executor.ts` | Ejecuta UNA recurrente dentro de una tx externa |
| `job.ts` | Batch: obtiene IDs pendientes, procesa c/u en su propia tx con lock |
| `lib/actions/recurring.ts` | CRUD de server actions + `manualExecuteRecurring` |
| `lib/data/recurring.ts` | Queries de lectura sin mutaciones |
| `lib/schemas/recurring.ts` | Validación de entrada con Zod |
| `app/api/cron/recurring/route.ts` | Endpoint HTTP para disparar el batch desde cron externo |
| `jobs/execute-recurring.ts` | CLI: modo one-shot o daemon con node-cron |

---

## Tipos de transacciones recurrentes

| Tipo | Comportamiento |
|---|---|
| `income` | Genera 1 transacción. Incrementa balance de la cuenta origen. |
| `expense` | Genera 1 transacción. Decrementa balance de la cuenta origen. |
| `transfer` | Genera 2 transacciones vinculadas (out/in). Requiere `destinationAccountId`. |

---

## Estado de una recurrente

| Campo | Tipo | Significado |
|---|---|---|
| `isActive` | boolean | Si `false`, el scheduler la ignora |
| `autoCreate` | boolean | Si `false`, solo se puede ejecutar manualmente |
| `nextExecutionDate` | date (YYYY-MM-DD) | Cuando se ejecutará la próxima vez |
| `lastExecutedAt` | timestamp tz | Última ejecución exitosa |
| `endDate` | date (nullable) | Si se supera, se desactiva automáticamente |

---

## Variables de entorno requeridas

```env
DATABASE_URL=postgres://...              # Requerida (existía antes)
CRON_SECRET=<random-secret-32-chars>     # Requerida para el API route
RECURRING_CRON_SCHEDULE=0 6 * * *        # Opcional (default: 6 AM UTC diario)
```

---

## Quick start

### Ejecutar el job manualmente (una vez)

```bash
bun run recurring:once
```

### Iniciar el daemon (proceso de larga duración)

```bash
bun run recurring:start
```

### Disparar via HTTP (cron externo)

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  http://localhost:3000/api/cron/recurring
```

Respuesta esperada:
```json
{
  "success": true,
  "processed": 3,
  "skipped": 0,
  "failed": 0,
  "duration_ms": 245
}
```

---

## Decisiones técnicas

### ¿Por qué `rrule`?
El cálculo de fechas recurrentes tiene muchos edge cases (Jan 31 → Feb 28/29, años bisiestos, etc.). `rrule` implementa RFC 5545 (iCalendar) y los resuelve correctamente. Alternativa rechazada: implementación manual con `Date` — más propensa a errores.

### ¿Por qué `transactionHelpers.ts` en lugar de exportar desde `transactions.ts`?
`lib/actions/transactions.ts` tiene la directiva `"use server"`. En Next.js, esto convierte toda función async exportada en un server action RPC (serializable, con endpoint en el manifest). Extraer los helpers a un módulo neutral evita exponer funciones internas como server actions.

### ¿Por qué el executor no abre su propia transacción?
El executor opera dentro de la transacción del caller. Esto lo hace composable: tanto el job (que ya tiene una `db.transaction`) como `manualExecuteRecurring` pueden envolver al executor en su propia transacción. Si el executor iniciara la suya, sería una transacción anidada (no soportada nativamente en PostgreSQL).

### ¿Por qué `FOR UPDATE SKIP LOCKED`?
Es el mecanismo estándar para cola de trabajos en PostgreSQL. Si dos workers intentan procesar el mismo registro al mismo tiempo, el segundo obtiene 0 filas y omite el registro sin esperar. Garantiza exactamente-una-vez por ejecución de job.

### ¿Por qué el executor NO inserta el registro de falla?
Si el executor retorna `{ success: false }` o lanza una excepción, la transacción del caller puede estar por revertirse. Un insert dentro de una tx revertida no se commitea. El caller es responsable de insertar el failure record en una transacción separada.

---

## Ver también

- [`execution-flow.md`](./execution-flow.md) — Flujo paso a paso con payloads de ejemplo
- [`scheduler.md`](./scheduler.md) — Configuración del scheduler y cron
- [`balance-concurrency.md`](./balance-concurrency.md) — Lógica de balances, concurrencia e idempotencia
