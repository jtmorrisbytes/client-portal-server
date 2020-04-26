const config = require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const massive = require("massive");
const cookieparser = require("cookie-parser");
const helmet = require("helmet");
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
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  NODE_ENV,
  SESSION_SECRET,
  SESSION_COOKIE_MAXAGE,
  REACT_APP_CLIENT_ID,
  REACT,
} = process.env;

log("NODE_ENV is ", NODE_ENV || null);

// if (!REACT_APP_CLIENT_ID) {
//   console.error(
//     "the react app client id has not been set. please set the react app client id"
//   );
//   log(config);
//   process.exit(-1);
// }

// if publishing client and server together,
// make sure to include an app.use

const app = express();

// set up helmet, enforcing as much security options as possible
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "https://stackpath.bootstrapcdn.com/",
          "https://www.aspiesolutions.com/",
          "http://localhost:3000/",
        ],
      },
    },
    expectCt: {
      maxAge: 0,
      reportUri: "http://aspiesolutions.com/reportct",
    },
    featurePolicy: {
      features: {
        layoutAnimations: ["'self'"],
        syncScript: ["'self'"],
        documentDomain: ["'none'"],
      },
    },
  })
);
// https security options

// use express.json as json parser
app.use(express.json());
app.use(new require("./controllers/redisSession")());
// set up express session

if (process.NODE_ENV === "production") {
  app.use(morgan("tiny"));
} else {
  app.use(morgan("dev"));
}
const routes = require("./routes/index.js");
app.use(routes.rootPath, routes.router);
let massive_config = {
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  database: DATABASE_NAME,
  user: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  ssl: true
};
if (NODE_ENV === "production") {
  massive_config.ssl = {
    mode: "require",
    // rejectUnauthorized: false,
    ca: fs.readFileSync("db.ca-certificate.crt"),
  };
}
// default server;

async function main() {
  log("setup complete... attempting to connect to the database...");
  try {
    let db = await massive(massive_config);
    app.set("db", db);
  } catch (e) {
    log("connection failed:", e);
    process.exit(-1);
  }
  if (NODE_ENV.includes("prod")) {
    app.use(express.static(path.join("..", "public")));
  }
  if (NODE_ENV.includes("dev") || NODE_ENV.includes("prod")) {
    https
      .createServer(
        {
          key: fs.readFileSync("privkey.pem"),
          cert: fs.readFileSync("fullchain.pem"),
          secureOptions: constants.SSL_OP_NO_SSLv3,
          // ca: [fs.readFileSync("chain.pem")],
        },
        app
      )
      .listen(SERVER_PORT, SERVER_HOST, () => {
        log(`SERVER LISTENING on ${SERVER_HOST}:${SERVER_PORT}`);
      });
  } else {
    return await app.listen(SERVER_PORT, SERVER_HOST);
  }
}
if (NODE_ENV.includes("dev") || NODE_ENV.includes("prod")) {
  main();
}
module.exports = main;
