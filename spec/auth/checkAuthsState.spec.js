// const jasmine = require("jasmine");

let request = require("supertest");
async function startAuthSession(done, callback) {
  let server = await require("../../index.js")();
  request(server)
    .post("/api/auth/")
    .expect("Content-Type", /json/)
    .expect(200, (err, res) => {
      if (err) {
        done(err);
        console.error("an error occurred while registering", err);
      } else {
        expect(res.body).toEqual(jasmine.any(Object));
        // expect(res.body.auth).toEqual(jasmine.any(Object));
        const { state, timestamp, ipAddr } = res.body;
        expect(timestamp).toEqual(jasmine.any(Number));
        expect(timestamp).toBeLessThan(Date.now());
        expect(timestamp).toBeGreaterThan(0);
        expect(state).toBeDefined();
        expect(state).toEqual(jasmine.any(String));
        expect(state.length).toBeGreaterThan(0);
        if (callback) {
          callback(server, state, timestamp, ipAddr);
        } else {
          done();
          server = null;
        }
      }
    });
}
function expectErrorMessages(res) {
  console.log(res.body);
  expect(res.body).toBeDefined(
    "The server should send an error response object in the body"
  );
  expect(res.body.message).toBeDefined(
    "The server should respond with a message detailing the response"
  );
  expect(res.body.message).toEqual(jasmine.any(String));
  expect(res.body.reason).toBeDefined(
    "The server should reply with the appropriate constant associated with the event"
  );
  expect(res.body.reason).toEqual(jasmine.any(String));
}
function registerUser(
  done,
  serverInst,
  state,
  testUser,
  timestamp,
  ipAddr,
  callback
) {
  request(serverInst)
    .post("/api/auth/register")
    .send({
      state,
      user: testUser,
    })
    .expect("Content-Type", /json/)
    .expect(200, (err, registerRes) => {
      if (err) {
        expectErrorMessages(registerRes);
        done(err);
      } else {
        console.log("registration response body", registerRes.body);
        expect(registerRes.body).toBeDefined(
          "The server should respond with an object in the body"
        );
        expect(registerRes.body).toEqual(jasmine.any(Object));
        const body = registerRes.body;
        expect(body.session).toBeDefined(
          "The server should respond with a property called session inside of body"
        );
        expect(body.session).toEqual(jasmine.any(Object));
        const { session } = body;
        expect(session.sessionID).toBeDefined(
          "The server should respond with property session ID on body.session"
        );
        const { user } = session;
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.id).toBeGreaterThanOrEqual(0);
        if (callback) {
          callback(serverInst, state, testUser, timestamp, ipAddr);
        } else {
          done();
        }
      }
    });
}
function genRandomEmail() {
  return `johnDoe${Math.floor(Math.random() * 10000)}@gmail.com`;
}
describe("When the user tries to authenicate", function () {
  // console.dir(app);

  const testUser = {
    firstName: "Jordan",
    lastName: "Morris",
    email: genRandomEmail(),
    address: "123 Software way",
    city: "Silicon Valley",
    state: "California",
    zip: "12345",
    phoneNumber: "1234567890",
  };
  let toShortPassword = "!a3";
  let badPassword = "password";
  let strongPassword = "j}4Sf_td'pQ%";
  let testSessionID = null;
  it("should be able to start an authentication session", async (done) => {
    startAuthSession(done);
  });
  it("should be able to register after starting an auth session", (done) => {
    startAuthSession(done, (serverInst, state, timestamp, ipAddr) => {
      registerUser(
        done,
        serverInst,
        state,
        { ...testUser, password: strongPassword },
        timestamp,
        ipAddr
      );
    });
  });
  describe("the user should be able to login after registering", () => {
    it("and the server should respond with 200 and the correct response body", (done) => {
      startAuthSession(done, (server, state, timestamp, ipAddr) => {
        registerUser(
          done,
          server,
          state,
          { ...testUser, password: strongPassword, email: genRandomEmail() },
          timestamp,
          ipAddr,
          (serverInst, state, testUser, timestamp, ipAddr) => {
            request(serverInst)
              .post("/api/auth/login")
              .send({
                state,
                user: { email: testUser.email, password: testUser.password },
              })
              .expect(200, (err, res) => {
                if (err) {
                  console.error(
                    "an error occurred while trying to log in",
                    err
                  );
                  expectErrorMessages(res);
                  done(err);
                } else {
                  console.log(
                    "test: Login user recieved response object",
                    res.body
                  );
                  expect(res.body).toBeDefined(
                    "The server should respond with an object in the body"
                  );
                  expect(res.body).toEqual(jasmine.any(Object));
                  expect(res.body.session).toBeDefined(
                    "The server should respond with property session in the body"
                  );
                  expect(res.body.session).toEqual(jasmine.any(Object));
                  let user = ((res.body || {}).session || {}).user;

                  expect(user).toBeDefined(
                    "The sever should respond with property user in session"
                  );
                  expect(user).toEqual(jasmine.any(Object));
                  expect(user.id).toBeDefined("user id must exist on session");
                  expect(user.id).toEqual(jasmine.any(Number));
                  done();
                }
              });
          }
        );
      });
    });
  });
});
