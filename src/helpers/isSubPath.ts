/**
 * Checks if the subpath is equal or a subfolder/subfile of path.
 * @param path - The parent path
 * @param subPath - The child path
 * @return `true` if it is a subpath.
 * @private
 */
const isSubPath = (path: string, subPath: string): boolean => {
  return (
    subPath.startsWith(path) &&
    (path.length === subPath.length || // /one/two === /one/two
      path.slice(-1) === "/" || // /one/ === /one/two
      subPath.charAt(path.length) === "/") // /one === /one/two
  );
};

export default isSubPath;
