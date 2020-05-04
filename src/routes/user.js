const controller = require("../controllers/user");
const router = require("express").Router();
const basePath = "/user";
// get /user with no parameter getts the currently logged in user
router.get("/", controller.getUser);

module.exports = { basePath, router };
