/// <reference types='express' />

import { Request, Response } from "express";
import * as EMAIL from "@jtmorrisbytes/lib/Email";
import * as NAME from "@jtmorrisbytes/lib/Name";
import { convertSnakeToCamel } from "../lib/convertSnakeToCamel";
// TODO: move this over to the library
let ENameInvalid = {
  MESSAGE: "field BLANK was not a valid Name",
  TYPE: "NAME_INVALID",
  field: "",
  value: "",
  CODE: 400,
};
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
    if (email == null) {
      res.status(EMAIL.EMissing.CODE).json(EMAIL.EMissing);
    } else if (!EMAIL.Email(email).isValid) {
      res.status(EMAIL.EInvalid.CODE).json(EMAIL.EInvalid);
    } else if (!new NAME.Name(firstName).isValid) {
      res.status(ENameInvalid.CODE).json({
        ...ENameInvalid,
        MESSAGE: "Field firstName was invalid",
        field: "firstName",
        value: firstName,
      });
    } else if (!new NAME.Name(lastName).isValid) {
      res.status(ENameInvalid.CODE).json({
        ...ENameInvalid,
        MESSAGE: "Field lastName is invalid",
        field: "lastName",
        value: lastName,
      });
    } else {
      let createResult = await req.app
        .get("db")
        .client.createC(
          firstName,
          lastName,
          String(email).toLowerCase(),
          phoneNumber,
          streetAddress,
          city,
          state,
          zip
        );
      if (createResult.length > 0) {
        let user = createResult[0];
        res.status(201).json(convertSnakeToCamel(user));
      } else {
        res.status(500).json({});
      }
    }
    // check client by username || email address first
  } catch (e) {
    console.error(e);
    switch (+e.code) {
      case 23502:
        console.error("constraint violation");
        res.status(400).json({
          MESSAGE: `Field ${e.column} violated null constraint`,
          TYPE: "VIOLATED_NULL_CONSTRAINT",
          field: e.column,
        });
        break;
      case 23505:
        // let match = /\(([a-zA-Z]+)\)=\(([a-zA-Z0-9.@\!#$%^&*\(\)\_\-\=]+)\)/.exec(
        //   e.detail
        // );
        console.error("UNIQUE CONSTRAINT VIOLATION");
        res.status(400).json({
          MESSAGE: "That $field already exists",
          TYPE: "VIOLATED_UNIQUE_CONSTRAINT",
          field: e.column || null,
          value: e.hint || null,
        });
      default:
        res.status(500).json({ error: e, data: {} });
    }
  }
}
export function login(req: Request, res: Response) {
  res.status(501).json({});
}
export async function update(req: Request, res: Response) {
  let {
    clientId,
    firstName,
    middleName,
    lastName,
    email,
    phoneNumber,
    streetAddress,
    city,
    state,
    zip,
  } = req.body || {};
  if (clientId == null) {
    res.status(400).json({
      MESSAGE: "Field client.clientId was missing from the request",
      TYPE: "CLIENT_ID_MISSING",
    });
  } else if (String(+clientId) === "NaN") {
    res.status(400).json({
      MESSAGE:
        "Expected field client.clientId to be a number, but recieved '" +
        typeof clientId +
        "'",
      TYPE: "CLIENT_ID_INVALID",
    });
  }
  if (email == null) {
    res.status(EMAIL.EMissing.CODE).json(EMAIL.EMissing);
  } else if (!EMAIL.Email(email).isValid) {
    res.status(EMAIL.EInvalid.CODE).json(EMAIL.EInvalid);
  }
  if (!new NAME.Name(firstName).isValid && firstName) {
    res.status(ENameInvalid.CODE).json({
      MESSAGE: "field firstName was not a valid Name",
      TYPE: "NAME_INVALID",
      field: "firstName",
      value: firstName,
    });
    return;
  }
  if (!new NAME.Name(lastName).isValid && lastName) {
    res.status(ENameInvalid.CODE).json({
      MESSAGE: "field lastName was not a valid Name",
      TYPE: "NAME_INVALID",
      field: "lastName",
      value: lastName,
    });
    return;
  }
  try {
    let updateResult = await req.app
      .get("db")
      .client.updateC(
        clientId,
        firstName,
        lastName,
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zip
      );
    if (updateResult.length > 0) {
      res.status(200).json(convertSnakeToCamel(updateResult[0]));
    } else {
      res.status(500).send();
    }
  } catch (e) {
    console.error("client.update route handler:", e);
    switch (+e.code) {
      case 23505:
        res.status(400).json({
          ...EMAIL.ENotAuthorized,
          REASON: "Emails must be unique between clients",
          CODE: 400,
        });
        break;
      default:
        res.status(500).json({ error: e, data: {} });
    }
  }
}
export async function search(req: Request, res: Response) {
  try {
    let searchResult = await req.app
      .get("db")
      ?.client?.searchC(`%${req.query.q || ""}%`);
    searchResult = searchResult.map((entry: object) => {
      return convertSnakeToCamel(entry);
    });
    res.status(200).json(searchResult);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e, data: [] });
  }
}
export async function deleteC(req: Request, res: Response) {
  console.log("delete client requested for " + req.body.clientId);
  if (+req.body?.clientId > 0) {
    try {
      let deleteResult = await req.app
        .get("db")
        ?.client?.deleteC(req.body.clientId);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e });
    }
  } else {
    res.status(400).json({
      MESSAGE: "ClientId was missing or invalid",
      TYPE: "DELETE_CLIENT_MISSING_OR_INVALID_CLIENT_ID",
    });
  }
}
export async function getById(req: Request, res: Response) {
  try {
    let client = await req.app.get("db").client.findById(req.params.id || 0);
    res.status(200).json(client || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e });
  }
}
