const Output = require("./output");
const Input = require("./input");
const { SHA256DataToHex } = require("../function");

class Transaction {
  constructor(inputs, outputs, type) {
    this.id = "0";
    this.inputs = inputs;
    this.outputs = outputs;
    this.type = type;
    this.timestamp = Date.now();
  }

  getDetails() {
    const { inputs, outputs, type, timestamp } = this;
    let inputsDetails = null;
    if (inputs !== null) {
      inputsDetails = inputs.map((value) => value.getDetails());
    }
    return {
      inputs: inputsDetails,
      outputs: outputs.map((value) => value.getDetails()),
      type,
      timestamp,
    };
  }

  SHA256TransactionToHex() {
    return SHA256DataToHex(this.getDetails());
  }

  parseTransaction(transaction) {
    if (transaction.type !== "first" && transaction.type !== "reward") {
      this.inputs = transaction.inputs.map((value) => {
        return new Input(value.address, value.signature);
      });
    }
    this.outputs = transaction.outputs.map((value) => {
      return new Output(value.amount, value.address, value.publicKey);
    });
    this.type = transaction.type;

    this.id = SHA256DataToHex({
      inputs: this.inputs,
      outputs: this.outputs,
      type: this.type,
      timestamp: this.timestamp,
    });
    return this.id;
  }

  parseTransactionWallet(transaction) {
    if (transaction.Type !== "first" && transaction.Type !== "reward") {
      this.inputs = transaction.Inputs.map((value) => {
        return new Input(value.Address, value.Signature);
      });
    }
    this.outputs = transaction.Outputs.map((value) => {
      return new Output(value.Amount, value.Address, value.PublicKey);
    });
    this.type = transaction.Type;

    this.id = SHA256DataToHex({
      inputs: this.inputs,
      outputs: this.outputs,
      type: this.type,
      timestamp: this.timestamp,
    });
    return this.id;
  }
}

module.exports = Transaction;
