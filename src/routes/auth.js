// do processing here
const auth = require("../controllers/auth.js");
const {
  logIn,
  logOut,
  register,
  startAuthSession,
  checkAuthState,
  getSession,
} = auth;

const router = require("express").Router();
const basePath = "/auth";

/*
  1. client starts authentication chain by POSTing /, including the client id in request.
  2. client responds with "OK" if auth checks pass, along with initial application state and a random auth state value
     * server will inform client if the session is valid.  
  3. client will be required to log in user before continuing. the next route that should be hit is /login or /register
     * the client will have to ask the server if the user is valid
     * the client will include the random state variable in the next step of the request
     * 
*/
router.post("/", startAuthSession);

router.get("/session", getSession);
// router.use(checkTimeStamp);
router.post("/register", checkAuthState, register);
router.post("/login", checkAuthState, logIn);
// router.post("/logout", logOut);

module.exports = { router, basePath, controller: { logIn, logOut, register } };
