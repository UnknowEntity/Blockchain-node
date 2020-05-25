const crypto = require("crypto-js");

const generateProof = async (block) => {
  const { index, transactions, timestamp } = block;
  let hash = "1";
  let proof = 0;
  let count = 0;
  var dontMine = process.env.BREAK;
  let startTime = Date.now();
  while (dontMine !== "true" && hash.substring(0, 5) !== "00000") {
    count++;
    proof = Math.random() * 10000000001;
    let blockString = `${index}-${proof}-${JSON.stringify(
      transactions
    )}-${timestamp}`;
    let tempHash = crypto.SHA256(blockString);
    hash = tempHash.toString(crypto.enc.Hex);
    dontMine = process.env.BREAK;
  }
  console.log(
    `Number of loop: ${count} Time mining: ${Date.now() - startTime} ms`
  );
  return proof;
};
// new Promise((resolve) => {
//   setImmediate(async () => {
//     let proof = Math.random() * 10000000001;
//     const dontMine = process.env.BREAK;
//     if (isProofValid(previousProof, proof) || dontMine === "true") {
//       resolve({ proof, dontMine });
//     } else {
//       resolve(await generateProof(previousProof));
//     }
//   });
// });

exports.generateProof = generateProof;
