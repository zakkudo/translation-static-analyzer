/**
 * Checks if the subpath is equal or a subfolder/subfile of path.
 * @param {String} path - The parent path
 * @param {String} subPath - The child path
 * @return {Boolean} true if it is a subpath.
 * @private
 */
export default function isSubPath(path: string, subPath: string) {
  return subPath.startsWith(path) &&
    (
      path.length === subPath.length || // /one/two === /one/two
      path.slice(-1) === '/' || // /one/ === /one/two
      subPath.charAt(path.length) === '/' // /one === /one/two
    );
}
