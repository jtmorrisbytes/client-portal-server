const crypto = require("crypto");
const redis = require("redis");
const equal = require("deep-equal");
const util = require("util");
const defaultConfig = {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  },
  session: {
    maxAge: 60 * 5,
    prefix: "sess",
  },
};

function RedisSession(config) {
  log("redis session initialized with config", config);
  config = config || defaultConfig;
  log("config defaulted to ", config);
  this.sessionConfig = config.session;
  this.redisConfig = config.redis;
  this.client = redis.createClient(this.redisConfig);

  //create the client
  // this.session = new Session(this.client);
  // log("closure creator recieved client", client);
  this.set = util.promisify(this.client.set).bind(this.client);
  this.del = util.promisify(this.client.del).bind(this.client);
  this.get = util.promisify(this.client.get).bind(this.client);

  function hash(object) {
    return crypto
      .createHash("sha1")
      .update(JSON.stringify(object))
      .digest("hex");
  }
  return (function (_this) {
    async function destroy(sessionID, req, res) {
      if (sessionID) {
        req.app.set(sessionID, undefined);
        _this.client.del(sessionID, (err, reply) => {
          if (err) {
            console.error("an error occurred deleting a session", err);
          } else if (reply === "OK") {
            log(
              "sucessfully updated session beginning with " +
                sessionID.substring(0, 5)
            );
            res.removeListener("close", update);
            res.removeListener("finish", update);
            if (req.session) {
              req.session = null;
            }
            sessionID = null;
          }
        });
      }
    }
    return function SessionHandler(req, res, next) {
      let sessionID = req.query.sessionID || req.body.sessionID;

      let update = async function update() {
        if (req.session && (req.session || {}).sessionID) {
          log("update redis session requested", sessionID);
          if (!equal(req.session, initialSession)) {
            let reply = await _this.set(
              sessionID,
              JSON.stringify(req.session),
              "EX",
              _this.sessionConfig.maxAge
            );
            if (reply === "OK") {
              log("successfully updated session with id", sessionID);
            } else {
              console.warn(
                "A potential error occurred when updating the session",
                reply
              );
            }
          }
        }
      };

      var initialSession = {
        update,
        destroy,
        create,
      };
      async function create() {
        sessionID = crypto.randomBytes(32).toString("base64");
        req.session = { ...initialSession, sessionID };
        req.app.set(sessionID, hash(JSON.stringify(req.session)));
      }
      if (sessionID) {
        _this.client.get(sessionID.toString(), (err, reply) => {
          if (err) {
            next(err);
          } else if (reply === null) {
            res.status(400).json({ message: "Session ID does not exist" });
            return;
          } else {
            try {
              req.session = { ...initialSession, ...JSON.parse(reply) };
              next();
            } catch (e) {
              console.warn(
                "Something went wrong while performing the initial session ID Lookup"
              );
              res.removeListener("finish", update);
              res.removeListener("close", update);
              res
                .status(500)
                .json({ message: "Initial session lookup failed", reply });
            }
          }
        });
      } else {
        req.session = { ...initialSession };
        next();
      }
      res.on("finish", update);
    };
  })(this);
}
module.exports = RedisSession;
