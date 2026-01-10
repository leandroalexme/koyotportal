// Empty polyfill for Node.js modules in browser
// Used by canvaskit-wasm which has Node.js detection code
const empty = {};
export default empty;
export const readFileSync = () => null;
export const readFile = () => null;
export const dirname = () => '';
export const normalize = (p) => p;
export const join = (...args) => args.join('/');
