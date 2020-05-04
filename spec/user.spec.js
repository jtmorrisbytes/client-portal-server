let request = require("supertest");
const { Server } = require("../../dist/index.js");

describe("The user", async () => {
  it("should require you to log in first", (done) => {
    let server = await Server.main();
    request(server).get("/api/user").expect(401,done)
  });
});
