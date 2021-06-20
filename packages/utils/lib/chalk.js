const chalk = require("chalk");

const chalkError = chalk.red;

const chalkWarning = chalk.yellow;

const chalkSuccess = chalk.green;

const chalkInfo = chalk.blue;

const chalkGray = chalk.gray;

const chalkDebug = chalk.bold.gray;

module.exports = {
  chalk,
  chalkInfo,
  chalkSuccess,
  chalkWarning,
  chalkError,
  chalkGray,
  chalkDebug,
};
