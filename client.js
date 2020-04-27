// <reference types='massive />
require("dotenv").config();
const {
  DATABASE_USERNAME,
  DATABASE_PORT,
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  CI,
} = process.env;
const massive = require("massive");

async function main() {
  console.log(
    `connecting to postgres://${DATABASE_USERNAME}:****@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`
  );
  let db = await massive({
    host: DATABASE_HOST || "postgres",
    port: DATABASE_PORT || 5432,
    user: DATABASE_USERNAME || "postgres",
    database: DATABASE_NAME || "testdb",
    password: DATABASE_PASSWORD || "",
    ssl: {
      mode: "require",
      rejectUnauthorized: false,
    },
    poolSize: 10,
  });
  console.log("running seed script");
  await db.seed(DATABASE_NAME);
  console.log("seed successful, exiting");
  process.exit(0);
}
main();
