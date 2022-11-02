# i18next-static-analysis

# Looking for Contributors
This project is currently unmaintained and very out of date

I've moved on to different approach for static analysis using Typescript types.
As such I do not have time to support/maintain/test this project.
I hope to open-source my other solution in the future.

## Description

Attempts to analyse statically your code to find calls to `i18next` and validates them for all your supported languages.
Provide the `i18next` instance and the path to your source file and wait for the report.

Uses [`babel`](https://babeljs.io/) for all parsing and traversing of your code so it supports everything it does.

## Installation
`npm install i18next-static-analysis` or `yarn add i18next-static-analysis`

## Usage
```javascript
const path = require("path");
const i18n = require("i18next");
const analyser = require("i18next-static-analysis");

/**
 * @typedef {Object} options
 * @property {Boolean} debug - Optional | Default: false | Print debug logs
 * @property {String[]} excludes - Optional | Default: ["node_modules", "bower_components"] | Path to exclude
 * @property {String[]} extensions - Optional | Default: [".js", ".jsx"] | File extensions to be analyzed
 * @property {String | String[]} keywords - Optional | Default: ["__"] | Callee Keywords
 * @property {String | String[]} paths - Required | Paths to be analyzed
 */
const options = {
  paths: [path.join(__dirname, "src")]
};

/**
 * @callback callback
 * @return {String} error - string
 */
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
  }, function() {
    analyser(i18n, options, callback);
  }
);
```

## Demo
An example of the analysis script is provided in the `index.js` file. Run the analysis script on the translation files in the provided `/tests` directory.
`npm run test` or `yarn test`

## Known Issues
 - Supports only literal values in `i18next` translate call.
 - No support for options in translation
 - `babel` options not passed to the parser
