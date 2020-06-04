const crypto = require("crypto-js");
const { constants } = require("../constants");

process.on("message", (block) => {
  const { index, transactions, timestamp } = block;
  let hash = "1";
  let proof = 0;
  let count = 0;
  var dontMine = process.env.BREAK;
  let startTime = Date.now();
  while (
    hash.substring(0, constants.DIFFICULTY.length) !== constants.DIFFICULTY
  ) {
    count++;
    proof = Math.random() * 10000000001;
    let blockString = `${index}-${proof}-${JSON.stringify(
      transactions
    )}-${timestamp}`;
    let tempHash = crypto.SHA256(blockString);
    hash = tempHash.toString(crypto.enc.Hex);
    dontMine = process.env.BREAK;
  }

  console.log("I minne a block");
  process.send({ status: 200, proof });
  console.log(
    `Number of loop: ${count} Time mining: ${Date.now() - startTime} ms`
  );
  process.exit(0);
});
