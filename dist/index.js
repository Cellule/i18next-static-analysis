"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel = __importStar(require("babel-core"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const defaultKeywords = ["__"];
// Make sure the minimal interface is compatible with i18next
const i18nTypings = null;
i18nTypings;
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
function analyze(i18next, options) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const missingKeys = {};
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
        yield new Promise((resolve) => i18next.on("initialized", (init) => {
            // Change saveMissing since we need it to trigger .on("missingKey")
            init.saveMissing = true;
            return resolve();
        }));
        yield analyseTranslations(paths);
        if (!options.skipConsole) {
            for (const all in missingKeys) {
                const keyInfo = missingKeys[all];
                console.warn("Missing localized key: %s::%s::%s.", keyInfo.lngs.join(" "), keyInfo.namespace, keyInfo.key);
                for (const i in keyInfo.usage) {
                    const usage = keyInfo.usage[i];
                    console.warn("  %s:%d:%d", usage.filename, usage.node.loc.start.line, usage.node.loc.start.column);
                }
                console.warn("");
            }
        }
        return missingKeys;
        function analyseTranslations(paths) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const p of paths) {
                    const stats = yield promises_1.default.stat(p);
                    if (stats.isFile()) {
                        if (~extensions.indexOf(path_1.default.extname(p))) {
                            yield analyseFile(p);
                        }
                    }
                    else if (stats.isDirectory()) {
                        const files = yield promises_1.default.readdir(p);
                        const fullFiles = files
                            .filter(function (file) {
                            return !~excludes.indexOf(file);
                        })
                            .map(function (file) {
                            return path_1.default.join(p, file);
                        });
                        yield analyseTranslations(fullFiles);
                    }
                }
            });
        }
        function isi18nCallee(callee) {
            return "name" in callee && ~keywords.indexOf(callee.name);
        }
        function analyseFile(filename) {
            return __awaiter(this, void 0, void 0, function* () {
                if (debug) {
                    console.log("Analysing file %s", filename);
                }
                const code = yield promises_1.default.readFile(filename, { encoding: "utf8" });
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
                                            if (missingKeys[i18nKey.value] ||
                                                // run translation then check again
                                                (i18next.t(i18nKey.value), missingKeys[i18nKey.value])) {
                                                missingKeys[i18nKey.value].usage.push({
                                                    filename,
                                                    node,
                                                });
                                            }
                                            break;
                                        // TODO:: support more than literal values
                                        default:
                                            console.warn("Unsupported i18next call type at %s:%d:%d", filename, node.loc.start.line, node.loc.start.column);
                                    }
                                }
                            }
                        },
                    },
                });
            });
        }
    });
}
exports.default = analyze;
//# sourceMappingURL=index.js.map