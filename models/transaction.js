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
    return {
      inputs: inputs.getDetails(),
      outputs: outputs.getDetails(),
      type,
      timestamp,
    };
  }

  parseTransaction(transaction) {
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
