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

  res = await plugin.registerNode(
    '0xE9D89022064a5f27EE29B1DBE0abAdC7737EA5D0',
    '0xbcf9696b620b304b8b807390cc30cceb0b811f2935fc5169de97ccd41dbc073e',
    // "0xF4764634B8E82B1Dca5E77A2F4b59e48Fc545Be2",
    // "0x39f38803f34f15c933f2bd062a6d05c598ddcbd44a63ef11e176f4d681110fe3",
    {
      name: "IPFS-Node-Testnet2",
      host: "ipfs-dev-node-3.singuladev.net",
      port: 443,
      type: "STORAGE",
    }
  );
  console.log(res);
  process.exit();
})()
