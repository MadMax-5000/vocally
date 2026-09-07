import { loadEnvConfig } from "@next/env";

// Match Next.js env file order (.env.local overrides .env). `dotenv/config`
// only loads `.env`, so Clerk keys in `.env.local` were ignored and middleware
// fell back to the clerk.example.com placeholder handshake.
loadEnvConfig(process.cwd());
