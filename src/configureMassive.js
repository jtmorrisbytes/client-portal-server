const fs = require("fs");
const path = require("path");
const CWD = process.cwd();
let {
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  NODE_ENV,
  CI,
} = process.env;

function ENV(env, def) {
  return env ? String(env).trim() : def;
}
NODE_ENV = ENV(NODE_ENV, "test");
let config = {
  host: ENV(DATABASE_HOST, "localhost"),
  port: ENV(DATABASE_PORT, "5432"),
  database: ENV(DATABASE_NAME, "testUser"),
  user: ENV(DATABASE_USERNAME, "postgres"),
  password: ENV(DATABASE_PASSWORD, ""),
};

console.log(`configureMassive: NODE_ENV is ${NODE_ENV}, config is`, config);
console.log(`Configuring massive `);
if (NODE_ENV === "production") {
  console.log("for production\r\n");
  config.ssl = {
    mode: "require",
    // rejectUnauthorized: false,
    ca: fs.readFileSync(path.join(CWD, "db.ca-certificate.crt")),
  };
} else if (NODE_ENV === "development") {
  console.log(" for development\n");
} else {
  console.log("for testing ");
  if (!CI) {
    config.ssl = {
      mode: true,
      rejectUnauthorized: false,
    };
  } else {
    console.log("on CI\r\n");
    console.log("on a local machine");
  }
}
module.exports = config;
