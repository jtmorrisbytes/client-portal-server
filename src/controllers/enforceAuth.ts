import { Resource } from "@jtmorrisbytes/lib/Resource";
import type { Request, Response, NextFunction } from "express";

function enforceUserLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    res.status(401).json({
      ...new Resource.ENotAuthorized(),
      REASON: "You must log in before accessing this resource",
      TYPE: "LOGIN_REQUIRED",
      path: "/api/auth/login",
    });
  }
}
module.exports = { enforceUserLoggedIn };
