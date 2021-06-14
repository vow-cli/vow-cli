const { log } = require("@vow-cli/utils");
const beforeExecute = require("./beforeExecute");

async function core() {
  try {
    await beforeExecute();
  } catch (e) {
    log.error(e.message);
  }
}

module.exports = core;
