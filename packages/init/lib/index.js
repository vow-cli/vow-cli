const { log, inquirer, Package, spinner, exec } = require("@vow-cli/utils");
const { TYPE_PROJECT, TYPE_COMPONENT } = require("./constant");
const fse = require("fs-extra");
const path = require("path");
const initProcessor = {};

async function init(options) {
  try {
    const { templateList, name, type, projectPath } = await beforeInit(options);
    const { cliCacheTemplateDirPath } = options;
    const processorOptions = {
      templateList,
      name,
      cliCacheTemplateDirPath,
      projectPath,
    };
    await initProcessor[type](processorOptions);
  } catch (e) {
    log.error("init error:", e.message);
  } finally {
    process.exit(0);
  }
}

/**
 * @description: 项目初始化
 * @param {*}
 * @return {*}
 */
initProcessor[TYPE_PROJECT] = async function (processorOptions) {
  const templateInfo = await downloadTemplate(processorOptions);
  const installOptions = {
    ...templateInfo,
    ...processorOptions,
  };
  //下载成功后安装到当前文件目录
  await installTemplate(installOptions);
};

/**
 * @description: 选择模板并下载到缓存目录
 * @param {*} templateList
 * @param {*} name
 * @param {*} type
 * @return {*}
 */
async function downloadTemplate({ templateList, cliCacheTemplateDirPath }) {
  const templateName = await getTemplateName(templateList);
  log.verbose("template", templateName);
  const selectedTemplate = templateList.find((item) => item.name === templateName);
  log.verbose("selected template:", selectedTemplate);
  const templatePkg = new Package({
    targetPath: cliCacheTemplateDirPath,
    storePath: cliCacheTemplateDirPath,
    packageName: selectedTemplate.name,
    packageVersion: selectedTemplate.version,
  });
  //如果模板不存在
  const templateIsExists = templatePkg.isExistedPackage();
  if (!templateIsExists) {
    let spinnerStart = spinner("正在下载模板");
    await templatePkg.install();
    spinnerStart.stop(true);
    log.info("下载模板成功");
  } else {
    log.notice("模板已存在,模板路径:", `${cliCacheTemplateDirPath}`);
    let spinnerStart = spinner("开始更新模板");
    await templatePkg.updatePackage();
    spinnerStart.stop(true);
    log.info("更新模板成功");
  }
  //安装模板所在的根路径
  const packageSourcePath = templatePkg.packagePath;
  //模板的启动命令
  const startCommand = templatePkg.getTemplatePackageJson().startCommand;
  const templateInfo = {
    sourcePath: packageSourcePath,
    ...selectedTemplate,
    startCommand,
  };
  return templateInfo;
}

/**
 * @description: 安装模板:从缓存目录拷贝到当前项目目录
 * @param {*}
 * @return {*}
 */
async function installTemplate({ sourcePath, projectPath, name, startCommand }) {
  let spinnerStart = spinner("正在安装模板...");
  //模板源码存于package的template目录下
  sourcePath = path.resolve(sourcePath, "template");
  //工作目录+项目名称
  projectPath = path.resolve(projectPath, name);
  fse.ensureDirSync(sourcePath);
  fse.ensureDirSync(projectPath);
  fse.copySync(sourcePath, projectPath);
  spinnerStart.stop(true);
  log.info("模板安装成功");
  //安装依赖
  log.notice("开始安装依赖");
  await npminstall(projectPath);
  log.info("依赖安装成功");
  if (startCommand) {
    startCommand = startCommand.split(" ");
    await execStartCommand(projectPath, startCommand);
  }
}

/**
 * @description: 通过子进程安装依赖
 * @param {*} targetPath
 * @return {*}
 */
async function npminstall(targetPath) {
  return new Promise((resolve, reject) => {
    const p = exec("npm", ["install", "--registry=https://registry.npm.taobao.org"], { stdio: "inherit", cwd: targetPath });
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (c) => {
      resolve(c);
    });
  });
}

/**
 * @description: 执行模板的启动命令
 * @param {*} targetPath
 * @param {*} startCommand
 * @return {*}
 */
async function execStartCommand(targetPath, startCommand) {
  return new Promise((resolve, reject) => {
    const p = exec(startCommand[0], startCommand.slice(1), { stdio: "inherit", cwd: targetPath });
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (c) => {
      resolve(c);
    });
  });
}

/**
 * @description: 组件初始化
 * @param {*}
 * @return {*}
 */
initProcessor[TYPE_COMPONENT] = function () {
  console.log("组件初始化");
};

/**
 * @description: 初始化模板前的校验工作
 * @param {*} force:当文件夹不为空时强制覆盖
 * @param {*} type:project|component 初始化类型
 * @return {*}
 */
async function beforeInit({ force, type }) {
  const projectPath = process.cwd();
  //命令行当前目录的文件列表
  let fileList = fse.readdirSync(projectPath);
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
  let initType = type || (await getInitType());
  log.verbose("initType", initType);
  let projectOrComponentName = "";
  while (!projectOrComponentName) {
    projectOrComponentName = await getProjectOrComponentName(initType);
  }
  log.verbose(projectOrComponentName);
  const templateList = getTemplateList();
  return {
    templateList,
    type: initType,
    name: projectOrComponentName,
    projectPath,
  };
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
 * @description: 获取模板列表
 * @param {*}
 * @return {*}
 */
function getTemplateList() {
  const templateList = [
    {
      title: "koa项目模板",
      name: "@vow-cli/koa-template",
      version: "1.0.0",
    },
    {
      title: "vue3移动端项目模板",
      name: "@vow-cli/vue3-mobile-template",
      version: "1.0.0",
    },
    {
      title: "vue3后台管理项目模板",
      name: "@vow-cli/vue3-admin-template",
      version: "1.0.0",
    },
  ];
  return templateList;
}

/**
 * @description: 选择项目模板
 * @param {*} templateList：模板列表
 * @return {*}
 */
function getTemplateName(templateList) {
  const choices = templateList.map((item) => ({
    value: item.name,
    name: item.title,
  }));
  return inquirer({
    type: "list",
    choices,
    message: "请选择项目模板",
  });
}

module.exports = init;
