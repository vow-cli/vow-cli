"use strict";

const log = require("./log");
const npm = require("./npm");
const Package = require("./Package");
const inquirer = require("./inquirer");
const spinner = require("./spinner");

function exec(command, args, options) {
  const win32 = process.platform === "win32";

  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;
  //类似于:spawn('cmd', ['/c','node','-e',code]
  return require("child_process").spawn(cmd, cmdArgs, options || {});
}

module.exports = {
  log,
  npm,
  Package,
  exec,
  inquirer,
  spinner,
};
