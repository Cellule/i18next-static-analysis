1.0.0

- BREAKING: Minimum node.js version: `>=16.0.0`
- BREAKING: analyze function is now asynchronous return a Promise instead of using a callback
- BREAKING: Option `paths` no longer support type "string", only array of strings "string[]"
- BREAKING: Option `keywords` no longer support type "string", only array of strings "string[]"
- BREAKING: Option `extensions` now defaults to [".js", ".jsx", ".ts", ".tsx", ".cjs", ".cts", ".mjs", ".mts"] was [".js", ".jsx"]
- Migrated project to TypeScript and provide typings declarations