const crypto = require("crypto-js");
const { constants } = require("../constants");

const generateProof = async (block) => {
  const { index, transactions, timestamp } = block;
  let hash = "1";
  let proof = 0;
  let count = 0;
  var dontMine = process.env.BREAK;
  let startTime = Date.now();
  while (
    dontMine !== "true" &&
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

  if (dontMine === "true") {
    console.log("Someone mine a blocks");
  }
  console.log(
    `Number of loop: ${count} Time mining: ${Date.now() - startTime} ms`
  );
  return proof;
};

exports.generateProof = generateProof;
