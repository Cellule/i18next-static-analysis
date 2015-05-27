
var defaultKeywords = ["__"];

var missingKeys = {};
var i18n, keywords;

module.exports = function(i18next, paths, _keywords) {
  i18n = i18next;
  keywords = _keywords || defaultKeywords;
  if(!Array.isArray(keywords)) {
    keywords = [keywords];
  }
  if(!paths) {
    console.log("Nothing to analyse, please give paths to the analyser");
    return;
  }
  if(!Array.isArray(paths)) {
    paths = [paths];
  }

  i18n.sync.postMissing = function(lng, ns, key, all) {
    if(!missingKeys[all]) {
      console.warn(
        "Missing localized key: %s::%s::%s.",
        lng, ns, key
      );
      missingKeys[all] = arguments;
    }
  };

  function checkIfInit() {
    if(!i18n.isInitialized()) {
      setTimeout(checkIfInit, 500);
    } else {
      analyseTranslations(paths);
    }
  }
  checkIfInit();
};

function analyseTranslations(paths) {

}
