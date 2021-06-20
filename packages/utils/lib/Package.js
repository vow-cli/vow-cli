const fse = require("fs-extra");
const path = require("path");
const semver = require("semver");
const log = require("./log");
const { getNpmRegistry, getLatestVersion } = require("./npm");
const { chalkError, chalkInfo } = require("./chalk");
const npminstall = require("npminstall");
const formatPath = require("./formatPath");

class Package {
  /**
   * @description:
   * @param {*} useOriginNpm:是否使用npm源镜像
   * @param {*} targetPath：脚手架所有package缓存的主目录,也可以是本地npm模块的绝对路径
   * @param {*} storePath：package存放的实际目录,如 targetPath/node_modules
   * @param {*} packageName:package名称
   * @param {*} packageVersion：package版本，默认latest
   * @return {*}
   */
  constructor({ useOriginNpm, targetPath, storePath, packageName, packageVersion = "latest" }) {
    this.useOriginNpm = useOriginNpm || false;
    this.targetPath = targetPath;
    this.storePath = storePath;
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.packagePrefix = packageName.replace("/", "_");
  }

  /**
   * @description: 获取安装package在缓存目录中的详细地址，用于获取package.json,包入口文件等
   * @description: npminstall安装的模块目录详细地址由以下几部分组成:_@vow-cli_utils@0.0.6@@vow-cli/utils
   * @param {*}
   * @return {*}
   */
  get packagePath() {
    return path.resolve(this.storePath, `_${this.packagePrefix}@${this.packageVersion}@${this.packageName}`);
  }

  /**
   * @description:安装前准备,检查缓存目录等
   * @param {*}
   * @return {*}
   */
  async beforeInstall() {
    if (!fse.pathExistsSync(this.targetPath)) {
      fse.mkdirpSync(this.targetPath);
    }
    if (!fse.pathExistsSync(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
    log.verbose("targetPath", this.targetPath);
    log.verbose("storePath", this.storePath);
    if (!this.packageName) {
      log.error(chalkError("install package error", "packageName 不能为空"));
      return;
    }
    const latestVersion = await getLatestVersion(this.packageName);
    log.verbose("lastestVersion", this.packageName, latestVersion);
    if (latestVersion) {
      this.packageVersion = latestVersion;
    }
  }

  /**
   * @description: 获取package.json文件
   * @param {*} isOrigin:默认flase，指通过npminstall下载的package
   * @return {*}
   */
  getPackageJSON(isOrigin = false) {
    if (!isOrigin) {
      return fse.readJSONSync(path.resolve(this.packagePath, "package.json"));
    }
    return fse.readJSONSync(path.resolve(this.storePath, "package.json"));
  }

  /**
   * @description: 获取package入口文件
   * @param {*} isOrigin:默认flase，指通过npminstall下载的package
   * @return {*}
   */
  getPackageEntryFile(isOrigin = false) {
    const pkg = this.getPackageJSON(isOrigin);
    if (pkg) {
      if (!isOrigin) {
        return formatPath(path.resolve(this.packagePath, pkg.main));
      }
      return formatPath(path.resolve(this.storePath, pkg.main));
    }
    return null;
  }

  /**
   * @description: 模板的package.json存在于template目录下
   * @param {*} isOrigin
   * @return {*}
   */
  getTemplatePackageJson(isOrigin) {
    if (!isOrigin) {
      return fse.readJSONSync(path.resolve(this.packagePath, "template", "package.json"));
    }
    return fse.readJSONSync(path.resolve(this.storePath, "template", "package.json"));
  }
  /**
   * @description: 安装package到指定目录
   * @param {*}
   * @return {*}
   */
  async install() {
    await this.beforeInstall();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getNpmRegistry(this.useOriginNpm),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }

  /**
   * @description: package是否已经存在，已存在则不需要重新安装
   * @param {*}
   * @return {*}
   */
  isExistedPackage() {
    return fse.pathExistsSync(this.packagePath);
  }

  /**
   * @description: 获取已安装package的版本号，若不是最新版本,则更新该package
   * @param {*}
   * @return {*}
   */
  getExistedPackageVersion() {
    return this.isExistedPackage() ? this.getPackageJSON.version : null;
  }

  /**
   * @description: 更新package
   * @param {*}
   * @return {*}
   */
  async updatePackage() {
    const latestVersion = await getLatestVersion(this.packageName);
    const existedVersion = this.getExistedPackageVersion();
    const isValid = semver.satisfies(existedVersion, `>=${latestVersion}`);
    //不是最新版本,重新安装新版
    if (!isValid) {
      return npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getNpmRegistry(this.useOriginNpm),
        pkgs: [
          {
            name: this.packageName,
            version: this.latestVersion,
          },
        ],
      });
    } else {
      log.info(chalkInfo("update package", `${this.packageName}已是最新版本`));
    }
  }
}

module.exports = Package;
