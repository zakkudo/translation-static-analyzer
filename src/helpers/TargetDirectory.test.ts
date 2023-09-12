import { describe, it, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import TargetDirectory from "./TargetDirectory";

jest.mock("node:fs");
const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe("TargetDirectory", () => {
  describe("buildFilename", () => {
    it("creates filename", () => {
      const directory = new TargetDirectory("/test/path");
      const filename = directory.buildFilename("locale");

      expect(filename).toEqual("/test/path/locale.json");
    });

    it("resolves the path", () => {
      const directory = new TargetDirectory("/test/path");
      const filename = directory.buildFilename("../locale");

      expect(filename).toEqual("/test/locale.json");
    });
  });

  describe("writeIndex", () => {
    it("writes index", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeIndex({
        en: [
          {
            key: "test key",
            value: "test value",
          },
        ],
      });

      expect(readFileSync("/test/path/index.json")).toEqual(`{
    "en": {
        "test key": "test value"
    }
}`);
    });

    it("uses cache in second index write", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeIndex({
        en: [
          {
            key: "test key",
            value: "test value",
          },
        ],
      });

      directory.writeIndex({
        en: [
          {
            key: "test key",
            value: "test value",
          },
        ],
      });

      expect(actions).toEqual([
        {
          action: "write",
          data: `{
    "en": {
        "test key": "test value"
    }
}`,
          filename: "/test/path/index.json",
        },
      ]);
    });
  });

  describe("writeLocalization", () => {
    it("writes localization", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          key: "test key",
          value: "test value",
        },
      ]);

      expect(readFileSync("/test/path/en.json")).toEqual(`{
    "test key": "test value"
}`);
    });

    it("uses cache in second localization write", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          key: "test key",
          value: "test value",
        },
      ]);

      directory.writeLocalization("en", [
        {
          key: "test key",
          value: "test value",
        },
      ]);

      expect(actions).toEqual([
        {
          action: "write",
          data: `{
    "test key": "test value"
}`,
          filename: "/test/path/en.json",
        },
      ]);
    });

    it("writes localization with context", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          context: "test context",
          key: "test key",
          value: "test value",
        },
      ]);

      expect(readFileSync("/test/path/en.json")).toEqual(`{
    "test key": {
        "test context": "test value"
    }
}`);
    });

    it("writes localization with explit default context", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          context: "default",
          key: "test key",
          value: "test value",
        },
      ]);

      expect(readFileSync("/test/path/en.json")).toEqual(`{
    "test key": "test value"
}`);
    });

    it("writes localization with explit default context and other context", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          context: "default",
          key: "test key",
          value: "test value",
        },
        {
          context: "test context",
          key: "test key",
          value: "test other value",
        },
      ]);

      expect(readFileSync("/test/path/en.json")).toEqual(`{
    "test key": {
        "default": "test value",
        "test context": "test other value"
    }
}`);
    });

    it("writes plural localization", () => {
      const directory = new TargetDirectory("/test/path");

      directory.writeLocalization("en", [
        {
          key: "test key",
          value: {
            "0": "test value 0",
            "1": "test value 1",
          },
        },
      ]);

      expect(readFileSync("/test/path/en.json")).toEqual(`{
    "test key": {
        "0": "test value 0",
        "1": "test value 1"
    }
}`);
    });
  });
  describe("ensureDirectory", () => {
    it("creates the directory if it doesn't exist", () => {
      const directory = new TargetDirectory("/test/path");

      directory.ensureDirectory();

      expect(actions).toEqual([
        {
          action: "write",
          filename: "/test/path",
        },
      ]);
    });
  });
});
