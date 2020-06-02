const Block = require("./block");

const secp256k1 = require("secp256k1");

const { StringToUint8Array, FormatedHash } = require("../function");

const actions = require("../constants");

const { generateProof } = require("../utils/proof");

class Blockchain {
  constructor(blocks, io) {
    this.blocks = blocks || [new Block(0, 1, 0, [])];
    this.currentTransactions = [];
    this.nodes = [];
    this.io = io;
    this.unSpend = [];
  }

  addNode(node) {
    this.nodes.push(node);
  }

  spendOutputs(transaction) {
    if (transaction.type === "first" || transaction.type === "reward") {
      this.unSpend.push(transaction.outputs[0]);
      return true;
    }

    let inputs = transaction.inputs;
    let outputs = transaction.outputs;
    let inputAmount = 0;
    let outputAmount = 0;
    let unSpend = this.unSpend;
    let temp = [];

    if (outputs.length === 0) {
      return false;
    }

    for (let index = 0; index < inputs.length; index++) {
      for (let index2 = 0; index2 < unSpend.length; index2++) {
        if (inputs[index].address === unSpend[index2].address) {
          temp.push({ input: inputs[index], output: unSpend[index2] });
          inputAmount += unSpend[index2].amount;
        }
      }
    }

    if (inputs.length !== temp.length) {
      return false;
    }

    for (let index = 0; index < outputs.length; index++) {
      outputAmount += outputs[index].amount;
    }

    if (inputAmount > outputAmount) {
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
        this.unSpend.splice(this.unSpend.indexOf(temp[index].output), 1);
      } else {
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
    this.blocks.push(block);
    for (let index1 = 0; index1 < block.length; index1++) {
      let currentOutputs = block[index].outputs;
      for (let index2 = 0; index2 < currentOutputs.length; index2++) {
        this.unSpend.push(currentOutputs[index2]);
      }
    }

    console.log("Mined Successfully");
    this.io.emit(actions.END_MINING, {
      blocks: this.toArray(),
      unSpend: this.unSpend,
    });
  }

  async newTransaction(transaction) {
    this.currentTransactions.push(transaction);
    if (this.currentTransactions.length === 2) {
      console.info("Starting mining block...");
      const previousBlock = this.lastBlock();
      process.env.BREAK = false;
      const block = new Block(
        previousBlock.getIndex() + 1,
        previousBlock.hashValue(),
        previousBlock.getNonce(),
        this.currentTransactions
      );
      const nonce = await generateProof(block);
      const dontMine = process.env.BREAK;
      block.setNonce(nonce);
      this.currentTransactions = [];
      if (dontMine !== "true") {
        this.mineBlock(block);
      }
    }
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
      if (currentBlock.hashValue().substring(0, 5) !== "00000") {
        return false;
      }
      if (currentBlock.index !== index) {
        return false;
      }
      previousBlock = currentBlock;
    }
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
  printBlocks() {
    this.blocks.forEach((block) => console.log(block));
  }
}

module.exports = Blockchain;
