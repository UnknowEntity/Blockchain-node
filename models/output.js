const { SHA256DataToHex, ArrayToStringHex } = require("../function");

class Output {
  /**
   * @param {number} amount
   * @param {string} address
   * @param {number[]} publicKey
   */
  constructor(amount, address, publicKey) {
    this.amount = amount;
    this.address = address;
    this.publicKey = publicKey;
  }

  parseOutput(output) {
    this.amount = output.amount;
    this.address = output.address;
    this.publicKey = [...output.publicKey];
  }

  getDetails() {
    const { amount, address, publicKey } = this;
    return {
      amount,
      address,
      publicKey: ArrayToStringHex(publicKey),
    };
  }

  getData() {
    const { amount, address, publicKey } = this;
    return {
      amount,
      address,
      publicKey: publicKey.map((value) => {
        return value;
      }),
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
