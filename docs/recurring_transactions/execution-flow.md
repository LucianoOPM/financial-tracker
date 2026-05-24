# Flujo de Ejecución

Documentación paso a paso del ciclo de vida de una ejecución de transacción recurrente.

---

## Visión general

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRIGGER                                  │
│  cron externo → GET /api/cron/recurring  OR  bun recurring:once │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    processAllDueRecurring()                      │
│  1. formatDateForDB(new Date())    → "2026-05-23"                │
│  2. getDueRecurring("2026-05-23")  → ["id1", "id2", ...]        │
│  3. Para cada ID: processSingleRecurring(id, todayStr)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼ (por cada ID)
┌─────────────────────────────────────────────────────────────────┐
│                    processSingleRecurring()                      │
│  db.transaction(async (tx) => {                                 │
│    SELECT ... FOR UPDATE SKIP LOCKED  → row o vacío             │
│    if vacío → return (otro worker lo tiene)                     │
│    re-validar condiciones dentro del lock                       │
│    executeRecurringTransaction(id, tx, new Date())              │
│    if !success → INSERT execution(failed), return               │
│  })                                                             │
│  if catch → INSERT execution(failed) en tx separada            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               executeRecurringTransaction()                      │
│  (dentro de la tx del caller)                                   │
│  1. Fetch recurring + cuentas                                   │
│  2. Validar cuentas activas                                     │
│  3. Validar endDate                                             │
│  4. INSERT transaction(s)                                       │
│  5. UPDATE financial_accounts (balance)                         │
│  6. UPSERT monthly_account_snapshots                            │
│  7. UPDATE recurring_transactions (nextExec, lastExecutedAt)    │
│  8. INSERT recurring_transaction_executions (success)           │
│  9. return { success: true, transactionId }                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplo: gasto mensual

### Estado inicial en DB

**recurring_transactions:**
```json
{
  "id": "clx1abc123",
  "userId": "usr_xyz",
  "accountId": "acc_main",
  "destinationAccountId": null,
  "type": "expense",
  "amount": "5000.00",
  "description": "Renta mensual",
  "frequency": "monthly",
  "intervalValue": 1,
  "startDate": "2026-01-01",
  "endDate": null,
  "nextExecutionDate": "2026-05-23",
  "lastExecutedAt": "2026-04-23T06:00:00Z",
  "isActive": true,
  "autoCreate": true
}
```

**financial_accounts (antes):**
```json
{ "id": "acc_main", "currentBalance": "25000.00", "isActive": true }
```

### Ejecución paso a paso

**1. Lock row (FOR UPDATE SKIP LOCKED):**
```sql
SELECT id, next_execution_date, is_active, auto_create
FROM recurring_transactions
WHERE id = 'clx1abc123'
FOR UPDATE SKIP LOCKED;
-- resultado: 1 fila → lock adquirido
```

**2. Re-validar condiciones:**
```
next_execution_date = "2026-05-23" <= "2026-05-23" ✓
is_active = true ✓
auto_create = true ✓
```

**3. Fetch con relaciones:**
```sql
SELECT rt.*, fa.*
FROM recurring_transactions rt
JOIN financial_accounts fa ON fa.id = rt.account_id
WHERE rt.id = 'clx1abc123';
```

**4. Validar:**
- `financialAccount.isActive = true` ✓
- `isPastEndDate(null, executionDate) = false` ✓

**5. INSERT transaction:**
```sql
INSERT INTO transactions (id, user_id, account_id, type, amount, description,
  transaction_date, status, recurring_transaction_id)
VALUES (
  'txn_new001', 'usr_xyz', 'acc_main', 'expense', '5000.00', 'Renta mensual',
  '2026-05-23T06:01:34.000Z', 'completed', 'clx1abc123'
);
```

**6. UPDATE balance (atomic):**
```sql
UPDATE financial_accounts
SET current_balance = current_balance + (-5000)
WHERE id = 'acc_main';
-- 25000.00 + (-5000) = 20000.00
```

**7. UPSERT snapshot:**
```sql
INSERT INTO monthly_account_snapshots (user_id, account_id, year, month, ...)
VALUES ('usr_xyz', 'acc_main', 2026, 5, ...)
ON CONFLICT DO UPDATE SET ...;
```

**8. Calcular siguiente fecha:**
```
calculateNextExecutionDate(new Date("2026-05-23"), "monthly", 1)
→ 2026-06-23
```

**9. UPDATE recurring:**
```sql
UPDATE recurring_transactions
SET
  next_execution_date = '2026-06-23',
  last_executed_at = NOW()
WHERE id = 'clx1abc123';
```

**10. INSERT execution record:**
```sql
INSERT INTO recurring_transaction_executions
  (recurring_transaction_id, transaction_id, status)
VALUES
  ('clx1abc123', 'txn_new001', 'success');
```

### Estado final en DB

**transactions (nuevo registro):**
```json
{
  "id": "txn_new001",
  "userId": "usr_xyz",
  "accountId": "acc_main",
  "type": "expense",
  "amount": "5000.00",
  "description": "Renta mensual",
  "transactionDate": "2026-05-23T06:01:34Z",
  "status": "completed",
  "recurringTransactionId": "clx1abc123"
}
```

**financial_accounts (actualizado):**
```json
{ "id": "acc_main", "currentBalance": "20000.00" }
```

**recurring_transactions (actualizado):**
```json
{
  "nextExecutionDate": "2026-06-23",
  "lastExecutedAt": "2026-05-23T06:01:34Z"
}
```

**recurring_transaction_executions:**
```json
{
  "recurringTransactionId": "clx1abc123",
  "transactionId": "txn_new001",
  "status": "success",
  "executedAt": "2026-05-23T06:01:34Z"
}
```

---

## Ejemplo: transferencia automática mensual

### Configuración

```json
{
  "type": "transfer",
  "accountId": "acc_main",
  "destinationAccountId": "acc_savings",
  "amount": "3000.00",
  "description": "Ahorro mensual",
  "frequency": "monthly"
}
```

### Diferencias con un gasto simple

El executor genera **dos transacciones** vinculadas con el mismo `transferGroupId`:

```sql
INSERT INTO transactions VALUES
  ('txn_out', 'usr_xyz', 'acc_main',    'transfer', '3000.00', ..., 'completed', 'clx1abc123', 'grp_abc', 'out'),
  ('txn_in',  'usr_xyz', 'acc_savings', 'transfer', '3000.00', ..., 'completed', 'clx1abc123', 'grp_abc', 'in');
```

Y actualiza **ambos balances**:
```sql
UPDATE financial_accounts SET current_balance = current_balance + (-3000) WHERE id = 'acc_main';
UPDATE financial_accounts SET current_balance = current_balance + 3000   WHERE id = 'acc_savings';
```

El `execution_record` referencia solo la transacción de salida (`txn_out`).

---

## Ejemplo: registro de falla

Si la cuenta origen está desactivada:

**El executor retorna:**
```json
{ "success": false, "error": "La cuenta financiera origen está inactiva o no existe" }
```

**El job inserta en recurring_transaction_executions:**
```json
{
  "recurringTransactionId": "clx1abc123",
  "transactionId": null,
  "status": "failed",
  "errorMessage": "La cuenta financiera origen está inactiva o no existe",
  "executedAt": "2026-05-23T06:01:34Z"
}
```

**Importante:** `nextExecutionDate` NO se avanza cuando falla. La recurrente se intentará de nuevo en la siguiente ejecución del job.

---

## Ejecución manual (`manualExecuteRecurring`)

La ejecución manual sigue el mismo flujo interno (llama al mismo `executeRecurringTransaction`), pero:
- Está expuesta como server action (`"use server"`)
- Requiere autenticación de sesión
- Valida que el recurringId pertenezca al usuario en sesión
- No redirige en caso de éxito (deja que el UI muestre una notificación)
- Puede ejecutarse aunque `autoCreate = false`

---

## Casos borde

### Recurrente con fecha de fin

Si `endDate = "2026-05-31"` y la siguiente ejecución calculada sería `"2026-06-23"`:

1. Se ejecuta normalmente (crea la transacción, actualiza balances)
2. Al calcular `nextDate = "2026-06-23"`, se detecta que `"2026-06-23" > "2026-05-31"`
3. Se actualiza `isActive = false` y `nextExecutionDate = "2026-06-23"` en la misma TX
4. El job ya no la procesará en el futuro

### Ejecución atrasada

Si el cron estuvo caído y hay recurrentes con `nextExecutionDate` de hace 3 días:
- El job las procesa normalmente en el primer run
- Se avanza `nextExecutionDate` a la siguiente fecha después del día de ejecución
- Se NO retroejecutan todas las fechas perdidas (solo la más reciente)
- Para retroejecutar, usar `manualExecuteRecurring` N veces

### Fecha de fin de mes

`calculateNextExecutionDate(new Date("2026-01-31"), "monthly", 1)`

`rrule` (RFC 5545) resuelve esto correctamente:
- Feb no tiene 31 días → resultado: `2026-02-28`
- En año bisiesto 2024: `2024-01-31 + monthly → 2024-02-29`
