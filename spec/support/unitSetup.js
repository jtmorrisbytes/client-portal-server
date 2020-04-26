const path = require("path");

function getController(filename) {
  return require(filename.replace("spec", "src").replace(".spec.", "."))
    .controller;
}
module.exports = {
  getController
};
