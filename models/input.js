const { ArrayToStringHex } = require("../function");

class Input {
  /**
   *
   * @param {string} address
   * @param {number[]} signature
   */
  constructor(address, signature) {
    //this.transactionId = transactionId;
    this.address = address;
    this.signature = signature;
  }

  parseInput(input) {
    //this.transactionId = input.amount;
    this.address = input.address;
    this.signature = [...input.signature];
  }

  getDetails() {
    const { address, signature } = this;
    return {
      address,
      signature: ArrayToStringHex(signature),
    };
  }

  getData() {
    const { address, signature } = this;
    return {
      address,
      signature: signature.map((value) => {
        return value;
      }),
    };
  }
}

module.exports = Input;
