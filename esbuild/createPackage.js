const fs = require('node:fs');

(async () => {
    await Promise.all([
        fs.promises.writeFile(
            './build/esm/package.json',
            JSON.stringify({type: 'module', sideEffects: false}),
        ),
        fs.promises.writeFile(
            './build/cjs/package.json',
            JSON.stringify({type: 'commonjs', sideEffects: false}),
        ),
    ]);
})();
