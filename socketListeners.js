const SocketActions = require("./constants");

const Transaction = require("./models/transaction");
const Blockchain = require("./models/chain");

const socketListeners = (socket, chain) => {
  socket.on(SocketActions.ADD_TRANSACTION, (newTransaction) => {
    const transaction = new Transaction(null, null, null);
    transaction.parseTransaction(newTransaction);
    chain.newTransaction(transaction);
    console.info(
      `Added transaction: ${JSON.stringify(
        transaction.getDetails(),
        null,
        "\t"
      )}`
    );
  });

  socket.on(SocketActions.END_MINING, (data) => {
    const { blocks, unSpend } = data;
    console.log("End Mining encountered");
    process.env.BREAK = true;
    const blockChain = new Blockchain();
    blockChain.parseChain(blocks);
    if (
      blockChain.checkValidity() &&
      blockChain.getLength() >= chain.getLength()
    ) {
      //let newBlockLength = blockChain.getLength() - chain.getLength();
      chain.unSpend = unSpend;
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

  socket.on(SocketActions.HELLO, () => {
    console.log("hello");
  });

  return socket;
};

module.exports = socketListeners;
