type Data = Record<string, string | Record<string, string>>;
/**
 * @param data - Removes all translation values so the object can be used as a translation template
 * @return The scrubbed localization tree
 * @private
 */
const removeEmptyValues = (data: Data) : Data => {
  return Object.keys(data).reduce((accumulator, k) => {
    if (typeof data[k] === "string") {
      return { ...accumulator, [k]: "" };
    } else if (Object(data[k]) === data[k]) {
      return { ...accumulator, [k]: removeEmptyValues(data[k] as Data) };
    }
  }, {});
};

export default removeEmptyValues;
