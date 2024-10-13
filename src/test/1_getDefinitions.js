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
  res = await plugin.getStorageProvisionRewardDefinition();
  console.log(res);
  res = await plugin.getStorageUsageFeeDefinition();
  console.log(res);
  res = await plugin.getStreamingProvisionRewardDefinition();
  console.log(res);
  res = await plugin.getStreamingUsageFeeDefinition();
  console.log(res);
  process.exit();
})()
