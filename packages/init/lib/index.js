const { log, inquirer } = require("@vow-cli/utils");
const fse = require("fs-extra");

async function init(options) {
  try {
    await beforeInit(options);
  } catch (e) {
    log.error("init error:", e.message);
  }
}

/**
 * @description: 初始化模板前的校验工作
 * @param {*} options
 * @return {*}
 */
async function beforeInit({ projectName, force }) {
  //命令行当前目录的文件列表
  let fileList = fse.readdirSync(process.cwd());
  fileList = fileList.filter((file) => !["node_modules", ".git"].includes(file));
  log.verbose("fileList:", fileList);
  let isContinueWhenDirNotEmpty = true;
  if (fileList && fileList.length > 0) {
    isContinueWhenDirNotEmpty = await inquirer({
      type: "confirm",
      message: "当前文件夹不为空,是否继续创建项目?",
      default: false,
    });
  }
  if (!isContinueWhenDirNotEmpty) return;
  log.verbose("isContinueWhenDirNotEmpty:", isContinueWhenDirNotEmpty);
  //强制覆盖
  if (force) {
    const confirmEmptyDir = await inquirer({
      type: "confirm",
      message: "是否清空当前目录下的文件",
      defaultValue: false,
    });
    if (!confirmEmptyDir) return;
    fse.emptyDirSync();
  }
  //TODO：此处需要展示有哪些模板,为考虑扩展性，可以存入数据库或者通过本地文件进行模板配置
}

module.exports = init;
