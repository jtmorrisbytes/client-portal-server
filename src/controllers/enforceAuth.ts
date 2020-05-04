import * as RESPONSE from "@jtmorrisbytes/lib/Response";
import type { Request, Response, NextFunction } from "express";

function enforceUserLoggedIn(req: Request, res: Response, next: NextFunction) {
  console.log("ENFORCE_AUTH: req.session = ", req.session, req.sessionID);
  if (!req.session.user) {
    res.status(401).json({
      ...RESPONSE.ENotAuthorized,
      REASON: "You must log in before accessing this resource",
      TYPE: "LOGIN_REQUIRED",
      path: "/api/auth/login",
    });
  }
}
export { enforceUserLoggedIn };
