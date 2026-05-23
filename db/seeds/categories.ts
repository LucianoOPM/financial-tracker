import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schemas";

type Db = NodePgDatabase<typeof schema>;

const categories: schema.TransactionCategoryInsert[] = [
  // Income
  { id: "seed_inc_salario", name: "Salario", type: "income", icon: "briefcase", color: "#22c55e" },
  { id: "seed_inc_freelance", name: "Freelance", type: "income", icon: "laptop", color: "#10b981" },
  { id: "seed_inc_inversiones", name: "Inversiones", type: "income", icon: "trending-up", color: "#06b6d4" },
  { id: "seed_inc_bonos", name: "Bonos", type: "income", icon: "gift", color: "#8b5cf6" },
  { id: "seed_inc_renta", name: "Renta", type: "income", icon: "home", color: "#f59e0b" },
  { id: "seed_inc_otros", name: "Otros ingresos", type: "income", icon: "plus-circle", color: "#84cc16" },
  // Expense
  { id: "seed_exp_alimentacion", name: "Alimentación", type: "expense", icon: "utensils", color: "#ef4444" },
  { id: "seed_exp_transporte", name: "Transporte", type: "expense", icon: "car", color: "#f97316" },
  { id: "seed_exp_entretenimiento", name: "Entretenimiento", type: "expense", icon: "tv", color: "#ec4899" },
  { id: "seed_exp_salud", name: "Salud", type: "expense", icon: "heart-pulse", color: "#14b8a6" },
  { id: "seed_exp_educacion", name: "Educación", type: "expense", icon: "graduation-cap", color: "#3b82f6" },
  { id: "seed_exp_ropa", name: "Ropa", type: "expense", icon: "shirt", color: "#a855f7" },
  { id: "seed_exp_hogar", name: "Hogar", type: "expense", icon: "house", color: "#f59e0b" },
  { id: "seed_exp_servicios", name: "Servicios", type: "expense", icon: "zap", color: "#64748b" },
  { id: "seed_exp_otros", name: "Otros gastos", type: "expense", icon: "minus-circle", color: "#9ca3af" },
  // Transfer
  { id: "seed_trf_transferencia", name: "Transferencia", type: "transfer", icon: "arrow-left-right", color: "#6366f1" },
];

export async function seedCategories(db: Db) {
  await db
    .insert(schema.transactionCategory)
    .values(categories)
    .onConflictDoNothing();

  console.log(`✓ Categorías: ${categories.length} registros procesados`);
}
