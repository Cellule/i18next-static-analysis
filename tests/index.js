var path = require("path");
var i18n = require("i18next");
var analyser = require("..");

module.exports = i18n.t;

var options = {
  paths: [path.join(__dirname, "src")]
};

function callback(err) {
  if (err) {
    throw new Error(err);
  } else {
    console.log("Successful Analysis");
  }
}

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
  analyser(i18n, options, callback);
  //require("./src/somefile");
});
