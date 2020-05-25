const crypto = require("crypto-js");

const Transaction = require("./transaction");

class Block {
  constructor(index, previousBlockHash, nonce, transactions) {
    this.index = index;
    this.nonce = nonce;
    this.previousBlockHash = previousBlockHash;
    this.transactions = transactions;
    if (index !== 0) {
      this.timestamp = Date.now();
    } else {
      this.timestamp = 1500000000000;
    }
  }

  hashValue() {
    const { index, nonce, transactions, timestamp } = this;
    const blockString = `${index}-${nonce}-${JSON.stringify(
      transactions
    )}-${timestamp}`;
    const hash = crypto.SHA256(blockString);
    return hash.toString(crypto.enc.Hex);
  }

  setNonce(nonce) {
    this.nonce = nonce;
  }

  getNonce() {
    return this.nonce;
  }

  getIndex() {
    return this.index;
  }

  getPreviousBlockHash() {
    return this.previousBlockHash;
  }

  getDetails() {
    const { index, nonce, previousBlockHash, transactions, timestamp } = this;
    return {
      index,
      nonce,
      timestamp,
      previousBlockHash,
      transactions: transactions.map((transaction) => transaction.getDetails()),
    };
  }

  parseBlock(block) {
    this.index = block.index;
    this.nonce = block.nonce;
    this.previousBlockHash = block.previousBlockHash;
    this.timestamp = block.timestamp;
    this.transactions = block.transactions.map((transaction) => {
      const parsedTransaction = new Transaction();
      parsedTransaction.parseTransaction(transaction);
      return parsedTransaction;
    });
  }

  printTransactions() {
    this.transactions.forEach((transaction) => console.log(transaction));
  }
}

module.exports = Block;
