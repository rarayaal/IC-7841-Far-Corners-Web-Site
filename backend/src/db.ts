import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL || "postgresql://admin:adminpassword@localhost:5432/farcorners",
	max: 10,
	idleTimeoutMillis: 30000,
});
