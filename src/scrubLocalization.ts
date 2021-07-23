/**
 * @param data - Removes all translation values so the object can be used as a translation template
 * @return The scrubbed localization tree
 * @private
 */
function scrubLocalization(data : any) {
  return Object.keys(data).reduce((accumulator, k) => {
    if (typeof data[k] === 'string') {
      return Object.assign(accumulator, {[k]: ''});
    } else {
      return Object.assign(accumulator, {[k]: scrubLocalization(data[k])});
    }
  }, {});
}

export default scrubLocalization;
