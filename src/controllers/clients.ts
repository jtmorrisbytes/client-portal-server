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

    let createResult = await req.app
      .get("db")
      .client.createC(
        firstName,
        lastName,
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zip
      );
    if (createResult.length > 0) {
      res.status(201).json(createResult[0]);
    } else {
      res.status(500).json({});
    }

    // check client by username || email address first
  } catch (e) {
    console.error(e);

    if (e.code === "23502") {
      console.error("constraint violation");
      res.status(400).json({
        MESSAGE: `Field ${e.column} violated null constraint`,
        TYPE: "VIOLATED_NULL_CONSTRAINT",
        field: e.column,
      });
    } else {
      res.status(500).json({ error: e, data: [] });
    }
  }

  res.status(501).json({});
}
export function login(req: Request, res: Response<{ id: string } | {}>) {
  res.status(501).json({});
}
export function update(req: Request, res: Response) {
  res.status(501).json({});
}
export async function search(req: Request, res: Response) {
  try {
    res
      .status(200)
      .json(
        (await req.app.get("db")?.client?.searchC(`%${req.query.q || ""}%`)) ||
          []
      );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e, data: [] });
  }
}
export async function deleteC(req: Request, res: Response) {
  res.status(501).json({});
}
