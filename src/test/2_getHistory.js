"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "wss://geth-testnet-auth1.japaneast.cloudapp.azure.com/ws",
    storageUsageHistoryAddress: "0xb23dd3a6fefcbbd1e1babb1bb160d6f0bc29ecac",
  })
  await plugin.connect();

  let res;
  res = await plugin.getOperatorHistory("0x089a91dC45ED84f1e585b52aDCe29504437854D7");
  console.log(res);
  res = await plugin.getUserHistory("0x73f802E3B07924ea802AE1B9766Ae5811b6930E7");
  console.log(res);

  process.exit();
})()
