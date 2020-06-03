const app = require("express")();
const bodyParser = require("body-parser");
const httpServer = require("http").Server(app);
const axios = require("axios");
const io = require("socket.io")(httpServer);
const client = require("socket.io-client");
const secp256k1 = require("secp256k1");
const crypto = require("crypto");

const { JSONToUint8Array, FormatedHash } = require("./function");

const BlockChain = require("./models/chain");
const Transaction = require("./models/transaction");
const { actions } = require("./constants");

const socketListeners = require("./socketListeners");

const PORT = process.env.PORT || 3000;
var nodeList = [];

const blockChain = new BlockChain(null, io);

app.use(bodyParser.json());

app.post("/nodes", (req, res) => {
  const { host, port } = req.body;
  const { callback, nodeLength } = req.query;
  const node = `http://${host}:${port}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node), blockChain);
  blockChain.addNode(socketNode);
  if (callback === "true") {
    if (parseInt(nodeLength) > 1 && nodeList.length === 1) {
      axios.post(`${node}/request-list`, {
        host: req.hostname,
        port: PORT,
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
      port: PORT,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.post("/transaction", (req, res) => {
  const transaction = req.body;
  console.log(transaction);
  var clientTansaction = new Transaction(null, null, null);
  var id = clientTansaction.parseTransactionWallet(transaction);
  if (blockChain.spendOutputs(clientTansaction, true)) {
    res.json({ status: "valid", id });
    io.emit(actions.ADD_TRANSACTION, transaction);
    blockChain.newTransaction(clientTansaction);
    console.log(
      `Added transaction: ${JSON.stringify(
        clientTansaction.getDetails(),
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

app.post("/getconfirm", (req, res) => {
  let confirms = blockChain.checkIsConfirm(req.body);
  res.json(confirms);
});

app.post("/request-list", (req, res) => {
  const { host, port } = req.body;
  const node = `http://${host}:${port}`;
  axios.post(`${node}/update-list`, {
    requestNodeList: nodeList,
  });
  res.json({ status: "request accepted" }).end();
});

app.post("/update-list", (req, res) => {
  const { requestNodeList } = req.body;
  const currentNode = `http://${req.hostname}:${PORT}`;
  console.log(currentNode);

  for (let index = 0; index < requestNodeList.length; index++) {
    if (requestNodeList[index] !== currentNode) {
      axios.post(`${requestNodeList[index]}/request-join`, {
        host: req.hostname,
        port: PORT,
      });
    }
  }
  res.json({ status: "node list return" }).end();
});

app.post("/request-join", (req, res) => {
  const { host, port } = req.body;
  const { callback } = req.query;
  const node = `http://${host}:${port}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node), blockChain);
  blockChain.addNode(socketNode);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/request-join?callback=true`, {
      host: req.hostname,
      port: PORT,
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
