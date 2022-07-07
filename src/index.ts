import * as babel from "babel-core";
import fs from "fs/promises";
import path from "path";
import type i18nTypes from "i18next";

const defaultKeywords = ["__"];

// Minimal i18next interface, this avoids needing to import i18next in declaration file
interface I18next {
  on(
    event: "initialized",
    callback: (init: { saveMissing?: boolean }) => void
  ): void;
  on(
    event: "missingKey",
    callback: (
      lngs: readonly string[],
      namespace: string,
      key: string,
      res: string
    ) => void
  ): void;
  t(key: string, options?: unknown): string;
}
// Make sure the minimal interface is compatible with i18next
const i18nTypings: I18next = null as unknown as typeof i18nTypes;
i18nTypings;

interface MissingKeyInfo {
  lngs: readonly string[];
  namespace: string;
  key: string;
  res: string;
  usage: Array<{
    filename: string;
    node: babel.types.CallExpression;
  }>;
}

interface Options {
  paths: string[];
  debug?: boolean;
  keywords?: string[];
  extensions?: string[];
  excludes?: string[];
  skipConsole?: boolean;
}

/**
 * @param {Object} i18next - i18next instance
 * @param {Object} options - Options
 * @param {String[]} options.paths - Required | Paths to be analyzed
 * @param {Boolean} options.debug - Optional | Default: false | Print debug logs
 * @param {String[]} options.excludes - Optional | Default: ["node_modules", "bower_components"] | Path to exclude
 * @param {String[]} options.extensions - Optional | Default: [".js", ".jsx", ".ts", ".tsx", ".cjs", ".cts", ".mjs", ".mts"] | File extensions to be analyzed
 * @param {String[]} options.keywords - Optional | Default: ["__"] | Callee Keywords
 * @param {Function} options.skipConsole - Optional | Default: false | Do not log missing keys to console
 * @returns Promise<Record<string, MissingKeyInfo>>
 */

export default async function analyze(
  i18next: I18next,
  options: Options
): Promise<Record<string, MissingKeyInfo>> {
  const keywords = options.keywords || defaultKeywords;
  const debug = !!options.debug;
  const extensions = options.extensions || [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    // ESM files
    ".cjs",
    ".cts",
    ".mjs",
    ".mts",
  ];
  const excludes = options.excludes || ["node_modules", "bower_components"];
  const paths = options.paths;

  const missingKeys: Record<string, MissingKeyInfo> = {};

  if (!paths.length) {
    throw new Error("Nothing to analyse, please give paths to the analyser");
  }

  i18next.on("missingKey", (lngs, namespace, key, res) => {
    if (debug) {
      console.warn("Missing localized key: %s::%s::%s.", lngs, namespace, key);
    }
    if (!missingKeys[res]) {
      missingKeys[res] = {
        lngs,
        namespace,
        key,
        res,
        usage: [],
      };
    }
  });

  await new Promise<void>((resolve) =>
    i18next.on("initialized", (init) => {
      // Change saveMissing since we need it to trigger .on("missingKey")
      init.saveMissing = true;
      return resolve();
    })
  );

  await analyseTranslations(paths);
  if (!options.skipConsole) {
    for (const all in missingKeys) {
      const keyInfo = missingKeys[all];
      console.warn(
        "Missing localized key: %s::%s::%s.",
        keyInfo.lngs.join(" "),
        keyInfo.namespace,
        keyInfo.key
      );
      for (const i in keyInfo.usage) {
        const usage = keyInfo.usage[i];
        console.warn(
          "  %s:%d:%d",
          usage.filename,
          usage.node.loc.start.line,
          usage.node.loc.start.column
        );
      }
      console.warn("");
    }
  }
  return missingKeys;

  async function analyseTranslations(paths: string[]) {
    for (const p of paths) {
      const stats = await fs.stat(p);
      if (stats.isFile()) {
        if (~extensions.indexOf(path.extname(p))) {
          await analyseFile(p);
        }
      } else if (stats.isDirectory()) {
        const files = await fs.readdir(p);
        const fullFiles = files
          .filter(function (file) {
            return !~excludes.indexOf(file);
          })
          .map(function (file) {
            return path.join(p, file);
          });
        await analyseTranslations(fullFiles);
      }
    }
  }

  function isi18nCallee(callee: babel.types.Expression) {
    return "name" in callee && ~keywords.indexOf(callee.name);
  }

  async function analyseFile(filename: string) {
    if (debug) {
      console.log("Analysing file %s", filename);
    }
    const code = await fs.readFile(filename, { encoding: "utf8" });
    const ast = babel.transform(code, { ast: true }).ast;
    if (!ast) {
      throw new Error(`Could not parse AST for ${filename}`);
    }
    babel.traverse(ast, {
      CallExpression: {
        enter: function (path) {
          if (path.isCallExpression() && isi18nCallee(path.node.callee)) {
            const node = path.node;
            if (node.arguments.length > 0) {
              // TODO:: use option (arg[1])
              const i18nKey = node.arguments[0];
              switch (i18nKey.type) {
                case "StringLiteral":
                  if (
                    missingKeys[i18nKey.value] ||
                    // run translation then check again
                    (i18next.t(i18nKey.value), missingKeys[i18nKey.value])
                  ) {
                    missingKeys[i18nKey.value].usage.push({
                      filename,
                      node,
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
        },
      },
    });
  }
}
