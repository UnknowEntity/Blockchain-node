const { SHA256DataToHex, ArrayToStringHex } = require("../function");

class Output {
  constructor(amount, address, publicKey) {
    this.amount = amount;
    this.address = address;
    this.publicKey = publicKey;
  }

  parseOutput(output) {
    this.amount = output.amount;
    this.address = output.address;
    this.publicKey = output.publicKey;
  }

  getDetails() {
    const { amount, address, publicKey } = this;
    return {
      amount,
      address,
      publicKey: ArrayToStringHex(publicKey),
    };
  }

  getSHA() {
    return SHA256DataToHex({
      amount: this.amount,
      address: this.address,
      publicKey: this.publicKey,
    });
  }
}

module.exports = Output;
