"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "",
    usageFeeAddress: "",
    usageHistoryAddress: "",
    ipfsNodeAddress: "",
  })
  await plugin.connect();

  let res;

  res = await plugin.addNode(
    "",
    "",
    {
      name: "",
      host: "",
      port: "",
      address: "",
    }
  );
  console.log(res);
  process.exit();
})()
