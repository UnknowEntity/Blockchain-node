const crypto = require("crypto");

module.exports.JSONToUint8Array = (data) => {
  var buffer = crypto
    .createHash("sha256")
    .update(JSON.stringify(data), "utf8")
    .digest();
  const hash = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Uint8Array.BYTES_PER_ELEMENT
  );
  return hash;
};

module.exports.StringToUint8Array = (data) => {
  var buffer = crypto.createHash("sha256").update(data, "utf8").digest();
  const hash = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Uint8Array.BYTES_PER_ELEMENT
  );
  return hash;
};

module.exports.FormatedHash = (hash, isPublicKey) => {
  var x = hash.splice(0, 32);
  var newHash = hash.concat(x);
  newHash.reverse();

  if (isPublicKey) {
    newHash.unshift(4);
  }
  return newHash;
};

module.exports.SHA256DataToHex = (data) => {
  var buffer = crypto
    .createHash("sha256")
    .update(JSON.stringify(data), "utf8")
    .digest("hex");
  return buffer;
};
