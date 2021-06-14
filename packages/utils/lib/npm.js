const axios = require("axios");
const urlJoin = require("url-join");

/**
 * @description: 获取npm镜像地址,可根据需要扩展
 * @param {*} isOrigin
 * @return {*}
 */
function getNpmRegistry(isOrigin = false) {
  return isOrigin
    ? "https://registry.npmjs.org"
    : "https://registry.npm.taobao.org";
}

/**
 * @description:获取npm包的历史版本等信息
 * @param {*} npmName:npm包名称
 * @param {*} registry：镜像地址
 * @return {*}
 */
function getNpmInfo(npmName, registry) {
  registry = registry || getNpmRegistry();
  //访问该地址可以得到对应npm包的信息
  const fullNpmUrl = urlJoin(registry, npmName);
  return axios
    .get(fullNpmUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
    })
    .catch((error) => {
      return Promise.reject(error);
    });
}

/**
 * @description: 获取npm包所有历史版本
 * @param {*} npmName
 * @param {*} registry
 * @return {*}
 */
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

/**
 * @description: 获取最新的版本号
 * @param {*}
 * @return {*}
 */
async function getLatestVersion(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (!data["dist-tags"] || !data["dist-tags"].latest) {
    return Promise.reject(new Error("Error: 没有 latest 版本号"));
  }
  const latestVersion = data["dist-tags"].latest;
  return latestVersion;
}

module.exports = {
  getNpmRegistry,
  getNpmInfo,
  getNpmVersions,
  getLatestVersion,
};
