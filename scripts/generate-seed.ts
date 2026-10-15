// Run with: npm run db:seed:generate  (Node 22.18+ runs TypeScript directly)
import { writeFileSync } from "node:fs";
import { schemes } from "../src/data/schemes.ts";
import { buildSeedSql } from "./seed-sql.ts";

const target = new URL("../supabase/seed.sql", import.meta.url);
writeFileSync(target, buildSeedSql(schemes), "utf8");
console.log(`Wrote ${schemes.length} schemes to supabase/seed.sql`);
