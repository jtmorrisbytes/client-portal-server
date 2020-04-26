const path = require("path");
const unitSetup = require(path.join(
  process.cwd(),
  "spec",
  "support",
  "unitSetup.js"
));

const controller = unitSetup.getController(__filename);
process.stdout.write(controller + "\r\n");

describe("tests run", function() {
  it("adds one plus one", function() {
    expect(1 + 1 === 2).toBe(true);
  });
});
