/* eslint-env node */
const {PassThrough, pipeline} = require('node:stream');
const path = require('node:path');
const fs = require('node:fs');
const utils = require('@gravity-ui/gulp-utils');
const fg = require('fast-glob');
const Vinyl = require('vinyl');

const BASE_PATH = 'src';

async function build() {
    const cwd = process.cwd();
    const tsConfig = require(path.join(cwd, `/tsconfig.json`));
    const outputDir = path.join(cwd, tsConfig.compilerOptions.outDir);

    const tsProject = await utils.createTypescriptProject();

    const transformers = [tsProject.customTransformers.transformLocalModules];

    const tsStream = tsProject({
        customTransformers: {
            before: transformers,
            afterDeclarations: transformers,
        },
    });

    const sourceStream = new PassThrough({
        readableObjectMode: true,
        writableObjectMode: true,
    });
    const targetStream = new PassThrough({
        readableObjectMode: true,
        writableObjectMode: true,
        write(chunk, encoding, callback) {
            (async () => {
                const rp = path.relative(chunk.base, chunk.path);
                const target = path.join(outputDir, rp);
                await fs.promises.mkdir(path.dirname(target), {recursive: true});
                await fs.promises.writeFile(path.join(outputDir, rp), chunk.contents);
            })().then(callback, callback);
        },
    });
    const plPromise = new Promise((resolve, reject) =>
        pipeline(sourceStream, tsStream, targetStream, (err) => {
            return err ? reject(err) : resolve();
        }),
    );

    const files = await fg(tsConfig.include, {
        cwd,
    });
    for (const p of files) {
        const file = new Vinyl({
            cwd,
            base: path.join(cwd, BASE_PATH),
            path: path.join(cwd, p),
            contents: await fs.promises.readFile(path.join(cwd, p)),
        });
        sourceStream.write(file);
    }
    sourceStream.end();

    await plPromise;
}

build();
