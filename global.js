const { fork } = require("child_process");
const path = require("path");

var isKill = true;

let filePath = path.resolve(__dirname, "./utils/proof.js");

var forked = null;

const setDeathFlag = (fork) => {
  fork.on("exit", () => {
    console.log("Child process is kill");
    isKill = true;
  });
  return fork;
};

const Fork = () => {
  if (isKill) {
    forked = setDeathFlag(fork(filePath));
    isKill = false;
    return forked;
  } else {
    return forked;
  }
};

module.exports = Fork;
