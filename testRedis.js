const redisSession = require("./controllers/redisSession2");
const express = require("express");
const app = express();
app.use(express.json());
app.use(redisSession());
app
  .get("/", (req, res, next) => {
    req.createSession();
    req.session.hello = "world";
    res.send("OK");
  })
  .listen(3000);
