import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Set it in Railway variables or .env locally.');
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
