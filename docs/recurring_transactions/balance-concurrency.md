# Balance, Concurrencia e Idempotencia

---

## Lógica de balances

### Función `getBalanceDelta`

```typescript
function getBalanceDelta(
  type: "income" | "expense" | "transfer",
  transferSide: "in" | "out" | null | undefined,
  amount: number,
  direction: "apply" | "revert",
): number
```

| Tipo | TransferSide | Delta (direction=apply) |
|---|---|---|
| `income` | — | `+amount` |
| `expense` | — | `-amount` |
| `transfer` | `out` (cuenta origen) | `-amount` |
| `transfer` | `in` (cuenta destino) | `+amount` |

Con `direction=revert`, el delta se invierte (multiplicado por -1).

### Aplicación atómica del balance

```typescript
await tx.update(financialAccount)
  .set({ currentBalance: sql`current_balance + ${delta}` })
  .where(eq(financialAccount.id, accountId));
```

El uso de `sql\`current_balance + ${delta}\`` (expresión SQL nativa) evita la race condition de lectura-modificación-escritura. Si dos workers leyeran el balance simultáneamente, ambos calcularían con el valor "viejo". Con la expresión SQL, la suma se resuelve en el motor de PostgreSQL donde el lock de fila garantiza la atomicidad.

---

## Cuentas de crédito

Las cuentas de tipo `credit` representan **deuda** (pasivo).

Convención del sistema: `currentBalance < 0` significa deuda.

```
currentBalance = -12000  →  deuda de $12,000
currentBalance = 0       →  sin deuda
```

### Comportamiento de los deltas en crédito

La **misma lógica de delta** aplica sin casos especiales:

| Operación | Delta aplicado | Balance resultante | Interpretación |
|---|---|---|---|
| Gasto en crédito (expense) | `-amount` | más negativo | Más deuda |
| Pago de crédito (income) | `+amount` | menos negativo | Menos deuda |
| Pago completo (income = deuda) | `+amount` | 0 | Sin deuda |

**Ejemplo:**
```
balance_inicial = -8000  (deuda de $8,000)
pago de $3,000 → delta = +3000
balance_final  = -5000  (deuda de $5,000)
```

No es necesario conocer el tipo de cuenta en `getBalanceDelta` — la convención de signos hace que la fórmula sea universal.

---

## Consistencia transaccional

Toda ejecución de una recurrente se realiza dentro de una única transacción PostgreSQL (`db.transaction`). Esto garantiza que:

1. Las transacciones financieras y los balances son consistentes entre sí
2. Los snapshots mensuales reflejan el estado post-ejecución
3. El `nextExecutionDate` y `lastExecutedAt` solo se actualizan si todo lo anterior tuvo éxito
4. Si cualquier paso falla, **todo se revierte** (ningún balance queda desactualizado)

---

## Concurrencia y locking

### Problema

Si dos instancias del job corren simultáneamente (múltiples workers, cron que se solapa con el anterior), sin control podrían procesar el mismo registro dos veces → duplicación de transacciones y balances incorrectos.

### Solución: `FOR UPDATE SKIP LOCKED`

```sql
SELECT id, next_execution_date, is_active, auto_create
FROM recurring_transactions
WHERE id = $1
FOR UPDATE SKIP LOCKED
```

**Cómo funciona:**
1. El primer worker adquiere el lock de fila en la transacción
2. El segundo worker intenta lo mismo → obtiene 0 filas (SKIP LOCKED, no espera)
3. El segundo worker omite este registro y sigue con el siguiente
4. Cuando el primer worker hace commit, el lock se libera
5. El segundo worker ya pasó a otro registro, no vuelve al primero

### Flujo de concurrencia

```
Worker A                          Worker B
─────────────────────────────────────────────────────
BEGIN TX
SELECT ... FOR UPDATE SKIP LOCKED
→ obtiene fila, lock adquirido
                                  BEGIN TX
                                  SELECT ... FOR UPDATE SKIP LOCKED
                                  → 0 filas (locked by A), SKIP
                                  → outcome = "skipped"
                                  COMMIT TX (vacío)
executeRecurringTransaction(...)
INSERT transactions, UPDATE balance...
UPDATE nextExecutionDate
INSERT execution(success)
COMMIT TX → lock liberado
```

### ¿Por qué procesar de a un registro por transacción?

En lugar de bloquear un batch completo en una sola transacción, cada registro tiene su propia transacción. Esto:
- Minimiza el tiempo de lock por fila
- Aísla fallos (un registro que falla no impide procesar los demás)
- Permite que otros workers procesen registros en paralelo mientras uno falla

---

## Idempotencia

### Garantía dentro de un solo run

Un mismo ID de recurrente no puede ser procesado dos veces en la misma ejecución del job porque:
1. `getDueRecurring` devuelve cada ID una sola vez
2. `processSingleRecurring` procesa cada ID con su propia transacción

### Garantía entre runs consecutivos

La idempotencia entre dos invocaciones del job (e.g., cron corre a las 6:00 y también a las 6:01 por un solapamiento) se garantiza por:

1. `nextExecutionDate` se avanza **dentro de la misma transacción** que crea las transacciones
2. El segundo run llama a `getDueRecurring("2026-05-23")` pero el registro ya tiene `next_execution_date = "2026-06-23"` → no aparece en la lista
3. Incluso si apareciese (race condition entre el SELECT inicial y el lock), el re-check dentro del lock verifica `row.next_execution_date > todayStr` → skip

### ¿Es verdaderamente idempotente?

**Sí**, ante múltiples runs en el mismo día. Un registro solo se procesa una vez por `nextExecutionDate`.

**No** ante ejecución manual repetida: `manualExecuteRecurring` no tiene guard por fecha — puede ejecutarse N veces en el mismo día y generará N transacciones. Esto es intencional (el usuario lo está pidiendo explícitamente).

---

## Re-validación dentro del lock

La secuencia `getDueRecurring` → `processSingleRecurring` tiene una ventana de tiempo entre:
1. La lectura inicial de IDs (sin lock)
2. El lock real dentro de la transacción

En esa ventana, las condiciones pueden cambiar (e.g., el usuario desactiva la recurrente). Por eso, dentro del lock, se re-validan:

```typescript
if (!row.is_active || !row.auto_create || row.next_execution_date > todayStr) {
  return; // skip
}
```

Esto garantiza que nunca se ejecute una recurrente en estado inconsistente.

---

## Edge cases

### Account desactivada entre la creación de la recurrente y su ejecución

El executor valida `financialAccount.isActive` antes de crear transacciones. Si la cuenta fue desactivada:
- El executor retorna `{ success: false, error: "..." }`
- El job inserta un registro de falla en `recurring_transaction_executions`
- `nextExecutionDate` NO se avanza → se reintentará en el próximo run
- Si la cuenta se reactiva antes del siguiente run, se ejecutará normalmente

### Recurrente desactivada durante ejecución

Si `isActive` se pone a `false` mientras el job ya adquirió el lock:
- La transacción del job hace commit normalmente (ya tenía el lock)
- El executor no verifica `isActive` de nuevo después del lock (el re-check del job ya lo hizo)
- En el siguiente run, `isActive = false` → no aparece en `getDueRecurring`

### Error de DB durante ejecución

Si PostgreSQL falla (timeout, conexión perdida) durante la ejecución:
- La transacción se revierte automáticamente
- El catch del job inserta un registro de falla en una transacción separada
- `nextExecutionDate` no fue avanzado → se reintentará en el próximo run
- El reintento puede ser idempotente si la transacción original nunca commiteó

### `amount` como string en Drizzle

Drizzle mapea columnas `numeric(14,2)` a strings en TypeScript. El executor parsea el amount con `parseFloat(String(rec.amount))` antes de pasarlo a `getBalanceDelta`. Los strings de amount en los INSERTs son `String(rec.amount)` directamente, preservando la precisión exacta sin floats intermedios.

---

## Troubleshooting

### Las recurrentes no se ejecutan

1. Verificar que `isActive = true` y `autoCreate = true`
2. Verificar que `nextExecutionDate <= hoy` (formato `YYYY-MM-DD`)
3. Verificar que el cron/daemon esté corriendo o que el API route sea accesible
4. Revisar `recurring_transaction_executions` para ver si hay registros `status = 'failed'`

### Duplicados en transactions

Si hay duplicados, verificar:
1. ¿Se ejecutó `manualExecuteRecurring` múltiples veces?
2. ¿El `FOR UPDATE SKIP LOCKED` está funcionando? (Correr 2 workers simultáneos y verificar 1 solo execution record)
3. Revisar que `nextExecutionDate` se haya avanzado después de la ejecución

### Balance incorrecto

El balance se actualiza con `sql\`current_balance + ${delta}\``. Si está incorrecto:
1. Revisar los deltas en `getBalanceDelta` con el tipo y `transferSide` correctos
2. Verificar que no haya transacciones duplicadas (ver punto anterior)
3. Recalcular manualmente: sumar income y restar expenses de `transactions` para el account

### `recurring_transaction_executions` no tiene registros

Si el job corre pero no hay execution records:
1. Puede que no haya recurrentes `due` — verificar `nextExecutionDate`
2. El job puede estar encontrando 0 IDs en `getDueRecurring`
3. Revisar logs del daemon o respuesta del API route con el campo `processed`
