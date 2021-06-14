const { log } = require("@vow-cli/utils");
const program = require("commander");
const beforeExecute = require("./beforeExecute");
const pkg = require("../package.json");

async function core() {
  try {
    await beforeExecute();
    registerCLICommand();
  } catch (e) {
    log.error(e.message);
  }
}

/**
 * @description: 注册脚手架命令
 * @param {*}
 * @return {*}
 */
function registerCLICommand() {
  const version = pkg.version;
  const name = Object.keys(pkg.bin)[0];
  program.version(version).name(name).usage("<command> [options]");
  program
    .command("init [type]")
    .description("项目初始化")
    .option("-f,--force", "是否覆盖当前路径")
    .action((source, desination) => {
      //TODO：此处处理init模块的内容
      console.log(source, desination);
    });
  //TODO:其他命令
  program.parse(process.argv);
}

module.exports = core;
