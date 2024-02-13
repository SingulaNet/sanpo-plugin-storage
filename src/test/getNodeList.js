"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "wss://geth-testnet-auth1.japaneast.cloudapp.azure.com/ws",
    usageFeeAddress: "0xd87EB3eDFE6eE3836c9E64A8D51a177850Fb64eB", // dev
    usageHistoryAddress: "0x3D33C58751adc6d913Ed9ddeeB7cAF4c007fA457", // dev
    nodeAddress: "0xe72221f951D0202670752Ae3A514e21FA21c7d89",
  })
  await plugin.connect();

  let res;

  res = await plugin.getNodeList("STORAGE");
  console.log(res);
  res = await plugin.getValidNodeList("STORAGE");
  console.log(res);
  process.exit();
})()
