const SocketActions = require("./constants");

const Transaction = require("./models/transaction");
const Blockchain = require("./models/chain");

const socketListeners = (socket, chain) => {
  socket.on(SocketActions.ADD_TRANSACTION, (sender, receiver, amount) => {
    const transaction = new Transaction(sender, receiver, amount);
    chain.newTransaction(transaction);
    console.info(
      `Added transaction: ${JSON.stringify(
        transaction.getDetails(),
        null,
        "\t"
      )}`
    );
  });

  socket.on(SocketActions.END_MINING, (newChain) => {
    console.log("End Mining encountered");
    process.env.BREAK = true;
    const blockChain = new Blockchain();
    blockChain.parseChain(newChain);
    if (
      blockChain.checkValidity() &&
      blockChain.getLength() >= chain.getLength()
    ) {
      chain.blocks = blockChain.blocks;
    } else {
      socket.broadcast.emit(SocketActions.WRONG_HASH_GENERATE);
    }
  });

  socket.on(SocketActions.WRONG_HASH_GENERATE, () => {
    if (process.env.BREAK) {
      console.log("End Mining encountered");
      process.env.BREAK = false;
    }
  });

  socket.on(SocketActions.ADD_NODE, () => {
    if (process.env.BREAK) {
      console.log("End Mining encountered");
      process.env.BREAK = false;
    }
  });

  return socket;
};

module.exports = socketListeners;
