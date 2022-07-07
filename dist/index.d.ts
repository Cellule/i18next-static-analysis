import * as babel from "babel-core";
interface I18next {
    on(event: "initialized", callback: (init: {
        saveMissing?: boolean;
    }) => void): void;
    on(event: "missingKey", callback: (lngs: readonly string[], namespace: string, key: string, res: string) => void): void;
    t(key: string, options?: unknown): string;
}
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
export default function analyze(i18next: I18next, options: Options): Promise<Record<string, MissingKeyInfo>>;
export {};
