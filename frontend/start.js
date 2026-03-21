const path = require('path');
const dir = path.resolve(__dirname);
process.chdir(dir);
process.argv = [process.execPath, 'next', 'dev', '--port', '3000'];
require(path.join(dir, 'node_modules', 'next', 'dist', 'bin', 'next'));
