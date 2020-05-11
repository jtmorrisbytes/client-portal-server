const express = require("express");
const Router = express.Router;
const fs = require("fs");
const path = require("path");
const rootPath = process.env.API_ROOT || "/api";
const routes = Router();

// require routers

const { enforceUserLoggedIn } = require("../controllers/enforceAuth.ts");

const auth = require("./auth");
const user = require("./user");
const clients = require("./clients");

routes.use(clients.basePath, /*enforceUserLoggedIn,*/ clients.router);
routes.use(user.basePath, enforceUserLoggedIn, user.router);
routes.use(auth.basePath, auth.router);
routes.post(auth.basePath + "/logout", auth.controller.logOut);

// finalize the request

module.exports = { router: routes, rootPath };
