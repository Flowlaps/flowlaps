import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js reads .env.local automatically; the Prisma CLI does not, so load
// it explicitly here rather than duplicating DATABASE_URL into a second
// .env file.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
