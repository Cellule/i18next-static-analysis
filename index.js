
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
      missingKeys[all] = {
        lng: lng,
        ns: ns,
        key: key,
        all: all,
        usage: []
      };
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

var babel = require("babel-core");
var fs = require("fs");
var async = require("async");
var path = require("path");

function analyseTranslations(paths) {
  async.each(paths, function(p, next) {
    fs.stat(p, function(err, stats) {
      if(err) {
        return next(err);
      }
      if(stats.isFile()) {
        setTimeout(analyseFile.bind(null, p), 10);
      } else if(stats.isDirectory()) {
        fs.readdir(p, function(err, files) {
          if(err) {
            return next(err);
          }
          files = files.map(function(file) {
            return path.join(p, file);
          });
          setTimeout(analyseTranslations.bind(null, files), 10);
        });
      }
      next();
    });
  }, function(err){
    if(err) {
      return console.error(err);
    }
  });
}


function isi18nCallee(callee) {
  return ~keywords.indexOf(callee.name);
}

function analyseFile(filename) {
  var code = fs.readFileSync(filename, {encoding: "utf8"});
  var ast = babel.parse(code);
  babel.traverse(ast, {
    CallExpression: {
      enter: function(node) {
        if(isi18nCallee(node.callee)) {
          if(node.arguments.length > 0) {
            // TODO:: use option (arg[1])
            var i18nKey = node.arguments[0];
            switch(i18nKey.type) {
              case "Literal":
                if(
                  missingKeys[i18nKey.value] ||
                  // run translation then check again
                  (i18n.t(i18nKey.value), missingKeys[i18nKey.value])
                ) {
                  missingKeys[i18nKey.value].usage.push({
                    filename: filename,
                    node: node
                  });
                }
                break;
              // TODO:: support more than literal values
              default:
                console.warn(
                  "Unsupported i18next call type at %s:%d",
                  filename,
                  node.start
                );
            }
          }
        }
      }
    }
  });
}
