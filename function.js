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

module.exports.FormatedHash = (originalHash, isPublicKey) => {
  var hash = [...originalHash];
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

module.exports.ArrayToStringHex = (array) => {
  return Array.from(array, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
};

module.exports.ParseHexString = (str) => {
  var result = [];
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16));

    str = str.substring(2, str.length);
  }

  return result;
};
