///<reference path="index.d.ts" />
import dotenv from "dotenv";
const config = dotenv.config();
import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import massive from "massive";
import cookieparser from "cookie-parser";
import helmet from "helmet";
import http from "http";
import type { TlsOptions } from "tls";
import https from "https";
import constants from "constants";

// global.log =
//   process.env.NODE_ENV === "production"
//     ? function () {}
//     : function (...rest:[]) {
//         let date = new Date();
//         console.log(
//           `[Time: ${date.getHours()}H${date.getMinutes()}M ${date.getSeconds()}S ${date.getMilliseconds()}MS]`,
//           ...rest
//         );
//       };
// global.debug =
//   process.env.NODE_ENV === "production" ? function () {} : console.debug;

let NODE_ENV: string = process.env.NODE_ENV || "";
let SSL_CERT: string = process.env.SSL_CERT || "";
let SSL_KEY: string = process.env.SSL_KEY || "";
let SSL_CA: string = process.env.SSL_CA || "";
let SESSION_SECRET = process.env.SESSION_SECRET || "";
let SERVER_PORT: number = Number(process.env.SERVER_PORT) || 3000;
let SERVER_HOST: string = process.env.SERVER_HOST || "127.0.0.1";
//normalize variables

const app = express();

app.use(require("./configureHelmet"));
// express-session
import session from "express-session";
import connectStore from "connect-sqlite3";
const SQLiteStore = connectStore(session);
session;
let sessionConfig: session.SessionOptions = {
  store: new SQLiteStore(),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 5 },
};

if (NODE_ENV === "production") {
  sessionConfig.cookie.secure = true;
}
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
async function main(db?: any) {
  if (!db) {
    db = await massive(MASSIVE_CONFIG);
  }
  app.set("db", db);
  let server = http.createServer(app);
  if (NODE_ENV === "production") {
    console.log("launching server in production");
    let SSL_OPTS: TlsOptions = {
      key: fs.readFileSync(path.resolve(SSL_KEY || "privkey.pem")),
      cert: fs.readFileSync(path.resolve(SSL_CERT || "fullchain.pem")),
      secureOptions: constants.SSL_OP_NO_SSLv3,
      // ca: [fs.readFileSync("chain.pem")],
    };
    if (SSL_CA) {
      SSL_OPTS.ca = [fs.readFileSync(SSL_CA)];
    }
    return await https
      .createServer(SSL_OPTS, app)
      .listen(SERVER_PORT, SERVER_HOST, null, null);
  } else if (NODE_ENV === "development") {
    console.log("launching server in development");
    return await server.listen(SERVER_PORT, SERVER_HOST);
  } else {
    console.log("launching server in test mode");
    return await app.listen(SERVER_PORT, SERVER_HOST);
  }
}
if (NODE_ENV === "production" || NODE_ENV === "development") {
  main().then((server) => {
    console.log(`server listening on ${SERVER_HOST}:${SERVER_PORT}`);
  });
} else {
  module.exports = main;
}
