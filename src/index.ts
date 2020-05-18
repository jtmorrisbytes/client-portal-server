///<reference path="index.d.ts" />
import * as dotenv from "dotenv";
const config = dotenv.config();
import * as express from "express";
import * as path from "path";
import * as fs from "fs";
import * as morgan from "morgan";
import * as massive from "massive";
// import * as cookieparser from "cookie-parser";
// import * as helmet from "helmet";
// import * as http from "http";
import type { TlsOptions } from "tls";
import * as https from "https";
import * as constants from "constants";
// import * as ws from "express-ws";

let NODE_ENV: string = process.env.NODE_ENV || "";
let SSL_CERT: string = process.env.SSL_CERT || "";
let SSL_KEY: string = process.env.SSL_KEY || "";
let SSL_CA: string = process.env.SSL_CA || "";
let SESSION_SECRET = process.env.SESSION_SECRET || "";
let SERVER_PORT: number = Number(process.env.SERVER_PORT) || 3000;
let SERVER_HOST: string = process.env.SERVER_HOST || "127.0.0.1";
//normalize variables
let CWD = process.cwd();
console.log("CWD", CWD || "no CWD");
const app = express();

// const wsinstance = ws(app, server);

app.use(require("./configureHelmet"));
// express-session
import * as session from "express-session";
import * as connectStore from "connect-sqlite3";
const SQLiteStore = connectStore(session);

let sessionConfig: session.SessionOptions = {
  store: new SQLiteStore(),
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  proxy: NODE_ENV === "production",
  rolling: true,
  cookie: {
    maxAge: 1000 * 60 * 5,
    secure: NODE_ENV === "production",
  },
};
app.use(express.static(path.join(CWD, "build")));
app.use(session(sessionConfig));

app.use(express.json());
// use morgan request logging
app.use(morgan("dev"));
// mount routes
const routes = require("./routes/index.js");
app.use(routes.rootPath, routes.router);

// get massive config
const MASSIVE_CONFIG = require("./configureMassive");

// https

export async function main(db?: any) {
  if (!db) {
    db = await massive(MASSIVE_CONFIG);
  }
  app.set("db", db);
  if (NODE_ENV === "production") {
    let SSL_OPTS: TlsOptions = {
      key: fs.readFileSync(
        path.resolve(SSL_KEY || path.join(CWD, "privkey.pem"))
      ),
      cert: fs.readFileSync(
        path.resolve(SSL_CERT || path.join(CWD, "fullchain.pem"))
      ),
      secureOptions: constants.SSL_OP_NO_SSLv3,
      // ca: [fs.readFileSync("chain.pem")],
    };
    if (SSL_CA) {
      SSL_OPTS.ca = [fs.readFileSync(SSL_CA)];
    }

    let server = https.createServer(SSL_OPTS, app);
    console.log("launching server in production");
    return await server.listen(SERVER_PORT, SERVER_HOST, null, null);
  } else {
    console.log("launching server in development");
    return await app.listen(SERVER_PORT, SERVER_HOST);
  }
}

if (NODE_ENV === "production" || NODE_ENV === "development") {
  main().then((server) => {
    console.log(`server listening on ${SERVER_HOST}:${SERVER_PORT}`);
    setTimeout(() => {
      if (process.platform === "linux") process.setuid("web");
      setTimeout(() => {
        if (process.platform === "linux") {
          console.log(
            "This process should not be running as root anymore.. getuid should != 0",
            process.getuid() !== 0
          );
        }
      }, 0);
    }, 0);
  });
}
