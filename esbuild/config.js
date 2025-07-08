const esbuild = require('esbuild');

const fs = require('fs');
const path = require('path');

(async () => {
    async function findMdxFiles(root, dir) {
        const mdxFiles = [];

        async function walkDirectory(directory) {
            const files = await fs.promises.readdir(path.join(root, directory));

            for (const file of files) {
                const relPath = path.join(directory, file);
                const stat = await fs.promises.stat(path.join(root, relPath));

                if (stat.isDirectory()) {
                    await walkDirectory(relPath);
                } else if (path.extname(file).toLowerCase() === '.js') {
                    const content = await fs.promises.readFile(path.join(root, relPath), 'utf8');
                    if (content.includes('@mdx-js/mdx')) {
                        mdxFiles.push(relPath);
                    }
                }
            }
        }

        await walkDirectory(dir);
        return mdxFiles;
    }

    async function replaceMdxRequire(root, mdxRelPath) {
        const mdxFiles = await findMdxFiles(root, '');
        await Promise.all(
            mdxFiles.map(async (relFilepath) => {
                const filepath = path.join(root, relFilepath);
                let data = await fs.promises.readFile(filepath, {
                    encoding: 'utf-8',
                });
                const modulePath = path.relative(path.dirname(relFilepath), mdxRelPath);
                data = data.replace(/"@mdx-js\/mdx"/g, JSON.stringify(modulePath));
                await fs.promises.writeFile(filepath, data);
            }),
        );
    }

    const relOutput = './build/cjs';
    const mdxPath = 'mdxPkg.js';

    await Promise.all([
        esbuild.build({
            entryPoints: ['./src/**/*'],
            bundle: false,
            platform: 'node',
            format: 'cjs',
            outdir: relOutput,
        }),
        await esbuild.build({
            stdin: {
                contents: `export * from '@mdx-js/mdx';`,
                loader: 'js',
                resolveDir: './node_modules',
            },
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outfile: path.join(relOutput, mdxPath),
        }),
    ]);

    await replaceMdxRequire(path.join(process.cwd(), relOutput), mdxPath);
})();
