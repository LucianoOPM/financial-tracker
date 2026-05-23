import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schemas";
import { seedCategories } from "./categories";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle({ client: pool, schema });

  try {
    await seedCategories(db);
    console.log("Seed completado.");
  } catch (error) {
    console.error("Error durante el seed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
