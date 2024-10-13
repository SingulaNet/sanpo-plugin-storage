"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "wss://geth-testnet-auth1.japaneast.cloudapp.azure.com/ws",
    storageUsageHistoryAddress: "0xb23dd3a6fefcbbd1e1babb1bb160d6f0bc29ecac",
  })
  await plugin.connect();

  const address = "0x089a91dC45ED84f1e585b52aDCe29504437854D7";
  const privateKey = "0x5853c30aba15721598d54422c2859899a12be7f6da5bf40bdf843cd4f8de8933";

  let res;
  let hist = {
    fileSize: 3750350, // _fileSize
    ipfsHash: "_ipfsHash", // _ipfsHash
    timestamp: 1234567890, // _timestamp
    user: "0x73f802E3B07924ea802AE1B9766Ae5811b6930E7", // _user
    operator: address, // _operator
    contentType: "contentType", // _contentType
    fileName: "fileName", // _fileName
  }
  res = await plugin.createStorageHistory(address, privateKey, hist);
  console.log(res);

  hist = {
    fileSize: 3750350, // _fileSize
    ipfsHash: "_ipfsHash", // _ipfsHash
    timestamp: 1234567890, // _timestamp
    user: "0x73f802E3B07924ea802AE1B9766Ae5811b6930E7", // _user
    operator: address, // _operator
    contentType: "contentType", // _contentType
    fileName: "fileName", // _fileName
  }
  res = await plugin.createStreamingHistory(address, privateKey, hist);
  console.log(res);

  process.exit();
})()
