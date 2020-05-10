/// <reference types='express' />

import { Request, Response } from "express";

export async function register(req: Request, res: Response) {
  try {
    const {
      firstName,
      middleName,
      email,
      phoneNumber,
      streetAddress,
      city,
      state,
      zip,
      lastName,
    } = req.body || {};

    // grab database reference from app

    const db = req.app.get("db");
    // check client by username || email address first
  } catch (e) {
    res.status(500).json({});
  }

  res.status(501).json({});
}
export function login(req: Request, res: Response<{ id: string } | {}>) {
  res.status(501).json({});
}
export function update(req: Request, res: Response) {
  res.status(501).json({});
}
