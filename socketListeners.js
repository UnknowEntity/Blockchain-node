const { actions } = require("./constants");

const Transaction = require("./models/transaction");
const Blockchain = require("./models/chain");

const socketListeners = (socket, chain) => {
  socket.on(actions.ADD_TRANSACTION, (newTransaction) => {
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

  socket.on(actions.END_MINING, (data) => {
    const { blocks } = data;
    console.log("End Mining encountered");
    process.env.BREAK = true;
    chain.reset();
    const blockChain = new Blockchain();
    blockChain.parseChain(blocks);
    if (
      blockChain.checkValidity() &&
      blockChain.getLength() >= chain.getLength()
    ) {
      if (chain.compareCurrentBlock(blockChain)) {
        socket.broadcast.emit(actions.CHAIN_VERIFY);
        chain.confirmBlock();
      } else {
        socket.broadcast.emit(actions.WRONG_HASH_GENERATE);
        chain.denyBlock();
      }
    } else {
      socket.broadcast.emit(actions.WRONG_HASH_GENERATE);
      chain.denyBlock();
    }
  });

  socket.on(actions.WRONG_HASH_GENERATE, () => {
    chain.denyBlock();
  });

  socket.on(actions.HELLO, () => {
    console.log("hello");
  });

  socket.on(actions.CHAIN_VERIFY, () => {
    chain.confirmBlock();
  });

  return socket;
};

module.exports = socketListeners;
