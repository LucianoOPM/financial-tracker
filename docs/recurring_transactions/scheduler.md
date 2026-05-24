# Scheduler y Configuración del Cron

---

## Dos modos de ejecución

El sistema soporta dos estrategias para el scheduling, complementarias:

### 1. CLI daemon con node-cron (proceso de larga duración)

Ideal para servidores tradicionales Node.js o Docker.

```bash
bun run recurring:start
# o directamente:
tsx jobs/execute-recurring.ts
```

El proceso queda corriendo y ejecuta el job según el schedule configurado.

**Configuración:**
```env
RECURRING_CRON_SCHEDULE=0 6 * * *    # default: 6 AM UTC diario
```

**Expresiones cron comunes:**

| Schedule | Expresión |
|---|---|
| Cada día a las 6 AM UTC | `0 6 * * *` |
| Cada hora | `0 * * * *` |
| Cada 6 horas | `0 */6 * * *` |
| Cada día a medianoche UTC | `0 0 * * *` |
| Lunes a las 8 AM UTC | `0 8 * * 1` |

---

### 2. API Route para cron externo (recomendado para producción serverless)

El endpoint `GET /api/cron/recurring` puede ser disparado por cualquier servicio externo.

**URL:** `https://tu-dominio.com/api/cron/recurring`
**Método:** GET o POST
**Auth:** `Authorization: Bearer <CRON_SECRET>`

#### Vercel Cron

En `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/recurring",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Vercel agrega automáticamente el header `Authorization: Bearer <CRON_SECRET>` si configuras el secret en los environment variables del proyecto.

#### cron-job.org

1. Crear nuevo cron job
2. URL: `https://tu-dominio.com/api/cron/recurring`
3. Método: GET
4. Header personalizado: `Authorization: Bearer <CRON_SECRET>`
5. Schedule: `0 6 * * *`

#### GitHub Actions

```yaml
# .github/workflows/recurring.yml
name: Recurring transactions
on:
  schedule:
    - cron: '0 6 * * *'
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -f -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/cron/recurring
```

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | Conexión PostgreSQL |
| `CRON_SECRET` | ✓ | — | Token para proteger el API route |
| `RECURRING_CRON_SCHEDULE` | — | `0 6 * * *` | Schedule del daemon CLI |

**Generación de `CRON_SECRET`:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# o simplemente un UUID
```

---

## Ejecución one-shot (testing / CI)

```bash
bun run recurring:once
# o:
tsx jobs/execute-recurring.ts --once
```

Sale con código `0` si todo fue exitoso, `1` si hubo alguna falla.

Útil para:
- Testing en desarrollo
- CI/CD pipelines que quieren verificar que el job funciona
- Backfill manual de recurrentes atrasadas

---

## Respuesta del API route

```json
{
  "success": true,
  "processed": 5,
  "skipped": 2,
  "failed": 1,
  "duration_ms": 1234,
  "errors": ["[clx1abc123] La cuenta financiera origen está inactiva o no existe"]
}
```

| Campo | Significado |
|---|---|
| `processed` | Transacciones generadas exitosamente |
| `skipped` | Omitidas (lock ocupado por otro worker, o condiciones cambiaron) |
| `failed` | Fallaron con error; se registró en `recurring_transaction_executions` |
| `errors` | Lista de errores con el ID de la recurrente |

---

## Consideraciones de timezone

- Todas las fechas en la DB se almacenan en UTC
- `nextExecutionDate` es de tipo `date` (sin hora), comparado como string `"YYYY-MM-DD"`
- `formatDateForDB(new Date())` usa `getUTCFullYear/Month/Date` para evitar problemas de DST
- El daemon CLI usa `timezone: "UTC"` en node-cron
- Si los usuarios están en distintos timezones, el cron de las 6 AM UTC puede ejecutar a horas distintas locales — considerar ajustar el schedule según la mayoría de usuarios

---

## Backfill

Si el cron estuvo caído varios días y hay recurrentes con `nextExecutionDate` antiguo:

1. Ejecutar `bun run recurring:once` — procesa 1 ejecución por cada recurrente pendiente
2. Para retroejecutar N fechas perdidas: repetir N veces o usar `manualExecuteRecurring`
3. El sistema NO genera múltiples transacciones en un solo run por recurrente atrasada

Si se necesita backfill completo, crear un script ad-hoc que llame a `executeRecurringTransaction` directamente con fechas específicas.

---

## Monitoreo

El log de salida estándar del daemon incluye:

```
[recurring] 2026-05-23T06:00:01.234Z — Iniciando procesamiento
[recurring] Completado en 543ms — procesadas: 12, omitidas: 0, fallidas: 0
```

En caso de errores:
```
[recurring] Completado en 1234ms — procesadas: 11, omitidas: 0, fallidas: 1
[recurring] Errores:
  [clx1abc123] La cuenta financiera origen está inactiva o no existe
```

Para monitoreo en producción, integrar con:
- Datadog / Sentry (redireccionar el stderr)
- Alertas de Vercel basadas en HTTP 500 del endpoint
- Verificar que `recurring_transaction_executions` no acumula `status = 'failed'`
