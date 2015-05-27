var analyser = require("..");
var path = require("path");
var i18n = require("i18next");

module.exports = i18n.t;



i18n.init({
  lng: "en",
  supportedLngs: ["en"],
  ns: {
    namespaces: ["general", "ns2"],
    defaultNs: "general"
  },
  nsseparator: "::",
  resGetPath: path.join(__dirname, "locales", "__lng__", "__ns__.json5"),
  //debug:true,
  //sendMissing: true,
}, function() {
  analyser(i18n, [path.join(__dirname, "src")], ["__"]);
  //require("./src/somefile");
});

