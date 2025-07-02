// @ts-ignore
import {expose} from 'threads/worker';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
// eslint-disable-next-line import/no-extraneous-dependencies
import {isWithMdxArtifacts, mdxPlugin} from '@plugin';
import {PURE_COMPONENTS, SSR_COMPONENTS} from '@/components';
import getAsyncSsrRenderer from '../../../../src/utils/getAsyncSsrRenderer';
import assert from 'node:assert';
import {minify} from 'terser';
import * as babel from '@babel/core';

export interface SsrRendererWorker {
    getContent: typeof getContent;
}

const getContent = async (content: string) => {
    const {render, renderAsync} = getAsyncSsrRenderer({
        components: SSR_COMPONENTS,
        pureComponents: PURE_COMPONENTS,
    });

    const {result} = transform(content, {
        needToSanitizeHtml: false,
        useCommonAnchorButtons: true,
        plugins: [...DefaultPlugins, mdxPlugin({render})],
    });

    isWithMdxArtifacts(result);

    const {html, mdxArtifacts} = result;

    assert(mdxArtifacts);
    const htmlWithMdx = await renderAsync(html, mdxArtifacts);

    const keys = Object.keys(mdxArtifacts.idMdx);

    for (let i = 0, id; (id = keys[i]); i++) {
        const code = mdxArtifacts.idMdx[id];

        const parsedAst = await babel.parseAsync(code, {
            parserOpts: {allowReturnOutsideFunction: true},
        });
        assert(parsedAst);

        const transformedResult = await babel.transformFromAstAsync(parsedAst, code, {
            presets: ['@babel/preset-env'],
            ast: false,
            code: true,
        });
        assert(transformedResult?.code);

        const {code: miniCode = ''} = await minify(transformedResult.code, {
            mangle: {
                module: true,
            },
            compress: {
                module: true,
            },
            parse: {
                bare_returns: true,
            },
        });

        mdxArtifacts.idMdx[id] = miniCode;
    }

    return {html: htmlWithMdx, mdxArtifacts};
};

expose({
    getContent,
});
