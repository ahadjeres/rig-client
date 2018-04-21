const fs = require("fs");
const util = require("util");
const request = require("axios");
const logger = require("winston");

const readFile = util.promisify(fs.readFile);

const liveUrl = "https://api.metricmining.com";
const localUrl = "http://127.0.0.1:8080";
let apiUrl = localUrl;

const statsLocalFile = "/var/run/ethos/stats.file";
const statsPath = "./stats.file";
const taskPeriod = 15000; // 15 seconds

async function loadAndParseStats(filePath) {
  let parsedData = {};
  let data = await readFile(filePath, "utf8");
  let dataPerLine = data.split("\n");
  let dataSplit = [];

  for (i in dataPerLine) {
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
  logger.log(parsedData);
  return parsedData;
}

//runtime
async function runTime(arg) {
  let payload = await loadAndParseStats(statsPath);
  try {
    let res = await request({
      method: "post",
      url: `${liveUrl}/status`,
      data: payload
    });
    logger.log(`POST status response: ${res}`);
  } catch (e) {
    logger.error(e);
  }
}
runTime();
// setTimeout(runTime, taskPeriod, "runTime");
