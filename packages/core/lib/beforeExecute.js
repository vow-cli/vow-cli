const semver = require("semver");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const pkg = require("../package.json");
const {
  log,
  npm: { getLatestVersion },
  chalkInfo,
  chalkWarning,
} = require("@vow-cli/utils");
/**
 * @description: 脚手架执行前的准备,比如版本校验等
 * @param {*}
 * @return {*}
 */
async function beforeExecute() {
  tipsCurrentVersion();
  checkNodeVersion();
  checkRootPermission();
  checkUserHome();
  checkInputArgs();
  await checkNewVersion();
}

/**
 * @description: 提示当前脚手架版本
 * @param {*}
 * @return {*}
 */
function tipsCurrentVersion() {
  log.info(chalkInfo("脚手架当前版本:", pkg.version));
}

/**
 * @description: node.js版本校验
 * @param {*}
 * @return {*}
 */
function checkNodeVersion() {
  const currentVersion = process.version;
  const requiredVersion = pkg.engines.node;
  const isValid = semver.satisfies(currentVersion, requiredVersion);
  if (!isValid) {
    throw new Error(`vow-cli 要求Node.js版本${requiredVersion},系统当前的版本为${currentVersion}`);
  }
}

/**
 * @description: root权限检查,mac系统可以使用sudo命令通过管理员权限执行脚手架，会带来文件权限问题
 * @param {*}
 * @return {*}
 */
function checkRootPermission() {
  const rootheck = require("root-check");
  rootheck();
}

/**
 * @description:用户主目录检查,脚手架会在用户主目录中做Temlate缓存
 * @param {*}
 * @return {*}
 */
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error("当前用户主目录不存在");
  }
}

/**
 * @description: 当前版本是否为最新版本,若不是提示用户更新
 * @param {*}
 * @return {*}
 */
async function checkNewVersion() {
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const newestVersion = await getLatestVersion(npmName);
  const isValid = semver.satisfies(currentVersion, `>=${newestVersion}`);
  if (!isValid) {
    log.warn(chalkWarning("更新提示:", `当前版本:${currentVersion}, 最新版本${newestVersion}`));
  }
}

/**
 * @description: 检查入参，开启debug模式
 * @param {*}
 * @return {*}
 */
function checkInputArgs() {
  const minimist = require("minimist");
  const args = minimist(process.argv.slice(2));
  if (args.debug || args.d) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

module.exports = beforeExecute;
