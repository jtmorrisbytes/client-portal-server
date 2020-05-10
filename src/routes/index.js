const express = require("express");
const Router = express.Router;
const fs = require("fs");
const path = require("path");
const rootPath = process.env.API_ROOT || "/api";
const routes = Router();

// require routers

const { enforceUserLoggedIn } = require("../controllers/enforceAuth.ts");

function postRequest(req, res) {
  console.log("this function ran after the request finished");
}

const auth = require("./auth");
const user = require("./user");
// mount routers
// const { enforceClientIdExists } = require( "../controllers/clientId";
const { REACT_APP_CLIENT_ID } = process.env;

// verify client id

// routes.use(enforceClientIdExists);
routes.use(user.basePath, enforceUserLoggedIn, user.router);
routes.use(auth.basePath, auth.router);
routes.post(auth.basePath + "/logout", auth.controller.logOut);

// finalize the request

module.exports = { router: routes, rootPath };
