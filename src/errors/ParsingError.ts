import { type LocalizationItem } from "src/types";

class ParsingError extends Error {
  item: LocalizationItem;

  constructor(line: string) {
    super("Invalidly formatted line, " + JSON.stringify(line));

    this.name = "ParsingError";
  }
}

export default ParsingError;
