import path from "path";
import i18n from "i18next";
import analyser from "../dist";

describe("analyser", () => {
  it("should work", async () => {
    const analysis = analyser(i18n, {
      paths: [path.join(__dirname, "src")],
      skipConsole: true,
    });
    i18n.init({
      lng: "en",
      supportedLngs: ["en"],
      ns: ["general", "ns2"],
      defaultNS: "general",
      nsSeparator: "::",
      resources: {
        en: {
          general: { test: "some text" },
          ns2: { test: "some text 2" },
        },
      },
    });

    const missingKeys = await analysis;
    const all = Object.entries(missingKeys)
    expect(all).toHaveLength(1);
    expect(all[0][0]).toBe("missingTest");
  });
});
