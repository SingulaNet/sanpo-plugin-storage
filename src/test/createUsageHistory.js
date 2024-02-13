"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "wss://geth-testnet-auth1.japaneast.cloudapp.azure.com/ws",
    usageFeeAddress: "0xd87EB3eDFE6eE3836c9E64A8D51a177850Fb64eB", // dev
    usageHistoryAddress: "0x3D33C58751adc6d913Ed9ddeeB7cAF4c007fA457", // dev
  })
  await plugin.connect();

  const address = "0xF18Fb76277A0Ea3FE23347A4445bb14C00D9f4FE";
  const key = "0xda3c701de5d1364d42fcc590f84d994b5769090a13101dce72b666364edc1582";

  let res;
  const hist = {
    
  }
  res = await plugin.createHistory(address, key, hist);
  console.log(res);
  process.exit();
})()
