# i18next-static-analysis

Attempts to analyse statically your code to find calls to `i18next` and validates them for all your supported languages.
Provide the `i18next` instance and the path to your source file and wait for the report.

Uses [`babel`](https://babeljs.io/) for all parsing and traversing of your code so it supports everything it does.

## Installation
```
$ npm install i18next-static-analysis
```

## Usage
 - Todo

## Known issues
 - Supports only literal values in `i18next` translate call.
 - No support for options in translation
 - `babel` options not passed to the parser
