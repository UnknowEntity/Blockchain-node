const { actions } = require("./constants");
const forked = require("./global");
const Transaction = require("./models/transaction");
const Blockchain = require("./models/chain");

const socketListeners = (io, socket, chain) => {
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
    const { blocks, reward } = data;
    console.log("End Mining encountered");
    forked().kill("SIGINT");
    forked().on("exit", () => {
      chain.reset();
      const blockChain = new Blockchain();
      chain.workReward = reward;
      blockChain.parseChain(blocks);
      if (
        blockChain.checkValidity() &&
        blockChain.getLength() >= chain.getLength()
      ) {
        console.log("The chain pass first check");
        if (chain.compareCurrentBlock(blockChain.blocks)) {
          console.log("The chain pass all check");
          io.emit(actions.CHAIN_VERIFY);
          chain.confirmBlock();
        } else {
          console.log("The chain fail second check");
          io.emit(actions.WRONG_HASH_GENERATE);
          chain.denyBlock();
          socket.disconnect();
          chain.nodes.splice(chain.nodes.indexOf(socket), 1);
        }
      } else {
        console.log("Something is wrong with the chain");
        io.emit(actions.WRONG_HASH_GENERATE);
        chain.denyBlock();
        socket.disconnect();
        chain.nodes.splice(chain.nodes.indexOf(socket), 1);
      }
    });
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
