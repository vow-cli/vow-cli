const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const path = require("path");
const { log, Package, exec } = require("@vow-cli/utils");
const program = require("commander");
const beforeExecute = require("./beforeExecute");
const pkg = require("../package.json");
const { DEFAULT_CACHE_DIR_NAME, DEFAULT_DEPENDENCIES_DIR_NAME } = require("./constant");

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
    .command("init [projectName]")
    .description("项目初始化")
    .option("-f,--force", "是否覆盖当前路径")
    .option("--packagePath <packagePath>", "本地init模块路径")
    .action(async (projectName, { force, packagePath }) => {
      //默认执行的是脚手架自带的init模块,也可以通过packagePath指定本地的npm模块
      const initPackageName = "@vow-cli/init";
      execCommand({ packagePath, packageName: initPackageName }, { projectName, force });
    });

  program
    .command("addTpl [tplTitle]")
    .description("添加项目模板")
    .action((tplTitle) => {
      //TODO
      console.log("添加模板", tplTitle);
    });

  //TODO:其他命令
  program.parse(process.argv);
}

/**
 * @description: 通过子进程执行package
 * @param {*} packagePath 自定义package的路径
 * @return {*}
 */
async function execCommand({ packagePath, packageName, packageVersion }, extraOptions) {
  let entryFile;
  try {
    if (packagePath) {
      entryFile = await getLocalPackageEntryFile({ packagePath, packageName, packageVersion });
    } else {
      entryFile = await getRemotePackageEntryFile({ packageName, packageVersion });
    }
    //传递给init模块的参数
    const _config = Object.assign({}, extraOptions);
    if (pathExists(entryFile)) {
      const code = `require('${entryFile}')(${JSON.stringify(_config)})`;
      const childProcess = exec("node", ["-e", code], { stdio: "inherit" });
      childProcess.on("error", (e) => {
        log.version("命令执行失败", e);
        process.exit(1);
      });
      childProcess.on("exit", (c) => {
        log.verbose("命令执行成功:", c);
        process.exit(c);
      });
    } else {
      log.error("init package", "package入口文件不存在");
    }
  } catch (e) {
    log.error(e.message);
  }
}

/**
 * @description: 获取本地Package的入口文件
 * @param {*}
 * @return {*}entryFile：入口文件，即main字段对应的js文件
 */
function getLocalPackageEntryFile({ packagePath, packageName, packageVersion }) {
  const execPackage = new Package({
    targetPath: packagePath,
    storePath: packagePath,
    packageName: packageName,
    packageVersion: packageVersion,
  });
  return execPackage.getPackageEntryFile(true);
}

/**
 * @description: 获取远程package的入口文件
 * @param {*}
 * @return {*}entryFile：入口文件，即main字段对应的js文件
 */
async function getRemotePackageEntryFile({ packageName, packageVersion }) {
  const targetPath = path.resolve(userHome, DEFAULT_CACHE_DIR_NAME, DEFAULT_DEPENDENCIES_DIR_NAME);
  const storePath = path.resolve(targetPath, "node_modules");
  const initPackage = new Package({
    targetPath,
    storePath,
    packageName,
    packageVersion,
  });
  //该package已在缓存目录中
  if (initPackage.isExistedPackage()) {
    await initPackage.updatePackage();
  } else {
    //不存在则下载该package到缓存
    await initPackage.install();
  }
  return initPackage.getPackageEntryFile();
}

module.exports = core;
