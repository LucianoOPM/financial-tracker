import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@db/index";
import * as schema from "@db/schemas";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    database: {
      generateId: () => createId(),
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
