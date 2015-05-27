
var defaultKeywords = ["__"];

var missingKeys = {};
var i18n,
  keywords,
  debug,
  excludes,
  extensions;

module.exports = function(i18next, options, callback) {
  i18n = i18next;
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  keywords = options.keywords || defaultKeywords;
  missingKeys = {};
  debug = !!options.debug;
  extensions = options.extensions || [".js", ".jsx"];
  excludes = options.excludes || ["node_modules", "bower_components"];
  var paths = options.paths;

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
    if(debug) {
      console.warn(
        "Missing localized key: %s::%s::%s.",
        lng, ns, key
      );
    }
    if(!missingKeys[all]) {
      missingKeys[all] = {
        lng: lng,
        ns: ns,
        key: key,
        all: all,
        usage: []
      };
    }
  };

  i18n.init({
    sendMissing: true
  }, function() {
    analyseTranslations(paths, function(err) {
      if(err) {
        return callback(err);
      }
      for(var all in missingKeys) {
        var keyInfo = missingKeys[all];
        console.warn(
          "Missing localized key: %s::%s::%s.",
          keyInfo.lng, keyInfo.ns, keyInfo.key
        );
        for(var i in keyInfo.usage) {
          var usage = keyInfo.usage[i];
          console.warn(
            "  %s:%d:%d",
            usage.filename,
            usage.node.loc.start.line,
            usage.node.loc.start.column
          );
        }
        console.warn("");
      }
      callback();
    });
  });
};

var babel = require("babel-core");
var fs = require("fs");
var async = require("async");
var path = require("path");

function analyseTranslations(paths, callback) {
  async.each(paths, function(p, next) {
    fs.stat(p, function(err, stats) {
      if(err) {
        return next(err);
      }
      if(stats.isFile()) {
        if(~extensions.indexOf(path.extname(p))) {
          analyseFile(p, next);
        } else {
          next();
        }
      } else if(stats.isDirectory()) {
        fs.readdir(p, function(err, files) {
          if(err) {
            return next(err);
          }
          files = files
            .filter(function(file) {
              return !(~excludes.indexOf(file));
            })
            .map(function(file) {
              return path.join(p, file);
            });
          analyseTranslations(files, next);
        });
      } else {
        next();
      }
    });
  }, function(err){
    if(err) {
      console.error(err);
    }
    callback(err);
  });
}


function isi18nCallee(callee) {
  return ~keywords.indexOf(callee.name);
}

function analyseFile(filename, callback) {
  if(debug) {
    console.log("Analysing file %s", filename);
  }
  var code = fs.readFileSync(filename, {encoding: "utf8"});
  try {
    var ast = babel.parse(code, {
      locations: true
    });
  } catch(e) {
    return callback(e);
  }
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
                  "Unsupported i18next call type at %s:%d:%d",
                  filename,
                  node.loc.start.line,
                  node.loc.start.column
                );
            }
          }
        }
      }
    }
  });
  callback();
}
