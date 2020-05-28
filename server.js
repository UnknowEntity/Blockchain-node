const app = require("express")();
const bodyParser = require("body-parser");
const httpServer = require("http").Server(app);
const axios = require("axios");
const io = require("socket.io")(httpServer);
const client = require("socket.io-client");
const secp256k1 = require("secp256k1");

const BlockChain = require("./models/chain");
const Transaction = require("./models/transaction");
const SocketActions = require("./constants");

const socketListeners = require("./socketListeners");

const PORT = process.env.PORT || 3000;
var nodeList = [];

const blockChain = new BlockChain(null, io);

app.use(bodyParser.json());

app.post("/nodes", (req, res) => {
  const { host } = req.body;
  const { callback, nodeLength } = req.query;
  const node = `https://${host}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node), blockChain);
  blockChain.addNode(socketNode);
  if (callback === "true") {
    if (parseInt(nodeLength) > 1 && nodeList.length === 1) {
      axios.post(`${node}/request-list`, {
        host: req.hostname,
      });
    } else if (nodeList.length > 1 && parseInt(nodeLength) === 1) {
      axios.post(`${node}/update-list`, {
        requestNodeList: nodeList,
      });
    }
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/nodes?callback=true&nodeLength=${nodeList.length}`, {
      host: req.hostname,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.post("/transaction", (req, res) => {
  const { publicKey, signature, transaction } = req.body;
  const { sender, receiver, amount } = transaction;

  var buffer = crypto
    .createHash("sha256")
    .update(JSON.stringify(transaction), "utf8")
    .digest();
  const transactionHash = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Uint8Array.BYTES_PER_ELEMENT
  );

  var x = publicKey.splice(0, 32);
  var newPublucKey = publicKey.concat(x);
  newPublucKey.reverse();
  newPublucKey.unshift(4);
  var temp = signature.splice(0, 32);
  var newSignature = signature.concat(temp);
  newSignature.reverse();
  if (
    secp256k1.ecdsaVerify(
      new Uint8Array(newSignature),
      transactionHash,
      new Uint8Array(newPublucKey)
    )
  ) {
    res.json({ status: "valid" });
    io.emit(SocketActions.ADD_TRANSACTION, sender, receiver, amount);
    const transaction = new Transaction(sender, receiver, amount);
    blockChain.newTransaction(transaction);
    console.log(
      `Added transaction: ${JSON.stringify(
        transaction.getDetails(),
        null,
        "\t"
      )}`
    );
  } else {
    res.json({ status: "invalid" });
  }
});

app.get("/chain", (req, res) => {
  res.json(blockChain.toArray()).end();
});

app.get("/hello", (req, res) => {
  io.emit("hello");
  res.json({ status: 200 });
});

app.get("/node-list", (req, res) => {
  io.emit("get nodeList");
  res.json({ status: 200 });
});

app.post("/request-list", (req, res) => {
  const { host, port } = req.body;
  const node = `https://${host}`;
  axios.post(`${node}/update-list`, {
    requestNodeList: nodeList,
  });
  res.json({ status: "request accepted" }).end();
});

app.post("/update-list", (req, res) => {
  const { requestNodeList } = req.body;
  const currentNode = `https://${req.hostname}`;
  console.log(currentNode);

  for (let index = 0; index < requestNodeList.length; index++) {
    if (requestNodeList[index] !== currentNode) {
      axios.post(`${requestNodeList[index]}/request-join`, {
        host: req.hostname,
      });
    }
  }
  res.json({ status: "node list return" }).end();
});

app.post("/request-join", (req, res) => {
  const { host, port } = req.body;
  const { callback } = req.query;
  const node = `https://${host}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node), blockChain);
  blockChain.addNode(socketNode);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/request-join?callback=true`, {
      host: req.hostname,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

io.on("connection", (socket) => {
  console.info(`Socket connected, ID: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected, ID: ${socket.id}`);
  });
});

// blockChain.addNode(socketListeners(client(`http://localhost:${PORT}`)));

httpServer.listen(PORT, () =>
  console.info(`Express server running on ${PORT}...`)
);
