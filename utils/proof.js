const crypto = require("crypto-js");
const { constants } = require("../constants");

var isBreak = false;

process.on("message", (data) => {
  const { status } = data;
  if (status === 100) {
    FindProof(data.block);
  } else if (status === 300) {
    isBreak = true;
  }
});

const FindProof = (block) => {
  const { index, transactions, timestamp } = block;
  let hash = "1";
  let proof = 0;
  let count = 0;
  var dontMine = isBreak;
  let startTime = Date.now();
  while (
    !dontMine &&
    hash.substring(0, constants.DIFFICULTY.length) !== constants.DIFFICULTY
  ) {
    count++;
    proof = Math.random() * 10000000001;
    let blockString = `${index}-${proof}-${JSON.stringify(
      transactions
    )}-${timestamp}`;
    let tempHash = crypto.SHA256(blockString);
    hash = tempHash.toString(crypto.enc.Hex);
    dontMine = isBreak;
  }

  if (dontMine === true) {
    console.log("Someone mine a blocks");
    process.send({ status: 400 });
  } else {
    console.log("I minne a block");
    process.send({ status: 200, proof });
  }
  console.log(
    `Number of loop: ${count} Time mining: ${Date.now() - startTime} ms`
  );
};
