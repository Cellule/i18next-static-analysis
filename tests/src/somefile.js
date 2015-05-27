
var __ = require("..");

var someLocalisedMsg = __("test");
var someLocalisedMsg2 = __("ns2::test");
var missingLocalisedMsg2 = __("missingTest");

module.exports = [
  someLocalisedMsg,
  someLocalisedMsg2,
  missingLocalisedMsg2
];

console.dir(module.exports);
