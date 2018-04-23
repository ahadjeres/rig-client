const fs = require("fs");
const util = require("util");
const request = require("axios");
const logger = require("winston");


require("axios-debug-log");
//
//
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const liveUrl = "https://api.metricmining.com";
const localUrl = "http://127.0.0.1:8080";
let apiUrl = liveUrl;

const statsLocalFile = "/var/run/ethos/stats.file";
const statsPath = "./stats.file";
const statsFile = statsPath;

const configRigFile = "/home/ethos/local.conf";
const configTestFile = "./local.conf";
const configPath = configRigFile;

const taskPeriod = 1 * 60 * 1000; // 15 seconds

class Client {
  constructor() {
    //do something
    //
    this.currentConfig = {};
    this.loadAndParseStats(statsLocalFile);
    this.run()
  }


  async loadAndParseStats(filePath) {
    let parsedData = {};
    let data = await readFile(filePath, "utf8");
    let dataPerLine = data.split("\n");

    let dataSplit = [];

    for (let i in dataPerLine) {
      let splitResult = dataPerLine[i].split(":");
      if (splitResult) {
        if (splitResult.length > 1) {
          parsedData[splitResult[0]] = splitResult[1];
        } else {
          // console.log(`array has ony one element: ${splitResult}`);
        }
      } else {
        logger.log(`array is empty: ${splitResult}`);
      }
    }

    logger.log(` data: ${parsedData}`);
    return parsedData;
  }

  async sendStats() {
    console.log(`run sendStats`);
    let payload = await this.loadAndParseStats(statsLocalFile);

    //adding some stuff from the config
    //
    //

    payload.coin = this.currentConfig.config.target_coin.coin;
    payload.config_hash = this.currentConfig.config_hash;
    payload.last_config_update = this.currentConfig.last_update;
    try {
      let res = await request({
        method: "post",
        url: `${liveUrl}/status`,
        data: payload
      });

      // logger.log(`POST status response: ${res}`);
    } catch (e) {
      console.error(e);
    }
  }
  async getWhatTomine() {
    console.log(`run getWhatTomine`);

    try {
      let res = await request({
        method: "get",
        url: `${liveUrl}/whattomine`,
      });

      let config = res.data;
      console.log(`GET status response: ${JSON.stringify(config, 0, 4)}`);
      return config;

    } catch (e) {
      console.error(e);
    }
  }

  async configLogic() {
    console.log(`run configLogic`);
    try {
      const latestConfig = await this.getWhatTomine();
      let newRawConfig = '';

      if (latestConfig.config_hash != this.currentConfig.config_hash) {
        console.log(`new config is diffrent than old config old config_hash: ${this.currentConfig.config_hash} new config_hash ${latestConfig.config_hash}`);
        let baseConfig = Object.entries(latestConfig.config.base);
        let coinConf = Object.entries(latestConfig.config.target_coin);
        let conf = baseConfig.concat(coinConf);
        conf.push(['config_hash', latestConfig.config_hash]);
        conf.push(['last_update', latestConfig.last_update]);
        for (let i in conf) {
          newRawConfig += `${conf[i][0]} ${conf[i][1]} \n`
        }
        console.log(newRawConfig);
        await writeFile(configPath, newRawConfig, "utf8");
        this.currentConfig = latestConfig;
        await console.log(this.currentConfig);

      }
      console.log(`Same old config: ${latestConfig.config_hash}`);
    } catch (e) {
      console.error(e);
    }
  }
  async run() {

    setInterval(this.sendStats.bind(this), 5000);
    setInterval(this.configLogic.bind(this), 5000);
  }

}


//runtime
let client = new Client();
// setTimeout(runTime, taskPeriod, "runTime");