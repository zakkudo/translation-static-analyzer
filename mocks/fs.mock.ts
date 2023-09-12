import { jest } from "@jest/globals";

jest.mock("node:os");

const actions = [];
let increment = 0;
let filesystem = {};

jest.mock("node:fs", () => {
  return {
    ensureDirSync: jest.fn((filename: string) => {
      if (!filesystem[filename]) {
        actions.push({ action: "write", filename });
        filesystem[filename] = true;
      }
    }),
    mkdtempSync: jest.fn(() => {
      const filename = "/test/tmp/" + increment;

      increment += 1;

      return filename;
    }),
    readFileSync: jest.fn((filename: string) => {
      actions.push({
        action: "read",
        data: filesystem[filename] || null,
        filename,
      });

      if (Object.prototype.hasOwnProperty.call(filesystem, filename)) {
        return filesystem[filename];
      }

      const e = new Error(
        "MockError: Filename '" + filename + "' doesn't exist, " + filename,
      );
      (e as any).code = "ENOENT";

      throw e;
    }),
    removeSync: jest.fn(() => 0),
    statSync: jest.fn((filename: string) => {
      return {
        isDirectory() {
          return !filename.endsWith(".js");
        },
      };
    }),
    unlinkSync: jest.fn((filename: string) => {
      delete filesystem[filename];
    }),
    writeFileSync: jest.fn((filename: string, data: string) => {
      actions.push({ action: "write", data, filename });
      filesystem[filename] = data;
    }),
  };
});

export default {
  actions,
  filesystem,
  increment,
  mockReset: () => {
    Object.keys(filesystem).forEach((k) => delete filesystem[k]);
    increment = 0;
    actions.length = 0;
  },
};
