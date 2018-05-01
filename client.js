const fs = require("fs");
const util = require("util");
const request = require("axios");
const logger = require("winston");
const run_cmd = require('node-run-cmd');

const COMMANDS = {
  reboot: 'r',
  upgrade: 'curl -L update.metricmining.com | bash',
  push: 'update',
  oc: 'sudo ethos-overclock'
}


require("axios-debug-log");
//
//
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const liveUrl = "https://api.metricmining.com";
const localUrl = "http://127.0.0.1:8090";
let apiUrl = liveUrl;

const statsLocalFile = "/var/run/ethos/stats.file";
const statsPath = "./stats.file";
let statsFile = statsLocalFile;

const configRigFile = "/home/ethos/local.conf";
const configTestFile = "./local.conf";
let configPath = configRigFile;

let taskPeriod = 1 * 60 * 1000; // 15 seconds


const DEBUG = true;

if (DEBUG) {
  logger.info(`Debug mode active !!`);
  statsFile = statsPath;
  configPath = configTestFile;
  apiUrl = localUrl;
  taskPeriod = 5 * 1000;

}


class Client {
  constructor() {
    //do something
    //
    this.currentConfig = {};

    this.loadAndParseStats(statsFile);
    this.hostname = '';
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
    let payload = {};
    try {
      payload = await this.loadAndParseStats(statsFile);
    } catch (e) {
      return console.error(`no data from loadAndParseStats  ${e} ${payload}`);
    }

    this.hostname = payload.hostname;
    //adding some stuff from the config
    //
    //
    if (this.currentConfig.config) {
      payload.coin = this.currentConfig.config.target_coin.coin;
      payload.config_hash = this.currentConfig.config_hash;
      payload.last_config_update = this.currentConfig.last_update;
    }

    try {
      let res = await request({
        method: "post",
        url: `${apiUrl}/status`,
        data: payload
      });

      // logger.log(`POST status response: ${res}`);
    } catch (e) {
      console.error(e.Error);
    }
  }
  async getWhatTomine() {
    console.log(`run getWhatTomine`);

    try {
      let res = await request({
        method: "get",
        url: `${apiUrl}/whattomine`,
      });

      return res.data;

    } catch (e) {
      console.error(e.Error);
    }
  }
  async getCommands() {
    console.log(`run getWhatTomine from ${this.hostname}`);

    try {
      let res = await request({
        method: "get",
        url: `${apiUrl}/command?host=${this.hostname}`,

      });


      let cmd = res.data;

      if (cmd.command) {
        console.log(`Runing command: ${JSON.stringify(COMMANDS[cmd.command], 0, 4)}`);
        let rest = await run_cmd.run(COMMANDS[cmd.command])
        console.log(`result: ${rest}`);
      }
      return config;

    } catch (e) {
      console.error(e.Error);
    }
  }

  async configLogic() {
    console.log(`run configLogic`);
    try {
      let latestConfig = {};
      latestConfig = await this.getWhatTomine();

      if (!latestConfig) {
        return console.error(`no data from getWhatTomine`);
      }
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
        await writeFile(configPath, newRawConfig, "utf8");
        this.currentConfig = latestConfig;

      }
      console.log(`Same old config: ${latestConfig.config_hash}`);
    } catch (e) {
      console.error(e);
    }
  }
  async run() {

    setInterval(this.sendStats.bind(this), 5000);
    setInterval(this.configLogic.bind(this), 5000);
    setInterval(this.getCommands.bind(this), 5000)
  }

}


//runtime
let client = new Client();
// setTimeout(runTime, taskPeriod, "runTime");