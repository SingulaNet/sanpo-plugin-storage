'use strict'

const debug = require('debug')('sanpo-plugin-stogage');
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;

const storageUsageHistoryAbi = require('../abi/StorageUsageHistory.json');
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
    this.storageUsageHistoryAddress = opts.storageUsageHistoryAddress;
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
    this.storageUsageHistory = new this.web3.eth.Contract(storageUsageHistoryAbi, this.storageUsageHistoryAddress);
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

  getStorageProvisionRewardDefinition() {
    return this.storageUsageHistory.methods.getStorageProvisionRewardDefinition().call();
  }

  getStorageUsageFeeDefinition() {
    return this.storageUsageHistory.methods.getStorageUsageFeeDefinition().call();
  }

  getStreamingProvisionRewardDefinition() {
    return this.storageUsageHistory.methods.getStreamingProvisionRewardDefinition().call();
  }

  getStreamingUsageFeeDefinition() {
    return this.storageUsageHistory.methods.getStreamingUsageFeeDefinition().call();
  }

  getOperatorHistory(address) {
    return this.storageUsageHistory.methods.getOperatorHistory(address).call();
  }

  getUserHistory(address) {
    return this.storageUsageHistory.methods.getUserHistory(address).call();
  }

  createStorageHistory(address, privateKey, opts) {
    console.log(opts)
    const txData = this.storageUsageHistory.methods.createStorageHistory(
      opts.fileSize,
      opts.ipfsHash,
      opts.timestamp,
      opts.user,
      opts.operator,
      opts.contentType,
      opts.fileName,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  createStreamingHistory(address, privateKey, opts) {
    const txData = this.storageUsageHistory.methods.createStreamingHistory(
      opts.fileSize,
      opts.ipfsHash,
      opts.timestamp,
      opts.user,
      opts.operator,
      opts.contentType,
      opts.fileName,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  /**
   * addDefinition
   * @param {*} opts.amount SPT
   * @param {*} opts.dataUsage GB
   * @param {*} opts.type 1: storageProvisionReward, 2: storageUsageFee, 3: streamingProvisionReward, 4: streamingUsageFee
   * @returns 
   */
  addDefinition(address, privateKey, opts) {
    const txData = this.storageUsageHistory.methods.addDefinition(
      opts.amount,
      opts.dataUsage,
      opts.type,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  updateDefinition(address, privateKey, opts) {
    const txData = this.storageUsageHistory.methods.updateDefinition(
      opts.amount,
      opts.dataUsage,
      opts.index,
      opts.type,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  /**
   * disableDefinition
   * @param {*} opts.index index 
   * @param {*} opts.type 1: storageProvisionReward, 2: storageUsageFee, 3: streamingProvisionReward, 4: streamingUsageFee
   * @returns 
   */
  disableDefinition(address, privateKey, opts) {
    const txData = this.storageUsageHistory.methods.disableDefinition(
      opts.index,
      opts.type,
    ).encodeABI();
    return this._sendSignedTransaction(address, privateKey, txData);
  }

  /**
   * Send transaction
   * @param {string} from
   * @param {string} privateKey
   * @param {object} txData
   * @returns
   */
  async _sendSignedTransaction(from, privateKey, txData) {
    const nonce = await this.web3.eth.getTransactionCount(from, "pending");
    const rawTx = {
      from,
      to: this.storageUsageHistory.options.address,
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
          console.log(error);
          reject(error);
        })
    });
  }
}

module.exports = PluginStorage;
