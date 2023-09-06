import { type LocalizationItem } from "src/types";

class ValidationError extends Error {
  item: LocalizationItem;

  constructor(message: string, item: LocalizationItem) {
    super(message);

    this.name = "ValidationError";
    this.item = item;
  }
}

export default ValidationError;
