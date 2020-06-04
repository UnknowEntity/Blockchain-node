const { fork } = require("child_process");
const path = require("path");

var isKill = false;

let filePath = path.resolve(__dirname, "./utils/proof.js");

var forked = fork(filePath);

forked.on("exit", () => {
  console.log("Child process is kill");
  isKill = true;
});

const Fork = () => {
  if (isKill) {
    forked = fork(filePath);
    isKill = false;
    return forked;
  } else {
    return forked;
  }
};

module.exports = Fork;
