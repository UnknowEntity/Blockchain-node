const Block = require("./block");
const Output = require("./output");
const Transaction = require("./transaction");
//const forked = require("../global");
const GenerateProof = require("../utils/proof");
const crypto = require("crypto");
var BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = require("base-x")(BASE58);
const db = require("../utils/db");

const secp256k1 = require("secp256k1");

const { randomBytes } = require("crypto");

const {
  StringToUint8Array,
  FormatedHash,
  ArrayToStringHex,
} = require("../function");

const { actions, constants } = require("../constants");

class Blockchain {
  constructor(blocks, io) {
    this.blocks = blocks || [new Block(0, 1, 0, [])];
    this.currentTransactions = [];
    this.nodes = [];
    this.io = io;
    this.unSpend = [];
    this.transactionBuffer = null;
    this.blocksBuffer = null;
    this.miningStatus = false;
    this.confirm = 0;
    this.deny = 0;
    this.isConfirm = false;
    this.myReward = null;
    this.workReward = null;
    this.myKey = null;
  }

  createReward() {
    let privKey;
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));

    var pubKey = Array.from(secp256k1.publicKeyCreate(privKey, false));
    pubKey.splice(0, 1);

    var buffer = crypto
      .createHash("sha1")
      .update(JSON.stringify(pubKey), "utf8")
      .digest();
    var address = bs58.encode(buffer);

    this.myKey = {
      privateKey: ArrayToStringHex([...privKey]),
      publicKey: ArrayToStringHex(FormatedHash(pubKey, false)),
      address,
      type: "reward",
      amount: 10,
    };

    const rewardOutput = new Output(10, address, FormatedHash(pubKey, false));
    const rewardTransaction = new Transaction(null, [rewardOutput], "reward");

    return rewardTransaction;
  }

  addNode(node) {
    this.nodes.push(node);
  }

  spendOutputs(transactionToCheck, isSave) {
    let transaction = new Transaction(null, null, null);
    transaction.parseTransaction(transactionToCheck);
    if (transaction.type === "first" || transaction.type === "reward") {
      this.unSpend.push(transaction.outputs[0]);
      return true;
    }

    let inputs = transaction.inputs;
    let outputs = transaction.outputs;
    let inputAmount = 0;
    let outputAmount = 0;
    let unSpend = this.unSpend.map((value) => {
      let unSpendTemp = new Output(0, 0, 0);
      unSpendTemp.parseOutput(value);
      return unSpendTemp;
    });
    let temp = [];

    if (outputs.length === 0) {
      console.log("Wrong output length");
      return false;
    }

    for (let index = 0; index < inputs.length; index++) {
      for (let index2 = 0; index2 < unSpend.length; index2++) {
        if (inputs[index].address === unSpend[index2].address) {
          let unSpendRemove = unSpend.splice(index2, 1);
          temp.push({
            input: inputs[index],
            output: unSpendRemove[0],
          });
          inputAmount += unSpend[index2].amount;
        }
      }
    }

    if (inputs.length !== temp.length) {
      console.log("Wrong input length");
      return false;
    }

    for (let index = 0; index < outputs.length; index++) {
      outputAmount += outputs[index].amount;
    }

    if (inputAmount > outputAmount) {
      console.log("Wrong amount");
      return false;
    }

    for (let index = 0; index < temp.length; index++) {
      var addressHash = StringToUint8Array(temp[index].input.address);

      var newPublicKey = FormatedHash(temp[index].output.publicKey, true);

      var newSignature = FormatedHash(temp[index].input.signature, false);
      if (
        secp256k1.ecdsaVerify(
          new Uint8Array(newSignature),
          addressHash,
          new Uint8Array(newPublicKey)
        )
      ) {
        if (isSave) {
          this.unSpend.splice(this.unSpend.indexOf(temp[index].output), 1);
        }
      } else {
        console.log("Wrong signature");
        return false;
      }
    }
    return true;
  }

  checkIsConfirm(addresses) {
    let status = [];
    for (let index = 0; index < this.unSpend.length; index++) {
      let currentUnSpend = this.unSpend[index];
      for (let index1 = 0; index1 < addresses.length; index1++) {
        if (currentUnSpend.address === addresses[index1]) {
          status.push({
            address: this.unSpend[index].address,
            amount: this.unSpend[index].amount,
          });
        }
      }
    }

    return status;
  }

  mineBlock(block) {
    this.blocksBuffer = [block];
    this.confirm++;
    this.reset();
    console.log("Mined Successfully");
    let tempChain = this.toArrayData();
    tempChain.push(block);
    this.myReward = this.createReward();
    const reward = new Transaction(null, null, null);
    reward.parseTransaction(this.myReward);
    this.io.emit(actions.END_MINING, {
      blocks: tempChain,
      reward: reward.getData(),
    });
  }

  async newTransaction(transaction) {
    this.currentTransactions.push(transaction);
    await this.minning();
  }

  async minning() {
    if (
      this.currentTransactions.length >= constants.NUMBER_OF_TRANSACTION &&
      !this.miningStatus
    ) {
      this.miningStatus = true;
      this.transactionBuffer = this.currentTransactions.splice(
        0,
        constants.NUMBER_OF_TRANSACTION
      );
      console.info("Starting mining block...");
      const previousBlock = this.lastBlock();
      process.env.BREAK = false;
      const transactionsInBlock = this.transactionBuffer.map((value) => {
        let transaction = new Transaction(null, null, null);
        transaction.parseTransaction(value);
        return transaction;
      });
      const block = new Block(
        previousBlock.getIndex() + 1,
        previousBlock.hashValue(),
        previousBlock.getNonce(),
        transactionsInBlock
      );
      // forked().send(block);
      // forked().on("message", (proof) => {
      //   block.setNonce(proof);
      //   this.mineBlock(block);
      // });

      GenerateProof(block).then((value) => {
        let dontMine = process.env.BREAK;
        if (dontMine !== "true") {
          block.setNonce(value);
          this.mineBlock(block);
        }
      });
    }
  }

  async reMinning() {
    console.info("Starting mining block...");
    const previousBlock = this.lastBlock();
    process.env.BREAK = false;
    const transactionsInBlock = this.transactionBuffer.map((value) => {
      let transaction = new Transaction(null, null, null);
      transaction.parseTransaction(value);
      return transaction;
    });
    const block = new Block(
      previousBlock.getIndex() + 1,
      previousBlock.hashValue(),
      previousBlock.getNonce(),
      transactionsInBlock
    );
    forked().send(block);
    forked().on("message", (proof) => {
      block.setNonce(proof);
      this.mineBlock(block);
    });
  }

  lastBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  getLength() {
    return this.blocks.length;
  }

  checkValidity() {
    const { blocks } = this;
    let previousBlock = blocks[0];
    for (let index = 1; index < blocks.length; index++) {
      const currentBlock = blocks[index];
      if (currentBlock.getPreviousBlockHash() !== previousBlock.hashValue()) {
        return false;
      }
      if (
        currentBlock.hashValue().substring(0, constants.DIFFICULTY.length) !==
        constants.DIFFICULTY
      ) {
        return false;
      }
      if (currentBlock.index !== index) {
        return false;
      }
      previousBlock = currentBlock;
    }
    return true;
  }

  compareCurrentBlock(otherBlocks) {
    const { blocks } = this;
    if (blocks.length >= otherBlocks.length) {
      console.log("Wrong block length");
      return false;
    }
    let newBlockLength = otherBlocks.length - blocks.length;

    for (let index = 0; index < blocks.length; index++) {
      if (blocks[index].hashValue() !== otherBlocks[index].hashValue()) {
        console.log("Wrong log hash");
        console.log(blocks[index]);
        console.log(otherBlocks[index]);
        return false;
      }
    }

    let newBlocks = otherBlocks.splice(blocks.length, newBlockLength);

    for (let index = 0; index < newBlocks.length; index++) {
      if (index === 0) {
        let transactionInBlock = newBlocks[0].transactions;
        for (let index1 = 0; index1 < this.transactionBuffer.length; index1++) {
          if (
            transactionInBlock[index1].SHA256TransactionToHex() !==
            this.transactionBuffer[index1].SHA256TransactionToHex()
          ) {
            console.log("Wrong transaction");
            console.log(transactionInBlock[index1]);
            console.log(this.transactionBuffer[index1]);
            return false;
          }
        }
      } else {
        let transactionInBlock = newBlocks[index].transactions;
        for (let index2 = 0; index2 < transactionInBlock.length; index2++) {
          let temp = new Transaction(null, null, null);
          temp.parseTransaction(transactionInBlock[index2]);
          if (!this.spendOutputs(temp, false)) {
            return false;
          }
        }
      }
    }

    this.blocksBuffer = newBlocks;
    return true;
  }

  parseChain(blocks) {
    this.blocks = blocks.map((block) => {
      const parsedBlock = new Block(0);
      parsedBlock.parseBlock(block);
      return parsedBlock;
    });
  }

  toArray() {
    return this.blocks.map((block) => block.getDetails());
  }

  toArrayData() {
    return this.blocks.map((block) => block.getData());
  }

  printBlocks() {
    this.blocks.forEach((block) => console.log(block));
  }

  confirmBlock() {
    console.log("Someone confirm");
    if (!this.isConfirm) {
      this.confirm++;
      let totalNodes = this.nodes.length + 1;
      if (this.confirm >= totalNodes / 2) {
        console.log("Enough confirm");
        this.miningStatus = false;
        this.confirm = 0;
        this.addUnspend();
        const tempChain = this.blocksBuffer.map((value) => {
          let block = new Block(0);
          block.parseBlock(value);
          return block;
        });
        this.blocks = this.blocks.concat(tempChain);

        const transaction = new Transaction(null, null, null);
        if (this.myReward === null) {
          transaction.parseTransaction(this.workReward);
        } else {
          transaction.parseTransaction(this.myReward);
          let tempMyKey = { ...this.myKey };
          db.add(tempMyKey);
          this.myKey = null;
          this.myReward = null;
        }
        this.currentTransactions.unshift(transaction);

        this.blocksBuffer = null;
        this.transactionBuffer = null;
        this.isConfirm = true;
        this.minning();
      }
    }
  }

  denyBlock() {
    console.log("Someone deny");
    if (!this.isConfirm) {
      this.deny++;
      let totalNodes = this.nodes.length + 1;
      if (this.deny >= totalNodes / 2) {
        console.log("Enough deny");
        this.miningStatus = false;
        this.deny = 0;
        this.blocksBuffer = null;
        this.isConfirm = true;
        this.reMinning();
      }
    }
  }

  getStatus() {
    return this.miningStatus;
  }

  reset() {
    this.deny = 0;
    this.confirm = 0;
    this.isConfirm = false;
  }

  addUnspend() {
    let newBlocks = this.blocksBuffer;
    for (let index = 0; index < newBlocks.length; index++) {
      let transactions = null;
      if (newBlocks.length === 1) {
        transactions = this.transactionBuffer;
      } else {
        transactions = newBlocks[index].transactions;
      }

      if (index > 0) {
        for (let index1 = 0; index1 < transactions.length; index1++) {
          let tempTransaction = new Transaction(null, null, null);
          tempTransaction.parseTransaction(transactions[index1]);
          this.spendOutputs(tempTransaction, true);
        }
      }

      for (let index1 = 0; index1 < transactions.length; index1++) {
        let outputs = transactions[index1].outputs;
        for (let index2 = 0; index2 < outputs.length; index2++) {
          this.unSpend.push(outputs);
        }
      }
    }
  }
}

module.exports = Blockchain;
