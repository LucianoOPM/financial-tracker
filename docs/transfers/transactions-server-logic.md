# Lógica del servidor — Módulo de Transacciones

Documento de referencia para implementar o extender la lógica de transacciones. Cubre schema, capa de datos, validación y server actions.

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `db/schemas/enums.ts` | Definición de `transferSideEnum` |
| `db/schemas/transactions.ts` | Tabla `transactions` con `transferSide` |
| `lib/schemas/transaction.ts` | Zod schema + tipo `TransactionSchema` |
| `lib/data/transactions.ts` | Funciones de consulta (read-only) |
| `lib/actions/transactions.ts` | Server actions: create, update, cancel, delete |

---

## 1. Schema de base de datos

### Enum `transfer_side` — `db/schemas/enums.ts`

```typescript
export const transferSideEnum = pgEnum("transfer_side", ["in", "out"]);
```

Todos los enums del proyecto siguen este patrón con `pgEnum`. No usar `text().$type<>()` porque no crea restricción en la BD.

### Columna añadida a `transactions` — `db/schemas/transactions.ts`

```typescript
transferSide: transferSideEnum("transfer_side"),
```

Es nullable por diseño: `null` para `income` y `expense`, `'out'` para el leg saliente de una transferencia, `'in'` para el leg entrante.

### Por qué existe `transferSide`

Las transferencias generan **dos filas** en `transactions` enlazadas por `transferGroupId`. Sin un campo de dirección, es imposible determinar en qué sentido viaja el dinero al consultar un solo registro. `transferSide` resuelve esto explícitamente.

| Campo | Leg saliente (origen) | Leg entrante (destino) |
|---|---|---|
| `accountId` | Cuenta financiera origen | Cuenta financiera destino |
| `transferGroupId` | mismo CUID2 | mismo CUID2 |
| `transferSide` | `'out'` | `'in'` |
| Efecto en saldo | `balance -= amount` | `balance += amount` |

---

## 2. Zod schema — `lib/schemas/transaction.ts`

```typescript
export const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive(),
  description: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().max(255).optional()),
  transactionDate: z.coerce.date(),
  status: z.enum(["pending", "completed", "cancelled"]).default("completed"),
  accountId: z.string().min(1),
  categoryId: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().optional()),
  destinationAccountId: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().optional()),
}).superRefine((data, ctx) => {
  if (data.type === "transfer") {
    if (!data.destinationAccountId) → error en destinationAccountId
    if (data.destinationAccountId === data.accountId) → error "misma cuenta"
  }
});

export type TransactionSchema = {
  type: "income" | "expense" | "transfer";
  amount: number;
  description?: string;
  transactionDate: Date;
  status: "pending" | "completed" | "cancelled";
  accountId: string;
  categoryId?: string;
  destinationAccountId?: string; // solo requerido cuando type === "transfer"
};
```

El tipo `TransactionSchema` se define manualmente porque `z.preprocess` hace que TypeScript infiera el input como `unknown`, lo que rompe `zodResolver` de React Hook Form. Este patrón se repite en `lib/schemas/financialAccount.ts`.

---

## 3. Capa de datos — `lib/data/transactions.ts`

Solo lectura. Nunca modifica la BD.

### Tipos

```typescript
type TransactionFilters = {
  accountId?: string;
  type?: "income" | "expense" | "transfer";
  status?: "pending" | "completed" | "cancelled";
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;   // default 50
  offset?: number;  // default 0
};

type TransactionWithRelations = TransactionSelect & {
  transactionCategory: { id, name, color, icon } | null;
  financialAccount: { id, name, type } | null;
};
```

### Funciones exportadas

#### `getTransactions(userId, filters?)`
Lista global de transacciones del usuario. Incluye `transactionCategory` y `financialAccount` via `with`. Orden: `desc(transactionDate)`.

#### `getTransactionById(userId, transactionId)`
Retorna una transacción con sus relaciones. `undefined` si no pertenece al usuario.

#### `getTransferPair(userId, transferGroupId, excludeId)`
Dado el `transferGroupId` y el id del leg actual, retorna el leg hermano. Usado internamente para operaciones sobre transferencias.

#### `getTransactionByIdForEdit(userId, transactionId)`
Igual que `getTransactionById` pero si es una transferencia incluye el leg par en `result.pair`. Necesario para que `updateTransaction` pueda revertir ambos legs.

```typescript
// Tipo de retorno
type Result = (TransactionWithRelations & { pair?: TransactionWithRelations }) | undefined
```

#### `getAccountTransactions(userId, accountId, limit?)` *(pre-existente)*
Transacciones de una cuenta financiera específica. Usado en la página de detalle de cuenta financiera.

#### `getCurrentMonthSnapshot(userId, accountId)` *(pre-existente)*
Snapshot del mes en curso para una cuenta financiera.

---

## 4. Server Actions — `lib/actions/transactions.ts`

Todas las funciones:
1. Verifican sesión con `auth.api.getSession({ headers: await headers() })`
2. Parsean la entrada con `transactionSchema.safeParse(data)`
3. Ejecutan mutaciones dentro de `db.transaction()` para atomicidad
4. Llaman `revalidatePath` y `redirect` al finalizar

### Helpers internos

#### `getBalanceDelta(type, transferSide, amount, direction)`

Centraliza el cálculo del delta de saldo. El parámetro `direction` es `'apply'` al crear/activar y `'revert'` al cancelar/eliminar.

| type | transferSide | apply | revert |
|---|---|---|---|
| `income` | `null` | `+amount` | `-amount` |
| `expense` | `null` | `-amount` | `+amount` |
| `transfer` | `'out'` | `-amount` | `+amount` |
| `transfer` | `'in'` | `+amount` | `-amount` |

#### `applyAccountBalanceDelta(tx, accountId, delta)`

Actualiza `current_balance` con una expresión SQL para evitar race conditions de lectura/escritura:

```typescript
await tx.update(financialAccount)
  .set({ currentBalance: sql`current_balance + ${delta}` })
  .where(eq(financialAccount.id, accountId));
```

#### `upsertMonthlySnapshot(tx, userId, accountId, year, month)`

Recalcula el snapshot **desde cero** (no incremental) para el mes/cuenta dados. Garantiza consistencia ante ediciones y cancelaciones.

Calcula:
- `incomeTotal` = suma de `amount` de transacciones `completed + income` del mes
- `expenseTotal` = suma de `amount` de transacciones `completed + expense` del mes
- `savingsTotal` = `incomeTotal - expenseTotal`
- `closingBalance` = `current_balance` actual de la cuenta financiera

Usa `INSERT ... ON CONFLICT DO UPDATE` sobre la unique constraint `(userId, year, month, accountId)`.

> Las transferencias no se incluyen en `incomeTotal` ni `expenseTotal` porque representan movimiento entre cuentas propias, no ganancia/pérdida neta.

#### `uniqueSnapshots(entries)`

Deduplica un array de `{ accountId, year, month }` para no recalcular el mismo snapshot dos veces en una sola operación (ej. cuando source y dest son del mismo mes).

---

### `createTransaction(data)`

**Tipos de error:**
```typescript
type CreateTransactionResult =
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };
```

**Flujo:**
1. Auth + Zod parse
2. Verificar que `accountId` es una cuenta financiera activa del usuario (via `getAccountById`)
3. Si `type === "transfer"`: verificar `destinationAccountId`
4. `db.transaction()`:
   - **income/expense**: insertar 1 fila
   - **transfer**: generar `transferGroupId = createId()` e insertar 2 filas (leg `'out'` y leg `'in'`)
   - Si `status === 'completed'`: aplicar deltas de saldo y upsert de snapshots
5. `revalidatePath('/transactions')`, `revalidatePath('/accounts')`, `redirect('/transactions')`

Los balances y snapshots solo se tocan si `status === 'completed'`. Las transacciones `pending` y `cancelled` no afectan saldo.

---

### `updateTransaction(transactionId, data)`

**Tipos de error:**
```typescript
type UpdateTransactionResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };
```

**Flujo dentro de `db.transaction()`:**
1. Revertir el efecto del estado anterior (si era `completed`)
   - Si era transferencia: revertir ambos legs
2. Si era `transfer` y el nuevo `type` no lo es: eliminar el leg par
3. Actualizar la fila principal con los nuevos datos
4. Si el nuevo `type === "transfer"`:
   - Si había leg par: actualizarlo
   - Si no había: insertar uno nuevo
5. Aplicar el efecto del nuevo estado (si el nuevo `status === 'completed'`)
6. Upsert de snapshots para **todos los meses afectados** (mes antiguo si cambió la fecha, mes nuevo, cuentas financieras de origen y destino)

El paso de upsert de snapshots usa `uniqueSnapshots` para deduplicar cuando origen y destino están en el mismo mes.

---

### `cancelTransaction(transactionId)`

Soft-cancel: cambia `status` a `'cancelled'` sin eliminar la fila.

**Tipos de error:**
```typescript
type CancelTransactionResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "ALREADY_CANCELLED"; message: string };
```

**Flujo:**
- Si `status === 'pending'`: solo cambia el status (no hay saldo que revertir)
- Si `status === 'completed'`: revertir saldo(s) → cambiar status → upsert snapshot(s)
- Si es transferencia: aplica a ambos legs en el mismo `db.transaction()`

---

### `deleteTransaction(transactionId)`

Hard delete. No hay recuperación posible.

**Tipos de error:**
```typescript
type DeleteTransactionResult = { error: "NOT_FOUND"; message: string };
```

**Flujo dentro de `db.transaction()`:**
1. Si `status === 'completed'`: revertir saldo(s)
2. Si es transferencia: eliminar leg par primero
3. Eliminar fila principal
4. Upsert snapshot(s) del mes afectado

Redirige a `/transactions` al finalizar.

---

## 5. Convenciones del proyecto a mantener

- **IDs**: siempre `createId()` de `@paralleldrive/cuid2`, nunca `uuid` ni autoincrement.
- **Montos**: almacenados como `string` en la BD (`numeric(14,2)`), convertir con `String(amount)` al insertar y `parseFloat(String(value))` al leer.
- **Enums**: siempre `pgEnum` en `db/schemas/enums.ts`. Nunca `text().$type<>()` para campos con valores restringidos.
- **Aislamiento por usuario**: toda consulta filtra por `userId` extraído de la sesión. Nunca confiar en IDs del cliente.
- **Cuentas financieras vs cuentas de sesión**: `financial_accounts` es el módulo financiero. `account` (singular, sin "financial") es la tabla de Better Auth para OAuth/sesiones. No confundirlos en nombres de variables, mensajes de error ni comentarios.
- **Sesión en server actions**: siempre `auth.api.getSession({ headers: await headers() })`.
- **Revalidación**: después de cualquier mutación, llamar `revalidatePath` en todas las rutas que muestran los datos modificados antes de `redirect`.
- **Snapshots**: siempre recalcular full, nunca incrementalmente. La función `upsertMonthlySnapshot` es la única responsable de escribir en `monthly_account_snapshots`.
