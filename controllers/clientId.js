const {
  MESSAGE_BAD_REQUEST,
  MESSAGE_NOT_AUTHORIZED,
} = require("@jtmorrisbytes/lib").constants;
const { REACT_APP_CLIENT_ID } = process.env;
export function enforceClientIdExists(req, res, next) {
  if (!req.query.clientid) {
    res.status(400).json({
      message: MESSAGE_BAD_REQUEST,
      reason: "MISSING_CLIENT_ID",
      location: "query",
    });
  } else if (req.query.clientid != REACT_APP_CLIENT_ID) {
    res
      .status(401)
      .json({ message: MESSAGE_NOT_AUTHORIZED, reason: "INVALID_CLIENT_ID" });
    return;
  } else {
    next();
  }
}
