const { log, inquirer } = require("@vow-cli/utils");
const { TYPE_PROJECT, TYPE_COMPONENT } = require("./constant");
const fse = require("fs-extra");
const initProcessor = {};

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
async function beforeInit({ force }) {
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
  let initType = await getInitType();
  log.verbose("initType", initType);
  let projectOrComponentName = "";
  while (!projectOrComponentName) {
    projectOrComponentName = await getProjectOrComponentName(initType);
  }
  log.verbose(projectOrComponentName);
  initProcessor[initType]();
}

/**
 * @description: 初始化类型选择
 * @param {*}
 * @return {*}
 */
function getInitType() {
  return inquirer({
    type: "list",
    choices: [
      {
        name: "项目",
        value: TYPE_PROJECT,
      },
      {
        name: "组件",
        value: TYPE_COMPONENT,
      },
    ],
    message: "请选择初始化类型",
    defaultValue: TYPE_PROJECT,
  });
}

/**
 * @description: 项目名称或组件名称获取
 * @param {*}
 * @return {*}
 */
function getProjectOrComponentName(initType) {
  return inquirer({
    require: true,
    type: "string",
    message: initType === TYPE_PROJECT ? "请输入项目名称" : "请输入组件名称",
    defaultValue: "",
  });
}

/**
 * @description: 项目初始化
 * @param {*}
 * @return {*}
 */
initProcessor[TYPE_PROJECT] = function () {
  //获取已有的项目模板列表,目前从本地缓存中读取,也可以存入数据库中
  // const templateList = [
  //   {
  //     title: "koa项目模板",
  //     name: "@vow-cli/koa-template",
  //     version: "1.0.0",
  //   },
  //   {
  //     title: "vue3移动端项目模板",
  //     name: "@vow-cli/vue3-mobile-template",
  //     version: "1.0.0",
  //   },
  //   {
  //     title: "vue3后台管理项目模板",
  //     name: "@vow-cli/vue3-admin-template",
  //     version: "1.0.0",
  //   },
  // ];
  //TODO
};

/**
 * @description: 组件初始化
 * @param {*}
 * @return {*}
 */
initProcessor[TYPE_COMPONENT] = function () {
  console.log("组件初始化");
};

module.exports = init;
