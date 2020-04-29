// @flow

const {
  validateEmail,
  validatePassword,
  constants,
} = require("@jtmorrisbytes/lib");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const sha1 = require("sha1");
const inspect =
  require("util").inpect ||
  ((o) => {
    o;
  });
const crypto = require("crypto");
const {
  MESSAGE_NOT_AUTHORIZED,
  MESSAGE_BAD_REQUEST,
  REASON,
  MESSAGE_NOT_FOUND,
  MESSAGE,
  PASSWORD,
  MAX_ELAPSED_REQUEST_TIME,
} = constants;
const { NIST } = PASSWORD;
function getSession(req, res) {
  res.json(req.session || {});
}
async function register(req, res) {
  // try to destructure, respond with 500 if it fails
  try {
    const {
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
    if (!email) {
      res.status(400).json({
        message: "field email is required",
        reason: REASON.REQUIRED.FIELD,
      });
      return;
    }
    if (!validateEmail(email)) {
      res.status(400).json({ message: `invalid email '${email}'` });
      return;
    }
    let dbResult = await db.user.getByEmail(email);
    if (dbResult.length > 0) {
      res.status(400).json({ message: `email ${email} is already in use` });
      return;
    }
    if (!password) {
      res.status(400).json({
        message: "field password is required",
        reason: REASON.REQUIRED.FIELD,
      });
      return;
    }
    // email is marked as a unique, required field. if it already exists, the database will throw an error
    // run
    let passwordLocal = validatePassword(password);
    if (passwordLocal.isValid === false) {
      res.status(400).json({
        message: passwordLocal.description,
        reason: passwordLocal.reason,
      });
      return;
    }
    if (process.env.NIST_TOKEN) {
      console.log("attempting NIST check with token ", process.env.NIST_TOKEN);
      let nistHash = sha1(password);
      let { found } = await axios.get(
        NIST.URL + nistHash + `?api_key=${process.env.NIST_TOKEN}`
      );
      if (found) {
        console.log(
          "Password found in NIST Database, Refusing to allow password"
        );
        res.status(400).json({
          message: NIST.MESSAGE,
          reason: NIST.REASON,
          info: "https://pages.nist.gov/800-63-3/",
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
    let errRes = {
      message: MESSAGE.GENERAL_FAILURE,
      reason: REASON.ERROR.UNKNOWN,
      error: e,
    };
    if (e instanceof SyntaxError) {
      process.stdout.write("because of a syntax error ");
      errRes.reason = REASON.ERROR.SYNTAX;
    } else if (e instanceof TypeError) {
      process.stdout.write("because of a Type Error ");
      errRes.reason = REASON.ERROR.TYPE;
    }
    res.status(500).json(errRes);
    process.stdout.write("with stacktrace:\n");
    console.error(e);
  }
}
async function getSession(req, res) {
  try {
    let session = req.session || null;
    res.send(session);
  } catch (e) {
    console.error("Failed to get session");
  }
}
async function logIn(req, res) {
  console.log(
    "/api/auth/login: login requested user object",
    req.body.user || "NOT FOUND"
  );
  try {
    let { email, password } = req.body.user;
    if (!email) {
      console.warn("/api/auth/login: email was missing from request");

      res.status(400).json({
        message: MESSAGE_BAD_REQUEST,
        reason: REASON.LOGIN.EMAIL.MISSING,
      });
    } else if (!password) {
      console.warn("/api/auth/login: password was missing from request");
      console.dir(req.body);
      console.dir(req.query);

      res.status(400).json({
        message: MESSAGE_BAD_REQUEST,
        reason: REASON.LOGIN.PASSWORD.MISSING,
      });
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
        res.status(401).json({
          message: MESSAGE_NOT_AUTHORIZED,
          reason: REASON.USER.NOT_FOUND,
        });
      } else {
        let user = result[0];
        console.log("/api/auth/login user found, comparing hash");
        authenticated = await bcrypt.compare(
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
            message: MESSAGE_NOT_AUTHORIZED,
            reason: REASON.LOGIN.PASSWORD.MISSING,
          });
        }
      }
    }
  } catch (e) {
    process.stdout.write("Failed to log in user ");
    let errRes = {
      message: MESSAGE.GENERAL_FAILURE,
      reason: REASON.ERROR.UNKOWN,
      error: e,
    };
    if (e instanceof TypeError) {
      process.stdout.write("because of a TypeError");
      errRes.reason = REASON.ERROR.TYPE;
    }
    if (e instanceof ReferenceError) {
      process.stdout.write("because of a ReferenceError");
      errRes.reason = REASON.ERROR.REFERENCE;
    }
    process.stdout.write(" with stacktrace\n" + inspect(e));
    res.status(500).json(errRes);
  }
}
async function logOut(req, res) {
  req.session.destroy();
  req.clearCookie("connect.sid");
  res.sendStatus(200);
}
function getUser(req, res) {
  let user = (req.session || {}).user || null;
  res.json({ user: user });
}

function checkAuthState(req, res, next) {
  // const stateObj = req.app.get(req.query.state||req.body.state);
  // if(!stateObj)
  // const { timestamp, state, ipAddr } = auth || {};
  if (!req.body) {
    res
      .status(400)
      .json({ message: MESSAGE_BAD_REQUEST, reason: "MISSING_REQUEST_BODY" });
    return;
  }
  if (!req.body.state) {
    res.status(401).json({
      message: MESSAGE_NOT_AUTHORIZED,
      reason: REASON.AUTH.STATE_MISSING,
      path: "body",
    });
    return;
  }
  let state = req.app.get(req.body.state);
  if (!state) {
    console.log(state, req.body.state);
    res.status(401).json({
      message: MESSAGE_NOT_AUTHORIZED,
      reason: REASON.AUTH.STATE_NOT_FOUND,
    });
    return;
  }
  if (state.ipAddr != req.connection.remoteAddress) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      message: MESSAGE_NOT_AUTHORIZED,
      reason: REASON.AUTH.IP_MISMATCH,
    });
    return;
  }
  let currentTimestamp = Date.now();
  if (currentTimestamp > state.timestamp + MAX_ELAPSED_REQUEST_TIME) {
    req.app.set(state.state, undefined);
    res.status(401).json({
      message: MESSAGE_NOT_AUTHORIZED,
      reason: REASON.AUTH.SESSION_EXPIRED,
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
module.exports = {
  register,
  logIn,
  logOut,
  getUser,
  startAuthSession,
  checkAuthState,
  getSession,
};
