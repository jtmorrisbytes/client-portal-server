// @flow

import type { Request, Response, NextFunction } from "express";
import { NIST } from "@jtmorrisbytes/lib/Nist";
//until I find a way to make static classes
// I must instantiate the utility classes with new
const Nist = new NIST.NIST();
// TODO extend email class with error types
import { Email } from "@jtmorrisbytes/lib/User/Email";
// TODO: implement Password error utility classes
import { Password } from "@jtmorrisbytes/lib/User/Password";
import { Resource } from "@jtmorrisbytes/lib/Resource";
//TODO: allow reason to be passed in and create more specific messages for user
import User from "@jtmorrisbytes/lib/User";
import { Error } from "@jtmorrisbytes/lib/Error";

const MAX_ELAPSED_REQUEST_TIME = 60 * 1000 * 3;

const bcrypt = require("bcryptjs");
const axios = require("axios");
const sha1 = require("sha1");
const crypto = require("crypto");

async function register(req: Request, res: Response) {
  // try to destructure, respond with 500 if it fails
  try {
    let {
      firstName,
      lastName,
      email,
      phoneNumber,
      streetAddress,
      city,
      state,
      zip,
      password,
    } = req.body.user;
    console.log("/api/auth/register called");
    console.dir(req.body);
    console.dir(req.query);
    const db = req.app.get("db");
    let newUser = new User(
      email,
      password,
      firstName,
      lastName,
      streetAddress,
      city,
      state,
      zip
    );
    if (!email) {
      res.status(400).json({
        MESSAGE: "field email is required",
        TYPE: "EMAIL_REQUIRED",
      });
      return;
    }
    if (!newUser.isEmailValid()) {
      res.status(400).json({ MESSAGE: `invalid email`, TYPE: "EMAIL_INVALID" });
      return;
    }
    let dbResult = await db.user.getByEmail(email);
    if (dbResult.length > 0) {
      res
        .status(400)
        .json({ MESSAGE: `email is already in use`, TYPE: "EMAIL_TAKEN" });
      return;
    }
    if (!password) {
      res.status(400).json({
        message: "field password is required",
        TYPE: "PASSWORD_REQUIRED",
      });
      return;
    }
    // email is marked as a unique, required field. if it already exists, the database will throw an error
    // run
    if (newUser.isPasswordValid() === false) {
      res.status(400).json({
        reason: "Password is not valid",
        TYPE: "PASSWORD_INVALID",
      });
      return;
    }
    if (process.env.NIST_TOKEN) {
      console.log("attempting NIST check with token ", process.env.NIST_TOKEN);
      let nistHash = sha1(password);
      let { found } = await axios.get(
        Nist.URL + nistHash + `?api_key=${process.env.NIST_TOKEN}`
      );
      if (found) {
        console.log(
          "Password found in NIST Database, Refusing to allow password"
        );

        res.status(400).json({
          ...new NIST.ENist(),
          link: Nist.INFOLINK,
        });
        return;
      }
      console.log("Password not found in NIST Database. continuing");
    }
    let encoded = Buffer.from(password).toString("base64");
    let hash = await bcrypt.hash(encoded, await bcrypt.genSalt(15));
    let result = await db.user.create(
      firstName,
      lastName,
      hash,
      email,
      phoneNumber,
      streetAddress,
      city,
      state,
      zip
    );
    let user = result[0];
    console.log("/api/auth/register DB create user result", user);
    req.session.user = {
      id: user.users_id,
    };
    res.json({ session: req.session });
  } catch (e) {
    process.stdout.write("Failed to register user ");
    let errRes = new Resource.EGeneralFailure();
    if (e instanceof SyntaxError) {
      process.stdout.write("because of a syntax error ");
      errRes = new Error.ESyntaxError();
    } else if (e instanceof TypeError) {
      process.stdout.write("because of a Type Error ");
      errRes = new Error.ETypeError();
    }
    res.status(500).json(errRes);
    process.stdout.write("with stacktrace:\n");
    console.error(e);
  }
}
async function getSession(req: Request, res: Response) {
  try {
    let session = req.session || null;
    res.send(session);
  } catch (e) {
    console.error("Failed to get session");
  }
}
async function logIn(req: Request, res: Response) {
  console.log(
    "/api/auth/login: login requested user object",
    req.body.user || "NOT FOUND"
  );
  try {
    let { email, password } = req.body.user;
    if (!email) {
      console.warn("/api/auth/login: email was missing from request");
      //Ideally allow reason to be passed through
      const reason = "email was missing from request";
      res.status(400).json(new Resource.EBadRequest());
    } else if (!password) {
      console.warn("/api/auth/login: password was missing from request");
      const reason = "password was missing from request";
      res.status(400).json(new Resource.EBadRequest());
    } else {
      console.log("searching database for username");
      let result = await req.app.get("db").user.getByEmail(email);
      if (result.length === 0) {
        console.warn(
          `/api/auth/login: user '${email.substr(
            0,
            email.indexOf("@") - 2
          )}' not found`
        );
        res.status(401).json(new Resource.ENotFound());
      } else {
        let user = result[0];
        console.log("/api/auth/login user found, comparing hash");
        let authenticated: Boolean = await bcrypt.compare(
          Buffer.from(password).toString("base64"),
          user.hash
        );
        if (authenticated) {
          console.log("logging in user with id:", user.users_id);
          (req.session.user = {
            id: user.users_id,
          }),
            res.json({ session: req.session });
        } else {
          console.warn("/api/auth/login recieved an invalid password");
          res.status(401).json({
            ...new Resource.ENotAuthorized(),
            REASON: "That password is incorrect",
            TYPE: "PASSWORD_INCORRECT",
          });
        }
      }
    }
  } catch (e) {
    process.stdout.write("Failed to log in user ");
    let errRes = {
      ...new Resource.EGeneralFailure(),
      REASON: e,
    };
    if (e instanceof TypeError) {
      errRes = {
        ...new Error.ETypeError(),
        REASON: e,
      };
    }
    if (e instanceof ReferenceError) {
      process.stdout.write("because of a ReferenceError");
      errRes = {
        ...new Error.ESyntaxError(),
        REASON: e,
      };
    }
    process.stdout.write(" with stacktrace\n");
    console.log(e);
    res.status(500).json(errRes);
  }
}
async function logOut(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.log();
      res.clearCookie("connect.sid");
    }
  });
  res.sendStatus(200);
}
function getUser(req: Request, res: Response) {
  res.json({ user: req.session.user || null });
}

function checkAuthState(req: Request, res: Response, next: NextFunction) {
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
      .json({ ...new Resource.EBadRequest(), reason: "Empty request body" });
    return;
  }
  if (!req.body.state) {
    res.status(401).json({
      ...new Resource.ENotAuthorized(),
      REASON:
        "The state parameter is required to continue with this request, but was missing",
      TYPE: "AUTH_STATE_MISSING",
      path: "body",
    });
    return;
  }
  let state = req.app.get(req.body.state);
  if (!state) {
    console.log(state, req.body.state);
    // Stub this error for now
    res.status(401).json({
      ...new Resource.ENotAuthorized(),
      REASON: "The auth parameter provided in the body was not found",
      TYPE: "AUTH_STATE_NOT_FOUND",
    });
    return;
  }
  if (state.ipAddr != req.connection.remoteAddress) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      ...new Resource.ENotAuthorized(),
      REASON: "You are not allowed to switch devices between login flow",
      TYPE: "AUTH_IP_MISMATCH",
    });
    return;
  }
  let currentTimestamp = Date.now();
  if (currentTimestamp > state.timestamp + MAX_ELAPSED_REQUEST_TIME) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      ...new Resource.ENotAuthorized(),
      REASON: "Your login/register session has expired, please try again ",
      TYPE: "AUTH_SESSION_EXPIRED",
    });
    // if there is already an auth session
    return;
    // if the user jumps between devices or there is an ip address mismatch, clear session and cookie
  }
  next();
}

function startAuthSession(req: Request, res: Response) {
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
module.exports = {
  register,
  logIn,
  logOut,
  getUser,
  startAuthSession,
  checkAuthState,
  getSession,
};
