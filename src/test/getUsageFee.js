"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "wss://geth-testnet-auth1.japaneast.cloudapp.azure.com/ws",
    usageFeeAddress: "0xd87EB3eDFE6eE3836c9E64A8D51a177850Fb64eB", // dev
    usageHistoryAddress: "0x3D33C58751adc6d913Ed9ddeeB7cAF4c007fA457", // dev
    ipfsNodeAddress: "0x4acA32396700c592347A096bf8c695938F1f0D1b",
  })
  await plugin.connect();

  let res;

  res = await plugin.getFeeDefinition();
  console.log(res);

  res = await plugin.getNodeList();
  console.log(res);

  process.exit();
})()
