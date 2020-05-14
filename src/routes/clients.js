const router = require("express").Router();
const basePath = "/clients";
const controller = require("../controllers/clients.ts");
// let db = null;
// router.ws("/search", (ws, req) => {
//   ws.on("message", async (data) => {
//     let result = [];
//     try {
//       ws.send(JSON.stringify(await req.app.get("db").client.search(data)));
//     } catch (e) {
//       console.error(e);
//       ws.send(JSON.stringify(result));
//     }
//   });
// });
router.get("/search", controller.search);
router.get("/:id", controller.getById);
router.post("/", controller.register);
router.put("/", controller.update);
router.delete("/", controller.deleteC);
module.exports = { basePath, router };
