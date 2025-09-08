import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url });
  const sql = `
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'candidates'
    order by ordinal_position
  `;
  const { rows } = await pool.query(sql);
  console.log(rows);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });


