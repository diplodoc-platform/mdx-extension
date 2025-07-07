const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['react', 'react-dom'],
    outdir: './build/cjs',
});
