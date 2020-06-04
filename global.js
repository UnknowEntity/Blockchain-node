const { fork } = require("child_process");

let filePath = path.resolve(__dirname, "./utils/proof.js");
const forked = fork(filePath);

module.exports = forked;
