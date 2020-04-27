const config = require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const massive = require("massive");
const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const http = require("http");
const https = require("https");
const constants = require("constants");

global.log =
  process.env.NODE_ENV === "production"
    ? function () {}
    : function (...rest) {
        let date = new Date();
        console.log(
          `[Time: ${date.getHours()}H${date.getMinutes()}M ${date.getSeconds()}S ${date.getMilliseconds()}MS]`,
          ...rest
        );
      };
global.debug =
  process.env.NODE_ENV === "production" ? function () {} : console.debug;
let {
  SERVER_HOST,
  SERVER_PORT,
  NODE_ENV,
  SSL_CERT,
  SSL_KEY,
  SSL_CA,
  SESSION_SECRET,
} = process.env;
//normalize variables
SERVER_HOST = SERVER_HOST || "127.0.0.1";
SERVER_PORT = SERVER_PORT || 3000;

const app = express();

app.use(require("./configureHelmet"));
// express-session
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
let sessionConfig = {
  store: new SQLiteStore(),
  secret: SESSION_SECRET,
  cookie: { maxAge: 1000 * 60 * 5 },
};

if (NODE_ENV === "production") {
  sessionConfig.cookie.secure = true;
}
app.use(session(session));

app.use(express.json());
// use morgan request logging
app.use(morgan("dev"));
// mount routes
const routes = require("./routes/index.js");
app.use(routes.rootPath, routes.router);

// get massive config
const MASSIVE_CONFIG = require("./configureMassive");

// https
async function main(db) {
  if (!db) {
    db = await massive(MASSIVE_CONFIG);
  }
  app.set("db", db);
  let server = http.createServer(app);
  if (NODE_ENV === "production") {
    console.log("launching server in production");
    return await https
      .createServer(
        {
          key: fs.readFileSync(path.resolve(SSL_KEY || "privkey.pem")),
          cert: fs.readFileSync(path.resolve(SSL_CERT || "fullchain.pem")),
          secureOptions: constants.SSL_OP_NO_SSLv3,
          // ca: [fs.readFileSync("chain.pem")],
        },
        app
      )
      .listen(SERVER_PORT, SERVER_HOST);
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
    console.log("server listening");
    console.dir(server);
  });
} else {
  module.exports = main;
}
