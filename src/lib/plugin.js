'use strict'

const debug = require('debug')('sanpo-plugin-stogage');
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;

const usagefeeAbi = require('../abi/StorageUsageFee.json');
const usageHistoryAbi = require('../abi/StorageUsageHistory.json');
const ipfsNodeAbi = require('../abi/ipfsNode.json');
const createWebsocketProvider = (provider) => new Web3.providers.WebsocketProvider(provider, {
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  }
});
const customCommon = Common.forCustomChain(
  'mainnet',
  {
    name: 'privatechain',
    networkId: 1,
    chainId: 11421,
  },
  'petersburg',
)

class PluginStorage extends EventEmitter2 {
  constructor(opts) {
    super();
    this._primaryProvider = opts.provider;
    this._secondaryProvider = opts.altProvider || opts.provider;
    this.provider = this._primaryProvider;
    this.usageFeeAddress = opts.usageFeeAddress;
    this.usageHistoryAddress = opts.usageHistoryAddress;
    this.ipfsNodeAddress = opts.ipfsNodeAddress;
    this.web3 = null;
    this.healthCheck = false;
  }

  async connect() {
    debug(`connect... ${this.provider}`);

    if (!this.healthCheck) {
      this._heartbeat();
    }
    this.healthCheck = true;

    this.web3 = new Web3(createWebsocketProvider(this.provider));
    this.web3.eth.handleRevert = true;
    this.usageFee = new this.web3.eth.Contract(usagefeeAbi, this.usageFeeAddress);
    this.usageHistory = new this.web3.eth.Contract(usageHistoryAbi, this.usageHistoryAddress);
    this.ipfsNode = new this.web3.eth.Contract(ipfsNodeAbi, this.ipfsNodeAddress);
    this.web3.eth.transactionBlockTimeout = 20000;
  }

  disconnect() {
    if (!this.web3) return;
    this.web3.currentProvider.disconnect();
    this.web3 = null;
  }

  _heartbeat() {
    setInterval(() => {
      /**
       * Handle web socket disconnects
       * @see https://github.com/ethereum/web3.js/issues/1354
       * @see https://github.com/ethereum/web3.js/issues/1933
       * It also serves as a heartbeat to node
       */
      if (this.web3) {
        this.web3.eth.net.isListening()
          .catch((e) => {
            debug("disconnected " + this.provider);
            this.web3.currentProvider.disconnect();
            this.web3 = null;
            if (this.provider === this._primaryProvider) {
              this.provider = this._secondaryProvider;
            } else {
              this.provider = this._primaryProvider;
            }
            const provider = createWebsocketProvider(this.provider);
            provider.on("connect", () => {
              this.connect();
            })
          })
      }

      // reconnect
      if (!this.web3) {
        if (this.provider === this._primaryProvider) {
          this.provider = this._secondaryProvider;
        } else {
          this.provider = this._primaryProvider;
        }
        debug("Attempting to reconnect... " + this.provider);
        const provider = createWebsocketProvider(this.provider);
        provider.on("connect", () => {
          this.connect();
        })
      }
    }, 5 * 1000);
  }

  getFeeDefinition() {
    return this.usageFee.methods.getFeeDefinition().call();
  }

  addFeeDefinition(address, privateKey, opts) {
    const txData = this.usageFee.methods.addFeeDefinition(
      opts.balance,
      opts.maxFileSize,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  updateFeeDefinition(address, privateKey, opts) {
    const txData = this.usageFee.methods.updateFeeDefinition(
      opts.balance,
      opts.maxFileSize,
      opts.index,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  disableFeeDefinition(address, privateKey, opts) {
    const txData = this.usageFee.methods.disableFeeDefinition(
      opts.index,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  getHistory(historyId) {
    return this.usageHistory.methods.getHistory(historyId).call();
  }

  getHistoryCount() {
    return this.usageHistory.methods.getHistoryCount().call();
  }

  getOperatorHistoryIdList(address) {
    return this.usageHistory.methods.getOperatorHistoryIdList(address).call();
  }

  getOperatorHistory(address) {
    return this.usageHistory.methods.getOperatorHistory(address).call();
  }

  getUserHistoryIdList(address) {
    return this.usageHistory.methods.getUserHistoryIdList(address).call();
  }

  getUserHistory(address) {
    return this.usageHistory.methods.getUserHistory(address).call();
  }

  createHistory(address, privateKey, opts) {
    const txData = this.usageHistory.methods.createHistory(
      opts.fileSize,
      opts.ipfsHash,
      opts.ipfsOriginHash,
      opts.timestamp,
      opts.user,
      opts.operator,
      opts.contentType,
      opts.result,
      opts.fileName,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData, this.usageHistory.options.address);
  }

  getNodeList() {
    return this.ipfsNode.methods.getNodeList().call();
  }

  addNode(address, privateKey, opts) {
    console.log(address, privateKey, opts, this.ipfsNode.options.address);
    const txData = this.ipfsNode.methods.addNode(
      opts.name,
      opts.host,
      opts.port,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData, this.ipfsNode.options.address);
  }

  /**
   * Send transaction
   * @param {string} from
   * @param {string} privateKey
   * @param {object} txData
   * @returns
   */
  async _sendSignedTransaction(from, privateKey, txData, cAddress) {
    const nonce = await this.web3.eth.getTransactionCount(from, "pending");
    const rawTx = {
      from,
      to: cAddress,
      gas: 29900000,
      gasPrice: 0,
      data: txData,
      nonce: nonce,
    };
    const tx = new Tx(rawTx, { common: customCommon });
    tx.sign(Buffer.from(privateKey.split("0x")[1], "hex"));
    const serializedTx = tx.serialize();

    return new Promise((resolve, reject) => {
      this.web3.eth.sendSignedTransaction("0x" + serializedTx.toString("hex"))
        .on("confirmation", (confirmationNumber, receipt) => {
          if (confirmationNumber === 1) {
            resolve(receipt.transactionHash);
          }
        })
        .on("error", (error) => {
          console.error;
          reject(error);
        })
    });
  }
}

module.exports = PluginStorage;
