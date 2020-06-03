const { ArrayToStringHex } = require("../function");

class Input {
  constructor(address, signature) {
    //this.transactionId = transactionId;
    this.address = address;
    this.signature = signature;
  }

  parseInput(input) {
    //this.transactionId = input.amount;
    this.address = input.address;
    this.signature = input.publicKey;
  }

  getDetails() {
    const { address, signature } = this;
    return {
      address,
      signature: ArrayToStringHex(signature),
    };
  }
}

module.exports = Input;
