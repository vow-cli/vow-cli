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
    .option("--packagePath <packagePath>", "本地init模块路径")
    .action(async (type, { force, packagePath }) => {
      //默认执行的是脚手架自带的init模块,也可以通过packagePath指定本地的npm模块
      //const packageName = "@vow-cli/init";
      console.log(type, force, packagePath);
      //通过node的多进程去执行模块
    });
  //TODO:其他命令
  program.parse(process.argv);
}

module.exports = core;
