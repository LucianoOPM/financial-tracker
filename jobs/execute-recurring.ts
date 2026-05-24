import "dotenv/config";
import cron from "node-cron";
import { processAllDueRecurring } from "@lib/recurring/job";

// ─── Schedule ─────────────────────────────────────────────────────────────────

// Default: every day at 06:00 UTC. Override with RECURRING_CRON_SCHEDULE env var.
const CRON_SCHEDULE = process.env.RECURRING_CRON_SCHEDULE ?? "0 6 * * *";

// ─── Job runner ───────────────────────────────────────────────────────────────

async function runJob(): Promise<{ failed: number }> {
  const timestamp = new Date().toISOString();
  console.log(`[recurring] ${timestamp} — Iniciando procesamiento`);

  const start = Date.now();

  const result = await processAllDueRecurring();

  const duration = Date.now() - start;
  console.log(
    `[recurring] Completado en ${duration}ms — procesadas: ${result.processed}, omitidas: ${result.skipped}, fallidas: ${result.failed}`,
  );

  if (result.errors.length > 0) {
    console.error("[recurring] Errores:");
    result.errors.forEach((e) => console.error(`  ${e}`));
  }

  return { failed: result.failed };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (process.argv.includes("--once")) {
  // One-shot execution: run immediately and exit
  runJob()
    .then(({ failed }) => process.exit(failed > 0 ? 1 : 0))
    .catch((error) => {
      console.error("[recurring] Error fatal:", error);
      process.exit(1);
    });
} else {
  // Daemon mode: run on the configured cron schedule
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[recurring] Expresión cron inválida: "${CRON_SCHEDULE}"`);
    process.exit(1);
  }

  console.log(`[recurring] Iniciando daemon con schedule "${CRON_SCHEDULE}" (UTC)`);

  cron.schedule(CRON_SCHEDULE, () => {
    runJob().catch((error) => {
      console.error("[recurring] Error en ejecución programada:", error);
    });
  }, { timezone: "UTC" });
}
