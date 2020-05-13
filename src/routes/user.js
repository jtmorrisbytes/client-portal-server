const controller = require("../controllers/user");
const router = require("express").Router();
const basePath = "/user";
// get /user with no parameter getts the currently logged in user
router.get("/", controller.getUser);
router.get("/clients", controller.getClients);
router.post("/clients", controller.addClient);
module.exports = { basePath, router };
