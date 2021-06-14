const log = require("npmlog");

//定义log等级
log.level = process.env.LOG_LEVEL || "info";

//修改前缀
log.heading = "vow-cli";

module.exports = log;
