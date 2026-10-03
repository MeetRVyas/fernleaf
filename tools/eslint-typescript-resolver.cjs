const { existsSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

module.exports = {
  interfaceVersion: 2,
  resolve(source, importer) {
    if (!source.startsWith('.')) return { found: false };
    const path = resolve(dirname(importer), source.replace(/\.js$/, '.ts'));
    return existsSync(path) ? { found: true, path } : { found: false };
  },
};
