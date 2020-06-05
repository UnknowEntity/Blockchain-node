const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fs = require("fs");

if (!fs.existsSync("./DATA")) {
  fs.mkdirSync("./DATA");
}

const adapter = new FileSync("DATA/db.json", { defaultValue: { keys: [] } });

const db = low(adapter);

module.exports = {
  all: () =>
    db
      .get("keys")
      .value()
      .map((value) => {
        return {
          address: value.address,
          amount: value.amount,
          pubKey: value.publicKey,
        };
      }),
  add: (value) => db.get("keys").push(value).write(),
};
