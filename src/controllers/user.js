const {
  convertSnakeToCamel,
  snakeArrToCamelArr,
} = require("../lib/convertSnakeToCamel");

async function getUser(req, res) {
  if ((req.session.user || {}).id) {
    const db = req.app.get("db");
    try {
      let result = await db.user.getLoggedIn(req.session.user.id);
      res.json(result[0]);
      return;
    } catch (e) {
      console.log(e);
      res.status(500).json({});
    }
  }
  res.json({ user: null });
}
async function getClients(req, res) {
  try {
    res.json(
      snakeArrToCamelArr(
        await req.app
          .get("db")
          .user.getClients(req.session.user.id || req.body.userId)
      )
    );
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
}
async function addClient(req, res) {
  try {
    console.log("Adding client to user", req.body);
    //if the database function does not throw an error, the operation
    //is considered to be successful
    await req.app
      .get("db")
      .user.addClient(
        req.session.user.id || req.body.userId,
        req.body.clientId
      );
    res.status(204).send();
  } catch (e) {
    switch (e.code) {
      case "23505":
        res.status(400).json({
          MESSAGE: "The given client is already associated with the user",
          TYPE: "UNIQUE_VIOLATION",
          userId: req.body.userId,
          clientId: req.body.clientId,
        });
      case "23502":
        res.status(400).json({
          MESSAGE:
            "Either clientId or userId was null or did not exist, which is not allowed",
          TYPE: "NOT_NULL_VIOLATION",
          userId: req.body.userId,
          clientId: req.body.clientId,
        });
      default:
        console.error("user.addClient: An unhandled error occurred", e);
        res.status(500).json({ error: e });
    }
  }
}
module.exports = { getUser, getClients, addClient };
