import { NIST, ENist } from "@jtmorrisbytes/lib/Nist";

//until I find a way to make static classes
// I must instantiate the utility classes with new

// TODO extend email class with error types

import * as winston from "winston";

import * as EMAIL from "@jtmorrisbytes/lib/Email";
// TODO: implement Password error utility classes
import * as PASSWORD from "@jtmorrisbytes/lib/Password";

import * as Response from "@jtmorrisbytes/lib/Response/";
import { Name } from "@jtmorrisbytes/lib/Name";
//TODO: allow reason to be passed in and create more specific messages for user
import * as USER from "@jtmorrisbytes/lib/User";
import * as ERROR from "@jtmorrisbytes/lib/Error";
const levels = Object.keys(winston.config.syslog.levels);
let { CONSOLE_LOG_LEVEL } = process.env;

const con = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: levels.includes(CONSOLE_LOG_LEVEL) ? CONSOLE_LOG_LEVEL : "warning",
    }),
  ],
});

const MAX_ELAPSED_REQUEST_TIME = 60 * 1000 * 3;

const bcrypt = require("bcryptjs");
const axios = require("axios");
const sha1 = require("sha1");
const crypto = require("crypto");

con.debug("PASSWORD MODULE: ", PASSWORD);
async function register(req, res) {
  // try to destructure, respond with 500 if it fails
  try {
    const db = req.app.get("db");
    let userReq = (req.body || {}).user || {};
    let body = {
      address: userReq.streetAddress || "",
      city: userReq.city || "",
      state: userReq.state || "",
      zip: userReq.zip || "",
      firstName: new Name(userReq.firstName),
      lastName: new Name(userReq.lastName),
      email: EMAIL.Email(userReq.email),
      password: PASSWORD.Password(userReq.password),
    };
    if (body.email.value === null || body.email.isValid === false) {
      con.debug(
        "Email.value was null or isValid was false. Value",
        body.email.value,
        "IsValid: ",
        body.email.isValid
      );
      res.status(EMAIL.EBadRequest.CODE).json(EMAIL.EBadRequest);
    }
    con.debug("trying to get new user by email");
    let dbResult = await db.user.getByEmail(body.email.value);
    if (dbResult.length > 0) {
      res.status(EMAIL.ENotAuthorized.CODE).json(EMAIL.ENotAuthorized);
      return;
    }
    // check password
    if (body.password.value == null) {
      con.debug("password was missing from request");
      res.status(PASSWORD.EMissing.CODE).json(PASSWORD.EMissing);
      return;
    }
    // email is marked as a unique, required field. if it already exists, the database will throw an error
    // run

    if (body.password.isValid === false) {
      con.debug("password was not valid");
      res.status(PASSWORD.ENotValid.CODE).json(PASSWORD.ENotValid);
      return;
    }
    con.debug("trying NIST TOKEN");
    if (process.env.NIST_TOKEN) {
      con.debug("attempting NIST check with token ", process.env.NIST_TOKEN);
      let nistHash = sha1(body.password.value);
      let { found } = await axios.get(
        NIST.URL + nistHash + `?api_key=${process.env.NIST_TOKEN}`
      );
      if (found) {
        con.debug(
          "Password found in NIST Database, Refusing to allow password"
        );
        res.status(400).json({
          ...ENist,
          link: NIST.INFOLINK,
        });
      }
      con.debug("Password not found in NIST Database. continuing");
    }
    // common errors have been handled at this point, continu
    // only commit the database if not in testing mode
    if (req.query.test === true) {
      res.status(200).json({
        id: -1,
        ...body,
        firstName: body.firstName.value,
        lastName: body.lastName.value,
        email: body.email.value,
      });
    } else {
      let hash = await bcrypt.hash(
        body.password.value,
        await bcrypt.genSalt(15)
      );

      con.debug("trying to create user");
      let result = await db.user.create(
        body.firstName.value,
        body.lastName.value,
        hash,
        body.email.value,
        body.phoneNumber,
        body.streetAddress,
        body.city,
        body.state,
        body.zip
      );
      let user = result[0];
      con.debug("/api/auth/register DB create user result", user);
      req.session.user = {
        id: user.users_id,
      };
      res.json({ session: req.session });
    }
  } catch (e) {
    process.stdout.write("Failed to register user ");
    let errRes = Response.EGeneralFailure;
    if (e instanceof SyntaxError) {
      process.stdout.write("because of a syntax error ");
      errRes = { ...errRes, ...ERROR.ESyntaxError };
    } else if (e instanceof TypeError) {
      process.stdout.write("because of a Type Error ");
      errRes = { ...errRes, ...ERROR.ETypeError };
    }
    res.status(500).json(errRes);
    process.stdout.write("with stacktrace:\n");
    con.error(e);
  }
}
async function getSession(req, res) {
  try {
    let session = req.session || null;
    res.json(session);
  } catch (e) {
    con.error("Failed to get session");
  }
}
async function logIn(req, res) {
  con.log(
    "/api/auth/login: login requested user object",
    req.body.user || "NOT FOUND"
  );
  try {
    let errors = [];
    let email = req.body.email;
    let password = req.body.password;
    if (!email) {
      con.warn("/api/auth/login: email was missing from request");
      //Ideally allow reason to be passed through
      errors.push(EMAIL.EMissing);
    }
    if (!password) {
      con.warn("/api/auth/login: password was missing from request");
      errors.push(PASSWORD.EMissing);
    }
    if (errors.length > 0) {
      res.status(400).json({ ...Response.EBadRequest, errors });
      return;
    } else {
      errors = [];
    }
    con.log("searching database for username");
    let result = await req.app.get("db").user.getByEmail(email);
    if (result.length === 0) {
      res.status(401).json(USER.ENotFoundByEmail);
    } else {
      let user = result[0];
      con.log("/api/auth/login user found, comparing hash");
      con.log("password", password, "hash", hash);

      let authenticated = await bcrypt.compare(password, user.hash);
      if (authenticated) {
        con.log("logging in user with id:", user.users_id);
        (req.session.user = {
          id: user.users_id,
        }),
          res.json({ session: req.session });
      } else {
        con.warn("/api/auth/login recieved an invalid password");
        res.status(PASSWORD.ENotAuthorized.CODE).json(PASSWORD.ENotAuthorized);
      }
    }
  } catch (e) {
    process.stdout.write("Failed to log in user ");
    let errRes = {
      ...Response.EGeneralFailure,
      REASON: e,
    };
    if (e instanceof TypeError) {
      errRes = {
        ...errRes,
        ...ERROR.ETypeError,
      };
    }
    if (e instanceof ReferenceError) {
      process.stdout.write("because of a ReferenceError");
      errRes = {
        ...errRes,
        ...ERROR.ESyntaxError,
      };
    }
    process.stdout.write(" with stacktrace\n");
    con.log(e);
    res.status(errRes.CODE).json(errRes);
  }
}
async function logOut(req, res) {
  req.session.destroy((err) => {
    if (err) {
      con.log(err);
    }
    res.clearCookie("connect.sid");
  });
  res.sendStatus(200);
}
function getUser(req, res) {
  res.json({ user: req.session.user || null });
}

function checkAuthState(req, res, next) {
  // const stateObj = req.app.get(req.query.state||req.body.state);
  // if(!stateObj)
  // const { timestamp, state, ipAddr } = auth || {};
  // need to stub out this type later
  let authStateError = {
    MESSAGE: "",
    REASON: "",
    TYPE: "",
    PATH: "",
  };
  if (!req.body) {
    res
      .status(400)
      .json({ ...Response.EBadRequest, REASON: "Empty request body" });
    return;
  }
  if (!req.body.state) {
    res.status(401).json({
      ...Response.ENotAuthorized,
      REASON:
        "The state parameter is required to continue with this request, but was missing",
      TYPE: "AUTH_STATE_MISSING",
      path: "body",
    });
    return;
  }
  let state = req.app.get(req.body.state);
  if (!state) {
    con.log(state, req.body.state);
    // Stub this error for now
    res.status(401).json({
      ...Response.ENotAuthorized,
      REASON: "The auth parameter provided in the body was not found",
      TYPE: "AUTH_STATE_NOT_FOUND",
    });
    return;
  }
  if (state.ipAddr != req.connection.remoteAddress) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      ...Response.ENotAuthorized,
      REASON: "You are not allowed to switch devices between login flow",
      TYPE: "AUTH_IP_MISMATCH",
    });
    return;
  }
  let currentTimestamp = Date.now();
  if (currentTimestamp > state.timestamp + MAX_ELAPSED_REQUEST_TIME) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      ...Response.ENotAuthorized,
      REASON: "Your login/register session has expired, please try again ",
      TYPE: "AUTH_SESSION_EXPIRED",
    });
    // if there is already an auth session
    return;
    // if the user jumps between devices or there is an ip address mismatch, clear session and cookie
  }
  next();
}

function startAuthSession(req, res) {
  // if we already have a session, clear the session
  // and restart it
  const state = crypto.randomBytes(64).toString("base64");
  const stateObj = {
    state,
    timestamp: Date.now(),
    ipAddr: req.connection.remoteAddress,
  };
  req.app.set(state, stateObj);

  res.json(stateObj);
}
export {
  register,
  logIn,
  logOut,
  getUser,
  startAuthSession,
  checkAuthState,
  getSession,
};
