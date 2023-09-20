"use strict"

const PluginStorage = require("../lib/plugin");
let plugin = null; // instance

(async () => {

  plugin = new PluginStorage({
    provider: "",
    usageFeeAddress: "",
    usageHistoryAddress: "",
  })
  await plugin.connect();

  let res;
  res = await plugin.getHistoryCount();
  console.log(res);
  process.exit();
})()
